import type { Deal } from "../types";
export function localDay(iso: string) {
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Johannesburg",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(iso));
 return ["year","month","day"].map(key=>parts.find(p=>p.type===key)!.value).join("-");
}
// https://www.gov.za/about-sa/public-holidays; Gregorian Easter (Meeus).
export function holidays(year: number): Set<string> {
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;
 const easter=new Date(Date.UTC(year,Math.floor(n/31)-1,n%31+1,12));
 const days=["01-01","03-21","04-27","05-01","06-16","08-09","09-24","12-16","12-25","12-26"].map(s=>year+"-"+s);
 for(const offset of [-2,1]){const dt=new Date(easter);dt.setUTCDate(dt.getUTCDate()+offset);days.push(dt.toISOString().slice(0,10));}
 // Additional proclaimed holidays. Extend this list when new dates are declared.
 days.push(...["2023-12-15","2024-05-29","2026-11-04"].filter(s=>s.startsWith(year+"-")));
 const result=new Set(days);
 for(const date of days){const dt=new Date(date+"T12:00:00Z");if(dt.getUTCDay()===0){dt.setUTCDate(dt.getUTCDate()+1);result.add(dt.toISOString().slice(0,10));}}
 return result;
}
const holidayCache=new Map<number,Set<string>>();
export function isWorkingDay(date: string){const dt=new Date(date+"T12:00:00Z"),year=dt.getUTCFullYear();if(!holidayCache.has(year))holidayCache.set(year,holidays(year));return ![0,6].includes(dt.getUTCDay())&&!holidayCache.get(year)!.has(date);}
export function proposalDue(iso: string){const day=new Date(localDay(iso)+"T12:00:00Z");let remaining=7;while(remaining){day.setUTCDate(day.getUTCDate()+1);if(isWorkingDay(day.toISOString().slice(0,10)))remaining--;}return day.toISOString().slice(0,10);}
export function effectiveProposalDue(deal: Deal): string|undefined {if(deal.workflow?.proposalDueOverride)return deal.workflow.proposalDueOverride;if(deal.leadTracker&&!deal.leadTracker.enquiryReceived)return undefined;return proposalDue(deal.receivedAt??deal.createdAt);}
export function workingDaysBetween(from: string,to: string){const day=new Date(from+"T12:00:00Z");let days=0;while(day.toISOString().slice(0,10)<to){day.setUTCDate(day.getUTCDate()+1);if(isWorkingDay(day.toISOString().slice(0,10)))days++;}return days;}
export function proposalOutstanding(deal: Deal){return !deal.proposalSentAt&&!["quote","final_proposal","negotiation","won","lost"].includes(deal.stage);}
export function proposalStatus(deal: Deal,now=new Date()){
 if(deal.stage==="lost")return "Closed as lost";
 const due=effectiveProposalDue(deal);if(!due)return "Received date not recorded · deadline unavailable";
 if(!proposalOutstanding(deal))return "Proposal sent · due "+due;
 const today=localDay(now.toISOString()),days=workingDaysBetween(today<due?today:due,today<due?due:today),plural=days===1?"":"s";
 return today>due?"Overdue by "+days+" working day"+plural+" · due "+due:today===due?"Proposal due today · "+due:days+" working day"+plural+" left · due "+due;
}
