<?php
declare(strict_types=1);
require __DIR__.'/session.php';
require __DIR__.'/import-functions.php';
require __DIR__.'/state-functions.php';
require __DIR__.'/workflow.php';
require __DIR__.'/deal-duplicates.php';
$actor=crm_session_user();
function deal_uid(string $prefix): string {return $prefix.'-'.bin2hex(random_bytes(16));}
function deal_contact(array &$state,string $company,array $input): ?array {
    $name=trim($input['name']??'');$email=strtolower(trim($input['email']??''));$phone=trim($input['phone']??'');if(!$name){if($email||$phone)throw new InvalidArgumentException('Enter the contact name.');return null;}
    if($email&&!filter_var($email,FILTER_VALIDATE_EMAIL))throw new InvalidArgumentException('Invalid contact email.');
    foreach($state['contacts'] as &$contact)if($contact['companyId']===$company&&deal_normalise($contact['name'])===deal_normalise($name)){$contact['name']=$name;if($email)$contact['email']=$email;if($phone)$contact['phone']=$phone;return $contact;}unset($contact);
    $contact=['id'=>deal_uid('ct'),'companyId'=>$company,'name'=>$name,'email'=>$email,'createdAt'=>gmdate('Y-m-d\TH:i:s\Z')];if($phone)$contact['phone']=$phone;$state['contacts'][]=$contact;return $contact;
}
function deal_as_draft(array $deal,array $state): array {
    $company=current(array_filter($state['companies'],fn($c)=>$c['id']===$deal['companyId']));$contact=current(array_filter($state['contacts'],fn($c)=>$c['id']===($deal['primaryContactId']??'')));
    return ['deal'=>$deal,'companyName'=>$company['name']??'','contact'=>['name'=>$contact['name']??$deal['primaryContactName']??'','phone'=>$contact['phone']??'','email'=>$contact['email']??'']];
}
try {
    if($_SERVER['REQUEST_METHOD']!=='POST'){crm_json(['ok'=>false,'error'=>'Method not allowed'],405);exit;}
    crm_csrf();$data=crm_input();$action=$data['action']??'check';$draft=$data['draft']??[];
    if(!in_array($action,['check','create','update','merge'],true)||!is_array($draft)||!is_array($draft['deal']??null)||!is_string($draft['companyName']??null))throw new InvalidArgumentException('Invalid deal request.');
    $pdo=crm_pdo();$pdo->beginTransaction();$revision=(int)$pdo->query('SELECT revision FROM crm_revision WHERE id=1'.($action==='check'?'':' FOR UPDATE'))->fetchColumn();
    if($action==='check'){$old=[];foreach(['users','companies','contacts','deals'] as $table)$old[$table]=array_map('frontend_row',$pdo->query('SELECT * FROM '.$table)->fetchAll());}else $old=read_state($pdo);$state=$old;
    $sourceId=$data['sourceId']??null;$source=$sourceId?current(array_filter($state['deals'],fn($d)=>$d['id']===$sourceId)):null;
    if($sourceId&&!$source)throw new InvalidArgumentException('This deal no longer exists. Reload the list.');
    $matches=deal_matches($draft,$state,$sourceId);
    if($action==='check'){$pdo->commit();crm_json(['ok'=>true,'matches'=>$matches]);exit;}
    if(!trim($draft['companyName'])||!trim($draft['deal']['title']??''))throw new InvalidArgumentException('Enter a company and deal title.');
    if($source&&($data['sourceVersion']??'')!==deal_version($source,array_column($state['contacts'],null,'id')[$source['primaryContactId']??'']??null))throw new DealDuplicateException($matches,'This deal changed since you opened it. Reopen its latest details before saving; your draft has been kept.');
    if($action==='update'&&!$source)throw new InvalidArgumentException('Select the deal to update.');
    if($action==='create'&&$source)throw new InvalidArgumentException('A new deal cannot replace an existing record.');
    $target=null;$archive=null;$mergeContact=null;
    if($action==='merge'){
        $target=current(array_filter($state['deals'],fn($d)=>$d['id']===($data['targetId']??'')));
        if(!$target||$target['id']===$sourceId)throw new InvalidArgumentException('Choose a different existing deal to merge into.');
        if(($data['targetVersion']??'')!==deal_version($target,array_column($state['contacts'],null,'id')[$target['primaryContactId']??'']??null))throw new DealDuplicateException($matches,'The existing deal changed. Review the updated merge comparison.');
        $existing=deal_as_draft($target,$state);
        if(duplicate_kind($draft,$target,$existing['companyName'])!=='potential')throw new InvalidArgumentException('Different companies, solutions or known locations should remain separate opportunities.');
        $archive=['source'=>$source,'incoming'=>$draft,'choices'=>$data['choices']??[],'targetBefore'=>$target];$mergeContact=$draft['contact']??[];
        if($source&&!empty($source['notes'])&&($draft['deal']['notes']??'')!==$source['notes'])$draft['deal']['notes']=implode("\n\n",array_filter([$source['notes'],$draft['deal']['notes']??'']));
        $draft=deal_merge_draft($existing,$draft,is_array($data['choices']??null)?$data['choices']:[]);
        // Preserve source data that was not selected for primary fields in a readable activity entry as well as the immutable merge archive.
        $incomingSummary=['Incoming deal'=>$archive['incoming']['deal'],'Incoming contact'=>$archive['incoming']['contact']??[]];
        $state['activities'][]=['id'=>deal_uid('a'),'dealId'=>$target['id'],'type'=>'system','body'=>'Merged '.($source?('deal '.$source['title']):'a new draft').' into '.$target['title'].'. Incoming information: '.json_encode($incomingSummary,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),'userId'=>$actor['id'],'createdAt'=>gmdate('Y-m-d\TH:i:s\Z')];
    } else {
        $identityChanged=!$source||duplicate_identity(array_merge($draft['deal'],['companyId'=>'draft']),['draft'=>$draft['companyName']])!==duplicate_identity($source,array_column($old['companies'],'name','id'));
        if($identityChanged)duplicate_decision($matches,$data['separate']??null);
    }
    $company=current(array_filter($state['companies'],fn($c)=>deal_normalise($c['name'])===deal_normalise($draft['companyName'])));
    if($target)$company=current(array_filter($state['companies'],fn($c)=>$c['id']===$target['companyId']));
    if(!$company){$company=['id'=>deal_uid('c'),'name'=>trim($draft['companyName']),'industry'=>'—','status'=>'Prospect','divisions'=>[$draft['deal']['division']??'secure'],'createdAt'=>gmdate('Y-m-d\TH:i:s\Z')];$state['companies'][]=$company;}
    // A different incoming person is retained as an additional company contact, even when the existing primary contact is kept.
    if($mergeContact&&deal_normalise($mergeContact['name']??'')!==deal_normalise($draft['contact']['name']??''))deal_contact($state,$company['id'],$mergeContact);
    $contact=deal_contact($state,$company['id'],$draft['contact']??[]);
    $base=$target?:$source?:['id'=>deal_uid('d'),'createdAt'=>gmdate('Y-m-d\TH:i:s\Z'),'createdById'=>$actor['id']];
    $allowed=array_flip(['title','site','division','segment','productLine','stage','onceOff','mrr','ownerId','closeDate','notes','lostReason','receivedAt','secureDetails','energyDetails','waterDetails','financingDetails','workflow']);
    $saved=array_merge(array_diff_key($base,$allowed),array_intersect_key($draft['deal'],$allowed));$saved['companyId']=$company['id'];$saved['primaryContactName']=$contact['name']??null;$saved['primaryContactId']=$contact['id']??null;
    if(!in_array($saved['division']??'', ['energy','secure','connect','water','saas'],true)||!in_array($saved['stage']??'',['lead','qualified','quote','final_proposal','negotiation','won','lost'],true)||!in_array($saved['ownerId']??'',array_column($state['users'],'id'),true))throw new InvalidArgumentException('Select a valid division, stage and owner.');
    if(!is_numeric($saved['onceOff']??null)||!is_numeric($saved['mrr']??null))throw new InvalidArgumentException('Enter valid amounts.');
    if(!$target&&!empty($data['separate']))$saved['duplicateDetails']['separate']=array_merge($data['separate'],['by'=>$actor['id'],'at'=>gmdate('c')]);
    if(isset($saved['leadTracker']))$saved['leadTracker']['enquiryReceived']=substr($saved['receivedAt']??'',0,10);
    $state['deals']=array_values(array_filter($state['deals'],fn($d)=>$d['id']!==$saved['id']));$state['deals'][]=$saved;
    $auditOld=$old;
    if($target&&$source){
        $state['deals']=array_values(array_filter($state['deals'],fn($d)=>$d['id']!==$sourceId));
        foreach(['tasks','activities','attachments'] as $table)foreach($state[$table] as &$row){if(($row['dealId']??'')===$sourceId)$row['dealId']=$target['id'];}unset($row);
        // Retain immutable activity IDs and values while moving their parent link.
        foreach($auditOld['activities'] as &$row)if(($row['dealId']??'')===$sourceId)$row['dealId']=$target['id'];unset($row);
        foreach($auditOld['tasks'] as &$row)if(($row['dealId']??'')===$sourceId)$row['dealId']=$target['id'];unset($row);
    }
    workflow_prepare($state,$auditOld,$actor,$target&&$source?($source['workflow']['kyc']??[]):[]);
    $saved=current(array_filter($state['deals'],fn($d)=>$d['id']===$saved['id']));
    upsert_companies($pdo,$state['companies']);upsert_contacts($pdo,$state['contacts']);upsert_deals($pdo,[$saved]);upsert_activities($pdo,$state['activities']);upsert_tasks($pdo,$state['tasks']);upsert_attachments($pdo,$state['attachments']);
    if($archive){$q=$pdo->prepare('INSERT INTO deal_merge_history(id,kept_deal_id,source_deal_id,snapshot_json,merged_by,merged_at) VALUES(?,?,?,?,?,?)');$q->execute([deal_uid('merge'),$saved['id'],$sourceId,json_encode($archive,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),$actor['id'],gmdate('Y-m-d H:i:s')]);}
    if($target&&$source){$q=$pdo->prepare('DELETE FROM deals WHERE id=?');$q->execute([$sourceId]);}
    $pdo->exec('UPDATE crm_revision SET revision=revision+1 WHERE id=1');$fresh=read_state($pdo);$pdo->commit();crm_json(['ok'=>true,'id'=>$saved['id'],'revision'=>$revision+1,'snapshot'=>$fresh]);
} catch(Throwable $e){if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();if($e instanceof DealDuplicateException){crm_json(['ok'=>false,'error'=>$e->getMessage(),'matches'=>$e->matches],409);exit;}error_log((string)$e);crm_json(['ok'=>false,'error'=>$e instanceof InvalidArgumentException?$e->getMessage():'The deal could not be saved. Your draft has been kept.'],400);}
