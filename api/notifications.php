<?php
declare(strict_types=1);
require __DIR__.'/session.php';
require __DIR__.'/notification-functions.php';
$user=crm_session_user();
try {
    $pdo=crm_pdo();
    if(!in_array($_SERVER['REQUEST_METHOD'],['GET','POST'],true)){crm_json(['ok'=>false,'error'=>'Method not allowed'],405);exit;}
    if($_SERVER['REQUEST_METHOD']==='POST') {
        crm_csrf();$data=crm_input();$action=$data['action']??'';
        if($action==='read-all'){$q=$pdo->prepare('UPDATE notifications SET read_at=UTC_TIMESTAMP() WHERE recipient_id=? AND read_at IS NULL');$q->execute([$user['id']]);}
        elseif(in_array($action,['read','unread'],true)&&is_string($data['id']??null)){$q=$pdo->prepare('UPDATE notifications SET read_at='.($action==='read'?'UTC_TIMESTAMP()':'NULL').' WHERE recipient_id=? AND id=?');$q->execute([$user['id'],$data['id']]);}
        else throw new InvalidArgumentException('Invalid notification action.');
    }
    $candidates=notification_candidates($pdo,$user['id']);
    $insert=$pdo->prepare('INSERT INTO notifications(recipient_id,id,title,body,url) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),body=VALUES(body),url=VALUES(url)');
    foreach($candidates as $n)$insert->execute([$user['id'],$n['id'],$n['title'],$n['body'],$n['url']]);
    // The inbox represents current reminders, not a repeated event log. Remove
    // generated rows whose task or overdue condition is no longer current.
    $active=array_column($candidates,'id');
    $old=$pdo->prepare("SELECT id FROM notifications WHERE recipient_id=? AND (id LIKE 'task:%' OR id LIKE 'proposal:%')");$old->execute([$user['id']]);
    $delete=$pdo->prepare('DELETE FROM notifications WHERE recipient_id=? AND id=?');
    foreach($old->fetchAll(PDO::FETCH_COLUMN) as $id)if(!in_array($id,$active,true))$delete->execute([$user['id'],$id]);
    $q=$pdo->prepare('SELECT id,title,body,url,created_at,read_at FROM notifications WHERE recipient_id=? ORDER BY created_at DESC,id DESC');$q->execute([$user['id']]);
    $messages=array_map(fn($n)=>['id'=>$n['id'],'title'=>$n['title'],'body'=>$n['body'],'url'=>$n['url'],'createdAt'=>str_replace(' ','T',$n['created_at']).'Z','readAt'=>$n['read_at']?str_replace(' ','T',$n['read_at']).'Z':null,'active'=>in_array($n['id'],$active,true)],$q->fetchAll());
    crm_json(['ok'=>true,'notifications'=>$messages]);
} catch(Throwable $e){error_log((string)$e);crm_json(['ok'=>false,'error'=>$e instanceof InvalidArgumentException?$e->getMessage():'Unable to load or save your reminder inbox.'],400);}
