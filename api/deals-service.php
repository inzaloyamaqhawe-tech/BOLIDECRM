<?php
declare(strict_types=1);
class DealEditConflict extends InvalidArgumentException {
    public function __construct(public string $field,public mixed $current,public mixed $incoming){parent::__construct('Another person changed this field. Review both values before saving.');}
}
function deal_uid(string $prefix): string {return $prefix.'-'.bin2hex(random_bytes(16));}
function deal_contact(array &$state,string $company,array $input): ?array {
    $name=trim($input['name']??'');$email=strtolower(trim($input['email']??''));$phone=trim($input['phone']??'');if(!$name){if($email||$phone)throw new InvalidArgumentException('Enter the contact name.');return null;}
    if($email&&!filter_var($email,FILTER_VALIDATE_EMAIL))throw new InvalidArgumentException('Invalid contact email.');
    foreach($state['contacts'] as &$contact)if($contact['companyId']===$company&&deal_normalise($contact['name'])===deal_normalise($name)){$contact['name']=$name;if(array_key_exists('email',$input))$contact['email']=$email;if(array_key_exists('phone',$input))$contact['phone']=$phone;return $contact;}unset($contact);
    $contact=['id'=>deal_uid('ct'),'companyId'=>$company,'name'=>$name,'email'=>$email,'createdAt'=>gmdate('Y-m-d\TH:i:s\Z')];if($phone)$contact['phone']=$phone;$state['contacts'][]=$contact;return $contact;
}
function deal_as_draft(array $deal,array $state): array {
    $company=current(array_filter($state['companies'],fn($c)=>$c['id']===$deal['companyId']));$contact=current(array_filter($state['contacts'],fn($c)=>$c['id']===($deal['primaryContactId']??'')));
    return ['deal'=>$deal,'companyName'=>$company['name']??'','contact'=>['name'=>$contact['name']??$deal['primaryContactName']??'','phone'=>$contact['phone']??'','email'=>$contact['email']??'']];
}
function deal_rebase_value(mixed $base,mixed $input,mixed $current,string $path): mixed {
    if(workflow_diff($base,$input)===[])return $current;
    if((is_array($base)&&!array_is_list($base))||(is_array($input)&&!array_is_list($input))){
        $result=is_array($current)?$current:[];
        foreach(array_unique(array_merge(array_keys(is_array($base)?$base:[]),array_keys(is_array($input)?$input:[]))) as $key){
            if($path==='workflow'&&$key==='nextAction')continue;
            $value=deal_rebase_value($base[$key]??null,$input[$key]??null,$current[$key]??null,$path.'.'.$key);
            if($value===null)unset($result[$key]);else $result[$key]=$value;
        }return $result;
    }
    if(workflow_diff($base,$current)!==[]&&workflow_diff($input,$current)!==[])throw new DealEditConflict($path,$current,$input);
    return $input;
}
function deal_rebase_draft(array $base,array $input,array $current): array {
    $result=$current;
    foreach(['title','site','division','segment','productLine','stage','onceOff','mrr','ownerId','closeDate','notes','lostReason','receivedAt','secureDetails','energyDetails','waterDetails','connectDetails','financingDetails','workflow'] as $key){
        $value=deal_rebase_value($base['deal'][$key]??null,$input['deal'][$key]??null,$current['deal'][$key]??null,$key);
        if($value===null)unset($result['deal'][$key]);else $result['deal'][$key]=$value;
    }
    $result['companyName']=deal_rebase_value($base['companyName']??null,$input['companyName'],$current['companyName'],'company');
    $result['contact']=deal_rebase_value($base['contact']??[],$input['contact']??[],$current['contact'],'contact');return $result;
}
function deal_write(PDO $pdo,array $data,array $actor,array $old): array {
    $state=$old;$draft=$data['draft'];$action=$data['action'];$sourceId=$data['sourceId']??null;$source=$sourceId?current(array_filter($state['deals'],fn($d)=>$d['id']===$sourceId)):null;
    if($sourceId&&!$source)throw new InvalidArgumentException('This deal no longer exists.');
    $matches=deal_matches($draft,$state,$sourceId);
    if(!trim($draft['companyName'])||!trim($draft['deal']['title']??''))throw new InvalidArgumentException('Enter a company and deal title.');
    if($source&&$action==='update'&&isset($data['baseDraft']))$draft=deal_rebase_draft($data['baseDraft'],$draft,deal_as_draft($source,$state));
    elseif($source&&($data['sourceVersion']??'')!==deal_version($source,array_column($state['contacts'],null,'id')[$source['primaryContactId']??'']??null))throw new DealDuplicateException($matches,'This deal changed since you opened it. Reopen its latest details before saving; your draft has been kept.');
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
        // Detailed source values stay in the immutable archive; sales activity uses a concise description.
        $state['activities'][]=['id'=>deal_uid('a'),'dealId'=>$target['id'],'type'=>'system','body'=>'Merged '.($source?('deal '.$source['title']):'a new draft').' into '.$target['title'].'.','userId'=>$actor['id'],'createdAt'=>gmdate('Y-m-d\TH:i:s\Z')];
    } else {
        $identityChanged=!$source||duplicate_identity(array_merge($draft['deal'],['companyId'=>'draft']),['draft'=>$draft['companyName']])!==duplicate_identity($source,array_column($old['companies'],'name','id'));
        if(!$source)duplicate_decision($matches,$data['separate']??null);
    }
    $company=current(array_filter($state['companies'],fn($c)=>deal_normalise($c['name'])===deal_normalise($draft['companyName'])));
    if($target)$company=current(array_filter($state['companies'],fn($c)=>$c['id']===$target['companyId']));
    if(!$company){$company=['id'=>deal_uid('c'),'name'=>trim($draft['companyName']),'industry'=>'—','status'=>'Prospect','divisions'=>[$draft['deal']['division']??'secure'],'createdAt'=>gmdate('Y-m-d\TH:i:s\Z')];$state['companies'][]=$company;}
    foreach($state['companies'] as &$row)if($row['id']===$company['id'])$row['divisions']=array_values(array_unique(array_merge($row['divisions']??[],[$draft['deal']['division']])));unset($row);
    // A different incoming person is retained as an additional company contact, even when the existing primary contact is kept.
    if($mergeContact&&deal_normalise($mergeContact['name']??'')!==deal_normalise($draft['contact']['name']??''))deal_contact($state,$company['id'],$mergeContact);
    $contact=deal_contact($state,$company['id'],$draft['contact']??[]);
    $base=$target?:$source?:['id'=>deal_uid('d'),'createdAt'=>gmdate('Y-m-d\TH:i:s\Z'),'createdById'=>$actor['id']];
    $allowed=array_flip(['title','site','division','segment','productLine','stage','onceOff','mrr','ownerId','closeDate','notes','lostReason','receivedAt','secureDetails','energyDetails','waterDetails','connectDetails','financingDetails','workflow','leadTracker']);
    $saved=array_merge(array_diff_key($base,$allowed),array_intersect_key($draft['deal'],$allowed));$saved['companyId']=$company['id'];$saved['primaryContactName']=$contact['name']??null;$saved['primaryContactId']=$contact['id']??null;
    if(!in_array($saved['division']??'', ['energy','secure','connect','water','saas'],true)||!in_array($saved['stage']??'',['lead','qualified','quote','final_proposal','negotiation','won','lost'],true)||!in_array($saved['ownerId']??'',array_column($state['users'],'id'),true))throw new InvalidArgumentException('Select a valid division, stage and owner.');
    if(!is_numeric($saved['onceOff']??null)||!is_numeric($saved['mrr']??null))throw new InvalidArgumentException('Enter valid amounts.');
    if(!$target&&!empty($data['separate']))$saved['duplicateDetails']['separate']=array_merge($data['separate'],['by'=>$actor['id'],'at'=>gmdate('c')]);
    if(isset($saved['leadTracker'])&&(!empty($saved['leadTracker']['enquiryReceived'])||($saved['receivedAt']??null)!==($source['receivedAt']??null)))$saved['leadTracker']['enquiryReceived']=substr($saved['receivedAt']??'',0,10);
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

    return ['id'=>$saved['id']];
}
