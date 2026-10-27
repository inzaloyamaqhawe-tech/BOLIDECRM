<?php
declare(strict_types=1);
// Keep the calendar aligned with src/lib/proposal.ts.
function notification_holidays(int $year): array {
    $a=$year%19;$b=intdiv($year,100);$c=$year%100;$d=intdiv($b,4);$e=$b%4;$f=intdiv($b+8,25);$g=intdiv($b-$f+1,3);$h=(19*$a+$b-$d-$g+15)%30;$i=intdiv($c,4);$k=$c%4;$l=(32+2*$e+2*$i-$h-$k)%7;$m=intdiv($a+11*$h+22*$l,451);$n=$h+$l-7*$m+114;
    $easter=new DateTimeImmutable(sprintf('%04d-%02d-%02d',$year,intdiv($n,31),$n%31+1),new DateTimeZone('Africa/Johannesburg'));
    $days=array_map(fn($d)=>$year.'-'.$d,['01-01','03-21','04-27','05-01','06-16','08-09','09-24','12-16','12-25','12-26']);
    $days[]=$easter->modify('-2 days')->format('Y-m-d');$days[]=$easter->modify('+1 day')->format('Y-m-d');
    foreach(['2023-12-15','2024-05-29','2026-11-04'] as $date)if(str_starts_with($date,$year.'-'))$days[]=$date;
    foreach($days as $date){$dt=new DateTimeImmutable($date);if($dt->format('N')==='7')$days[]=$dt->modify('+1 day')->format('Y-m-d');}
    return array_unique($days);
}
function notification_proposal_due(string $received): string {
    $day=(new DateTimeImmutable($received,new DateTimeZone('UTC')))->setTimezone(new DateTimeZone('Africa/Johannesburg'));$remaining=7;
    while($remaining){$day=$day->modify('+1 day');if((int)$day->format('N')<6&&!in_array($day->format('Y-m-d'),notification_holidays((int)$day->format('Y')),true))$remaining--;}
    return $day->format('Y-m-d');
}
function notification_candidates(PDO $pdo,string $userId): array {
    $result=[];$now=time();$today=(new DateTimeImmutable('now',new DateTimeZone('Africa/Johannesburg')))->format('Y-m-d');
    foreach($pdo->query('SELECT id,title,deal_id,due_date,done,options_json FROM tasks')->fetchAll() as $task){
        $o=json_decode($task['options_json']??'{}',true)??[];
        if($task['done']||($o['assigneeId']??'')!==$userId||empty($o['reminderAt'])||strtotime($o['reminderAt'])>$now)continue;
        $result[]=['id'=>'task:'.$task['id'],'title'=>$task['title'],'body'=>'Your '.($o['priority']??'normal').' priority task'.($task['due_date']?' ? due '.$task['due_date']:''),'url'=>$task['deal_id']?'deals?open='.rawurlencode($task['deal_id']):'tasks'];
    }
    foreach($pdo->query('SELECT id,title,owner_id,stage,proposal_sent_at,received_at,created_at,lead_tracker_json,workflow_json FROM deals')->fetchAll() as $deal){
        $w=json_decode($deal['workflow_json']??'{}',true)??[];$tracker=json_decode($deal['lead_tracker_json']??'null',true);
        if(($deal['owner_id']!==$userId&&($w['escalationUserId']??'')!==$userId)||$deal['proposal_sent_at']||in_array($deal['stage'],['quote','final_proposal','negotiation','won','lost'],true))continue;
        $due=$w['proposalDueOverride']??null;if(!$due&&$tracker&&empty($tracker['enquiryReceived']))continue;
        $due=$due?:notification_proposal_due($deal['received_at']?:$deal['created_at']);if($due>=$today)continue;
        $result[]=['id'=>'proposal:'.$deal['id'].':'.$due,'title'=>'Overdue proposal: '.$deal['title'],'body'=>($deal['owner_id']===$userId?'Your proposal is overdue':'Proposal escalated to you').' ? due '.$due,'url'=>'deals?open='.rawurlencode($deal['id'])];
    }
    return $result;
}
