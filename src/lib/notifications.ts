import type { Deal, Task } from "../types";
import { effectiveProposalDue, localDay, proposalOutstanding } from "./proposal";
export interface ReminderMessage {id:string;title:string;body:string;url:string;createdAt:string;readAt:string|null;active:boolean;}
export function reminderCandidates(userId:string,tasks:Task[],deals:Deal[],now=new Date()):Omit<ReminderMessage,"readAt"|"createdAt"|"active">[]{
 const today=localDay(now.toISOString());
 return [
  ...tasks.filter(t=>!t.done&&t.assigneeId===userId&&t.reminderAt&&new Date(t.reminderAt)<=now).map(t=>({id:"task:"+t.id+":"+t.reminderAt,title:t.title,body:"Your "+(t.priority??"normal")+" priority task"+(t.dueDate?" · due "+t.dueDate:""),url:"tasks"})),
  ...deals.filter(d=>proposalOutstanding(d)&&(d.ownerId===userId||d.workflow?.escalationUserId===userId)&&!!effectiveProposalDue(d)&&effectiveProposalDue(d)!<today).map(d=>({id:"proposal:"+d.id+":"+effectiveProposalDue(d)+":"+today,title:"Overdue proposal: "+d.title,body:(d.ownerId===userId?"Your proposal is overdue":"Proposal escalated to you")+" · due "+effectiveProposalDue(d),url:"deals?open="+encodeURIComponent(d.id)})),
 ];
}
export function previewInbox(userId:string,candidates:ReturnType<typeof reminderCandidates>,action?:{action:string;id?:string}):ReminderMessage[]{
 const key="bolide-crm:inbox:"+userId;let messages:ReminderMessage[]=[];
 try{messages=JSON.parse(localStorage.getItem(key)??"[]");}catch{ /* start a valid personal inbox */ }
 for(const candidate of candidates){const existing=messages.find(n=>n.id===candidate.id);if(existing)Object.assign(existing,candidate);else messages.unshift({...candidate,createdAt:new Date().toISOString(),readAt:null,active:true});}
 if(action)for(const message of messages)if(action.action==="read-all"||message.id===action.id)message.readAt=action.action==="unread"?null:new Date().toISOString();
 messages=messages.map(n=>({...n,active:candidates.some(c=>c.id===n.id)}));
 localStorage.setItem(key,JSON.stringify(messages));return messages.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
