<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(403);exit;}
if(($argv[1]??'')!=='--apply')throw new RuntimeException('Explicit --apply is required. Prepare and review the private import plan first.');
require __DIR__.'/../api/db.php';require __DIR__.'/../api/state-functions.php';require __DIR__.'/../api/import-functions.php';require __DIR__.'/../api/workflow.php';
$plan=json_decode(file_get_contents(__DIR__.'/../.import-work/screenshot-import-plan.json'),true,512,JSON_THROW_ON_ERROR);$pdo=crm_pdo();$pdo->beginTransaction();
try{
 $revision=(int)$pdo->query('SELECT revision FROM crm_revision WHERE id=1 FOR UPDATE')->fetchColumn();
 if($revision!==$plan['revision'])throw new RuntimeException('Database changed since preparation. Prepare a fresh plan; no records were changed.');
 $old=read_state($pdo);$oldDeals=array_column($old['deals'],null,'id');$deals=array_column($plan['after']['deals'],null,'id');
 foreach($oldDeals as $id=>$row)if(!isset($deals[$id]))throw new RuntimeException('Import would remove an existing record.');
 $oldCompanies=array_column($old['companies'],null,'id');$changedCompanies=array_filter($plan['after']['companies'],fn($r)=>!isset($oldCompanies[$r['id']])||workflow_diff($oldCompanies[$r['id']],$r)!==[]);
 $oldContacts=array_column($old['contacts'],null,'id');$changedContacts=array_filter($plan['after']['contacts'],fn($r)=>!isset($oldContacts[$r['id']])||workflow_diff($oldContacts[$r['id']],$r)!==[]);
 upsert_companies($pdo,array_values($changedCompanies));upsert_contacts($pdo,array_values($changedContacts));$added=0;$enriched=0;$skipped=0;
 foreach($plan['sources'] as $source){
  if(basename($source['source'])!==$source['source'])throw new RuntimeException('Invalid screenshot path.');
  $image=__DIR__.'/../../Deals/'.$source['source'];if(!is_file($image)||hash_file('sha256',$image)!==$source['sha256'])throw new RuntimeException('Screenshot changed since preparation.');
  $q=$pdo->prepare('SELECT id FROM deal_import_history WHERE source_key=?');$q->execute([$source['source']]);if($q->fetchColumn()){$skipped++;continue;}
  $id=$source['targetId']??$source['deal']['id'];$after=$deals[$id];$before=$oldDeals[$id]??null;
  if($before&&$before['ownerId']!==$after['ownerId'])throw new RuntimeException('Existing ownership must be preserved.');
  $after['updatedAt']=gmdate('Y-m-d\TH:i:s\Z');if(!$before||$before['stage']!==$after['stage'])$after['stageChangedAt']=$after['updatedAt'];
  $actions=['lead'=>'Qualify/KYC Onboarding','qualified'=>'Preliminary Proposal','quote'=>'Final Proposal','final_proposal'=>'Negotiation','negotiation'=>'Final Proposal Signed'];
  if(isset($actions[$after['stage']]))$after['workflow']['nextAction']=['title'=>$actions[$after['stage']]];
  // This is a historical status import, not evidence of KYC verification, a receipt date or a signature.
  upsert_deals($pdo,[$after]);
  // Technical provenance stays in deal_import_history, outside the sales activity feed.
  $q=$pdo->prepare('INSERT INTO deal_import_history(id,deal_id,source_key,before_json,after_json,source_json,imported_at) VALUES(?,?,?,?,?,?,UTC_TIMESTAMP())');$q->execute(['imp-'.bin2hex(random_bytes(16)),$id,$source['source'],$before?json_encode($before):null,json_encode($after),json_encode($source)]);
  if($before)$enriched++;else $added++;
 }
 $pdo->exec('UPDATE crm_revision SET revision=revision+1 WHERE id=1');$pdo->commit();echo "Imported: $added new; $enriched existing enriched; $skipped already imported. No existing deals deleted.\n";
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
