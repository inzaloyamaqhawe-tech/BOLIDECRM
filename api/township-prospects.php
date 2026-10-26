<?php
declare(strict_types=1);
require __DIR__.'/db.php';
require __DIR__.'/import-functions.php';
require __DIR__.'/state-functions.php';
require __DIR__.'/workflow.php';
require __DIR__.'/deal-duplicates.php';
require __DIR__.'/deals-service.php';
require __DIR__.'/township-functions.php';
crm_apply_cors();crm_require_secret();
try {
    if($_SERVER['REQUEST_METHOD']!=='POST')throw new InvalidArgumentException('Method not allowed.');
    $data=crm_input();$action=(string)($data['action']??'list');$actor=tp_actor($data);$pdo=crm_pdo();
    if($action==='list'){crm_json(['ok'=>true,'leads'=>tp_all($pdo)]);exit;}
    if($action==='get'){$lead=tp_one($pdo,(string)($data['leadId']??''));if(!$lead)throw new InvalidArgumentException('Lead not found.');crm_json(['ok'=>true,'lead'=>$lead]);exit;}
    if($action==='owners'){$rows=$pdo->query('SELECT id,name,email FROM users ORDER BY name')->fetchAll();crm_json(['ok'=>true,'owners'=>$rows]);exit;}
    if($action==='activity'){$q=$pdo->prepare('SELECT id,lead_id,body AS text,created_by_external AS created_by,created_by_name,created_at FROM township_lead_activity WHERE lead_id=? ORDER BY created_at DESC');$q->execute([(string)($data['leadId']??'')]);crm_json(['ok'=>true,'activity'=>$q->fetchAll()]);exit;}
    if($action==='photos'){$q=$pdo->prepare('SELECT id,lead_id,storage_path,caption,uploaded_by_external AS uploaded_by,created_at FROM township_lead_photos WHERE lead_id=? ORDER BY created_at DESC');$q->execute([(string)($data['leadId']??'')]);crm_json(['ok'=>true,'photos'=>$q->fetchAll()]);exit;}
    tp_require_edit($actor);
    if($action==='bootstrap'){
        $pdo->beginTransaction();$added=0;
        foreach(($data['leads']??[]) as $lead)if(is_array($lead)&&preg_match('/^[a-zA-Z0-9-]{2,64}$/D',(string)($lead['id']??'')))$added+=(int)tp_insert_ignore($pdo,$lead,(string)$lead['id']);
        foreach(($data['activity']??[]) as $row)if(is_array($row)&&tp_one($pdo,(string)($row['lead_id']??'')))tp_activity($pdo,(string)$row['lead_id'],(string)($row['text']??''),['id'=>(string)($row['created_by']??$actor['id']),'name'=>$actor['name']],(string)($row['id']??tp_id('tpa')),(string)($row['created_at']??''));
        foreach(($data['photos']??[]) as $row)if(is_array($row)&&tp_one($pdo,(string)($row['lead_id']??''))){$q=$pdo->prepare('INSERT IGNORE INTO township_lead_photos(id,lead_id,storage_path,caption,uploaded_by_external,created_at) VALUES(?,?,?,?,?,?)');$q->execute([(string)($row['id']??tp_id('tpp')),(string)$row['lead_id'],(string)$row['storage_path'],$row['caption']??null,$row['uploaded_by']??null,crm_iso_to_mysql($row['created_at']??null)??gmdate('Y-m-d H:i:s')]);}
        $pdo->commit();crm_json(['ok'=>true,'added'=>$added,'leads'=>tp_all($pdo)]);exit;
    }
    if($action==='create'){
        $row=tp_clean(is_array($data['lead']??null)?$data['lead']:[],true);if($duplicate=tp_duplicate($pdo,$row)){crm_json(['ok'=>false,'error'=>'This business and location already exist in Township Prospector.','existingId'=>$duplicate['id']],409);exit;}
        $id=(string)($data['lead']['id']??tp_id('L'));if(!preg_match('/^[a-zA-Z0-9-]{2,64}$/D',$id))throw new InvalidArgumentException('Invalid lead ID.');
        $pdo->beginTransaction();tp_insert_ignore($pdo,array_merge($row,['created_by'=>$row['created_by']??$actor['name']]),$id);tp_activity($pdo,$id,'Lead added',$actor);$pdo->commit();crm_json(['ok'=>true,'lead'=>tp_one($pdo,$id)],201);exit;
    }
    if($action==='update'){
        $id=(string)($data['leadId']??'');$pdo->beginTransaction();$current=tp_one($pdo,$id,true);if(!$current)throw new InvalidArgumentException('Lead not found.');if((int)($data['version']??0)!==(int)$current['version']){ $pdo->rollBack();crm_json(['ok'=>false,'error'=>'This lead changed. Review the latest information before saving.','lead'=>$current],409);exit;}
        $patch=tp_clean(is_array($data['patch']??null)?$data['patch']:[]);unset($patch['created_at'],$patch['updated_at'],$patch['crm_deal_id']);if(!$patch)throw new InvalidArgumentException('No lead changes supplied.');
        $merged=array_merge($current,$patch);if(empty($merged['business_name'])||empty($merged['industry'])||empty($merged['township']))throw new InvalidArgumentException('Business name, industry and township are required.');
        if($duplicate=tp_duplicate($pdo,$merged,$id)){throw new InvalidArgumentException('This business and location already exist in Township Prospector.');}
        $sets=[];$values=[];foreach($patch as $key=>$value){$sets[]=$key.'=?';$values[]=$value;}$sets[]='version=version+1';$sets[]='updated_at=UTC_TIMESTAMP()';$values[]=$id;$q=$pdo->prepare('UPDATE township_leads SET '.implode(',',$sets).' WHERE id=?');$q->execute($values);if(trim((string)($data['activityText']??'')))tp_activity($pdo,$id,(string)$data['activityText'],$actor);$pdo->commit();crm_json(['ok'=>true,'lead'=>tp_one($pdo,$id)]);exit;
    }
    if($action==='addActivity'){$id=(string)($data['leadId']??'');if(!tp_one($pdo,$id))throw new InvalidArgumentException('Lead not found.');tp_activity($pdo,$id,(string)($data['text']??''),$actor);crm_json(['ok'=>true]);exit;}
    if($action==='addPhoto'){$id=(string)($data['leadId']??'');$path=trim((string)($data['storagePath']??''));if(!tp_one($pdo,$id))throw new InvalidArgumentException('Lead not found.');if($path===''||strlen($path)>500||str_contains($path,'..'))throw new InvalidArgumentException('Invalid photo path.');$q=$pdo->prepare('INSERT INTO township_lead_photos(id,lead_id,storage_path,caption,uploaded_by_external,created_at) VALUES(?,?,?,?,?,UTC_TIMESTAMP())');$photoId=tp_id('tpp');$q->execute([$photoId,$id,$path,$data['caption']??null,$actor['id']]);crm_json(['ok'=>true,'id'=>$photoId]);exit;}
    if($action==='promotionPreview'){
        $lead=tp_one($pdo,(string)($data['leadId']??''));if(!$lead)throw new InvalidArgumentException('Lead not found.');$ownerId=(string)($data['ownerId']??'');$state=[];foreach(['users','companies','contacts','deals'] as $table)$state[$table]=array_map('frontend_row',$pdo->query('SELECT * FROM '.$table)->fetchAll());if(!in_array($ownerId,array_column($state['users'],'id'),true))throw new InvalidArgumentException('Choose a CRM owner.');crm_json(['ok'=>true,'matches'=>deal_matches(tp_draft($lead,$ownerId),$state)]);exit;
    }
    if($action==='promote'){
        $leadId=(string)($data['leadId']??'');$ownerId=(string)($data['ownerId']??'');$requestId=(string)($data['requestId']??'');if(!preg_match('/^[a-zA-Z0-9-]{16,64}$/D',$requestId))throw new InvalidArgumentException('Invalid promotion reference.');
        $pdo->beginTransaction();$pdo->query('SELECT revision FROM crm_revision WHERE id=1 FOR UPDATE');$lead=tp_one($pdo,$leadId,true);if(!$lead)throw new InvalidArgumentException('Lead not found.');if($lead['crm_deal_id']){$pdo->commit();crm_json(['ok'=>true,'dealId'=>$lead['crm_deal_id'],'alreadyPromoted'=>true]);exit;}
        $ownerQ=$pdo->prepare('SELECT id,name,email,role FROM users WHERE id=?');$ownerQ->execute([$ownerId]);$owner=$ownerQ->fetch();if(!$owner)throw new InvalidArgumentException('Choose a CRM owner.');$actorQ=$pdo->prepare('SELECT id,name,email,role FROM users WHERE LOWER(email)=?');$actorQ->execute([$actor['email']]);$crmActor=$actorQ->fetch()?:$owner;
        $state=read_state($pdo);$draft=tp_draft($lead,$ownerId);$matches=deal_matches($draft,$state);$potential=array_values(array_filter($matches,fn($m)=>!empty($m['potential'])));$decision=(string)($data['decision']??'');$dealId='';$resultDecision='created';
        if($potential&&$decision==='link'){$target=current(array_filter($potential,fn($m)=>$m['deal']['id']===($data['targetDealId']??'')));if(!$target)throw new InvalidArgumentException('Choose a matching CRM deal to link.');$dealId=$target['deal']['id'];$resultDecision='linked';$q=$pdo->prepare('INSERT INTO activities(id,deal_id,company_id,type,body,user_id,created_at) VALUES(?,?,?,?,?,?,UTC_TIMESTAMP())');$q->execute([tp_id('a'),$dealId,$target['deal']['companyId'],'update','Interest confirmed by '.$actor['name'].' in Township Prospector.',$crmActor['id']]);}
        else {$request=['action'=>'create','draft'=>$draft];if($potential){if($decision!=='separate'||strlen(trim((string)($data['reason']??'')))<5)throw new DealDuplicateException($matches);$request['separate']=['reason'=>trim((string)$data['reason']),'matches'=>array_map(fn($m)=>['id'=>$m['deal']['id'],'version'=>$m['version']],$potential)];$resultDecision='separate';}$dealId=deal_write($pdo,$request,$crmActor,$state)['id'];}
        $q=$pdo->prepare('UPDATE township_leads SET status="Interested",crm_deal_id=?,version=version+1,updated_at=UTC_TIMESTAMP() WHERE id=?');$q->execute([$dealId,$leadId]);tp_activity($pdo,$leadId,'Interest confirmed and moved to the CRM pipeline.',$actor);
        $q=$pdo->prepare('INSERT INTO township_lead_promotions(id,request_id,lead_id,crm_deal_id,decision,promoted_by_external,promoted_by_name,snapshot_json,promoted_at) VALUES(?,?,?,?,?,?,?,?,UTC_TIMESTAMP())');$q->execute([tp_id('tpm'),$requestId,$leadId,$dealId,$resultDecision,$actor['id'],$actor['name'],json_encode(['lead'=>$lead,'owner'=>$owner,'matches'=>$matches],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)]);$pdo->exec('UPDATE crm_revision SET revision=revision+1 WHERE id=1');$pdo->commit();crm_json(['ok'=>true,'dealId'=>$dealId,'decision'=>$resultDecision]);exit;
    }
    throw new InvalidArgumentException('Invalid Township Prospector action.');
} catch(Throwable $e) {
    if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();
    if($e instanceof DealDuplicateException){crm_json(['ok'=>false,'error'=>$e->getMessage(),'matches'=>$e->matches],409);exit;}
    error_log((string)$e);crm_json(['ok'=>false,'error'=>$e instanceof InvalidArgumentException?$e->getMessage():'The Township Prospector request could not be completed.'],400);
}
