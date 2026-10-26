<?php
declare(strict_types=1);

const TP_STATUSES=['New','Researching','Contacted','Follow-up','Interested','Not interested','Unreachable'];
const TP_FIELDS=['business_name','brand','industry','township','suburb','address','standalone','lat','lng','phone','email','website','contact_person','owner_operator','energy_profile','notes','source_url','electricity_provider','water_provider','utility_confidence','utility_rule','utility_source','utility_confirmed','rooftop_solar','roof_area_m2','marketing_consent','status','owner_external_id','score','tier','created_by','created_at','updated_at'];

function tp_id(string $prefix): string {return $prefix.'-'.bin2hex(random_bytes(16));}
function tp_status(string $value): string {
    return match($value){'Site visit','Proposal','Won'=>'Follow-up','Not a fit'=>'Not interested',default=>in_array($value,TP_STATUSES,true)?$value:'New'};
}
function tp_actor(array $data): array {
    $actor=is_array($data['actor']??null)?$data['actor']:[];
    if(!preg_match('/^[a-zA-Z0-9-]{8,80}$/D',(string)($actor['id']??''))||!filter_var($actor['email']??'',FILTER_VALIDATE_EMAIL)||empty($actor['active']))throw new InvalidArgumentException('Invalid Township Prospector user.');
    return ['id'=>(string)$actor['id'],'email'=>strtolower((string)$actor['email']),'name'=>trim((string)($actor['name']??$actor['email'])),'canEdit'=>!empty($actor['canEdit'])];
}
function tp_require_edit(array $actor): void {if(!$actor['canEdit'])throw new InvalidArgumentException('This account has view-only access.');}
function tp_lead(array $row): array {
    $row['standalone']=$row['standalone']===null?null:(bool)$row['standalone'];
    foreach(['lat','lng','roof_area_m2'] as $key)$row[$key]=$row[$key]===null?null:(float)$row[$key];
    foreach(['score','version'] as $key)$row[$key]=$row[$key]===null?null:(int)$row[$key];
    $row['owner_user']=$row['owner_external_id'];unset($row['owner_external_id']);return $row;
}
function tp_all(PDO $pdo): array {return array_map('tp_lead',$pdo->query('SELECT * FROM township_leads ORDER BY score DESC,business_name')->fetchAll());}
function tp_one(PDO $pdo,string $id,bool $lock=false): ?array {$q=$pdo->prepare('SELECT * FROM township_leads WHERE id=?'.($lock?' FOR UPDATE':''));$q->execute([$id]);$row=$q->fetch();return $row?tp_lead($row):null;}
function tp_clean(array $input,bool $creating=false): array {
    $out=[];foreach(TP_FIELDS as $field)if(array_key_exists($field,$input))$out[$field]=$input[$field];
    if(array_key_exists('owner_user',$input))$out['owner_external_id']=$input['owner_user'];
    foreach(['business_name','brand','industry','township','suburb','address','phone','email','website','contact_person','owner_operator','electricity_provider','water_provider','utility_confidence','utility_rule','utility_source','utility_confirmed','tier','created_by'] as $field)if(array_key_exists($field,$out))$out[$field]=trim((string)$out[$field])?:null;
    foreach(['energy_profile','notes','source_url'] as $field)if(array_key_exists($field,$out))$out[$field]=trim((string)$out[$field])?:null;
    if(!empty($out['email'])&&!filter_var($out['email'],FILTER_VALIDATE_EMAIL))throw new InvalidArgumentException('Enter a valid email address.');
    if(array_key_exists('standalone',$out))$out['standalone']=$out['standalone']===null?null:(int)(bool)$out['standalone'];
    foreach(['lat','lng','roof_area_m2'] as $field)if(array_key_exists($field,$out))$out[$field]=$out[$field]===''||$out[$field]===null?null:(float)$out[$field];
    if(array_key_exists('score',$out))$out['score']=$out['score']===null?null:max(0,min(100,(int)$out['score']));
    if(array_key_exists('marketing_consent',$out))$out['marketing_consent']=crm_iso_to_mysql($out['marketing_consent']);
    if(array_key_exists('status',$out))$out['status']=tp_status((string)$out['status']);
    if(($out['status']??'')==='Interested')throw new InvalidArgumentException('Use Move to CRM pipeline to mark a prospect interested.');
    if($creating&&(empty($out['business_name'])||empty($out['industry'])||empty($out['township'])))throw new InvalidArgumentException('Business name, industry and township are required.');
    return $out;
}
function tp_insert_ignore(PDO $pdo,array $input,string $id): bool {
    $row=tp_clean($input,true);$row['id']=$id;$row['status']=tp_status((string)($input['status']??'New'));
    $row['created_at']=crm_iso_to_mysql($input['created_at']??null)??gmdate('Y-m-d H:i:s');$row['updated_at']=crm_iso_to_mysql($input['updated_at']??null)??$row['created_at'];
    $fields=array_merge(['id'],TP_FIELDS);$fields=array_values(array_unique($fields));$params=[];foreach($fields as $f)$params[$f]=$row[$f]??null;
    $sql='INSERT IGNORE INTO township_leads('.implode(',',$fields).') VALUES(:'.implode(',:',$fields).')';$q=$pdo->prepare($sql);$q->execute($params);return $q->rowCount()>0;
}
function tp_activity(PDO $pdo,string $leadId,string $body,array $actor,?string $id=null,?string $at=null): void {
    if(trim($body)==='')return;$q=$pdo->prepare('INSERT IGNORE INTO township_lead_activity(id,lead_id,body,created_by_external,created_by_name,created_at) VALUES(?,?,?,?,?,?)');$q->execute([$id?:tp_id('tpa'),$leadId,trim($body),$actor['id'],$actor['name'],crm_iso_to_mysql($at)??gmdate('Y-m-d H:i:s')]);
}
function tp_duplicate(PDO $pdo,array $row,?string $excludeId=null): ?array {
    foreach($pdo->query('SELECT id,business_name,township,address FROM township_leads')->fetchAll() as $old)if($old['id']!==$excludeId&&deal_normalise($old['business_name'])===deal_normalise($row['business_name']??'')&&deal_normalise($old['township'])===deal_normalise($row['township']??'')&&deal_normalise($old['address'])===deal_normalise($row['address']??''))return $old;return null;
}
function tp_draft(array $lead,string $ownerId): array {
    $site=trim((string)($lead['address']??''))?:trim((string)$lead['township']);$solar=($lead['roof_area_m2']??0)>0?round((float)$lead['roof_area_m2']*.18,2):null;
    return ['companyName'=>$lead['business_name'],'contact'=>['name'=>$lead['contact_person']?:($lead['owner_operator']?:''),'phone'=>$lead['phone']??'','email'=>$lead['email']??''],'deal'=>[
        'title'=>$lead['business_name'].' — Solar/PPA','site'=>$site,'division'=>'energy','segment'=>'Commercial','productLine'=>'Solar/PPA','stage'=>'lead','onceOff'=>0,'mrr'=>0,'ownerId'=>$ownerId,'notes'=>$lead['notes']??'','receivedAt'=>gmdate('c'),
        'energyDetails'=>array_filter(['solarKwp'=>$solar,'roofAreaM2'=>$lead['roof_area_m2']??null,'existingSolar'=>$lead['rooftop_solar']??'unknown','electricityProvider'=>$lead['electricity_provider']??null]),'workflow'=>[],
        'leadTracker'=>['source'=>'Township Prospector','townshipLeadId'=>$lead['id'],'township'=>$lead['township'],'suburb'=>$lead['suburb']??null,'score'=>$lead['score']??null,'tier'=>$lead['tier']??null,'sourceUrl'=>$lead['source_url']??null]
    ]];
}
