<?php
declare(strict_types=1);
require __DIR__.'/session.php';
require __DIR__.'/import-functions.php';
$user=crm_session_user();
function frontend_row(array $row): array {
    $out=[];
    foreach($row as $key=>$value) {
        if($key==='password_hash') { $out['registered']=!empty($value); continue; }
        if(str_ends_with($key,'_json')) { $key=substr($key,0,-5); $value=$value===null?null:json_decode($value,true); }
        $key=lcfirst(str_replace(' ','',ucwords(str_replace('_',' ',$key))));
        if(in_array($key,['createdAt','updatedAt','receivedAt','proposalSentAt','stageChangedAt']) && $value) $value=str_replace(' ','T',$value).'Z';
        if(in_array($key,['onceOff','mrr'])) $value=(float)$value;
        if($key==='done') $value=(bool)$value;
        if($value!==null) $out[$key]=$value;
    }
    return $out;
}
function read_state(PDO $pdo): array {
    $result=[];
    foreach(['users','companies','contacts','deals','activities','tasks','attachments'] as $table) {
        $result[$table]=array_map('frontend_row',$pdo->query('SELECT * FROM '.$table)->fetchAll());
    }
    foreach(['divisionOverrides'=>'division_overrides','stageOverrides'=>'stage_overrides'] as $key=>$table) {
        $result[$key]=new stdClass();
        foreach($pdo->query('SELECT * FROM '.$table)->fetchAll() as $row) {
            $id=$row[$table==='stage_overrides'?'stage_key':'division_key'];
            unset($row['stage_key'],$row['division_key'],$row['updated_at']);
            $result[$key]->{$id}=frontend_row($row);
        }
    }
    return $result;
}
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
    upsert_companies($pdo,$snapshot['companies']); upsert_contacts($pdo,$snapshot['contacts']); upsert_deals($pdo,$snapshot['deals']);
    upsert_activities($pdo,$snapshot['activities']); upsert_tasks($pdo,$snapshot['tasks']); upsert_attachments($pdo,$snapshot['attachments']);
    foreach(['attachments','activities','tasks','deals','contacts','companies'] as $table) {
        $ids=array_column($snapshot[$table],'id');
        if(!$ids) $pdo->exec('DELETE FROM '.$table);
        else { $q=$pdo->prepare('DELETE FROM '.$table.' WHERE id NOT IN ('.implode(',',array_fill(0,count($ids),'?')).')');$q->execute($ids); }
    }
    $pdo->exec('UPDATE crm_revision SET revision=revision+1 WHERE id=1'); $pdo->commit();
    crm_json(['ok'=>true,'revision'=>$revision+1]);
} catch(Throwable $e) {
    if(isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_log((string)$e); crm_json(['ok'=>false,'error'=>$e instanceof InvalidArgumentException?$e->getMessage():'Save failed. Your changes have not been saved to the database.'],400);
}
