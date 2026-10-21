<?php
declare(strict_types=1);
class DealDuplicateException extends RuntimeException {public function __construct(public array $matches,string $message='A similar deal already exists. Open it, review a merge, or explain why this is a separate opportunity.'){parent::__construct($message);}}
function deal_normalise(?string $value): string {return preg_replace('/[^a-z0-9]/','',strtolower($value??''));}
function deal_canonical(mixed $value): mixed {if(!is_array($value))return $value;if(!array_is_list($value))ksort($value,SORT_STRING);foreach($value as &$v)$v=deal_canonical($v);return $value;}
function deal_version(array $deal,?array $contact=null): string {return hash('sha256',json_encode(deal_canonical([$deal,$contact]),JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_LINE_TERMINATORS));}
function duplicate_kind(array $draft,array $existing,string $company): ?string {
    $a=deal_normalise($draft['companyName']??'');$b=deal_normalise($company);if(!$a||!$b)return null;
    if($a!==$b)return strlen($a)>=3&&(str_contains($a,$b)||str_contains($b,$a))?'related':null;
    $fresh=$draft['deal']??[];if(($fresh['division']??'')!==$existing['division'])return 'related';
    $site=deal_normalise($fresh['site']??'');$oldSite=deal_normalise($existing['site']??'');$product=deal_normalise($fresh['productLine']??'');$oldProduct=deal_normalise($existing['productLine']??'');
    return ($site&&$oldSite&&$site!==$oldSite)||($product&&$oldProduct&&$product!==$oldProduct)?'related':'potential';
}
function deal_matches(array $draft,array $state,?string $exclude=null): array {
    $companies=array_column($state['companies'],'name','id');$users=array_column($state['users'],'name','id');$contacts=array_column($state['contacts'],null,'id');$matches=[];
    foreach($state['deals'] as $deal){if($deal['id']===$exclude)continue;$company=$companies[$deal['companyId']]??'';$kind=duplicate_kind($draft,$deal,$company);if(!$kind)continue;
        $matches[]=['deal'=>$deal,'companyName'=>$company,'ownerName'=>$users[$deal['ownerId']]??'Unknown owner','creatorName'=>$users[$deal['createdById']??'']??null,'contact'=>$contacts[$deal['primaryContactId']??'']??null,'version'=>deal_version($deal,$contacts[$deal['primaryContactId']??'']??null),'potential'=>$kind==='potential','reason'=>$kind==='potential'?'Same company and solution; location matches or needs confirmation':'Same or similar company, different or unconfirmed opportunity'];
    }
    usort($matches,fn($a,$b)=>(int)$b['potential']<=>(int)$a['potential']);return $matches;
}
function duplicate_decision(array $matches,?array $decision): void {
    $potential=array_filter($matches,fn($m)=>$m['potential']);if(!$potential)return;
    $reviewed=array_column($decision['matches']??[],'version','id');
    if(strlen(trim($decision['reason']??''))<5)throw new DealDuplicateException(array_values($matches));
    foreach($potential as $match)if(($reviewed[$match['deal']['id']]??'')!==$match['version'])throw new DealDuplicateException(array_values($matches),'The matching deals changed. Review their latest information before creating a separate opportunity.');
}
function duplicate_identity(array $deal,array $companies): string {return implode('|',array_map('deal_normalise',[$companies[$deal['companyId']]??'',$deal['division']??'',$deal['site']??'',$deal['productLine']??'']));}
function duplicate_guard(array &$snapshot,array $old,array $actor): void {
    $before=array_column($old['deals'],null,'id');$companies=array_column($snapshot['companies'],'name','id');$oldCompanies=array_column($old['companies'],'name','id');
    foreach($snapshot['deals'] as &$deal){$previous=$before[$deal['id']]??null;$deal['createdById']=$previous['createdById']??$actor['id'];if($previous&&!isset($previous['createdById']))unset($deal['createdById']);
        if($previous&&duplicate_identity($deal,$companies)===duplicate_identity($previous,$oldCompanies))continue;
        $matches=deal_matches(['companyName'=>$companies[$deal['companyId']]??'','deal'=>$deal],$snapshot,$deal['id']);
        duplicate_decision($matches,$deal['duplicateDetails']['separate']??null);
        if(!empty($deal['duplicateDetails']['separate'])){$deal['duplicateDetails']['separate']['by']=$actor['id'];$deal['duplicateDetails']['separate']['at']=gmdate('c');}
    }unset($deal);
}
function merge_missing(mixed $value): bool {return $value===null||$value===''||$value===[];}
function deal_merge_fields(array $target,array $incoming): array {
    $old=array_merge($target['deal'],['contact'=>$target['contact']]);$fresh=array_merge($incoming['deal'],['contact'=>$incoming['contact']]);$rows=[];
    $walk=function($a,$b,$path) use (&$walk,&$rows){if($a===$b||merge_missing($b))return;if($path==='contact'&&!empty($a['name'])&&!empty($b['name'])&&deal_normalise($a['name'])!==deal_normalise($b['name'])){$rows[]=['path'=>$path,'before'=>$a,'after'=>$b,'fill'=>false];return;}if(is_array($b)&&!array_is_list($b)){foreach($b as $k=>$v){if($path==='workflow'&&$k==='nextAction')continue;$walk($a[$k]??null,$v,$path.'.'.$k);}}else $rows[]=['path'=>$path,'before'=>$a,'after'=>$b,'fill'=>merge_missing($a)];};
    foreach(['title','site','segment','productLine','stage','onceOff','mrr','ownerId','closeDate','receivedAt','lostReason','secureDetails','energyDetails','waterDetails','financingDetails','workflow','contact'] as $root)$walk($old[$root]??null,$fresh[$root]??null,$root);
    return $rows;
}
function deal_merge_draft(array $target,array $incoming,array $choices): array {
    $view=array_merge($target['deal'],['contact'=>$target['contact']]);
    foreach(deal_merge_fields($target,$incoming) as $field)if(in_array($field['path'],$choices,true)){$keys=explode('.',$field['path']);$node=&$view;foreach(array_slice($keys,0,-1) as $key){if(!is_array($node[$key]??null))$node[$key]=[];$node=&$node[$key];}$node[end($keys)]=$field['after'];unset($node);}
    if(trim($incoming['deal']['notes']??'')!==''&&trim($incoming['deal']['notes'])!==trim($target['deal']['notes']??''))$view['notes']=implode("\n\n",array_filter([$target['deal']['notes']??'','Merged information:'."\n".trim($incoming['deal']['notes'])]));
    $contact=$view['contact'];unset($view['contact']);return ['companyName'=>$target['companyName'],'deal'=>$view,'contact'=>$contact];
}
