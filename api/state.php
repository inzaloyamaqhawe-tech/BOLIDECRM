<?php
declare(strict_types=1);
require __DIR__.'/session.php';
require __DIR__.'/import-functions.php';
require __DIR__.'/workflow.php';
$user=crm_session_user();
require __DIR__.'/state-functions.php';
require __DIR__.'/deal-duplicates.php';

try {
    $pdo=crm_pdo();
    if($_SERVER['REQUEST_METHOD']==='GET') {
        $pdo->beginTransaction();
        $revision=(int)$pdo->query('SELECT revision FROM crm_revision WHERE id=1 FOR UPDATE')->fetchColumn();
        $state=read_state($pdo); $pdo->commit();
        crm_json(['ok'=>true,'revision'=>$revision,'snapshot'=>$state]); exit;
    }
    if($_SERVER['REQUEST_METHOD']!=='POST') { crm_json(['ok'=>false],405); exit; }
    crm_csrf(); $data=crm_input(); $snapshot=$data['snapshot'] ?? [];
    foreach(['users','companies','contacts','deals','activities','tasks','attachments','divisionOverrides','stageOverrides'] as $key) if(!isset($snapshot[$key]) || !is_array($snapshot[$key])) throw new InvalidArgumentException('Incomplete data.');
    $pdo->beginTransaction();
    $revision=(int)$pdo->query('SELECT revision FROM crm_revision WHERE id=1 FOR UPDATE')->fetchColumn();
    if($revision!==($data['revision'] ?? -1)) { $pdo->rollBack(); crm_json(['ok'=>false,'error'=>'Another team member saved changes. Reload before saving again.'],409); exit; }
    $old=read_state($pdo);
    if($user['role']!=='admin') {
        $identity=fn($rows)=>array_map(fn($u)=>array_intersect_key($u,array_flip(['id','name','email','role'])),$rows);
        if($identity($old['users'])!==$identity($snapshot['users']) || json_encode($old['divisionOverrides'])!==json_encode((object)$snapshot['divisionOverrides']) || json_encode($old['stageOverrides'])!==json_encode((object)$snapshot['stageOverrides'])) throw new InvalidArgumentException('Only administrators can change users and settings.');
    } else {
        // Never accept browser password hashes or remove existing accounts.
        foreach($snapshot['users'] as $row) {
            $q=$pdo->prepare('INSERT INTO users(id,name,email,role) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),email=VALUES(email),role=VALUES(role)');
            if(!filter_var($row['email'],FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Invalid email.');
            $q->execute([$row['id'],$row['name'],strtolower($row['email']),$row['role']]);
        }
        $q=$pdo->prepare('SELECT role FROM users WHERE id=?');$q->execute([$user['id']]);if($q->fetchColumn()!=='admin') throw new InvalidArgumentException('You cannot remove your own administrator access.');
        upsert_division_overrides($pdo,$snapshot['divisionOverrides']); upsert_stage_overrides($pdo,$snapshot['stageOverrides']);
    }
    duplicate_guard($snapshot,$old,$user);
    workflow_prepare($snapshot,$old,$user);
    foreach($snapshot['users'] as $row) if($row['id']===$user['id']){$q=$pdo->prepare('UPDATE users SET saved_views_json=? WHERE id=?');$q->execute([json_encode($row['savedViews']??[]),$user['id']]);}
    upsert_companies($pdo,$snapshot['companies']); upsert_contacts($pdo,$snapshot['contacts']); upsert_deals($pdo,$snapshot['deals']);
    upsert_activities($pdo,$snapshot['activities']); upsert_tasks($pdo,$snapshot['tasks']); upsert_attachments($pdo,$snapshot['attachments']);
    foreach(['attachments','activities','tasks','deals','contacts','companies'] as $table) {
        $ids=array_column($snapshot[$table],'id');
        if(!$ids) $pdo->exec('DELETE FROM '.$table);
        else { $q=$pdo->prepare('DELETE FROM '.$table.' WHERE id NOT IN ('.implode(',',array_fill(0,count($ids),'?')).')');$q->execute($ids); }
    }
    $pdo->exec('UPDATE crm_revision SET revision=revision+1 WHERE id=1'); $pdo->commit();
    crm_json(['ok'=>true,'revision'=>$revision+1,'deals'=>$snapshot['deals'],'activities'=>$snapshot['activities']]);
} catch(Throwable $e) {
    if(isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    if($e instanceof DealDuplicateException){crm_json(['ok'=>false,'error'=>$e->getMessage(),'matches'=>$e->matches],409);exit;}
    error_log((string)$e); crm_json(['ok'=>false,'error'=>$e instanceof InvalidArgumentException?$e->getMessage():'Save failed. Your changes have not been saved to the database.'],400);
}
