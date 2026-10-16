import type { Attachment, Deal, KycItem, Task } from "../types";
import { localDay } from "./proposal";
export const activeDeal=(deal: Deal)=>!["won","lost"].includes(deal.stage);
export const defaultKyc=(): KycItem[]=>[
 {id:"registration",label:"Company registration document",required:true,status:"missing"},
 {id:"identity",label:"Authorised signatory identity document",required:true,status:"missing"},
 {id:"address",label:"Proof of business address",required:true,status:"missing"},
];
export function kycIssues(items: KycItem[]|undefined,attachments?: Attachment[],today=localDay(new Date().toISOString())){
 if(!items || !["registration","identity","address"].every(id=>items.some(i=>i.id===id&&i.required)))return ["Complete the KYC checklist before progressing beyond Qualify/KYC Onboarding."];
 return items.filter(i=>i.required&&(i.status!=="verified"||!i.attachmentId||!i.verifiedBy||!i.verifiedAt||(i.expiresOn&&i.expiresOn<today)||(attachments&&!attachments.some(a=>a.id===i.attachmentId)))).map(i=>i.label+": verify a supporting document and check expiry.");
}
export function workflowErrors(after: Deal,before?: Deal,attachments?: Attachment[]){
 const errors:string[]=[],today=localDay(new Date().toISOString());
 if(activeDeal(after)){const next=after.workflow?.nextAction;if(!next?.title.trim()||!next.assigneeId||!/^\d{4}-\d{2}-\d{2}$/.test(next.dueDate))errors.push("An active deal needs a next action, responsible person and due date.");}
 if(after.stage==="lost"&&!after.lostReason?.trim())errors.push("A lost reason is required.");
 if(after.stage==="won"){
  if(!after.workflow?.signedOn||after.workflow.signedOn>today)errors.push("Record a valid signature date (today or earlier) before marking Won.");
  if(!after.workflow?.signedAttachmentId||(attachments&&!attachments.some(a=>a.id===after.workflow?.signedAttachmentId&&a.dealId===after.id)))errors.push("Attach and select the signed final proposal before marking Won.");
 }
 if(["quote","final_proposal","negotiation","won"].includes(after.stage)&&(!before||before.stage!==after.stage))errors.push(...kycIssues(after.workflow?.kyc,attachments));
 if(before&&(before.workflow?.proposalDueOverride!==after.workflow?.proposalDueOverride||(before.receivedAt?localDay(before.receivedAt):undefined)!==(after.receivedAt?localDay(after.receivedAt):undefined))&&!after.workflow?.deadlineReason?.trim())errors.push("Explain why the proposal deadline / received date is changing.");
 if(after.workflow?.proposalDueOverride&&!after.workflow.deadlineReason?.trim())errors.push("Enter a reason for the proposal deadline override.");
 return errors;
}
export function dealFlags(deal: Deal,now=new Date()){
 if(!activeDeal(deal))return [];const flags:string[]=[],next=deal.workflow?.nextAction,today=localDay(now.toISOString());
 if(!next?.title||!next.assigneeId||!next.dueDate)flags.push("No next action");else if(next.dueDate<today)flags.push("Next action overdue");
 if(now.getTime()-new Date(deal.updatedAt).getTime()>14*86400000)flags.push("Inactive 14+ days");return flags;
}
export function nextOccurrence(task: Task): Partial<Task>|undefined {
 if(!task.dueDate||!task.recurrence||task.recurrence==="none")return undefined;
 const due=new Date(task.dueDate+"T12:00:00Z");
 if(task.recurrence==="monthly"){const original=due.getUTCDate();due.setUTCDate(1);due.setUTCMonth(due.getUTCMonth()+1);const last=new Date(Date.UTC(due.getUTCFullYear(),due.getUTCMonth()+1,0)).getUTCDate();due.setUTCDate(Math.min(original,last));}else due.setUTCDate(due.getUTCDate()+(task.recurrence==="weekly"?7:1));
 const dueDate=due.toISOString().slice(0,10),reminderAt=task.reminderAt?new Date(new Date(task.reminderAt).getTime()+due.getTime()-new Date(task.dueDate+"T12:00:00Z").getTime()).toISOString():undefined;
 return {dueDate,reminderAt};
}
