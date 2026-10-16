import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { Deal } from "../types";
import { useCompanies } from "../lib/use-store";

/** Shared live-search picker. Render a small result window rather than thousands of options. */
export function DealPickerDropdown({deals,value,onChange,placeholder="No linked deal",label="Linked deal"}:{deals:Deal[];value:string;onChange:(id:string)=>void;placeholder?:string;label?:string}){
 const companies=useCompanies(),[open,setOpen]=useState(false),[query,setQuery]=useState(""),[limit,setLimit]=useState(50),[highlight,setHighlight]=useState(0);
 const ref=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),results=useRef<HTMLDivElement>(null),id=useId();
 const companyNames=useMemo(()=>new Map(companies.map(c=>[c.id,c.name])),[companies]);
 const indexed=useMemo(()=>deals.map(d=>({deal:d,company:companyNames.get(d.companyId)??"",search:[d.title,companyNames.get(d.companyId),d.site,d.id].filter(Boolean).join(" ").toLowerCase()})),[deals,companyNames]);
 const filtered=useMemo(()=>{const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return indexed.filter(row=>terms.every(term=>row.search.includes(term)));},[indexed,query]);
 const visible=filtered.slice(0,limit),selected=deals.find(d=>d.id===value);
 function close(){setOpen(false);setQuery("");setLimit(50);setHighlight(0);}
 function choose(id:string){onChange(id);close();trigger.current?.focus();}
 useEffect(()=>{const outside=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))close();};document.addEventListener("mousedown",outside);return()=>document.removeEventListener("mousedown",outside);},[]);
 useEffect(()=>{if(open)results.current?.querySelector('[data-highlight="true"]')?.scrollIntoView({block:"nearest"});},[highlight,open]);
 return <div className="relative w-full min-w-0" ref={ref} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))close();}}>
  <button ref={trigger} type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={()=>{if(open)close();else setOpen(true);}} onKeyDown={e=>{if(e.key==="ArrowDown"){e.preventDefault();setOpen(true);}}} className="input flex w-full min-w-0 items-center justify-between gap-2 text-left">
   <span className={"truncate "+(!value?"text-neutral-400":"")}>{selected?.title??(value?"Linked deal unavailable":placeholder)}</span><ChevronDown className="h-4 w-4 shrink-0 text-neutral-400"/>
  </button>
  {open&&<div className="absolute left-0 top-full z-40 mt-2 w-full min-w-[240px] max-w-[calc(100vw-32px)] rounded-xl border bg-white p-2 shadow-xl">
   <div className="relative mb-2"><Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/><input autoFocus type="search" aria-label="Search deals" value={query} onChange={e=>{setQuery(e.target.value);setLimit(50);setHighlight(1);}} placeholder="Search deal, company or site…" className="input pl-8 text-sm" onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();trigger.current?.focus();}else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();setHighlight(h=>Math.max(0,Math.min(visible.length,h+(e.key==="ArrowDown"?1:-1))));}else if(e.key==="Enter"){e.preventDefault();if(highlight===0)choose("");else if(visible[highlight-1])choose(visible[highlight-1].deal.id);}}}/></div>
   <div id={id} ref={results} role="listbox" aria-label={label+" results"} className="max-h-64 overflow-y-auto scroll-thin">
    <button type="button" role="option" aria-selected={!value} data-highlight={highlight===0} onClick={()=>choose("")} className={"w-full rounded-lg px-2 py-2 text-left text-sm text-neutral-500 "+(highlight===0?"bg-pink-50":"hover:bg-neutral-50")}>{placeholder}</button>
    {visible.map((row,i)=><button key={row.deal.id} type="button" role="option" aria-selected={row.deal.id===value} data-highlight={highlight===i+1} onMouseEnter={()=>setHighlight(i+1)} onClick={()=>choose(row.deal.id)} className={"block w-full rounded-lg px-2 py-2 text-left text-sm "+(highlight===i+1?"bg-pink-50":"hover:bg-neutral-50")}><span className="block truncate font-semibold">{row.deal.title}</span><span className="block truncate text-[11px] text-neutral-400">{[row.company,row.deal.site].filter(Boolean).join(" · ")}</span></button>)}
   </div>
   {!filtered.length&&<p role="status" className="p-3 text-xs text-neutral-400">No matching deals.</p>}
   <p className="px-2 pt-2 text-[11px] text-neutral-400">Showing {visible.length} of {filtered.length} matches</p>
   {filtered.length>limit&&<button type="button" className="w-full p-2 text-xs font-bold text-pink-600" onClick={()=>setLimit(limit+50)}>Show 50 more, or refine your search</button>}
  </div>}
 </div>;
}
