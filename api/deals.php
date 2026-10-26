<?php
declare(strict_types=1);
require __DIR__.'/session.php';
require __DIR__.'/import-functions.php';
require __DIR__.'/state-functions.php';
require __DIR__.'/workflow.php';
require __DIR__.'/deal-duplicates.php';
require __DIR__.'/deals-service.php';
$actor=crm_session_user();
try {
    if($_SERVER['REQUEST_METHOD']!=='POST'){crm_json(['ok'=>false,'error'=>'Method not allowed'],405);exit;}
    crm_csrf();$data=crm_input();$action=$data['action']??'check';
    if(!in_array($action,['check','create','update','merge','batch'],true))throw new InvalidArgumentException('Invalid deal request.');
    $requests=$action==='batch'?($data['requests']??[]):[$data];
    if(!is_array($requests)||!count($requests)||count($requests)>20)throw new InvalidArgumentException('Select between one and twenty solutions.');
    foreach($requests as $request)if(!is_array($request['draft']['deal']??null)||!is_string($request['draft']['companyName']??null)||!in_array($request['action']??'', ['check','create','update','merge'],true))throw new InvalidArgumentException('Invalid deal request.');
    if($action==='batch')foreach($requests as $i=>$request)foreach(array_slice($requests,0,$i) as $previous)if(duplicate_kind($request['draft'],$previous['draft']['deal'],$previous['draft']['companyName'])==='potential')throw new InvalidArgumentException('Two selected solutions have the same company, solution and location. Give each project a distinct location or product, or remove the repeated solution.');
    $pdo=crm_pdo();$pdo->beginTransaction();$revision=(int)$pdo->query('SELECT revision FROM crm_revision WHERE id=1'.($action==='check'?'':' FOR UPDATE'))->fetchColumn();
    if($action==='check'){
        $state=[];foreach(['users','companies','contacts','deals'] as $table)$state[$table]=array_map('frontend_row',$pdo->query('SELECT * FROM '.$table)->fetchAll());
        $matches=deal_matches($data['draft'],$state,$data['sourceId']??null);$pdo->commit();crm_json(['ok'=>true,'matches'=>$matches]);exit;
    }
    $requestId=$action==='batch'?($data['requestId']??''):'';$hash=hash('sha256',json_encode($requests));
    if($action==='batch'){
        if(!preg_match('/^[a-zA-Z0-9-]{16,64}$/D',$requestId))throw new InvalidArgumentException('Invalid save reference.');
        $q=$pdo->prepare('SELECT payload_hash,saved_ids_json FROM deal_save_requests WHERE id=? AND user_id=?');$q->execute([$requestId,$actor['id']]);$previous=$q->fetch();
        if($previous){if($previous['payload_hash']!==$hash)throw new InvalidArgumentException('This save already completed with different details. Reload to view the saved company deals before starting another save.');$ids=json_decode($previous['saved_ids_json'],true);$fresh=read_state($pdo);$pdo->commit();crm_json(['ok'=>true,'id'=>$ids[0],'ids'=>$ids,'revision'=>$revision,'snapshot'=>$fresh]);exit;}
    }
    $ids=[];$requestIndex=0;
    foreach($requests as $requestIndex=>$request){if($action==='batch'&&$request['action']!=='create')throw new InvalidArgumentException('Add new solutions in a company batch. Edit existing deals individually.');$result=deal_write($pdo,$request,$actor,read_state($pdo));$ids[]=$result['id'];}
    if($action==='batch'){$q=$pdo->prepare('INSERT INTO deal_save_requests(id,user_id,payload_hash,saved_ids_json,created_at) VALUES(?,?,?,?,UTC_TIMESTAMP())');$q->execute([$requestId,$actor['id'],$hash,json_encode($ids)]);}
    $pdo->exec('UPDATE crm_revision SET revision=revision+1 WHERE id=1');$fresh=read_state($pdo);$pdo->commit();crm_json(['ok'=>true,'id'=>$ids[0],'ids'=>$ids,'revision'=>$revision+1,'snapshot'=>$fresh]);
}catch(Throwable $e){
    if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();
    if($e instanceof DealEditConflict){crm_json(['ok'=>false,'error'=>$e->getMessage(),'fieldConflict'=>['field'=>$e->field,'current'=>$e->current,'incoming'=>$e->incoming]],409);exit;}
    if($e instanceof DealDuplicateException){crm_json(['ok'=>false,'error'=>$e->getMessage(),'matches'=>$e->matches,'requestIndex'=>$requestIndex??0],409);exit;}
    error_log((string)$e);crm_json(['ok'=>false,'error'=>$e instanceof InvalidArgumentException?$e->getMessage():'The deal could not be saved. Your draft has been kept.','requestIndex'=>$requestIndex??0],400);
}
