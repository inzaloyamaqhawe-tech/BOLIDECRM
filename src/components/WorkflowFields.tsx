import { useState } from "react";
import type { Attachment, DealWorkflow, KycItem, StageKey } from "../types";
import { useUsers } from "../lib/use-store";
import { useAuth } from "../lib/auth";
import { defaultKyc, kycIssues } from "../lib/workflow";
import { localDay } from "../lib/proposal";

export function WorkflowFields({value,onChange,stage,attachments,isNew}:{value:DealWorkflow;onChange:(v:DealWorkflow)=>void;stage:StageKey;attachments:Attachment[];isNew:boolean}) {
 const users=useUsers(),{user}=useAuth();const [open,setOpen]=useState(false),[newLabel,setNewLabel]=useState("");
 const patch=(p:Partial<DealWorkflow>)=>onChange({...value,...p});
 const items=value.kyc??defaultKyc(),next=value.nextAction??{title:"",assigneeId:user?.id??"",dueDate:""};
 function itemPatch(id:string,p:Partial<KycItem>){patch({kyc:items.map(i=>i.id===id?{...i,...p}:i)});}
 const issues=kycIssues(items,attachments);
 return <div className="sm:col-span-2 space-y-4 rounded-xl border border-sky-100 bg-sky-50/40 p-4">
  {!["won","lost"].includes(stage)&&<>
   <h3 className="font-bold">Required next action</h3>
   <input aria-label="Next action" className="input" placeholder="Next step for this deal" value={next.title} onChange={e=>patch({nextAction:{...next,title:e.target.value}})}/>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold">Responsible person<select className="input mt-1" value={next.assigneeId} onChange={e=>patch({nextAction:{...next,assigneeId:e.target.value}})}><option value="">Choose person</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
    <label className="text-xs font-semibold">Next action due<input className="input mt-1" type="date" value={next.dueDate} onChange={e=>patch({nextAction:{...next,dueDate:e.target.value}})}/></label>
   </div>
  </>}
  <details><summary className="cursor-pointer font-semibold">Proposal deadline and escalation</summary>
   <p className="my-2 text-xs text-neutral-500">Default: seven South African working days after receipt, excluding public holidays. An override or received-date correction needs a reason. Escalation alerts the selected person when overdue.</p>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold">Override deadline<input className="input mt-1" type="date" value={value.proposalDueOverride??""} onChange={e=>patch({proposalDueOverride:e.target.value||undefined,deadlineReason:""})}/></label>
    <label className="text-xs font-semibold">Escalate to<select className="input mt-1" value={value.escalationUserId??""} onChange={e=>patch({escalationUserId:e.target.value||undefined})}><option value="">Deal owner only</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   </div>
   <label className="mt-2 block text-xs font-semibold">Reason for deadline / received-date change<textarea className="input mt-1" value={value.deadlineReason??""} onChange={e=>patch({deadlineReason:e.target.value})}/></label>
  </details>
  <div>
   {stage==="qualified"&&<p className="mb-2 text-sm font-semibold">Qualify/KYC Onboarding: complete verification before progressing to a proposal.</p>}
   <button type="button" className="rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-bold" aria-expanded={open} onClick={()=>{setOpen(!open);if(!value.kyc)patch({kyc:items});}}>{open?"Hide":"Open"} KYC checklist · {items.filter(i=>i.status==="verified").length}/{items.length} verified</button>
   {open&&<div className="mt-3 space-y-3">
    <p className="text-xs text-neutral-500">Starting checklist: registration, signatory ID and business address. Add requirements for the deal below. Upload documents under Attachments after saving the deal.</p>
    {items.map(item=><div key={item.id} className="space-y-2 rounded-lg border bg-white p-3">
     <div className="text-sm font-bold">{item.label}{item.required?" *":" (optional)"}</div>
     <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-xs">Verification<select className="input" value={item.status} onChange={e=>itemPatch(item.id,{status:e.target.value as KycItem["status"],verifiedBy:e.target.value==="verified"?user?.id:undefined,verifiedAt:e.target.value==="verified"?new Date().toISOString():undefined})}><option value="missing">Missing</option><option value="received">Received</option><option value="verified">Verified</option></select></label>
      <label className="text-xs">Supporting document<select className="input" value={item.attachmentId??""} onChange={e=>itemPatch(item.id,{attachmentId:e.target.value||undefined,status:"received",verifiedAt:undefined,verifiedBy:undefined})}><option value="">Select attachment</option>{attachments.map(a=><option key={a.id} value={a.id}>{a.filename}</option>)}</select></label>
      <label className="text-xs">Expiry (if applicable)<input type="date" className="input" value={item.expiresOn??""} onChange={e=>itemPatch(item.id,{expiresOn:e.target.value||undefined,status:"received",verifiedAt:undefined,verifiedBy:undefined})}/></label>
     </div>
     {item.expiresOn&&item.expiresOn<localDay(new Date().toISOString())&&<p className="text-xs font-bold text-red-600">Document expired</p>}
     {item.verifiedBy&&<p className="text-xs text-neutral-500">Verified by {users.find(u=>u.id===item.verifiedBy)?.name??item.verifiedBy} · {item.verifiedAt}</p>}
    </div>)}
    <div className="flex gap-2"><input className="input" placeholder="Additional required document" value={newLabel} onChange={e=>setNewLabel(e.target.value)}/><button type="button" className="text-sm font-bold" onClick={()=>{if(newLabel.trim()){patch({kyc:[...items,{id:crypto.randomUUID(),label:newLabel.trim(),required:true,status:"missing"}]});setNewLabel("");}}}>Add</button></div>
    <p className="text-xs text-neutral-500">{issues.length?issues.join(" "):"Required KYC documents verified."}</p>
   </div>}
  </div>
  {(stage==="won"||stage==="final_proposal"||stage==="negotiation"||value.signedOn)&&<div className="space-y-2 border-t pt-3">
   <h3 className="font-bold">Signed final proposal</h3>
   {isNew&&<p className="text-sm text-amber-700">Save the deal in an earlier stage first, then attach its signed final proposal.</p>}
   <label className="block text-xs font-semibold">Signature date<input className="input mt-1" type="date" max={localDay(new Date().toISOString())} value={value.signedOn??""} onChange={e=>patch({signedOn:e.target.value||undefined})}/></label>
   <label className="block text-xs font-semibold">Signed final proposal document<select className="input mt-1" value={value.signedAttachmentId??""} onChange={e=>patch({signedAttachmentId:e.target.value||undefined})}><option value="">Select signed attachment</option>{attachments.map(a=><option key={a.id} value={a.id}>{a.filename}</option>)}</select></label>
  </div>}
 </div>;
}
