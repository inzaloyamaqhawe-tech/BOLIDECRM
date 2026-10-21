<?php
declare(strict_types=1);
function frontend_row(array $row): array {
    $out=[];
    foreach($row as $key=>$value) {
        if($key==='password_hash') { $out['registered']=!empty($value); continue; }
        if(str_ends_with($key,'_json')) { $key=substr($key,0,-5); $value=$value===null?null:json_decode($value,true); }
        $key=lcfirst(str_replace(' ','',ucwords(str_replace('_',' ',$key))));
        if(in_array($key,['createdAt','updatedAt','receivedAt','proposalSentAt','stageChangedAt']) && $value) $value=str_replace(' ','T',$value).'Z';
        if(in_array($key,['onceOff','mrr'])) $value=(float)$value;
        if($key==='done') $value=(bool)$value;
        if($key==='options') {if(is_array($value))$out=array_merge($out,$value);continue;}
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
