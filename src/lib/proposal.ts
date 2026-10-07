import type { Deal } from "../types";
// Seven Monday–Friday days after receipt; received day is day zero.
export function localDay(iso: string) { return new Intl.DateTimeFormat("en-CA", {timeZone:"Africa/Johannesburg",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso)); }
export function proposalDue(iso: string) {
 const day = new Date(localDay(iso) + "T12:00:00Z"); let remaining=7;
 while(remaining) { day.setUTCDate(day.getUTCDate()+1); if(day.getUTCDay()!==0 && day.getUTCDay()!==6) remaining--; }
 return day.toISOString().slice(0,10);
}
export function proposalStatus(deal: Deal, now=new Date()) {
 const due=proposalDue(deal.receivedAt ?? deal.createdAt);
 if(deal.proposalSentAt || ["quote","final_proposal","negotiation","won"].includes(deal.stage)) return `Proposal sent · due ${due}`;
 if(deal.stage==="lost") return "Closed as lost";
 const today=localDay(now.toISOString());
 let days=0; const start=new Date((today<due?today:due)+"T12:00:00Z"); const end=today<due?due:today;
 while(start.toISOString().slice(0,10)<end) {start.setUTCDate(start.getUTCDate()+1); if(![0,6].includes(start.getUTCDay()))days++;}
 return today>due ? `Overdue by ${days} working day${days===1?"":"s"} · due ${due}` : today===due ? `Proposal due today · ${due}` : `${days} working day${days===1?"":"s"} left · due ${due}`;
}
