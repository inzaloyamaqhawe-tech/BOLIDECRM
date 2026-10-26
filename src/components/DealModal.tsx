import {CompanyDealModal} from './CompanyDealModal';
import {SolutionDetails,cleanSolutionDetails,parseAmount} from './SolutionDetails';
import { DealDuplicatePanel, targetDraft } from "./DealDuplicatePanel";
import { CrmApiError } from "../lib/remote";
import { DealFieldConflict, canonical, dealVersion, normaliseDealText, type DealDraft, type DuplicateMatch } from "../lib/deal-duplicates";
import { WorkflowFields } from "./WorkflowFields";
import { TaskEditor } from "./TaskEditor";
import { workflowErrors } from "../lib/workflow";
import type { DealWorkflow } from "../types";
import { proposalStatus } from "../lib/proposal";
import { useEffect, useRef, useState } from "react";
import { X, Copy, Paperclip, Download, Trash2, Send, CalendarClock } from "lucide-react";
import type { BankModelStatus, Activity, Attachment, Deal, DivisionKey, Segment, StageKey } from "../types";
import {
  cloneDeal,
  createCompany,
  createDeal,
  checkDealDuplicates,
  saveDealDraft,
  getDeal,
  createTask,
  deleteDeal,
  getActivities,
  getDivisions,
  getStagesLive,
  logActivity,
  restoreDeal,
  saveDealContact,
  subscribe,
  updateDeal,
} from "../lib/store";
import { useCompanies, useContacts, useUsers } from "../lib/use-store";
import { formatZAR, formatDate, findSimilarName } from "../lib/format";
import { addAttachment, deleteAttachment, formatFileSize, getAttachments } from "../lib/attachments";
import { DivisionBadge } from "./DivisionBadge";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";

const SEGMENTS: Segment[] = ["Commercial", "Industrial", "Forecourt", "MDU"];

// Fixed per client request (email, Sep 2026) — Product Line is a plain
// dropdown of these four now, not a free-text field suggesting a division's
// product lines.
const PRODUCT_LINES = ["Water", "Security", "Solar", "Fibre"];
const optionalNumber=(value:string)=>value.trim()===""?undefined:parseAmount(value);

interface Props {
  /** Pass an existing deal to edit/view it; omit to create a new one. */
  deal?: Deal;
  /** Pre-select a division when creating fresh (e.g. from a Pipeline column). */
  defaultDivision?: DivisionKey;
  defaultStage?: StageKey;
  onClose: () => void;
}

/**
 * Single modal used everywhere a deal needs to be created, viewed, or edited:
 * the "+ New deal" button, a row click in Deals, and now a card click in the
 * Pipeline board too (previously the Pipeline only let you drag a card
 * between stages — there was no way to see what a client was actually
 * quoted before it became a Deal).
 */
export function DealModal(props:Props){return props.deal?<SingleDealEditor {...props}/>:<CompanyDealModal defaultDivision={props.defaultDivision} defaultStage={props.defaultStage} onClose={props.onClose}/>;}
export function SingleDealEditor({ deal, defaultDivision, defaultStage, onClose }: Props) {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const companies = useCompanies();
  const users = useUsers();
  const contacts = useContacts();
  const linkedContact=contacts.find(c=>c.id===deal?.primaryContactId) ?? contacts.find(c=>c.companyId===deal?.companyId && c.name.toLowerCase()===deal?.primaryContactName?.toLowerCase());
  const draftStorageKey='crm:deal-draft:'+user?.id+':'+(deal?.id??'new');
  const restored=useRef<any>((()=>{try{return JSON.parse(sessionStorage.getItem(draftStorageKey)??'null');}catch{return null;}})());
  const initialDeal={...deal,...restored.current?.draft?.deal} as Partial<Deal>;
  const baseline=useRef<DealDraft>(restored.current?.baseline??{companyName:companies.find(c=>c.id===deal?.companyId)?.name??'',contact:{name:linkedContact?.name??deal?.primaryContactName??'',phone:linkedContact?.phone??'',email:linkedContact?.email??''},deal:JSON.parse(JSON.stringify(deal??{}))});
  const closeEditorRef=useRef(onClose);
  const [extraDetails,setExtraDetails]=useState<Partial<Deal>>({energyDetails:initialDeal.energyDetails,waterDetails:initialDeal.waterDetails,connectDetails:initialDeal.connectDetails});
  const [addSolutionsSeed,setAddSolutionsSeed]=useState<Deal>();
  const [copyMode,setCopyMode]=useState(!!restored.current?.copyMode);
  const isNew = copyMode || !deal;
  const divisions = getDivisions();
  const stages = getStagesLive();

  const [title, setTitle] = useState(initialDeal?.title ?? "");
  const [companyName, setCompanyName] = useState(restored.current?.draft?.companyName??companies.find(c=>c.id===deal?.companyId)?.name??"");
  const [primaryContactName, setPrimaryContactName] = useState(restored.current?.draft?.contact?.name??linkedContact?.name??initialDeal?.primaryContactName??"");
  const [contactPhone, setContactPhone] = useState(restored.current?.draft?.contact?.phone??linkedContact?.phone??"");
  const [contactEmail, setContactEmail] = useState(restored.current?.draft?.contact?.email??linkedContact?.email??"");
  const [division, setDivision] = useState<DivisionKey>(initialDeal?.division ?? defaultDivision ?? "secure");
  const [segment, setSegment] = useState<Segment | "">(initialDeal?.segment ?? "");
  const [site, setSite] = useState(initialDeal?.site ?? "");
  const [productLine, setProductLine] = useState(initialDeal?.productLine ?? "");
  const [stage, setStage] = useState<StageKey>(initialDeal?.stage ?? defaultStage ?? "lead");
  const [lostReason, setLostReason] = useState(initialDeal?.lostReason ?? "");
  const [onceOff, setOnceOff] = useState(restored.current?.rawNumbers?.onceOff??initialDeal?.onceOff?.toString() ?? "0");
  const [mrr, setMrr] = useState(restored.current?.rawNumbers?.mrr??initialDeal?.mrr?.toString() ?? "0");
  const [ownerId, setOwnerId] = useState(initialDeal?.ownerId ?? users[0]?.id ?? "");
  const [closeDate, setCloseDate] = useState(initialDeal?.closeDate ?? "");
  const [notes, setNotes] = useState(initialDeal?.notes ?? "");

  const [camerasInstalled, setCamerasInstalled] = useState(restored.current?.rawNumbers?.camerasInstalled??initialDeal?.secureDetails?.camerasInstalled?.toString() ?? "");
  const [camerasMonitored, setCamerasMonitored] = useState(restored.current?.rawNumbers?.camerasMonitored??initialDeal?.secureDetails?.camerasMonitored?.toString() ?? "");
  const [solarKwp, setSolarKwp] = useState(restored.current?.rawNumbers?.solarKwp??initialDeal?.energyDetails?.solarKwp?.toString() ?? "");
  const [bessKwh, setBessKwh] = useState(restored.current?.rawNumbers?.bessKwh??initialDeal?.energyDetails?.bessKwh?.toString() ?? "");
  const [ratePerKwh, setRatePerKwh] = useState(restored.current?.rawNumbers?.ratePerKwh??initialDeal?.energyDetails?.ratePerKwh?.toString() ?? "");
  const [litresPerDay, setLitresPerDay] = useState(restored.current?.rawNumbers?.litresPerDay??initialDeal?.waterDetails?.litresPerDay?.toString() ?? "");

  const [bankModelStatus, setBankModelStatus] = useState<BankModelStatus | "">(initialDeal?.financingDetails?.bankModelStatus ?? "");
  const [contractSignatureDate, setContractSignatureDate] = useState(initialDeal?.financingDetails?.contractSignatureDate ?? "");
  const [operationsStartDate, setOperationsStartDate] = useState(initialDeal?.financingDetails?.operationsStartDate ?? "");
  const [capexPpa, setCapexPpa] = useState(restored.current?.rawNumbers?.capexPpa??initialDeal?.financingDetails?.capexPpa?.toString() ?? "");
  const [capexRental, setCapexRental] = useState(restored.current?.rawNumbers?.capexRental??initialDeal?.financingDetails?.capexRental?.toString() ?? "");
  const [ppaIrr, setPpaIrr] = useState(restored.current?.rawNumbers?.ppaIrr??initialDeal?.financingDetails?.ppaIrr?.toString() ?? "");
  const [rentalIrr, setRentalIrr] = useState(restored.current?.rawNumbers?.rentalIrr??initialDeal?.financingDetails?.rentalIrr?.toString() ?? "");

  const [receivedAt, setReceivedAt] = useState(restored.current?.rawNumbers?.receivedAt??(initialDeal?.leadTracker ? (initialDeal.leadTracker!.enquiryReceived ?? "") : (initialDeal?.receivedAt ?? initialDeal?.createdAt ?? new Date().toISOString()).slice(0,10)));
  const [workflow,setWorkflow]=useState<DealWorkflow>(initialDeal?.workflow??{});
  const [showTask,setShowTask]=useState(false);
  const [error, setError] = useState("");
  const [fieldConflict,setFieldConflict]=useState<{field:string;current:any;incoming:any}>();
  const [matches,setMatches]=useState<DuplicateMatch[]>([]),[checking,setChecking]=useState(false),[duplicateError,setDuplicateError]=useState(""),[mergeTarget,setMergeTarget]=useState<DuplicateMatch|null>(null),[mergeChoices,setMergeChoices]=useState<string[]>([]),[separateReason,setSeparateReason]=useState(""),[forceReview,setForceReview]=useState(false),[saving,setSaving]=useState(false),[openExisting,setOpenExisting]=useState<Deal>();
  const saveBusy=useRef(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState(restored.current?.newNote??"");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saveBusy.current) closeEditorRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Activity feed + attachments only exist for a deal that's already been
  // saved (they're keyed by dealId) — refresh whenever the store changes so
  // a note added a moment ago shows immediately.
  useEffect(() => {
    if (!deal) return;
    const refresh = () => setActivities(getActivities(deal.id));
    refresh();
    return subscribe(refresh);
  }, [deal]);

  useEffect(() => {
    if (!deal) return;
    getAttachments(deal.id).then(setAttachments);
  }, [deal]);

  const similarCompany = !isNew
    ? undefined
    : findSimilarName(
        companyName,
        companies.map((c) => c.name)
      );

  async function handleSave(addSolutions=false) {
    if([onceOff,mrr,camerasInstalled,camerasMonitored,solarKwp,bessKwh,ratePerKwh,litresPerDay,capexPpa,capexRental,ppaIrr,rentalIrr].some(v=>v.trim()!==''&&(!Number.isFinite(parseAmount(v))||parseAmount(v)<0))){setError('Enter valid non-negative numeric amounts; a decimal point or comma is accepted.');return;}
    if((contactPhone.trim() || contactEmail.trim()) && !primaryContactName.trim()) {setError("Enter the contact person's name.");return;}
    if(contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {setError("Enter a valid contact email address.");return;}
    if (!receivedAt && !deal?.leadTracker) { setError("Enter the lead received date."); return; }
    if (!title.trim()) {
      setError("Give the deal a title.");
      return;
    }
    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setError("Enter the client's company name.");
      return;
    }
    if (stage === "lost" && !lostReason.trim()) {
      setError("Say why this deal was lost — price, timing, went with a competitor, etc.");
      return;
    }
    if(saveBusy.current)return;
    const receiptValue=!isNew&&(!receivedAt||receivedAt===(deal?.receivedAt??deal?.leadTracker?.enquiryReceived??'').slice(0,10))?deal?.receivedAt:receivedAt?receivedAt+'T08:00:00+02:00':undefined;
    const candidate={...(!isNew?deal:{}),id:!isNew?deal?.id:"new",stage,receivedAt:receiptValue,lostReason,workflow} as Deal;
    const validation=workflowErrors(candidate,isNew?undefined:deal,attachments);
    if(validation.length){setError(validation.join(" "));return;}
    const payload = {
      workflow,
      receivedAt: receiptValue,
      title: title.trim(),
      primaryContactName: primaryContactName.trim() || undefined,
      site: site.trim() || undefined,
      division,
      segment: segment || undefined,
      productLine: productLine.trim() || undefined,
      stage,
      lostReason: stage === "lost" ? lostReason.trim() : undefined,
      onceOff: parseAmount(onceOff),
      mrr: parseAmount(mrr),
      ownerId,
      closeDate: closeDate || undefined,
      notes: notes.trim() || undefined,
      secureDetails:
        division === "secure"
          ? { camerasInstalled: optionalNumber(camerasInstalled), camerasMonitored: optionalNumber(camerasMonitored) }
          : deal?.secureDetails,
      energyDetails:
        division === "energy"
          ? {...extraDetails.energyDetails,
              solarKwp: optionalNumber(solarKwp),
              bessKwh: optionalNumber(bessKwh),
              ratePerKwh: optionalNumber(ratePerKwh),
            }
          : deal?.energyDetails,
      connectDetails: extraDetails.connectDetails,
      waterDetails: division === "water" ? {...extraDetails.waterDetails, litresPerDay: optionalNumber(litresPerDay) } : deal?.waterDetails,
      financingDetails:
        division === "energy"
          ? {
              bankModelStatus: bankModelStatus || undefined,
              contractSignatureDate: contractSignatureDate || undefined,
              operationsStartDate: operationsStartDate || undefined,
              capexPpa: optionalNumber(capexPpa),
              capexRental: optionalNumber(capexRental),
              ppaIrr: optionalNumber(ppaIrr),
              rentalIrr: optionalNumber(rentalIrr),
            }
          : deal?.financingDetails,
    };

    const draft:DealDraft={companyName:trimmedName,contact:{name:primaryContactName.trim(),phone:contactPhone.trim(),email:contactEmail.trim()},deal:payload};
    try{draft.deal=cleanSolutionDetails(draft.deal);}catch(e){setError((e as Error).message);return;}
    setError("");setSaving(true);saveBusy.current=true;
    try {
      const latest=await checkDealDuplicates(draft,isNew?undefined:deal?.id);setMatches(latest);
      const identityChanged=isNew||normaliseDealText(companies.find(c=>c.id===deal?.companyId)?.name)!==normaliseDealText(companyName)||division!==deal?.division||normaliseDealText(site)!==normaliseDealText(deal?.site)||normaliseDealText(productLine)!==normaliseDealText(deal?.productLine);
      if(!mergeTarget&&isNew&&latest.some(m=>m.potential)&&separateReason.trim().length<5){setForceReview(true);return;}
      if(!mergeTarget&&isNew&&separateReason.trim().length>=5&&latest.some(m=>m.potential&&!matches.some(old=>old.deal.id===m.deal.id&&old.version===m.version))){setError("New or changed matching information appeared. Review it before confirming a separate opportunity.");setForceReview(true);return;}
      const saved=await saveDealDraft(draft,{action:mergeTarget?"merge":isNew?"create":"update",sourceId:isNew?undefined:deal?.id,baseDraft:!isNew?baseline.current:undefined,sourceVersion:!isNew&&deal?await dealVersion(deal,contacts.find(c=>c.id===deal.primaryContactId)):undefined,targetId:mergeTarget?.deal.id,targetVersion:mergeTarget?.version,choices:mergeChoices,separate:separateReason.trim().length>=5?{reason:separateReason.trim(),matches:matches.filter(m=>m.potential).map(m=>({id:m.deal.id,version:m.version}))}:undefined});
      sessionStorage.removeItem(draftStorageKey);restored.current=null;showToast(mergeTarget?"Deal merged; related records preserved":"Deal saved");if(addSolutions)setAddSolutionsSeed(saved);else onClose();
    }catch(e){setError((e as Error).message);if(e instanceof DealFieldConflict)setFieldConflict(e);if(e instanceof CrmApiError&&e.details?.fieldConflict)setFieldConflict(e.details.fieldConflict);if(e instanceof CrmApiError&&e.details?.matches){setMatches(e.details.matches);setForceReview(true);if(mergeTarget){const fresh=e.details.matches.find((m:DuplicateMatch)=>m.deal.id===mergeTarget.deal.id);setMergeTarget(fresh??null);}}}
    finally{setSaving(false);saveBusy.current=false;}
  }

  function resolveField(keepLatest:boolean){
    if(!fieldConflict)return;const {field,current}=fieldConflict;
    function put(root:any,path:string,value:any){const keys=path.split('.');let node=root;for(const key of keys.slice(0,-1))node=node[key]??={};if(value===null||value===undefined)delete node[keys[keys.length-1]];else node[keys[keys.length-1]]=value;}
    const base=structuredClone(baseline.current);if(field==='company')base.companyName=current??'';else if(field.startsWith('contact.'))put(base.contact,field.slice(8),current);else put(base.deal,field,current);baseline.current=base;
    if(keepLatest){
      const setters:Record<string,(value:any)=>void>={company:setCompanyName,title:setTitle,site:setSite,division:setDivision,segment:setSegment,productLine:setProductLine,stage:setStage,lostReason:setLostReason,ownerId:setOwnerId,closeDate:setCloseDate,notes:setNotes,'contact.name':setPrimaryContactName,'contact.phone':setContactPhone,'contact.email':setContactEmail,onceOff:setOnceOff,mrr:setMrr,'secureDetails.camerasInstalled':setCamerasInstalled,'secureDetails.camerasMonitored':setCamerasMonitored,'energyDetails.solarKwp':setSolarKwp,'energyDetails.bessKwh':setBessKwh,'energyDetails.ratePerKwh':setRatePerKwh,'waterDetails.litresPerDay':setLitresPerDay,'financingDetails.bankModelStatus':setBankModelStatus,'financingDetails.contractSignatureDate':setContractSignatureDate,'financingDetails.operationsStartDate':setOperationsStartDate,'financingDetails.capexPpa':setCapexPpa,'financingDetails.capexRental':setCapexRental,'financingDetails.ppaIrr':setPpaIrr,'financingDetails.rentalIrr':setRentalIrr};
      if(field==='receivedAt')setReceivedAt(current?.slice(0,10)??'');else if(setters[field])setters[field](current===null||current===undefined?'':String(current));else if(field.startsWith('workflow.'))setWorkflow(old=>{const next=structuredClone(old);put(next,field.slice(9),current);return next;});else setExtraDetails(old=>{const next=structuredClone(old);put(next,field,current);return next;});
    }setFieldConflict(undefined);setError('');showToast('Value selected. Save the deal to apply your choice.');
  }
  function conflictValue(value:any):string{return value===null||value===undefined?'Not recorded':Array.isArray(value)?value.map(v=>typeof v==='object'?[v.label,v.status].filter(Boolean).join(': '):String(v)).join('\n'):typeof value==='object'?Object.values(value).join(' ? '):String(value);}

  function handleDelete() {
    if (!deal || saveBusy.current) return;
    const snapshot = deal;
    deleteDeal(snapshot.id);
    onClose();
    showToast(`"${snapshot.title}" deleted`, {
      label: "Undo",
      onClick: () => restoreDeal(snapshot),
    });
  }

  function handleDuplicate() {
    if(!deal||saving)return;setCopyMode(true);setTitle(deal.title+" (Copy)");setStage("lead");setReceivedAt(new Date().toISOString().slice(0,10));setWorkflow({});setLostReason("");setMergeTarget(null);setSeparateReason("");setForceReview(true);setError("");
  }

  function handleAddNote() {
    if (!deal || !newNote.trim()) return;
    logActivity(deal.id, "note", newNote.trim(), user?.id);
    setNewNote("");
  }

  function handleAddFollowUp() {setShowTask(!showTask);}

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!deal || !e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        await addAttachment(deal.id, file);
      }
      setAttachments(await getAttachments(deal.id));
      logActivity(deal.id, "note", `Attached ${e.target.files.length} file(s)`, user?.id);
    } catch(e) {setError((e as Error).message);} finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAttachment(id: string) {
    if (!deal) return;
    if(workflow.signedAttachmentId===id || workflow.kyc?.some(i=>i.attachmentId===id)){setError("Remove the document from signature / KYC selections and save before deleting it.");return;}
    await deleteAttachment(id);
    setAttachments(await getAttachments(deal.id));
  }

  function userName(id?: string) {
    if (!id || id === "system") return "System";
    return users.find((u) => u.id === id)?.name ?? "Unknown";
  }

  const liveDraft:DealDraft={companyName,contact:{name:primaryContactName,phone:contactPhone,email:contactEmail},deal:{title,division,productLine:productLine||undefined,site:site||undefined,stage,onceOff:parseAmount(onceOff)||0,mrr:parseAmount(mrr)||0,ownerId,closeDate:closeDate||undefined,notes,receivedAt:receivedAt?receivedAt+"T08:00:00+02:00":undefined,workflow}};
  useEffect(()=>{if(companyName.trim().length<3){setMatches([]);return;}let cancelled=false;setChecking(true);const timer=setTimeout(()=>{checkDealDuplicates(liveDraft,isNew?undefined:deal?.id).then(rows=>{if(!cancelled){setMatches(rows);setDuplicateError("");}}).catch(e=>{if(!cancelled)setDuplicateError(e.message);}).finally(()=>{if(!cancelled)setChecking(false);});},350);return()=>{cancelled=true;clearTimeout(timer);};},[companyName,division,productLine,site,title,isNew,deal?.id]);
  const reviewDraft:DealDraft={...liveDraft,deal:{...liveDraft.deal,segment:segment||undefined,lostReason:lostReason||undefined,secureDetails:division==="secure"?{camerasInstalled:optionalNumber(camerasInstalled),camerasMonitored:optionalNumber(camerasMonitored)}:deal?.secureDetails,energyDetails:division==="energy"?{...extraDetails.energyDetails,solarKwp:optionalNumber(solarKwp),bessKwh:optionalNumber(bessKwh),ratePerKwh:optionalNumber(ratePerKwh)}:deal?.energyDetails,connectDetails:extraDetails.connectDetails,waterDetails:division==="water"?{...extraDetails.waterDetails,litresPerDay:optionalNumber(litresPerDay)}:deal?.waterDetails,financingDetails:division==="energy"?{bankModelStatus:bankModelStatus||undefined,contractSignatureDate:contractSignatureDate||undefined,operationsStartDate:operationsStartDate||undefined,capexPpa:optionalNumber(capexPpa),capexRental:optionalNumber(capexRental),ppaIrr:optionalNumber(ppaIrr),rentalIrr:optionalNumber(rentalIrr)}:deal?.financingDetails}};
  const signature=canonical(reviewDraft),initialSignature=useRef(signature);
  const hasDraftChanges=signature!==initialSignature.current||!!restored.current||!!newNote.trim();
  useEffect(()=>{try{if(hasDraftChanges)sessionStorage.setItem(draftStorageKey,JSON.stringify({draft:reviewDraft,baseline:baseline.current,copyMode,newNote,rawNumbers:{receivedAt,onceOff,mrr,camerasInstalled,camerasMonitored,solarKwp,bessKwh,ratePerKwh,litresPerDay,capexPpa,capexRental,ppaIrr,rentalIrr}}));else sessionStorage.removeItem(draftStorageKey);}catch{}},[signature,newNote,copyMode,receivedAt,onceOff,mrr,camerasInstalled,camerasMonitored,solarKwp,bessKwh,ratePerKwh,litresPerDay,capexPpa,capexRental,ppaIrr,rentalIrr]);
  useEffect(()=>{const handler=(e:BeforeUnloadEvent)=>{if(hasDraftChanges){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[hasDraftChanges]);
  closeEditorRef.current=()=>{if(saving)return;if(hasDraftChanges&&!window.confirm('Discard the unsaved changes to this deal?'))return;sessionStorage.removeItem(draftStorageKey);onClose();};
  if(addSolutionsSeed)return <CompanyDealModal seed={addSolutionsSeed} defaultDivision={division} onClose={onClose}/>;
  if(openExisting)return <DealModal deal={openExisting} onClose={onClose}/>;
  return (
    <div role="dialog" aria-modal="true" aria-label="Lead details" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12" onClick={()=>closeEditorRef.current()}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <DivisionBadge division={division} />
            {!isNew && <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">{stages.find(s=>s.key===stage)?.label}</span>}
          </div>
          <button disabled={saving} onClick={()=>closeEditorRef.current()} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isNew&&<button type="button" disabled={saving||uploading} onClick={()=>void handleSave(true)} className="mb-3 rounded-full border border-pink-300 px-4 py-2 text-sm font-bold text-pink-600">Save & add company solutions</button>}
        <h2 className="mb-1 text-xl font-black">{isNew ? "New deal" : deal!.title}</h2>
        {!isNew && (
          <p className="mb-4 text-sm text-neutral-500">
            {companies.find((c) => c.id === deal!.companyId)?.name} · Once-off {formatZAR(deal!.onceOff)} · {formatZAR(deal!.mrr)}/m (excl. VAT)
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="mb-3"><label className="text-xs font-semibold">Lead received date<input type="date" required value={receivedAt} onChange={e=>{setReceivedAt(e.target.value);setWorkflow(w=>({...w,deadlineReason:""}));}} className="input mt-1" /></label><p className="mt-1 text-xs text-neutral-500">{receivedAt ? proposalStatus({ ...(deal ?? {}), workflow, stage, leadTracker: deal?.leadTracker ? {...deal.leadTracker,enquiryReceived:receivedAt} : undefined, createdAt: receivedAt + "T08:00:00+02:00", receivedAt: receivedAt + "T08:00:00+02:00" } as Deal) : "Enter the lead received date."}</p></div>
              <Field label="Title" span={2}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. AJ — Kingsburgh" />
          </Field>

          <Field label="Company" span={2}>
            <input
              list="company-names"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input"
              placeholder="Type a client name — existing or brand new"
            />
            <datalist id="company-names">
              {companies.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            {similarCompany ? (
              <p className="mt-1 text-xs font-semibold text-orange-600">
                Did you mean "{similarCompany}"?{" "}
                <button type="button" onClick={() => setCompanyName(similarCompany)} className="underline">
                  Use that instead
                </button>
                {" · "}otherwise this will create a new, separate company.
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">
                Matches an existing company if the name matches one, otherwise creates a new one — no need to add the company first.
              </p>
            )}
          </Field>

          <DealDuplicatePanel matches={matches} draft={reviewDraft} loading={checking} error={duplicateError} target={mergeTarget} onTarget={setMergeTarget} onOpen={m=>setOpenExisting(m.deal)} choices={mergeChoices} onChoices={setMergeChoices} separateReason={separateReason} onSeparateReason={setSeparateReason} forceReview={forceReview} busy={saving}/>

          <Field label="Primary contact" span={2}>
            <input
              value={primaryContactName}
              onChange={(e) => {
                const name=e.target.value;setPrimaryContactName(name);
                const company=companies.find(c=>c.name.toLowerCase()===companyName.trim().toLowerCase());
                const person=contacts.find(c=>c.companyId===company?.id && c.name.toLowerCase()===name.trim().toLowerCase());
                setContactPhone(person?.phone ?? "");setContactEmail(person?.email ?? "");
              }}
              list="deal-contact-people"
              className="input"
              placeholder="e.g. Jane Doe"
            />
            <datalist id="deal-contact-people">{contacts.filter(c=>companies.find(company=>company.id===c.companyId)?.name.toLowerCase()===companyName.trim().toLowerCase()).map(c=><option key={c.id} value={c.name}/>)}</datalist>
            <p className="mt-1 text-xs text-neutral-500">Saved automatically to Contacts for this company.</p>
          </Field>

          <Field label="Contact cell / phone number">
            <input type="tel" autoComplete="tel" value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className="input" placeholder="e.g. +27 82 123 4567" />
          </Field>
          <Field label="Contact email (optional)">
            <input type="email" autoComplete="email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className="input" placeholder="user@bolideexample.co.za" />
          </Field>

          <Field label="Site">
            <input value={site} onChange={(e) => setSite(e.target.value)} className="input" placeholder="e.g. Kingsburgh" />
          </Field>

          <Field label="Division">
            <select value={division} onChange={(e) => setDivision(e.target.value as DivisionKey)} className="input">
              {divisions.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Segment">
            <select value={segment} onChange={(e) => setSegment(e.target.value as Segment | "")} className="input">
              <option value="">—</option>
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Product line">
            <select value={productLine} onChange={(e) => setProductLine(e.target.value)} className="input">
              <option value="">—</option>
              {PRODUCT_LINES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              {productLine && !PRODUCT_LINES.includes(productLine) && (
                <option value={productLine}>{productLine} (legacy)</option>
              )}
            </select>
          </Field>

          <Field label="Stage">
            <select value={stage} onChange={(e) => setStage(e.target.value as StageKey)} className="input">
              {stages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          {stage === "lost" && (
            <Field label="Reason lost" span={2}>
              <input
                required
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="input"
                placeholder="e.g. Price, timing, went with a competitor…"
              />
            </Field>
          )}

          <Field label="Once-off (excl. VAT)">
            <input type="text" inputMode="decimal" value={onceOff} onChange={(e) => setOnceOff(e.target.value)} className="input" />
          </Field>

          <Field label="MRR (excl. VAT)">
            <input type="text" inputMode="decimal" value={mrr} onChange={(e) => setMrr(e.target.value)} className="input" />
          </Field>

          <Field label="ARR (computed)">
            <input disabled value={formatZAR((Number(mrr) || 0) * 12)} className="input bg-neutral-50 text-neutral-500" />
          </Field>

          <Field label="Owner">
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="input">
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Expected close date">
            <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className="input" />
          </Field>

          {division === "secure" && (
            <>
              <div className="sm:col-span-2 -mb-2 mt-2 text-xs font-bold uppercase tracking-widest text-neutral-400">Secure details</div>
              <Field label="Cameras installed">
                <input type="text" inputMode="decimal" value={camerasInstalled} onChange={(e) => setCamerasInstalled(e.target.value)} className="input" />
              </Field>
              <Field label="Cameras monitored">
                <input type="text" inputMode="decimal" value={camerasMonitored} onChange={(e) => setCamerasMonitored(e.target.value)} className="input" />
              </Field>
            </>
          )}

          {division === "energy" && (
            <>
              <div className="sm:col-span-2 -mb-2 mt-2 text-xs font-bold uppercase tracking-widest text-neutral-400">Energy details</div>
              <Field label="Solar (kWp)">
                <input type="text" inputMode="decimal" value={solarKwp} onChange={(e) => setSolarKwp(e.target.value)} className="input" />
              </Field>
              <Field label="BESS (kWh)">
                <input type="text" inputMode="decimal" value={bessKwh} onChange={(e) => setBessKwh(e.target.value)} className="input" />
              </Field>
              <Field label="Rate (R/kWh)">
                <input type="text" inputMode="decimal" step="0.01" value={ratePerKwh} onChange={(e) => setRatePerKwh(e.target.value)} className="input" />
              </Field>

              <div className="sm:col-span-2 -mb-2 mt-2 text-xs font-bold uppercase tracking-widest text-neutral-400">Financing</div>
              <Field label="Bank model status">
                <select value={bankModelStatus} onChange={(e) => setBankModelStatus(e.target.value as BankModelStatus | "")} className="input">
                  <option value="">—</option>
                  <option value="Modelled">Modelled</option>
                  <option value="Not Modelled">Not Modelled</option>
                </select>
              </Field>
              <Field label="Contract signature date">
                <input type="date" value={contractSignatureDate} onChange={(e) => setContractSignatureDate(e.target.value)} className="input" />
              </Field>
              <Field label="Operations start date">
                <input type="date" value={operationsStartDate} onChange={(e) => setOperationsStartDate(e.target.value)} className="input" />
              </Field>
              <Field label="Capex – PPA (incl. cont.)">
                <input type="text" inputMode="decimal" value={capexPpa} onChange={(e) => setCapexPpa(e.target.value)} className="input" />
              </Field>
              <Field label="Capex – Rental (incl. cont.)">
                <input type="text" inputMode="decimal" value={capexRental} onChange={(e) => setCapexRental(e.target.value)} className="input" />
              </Field>
              <Field label="PPA IRR (%)">
                <input type="text" inputMode="decimal" step="0.1" value={ppaIrr} onChange={(e) => setPpaIrr(e.target.value)} className="input" />
              </Field>
              <Field label="Rental IRR (%)">
                <input type="text" inputMode="decimal" step="0.1" value={rentalIrr} onChange={(e) => setRentalIrr(e.target.value)} className="input" />
              </Field>
            </>
          )}

          {division === "water" && (
            <>
              <div className="sm:col-span-2 -mb-2 mt-2 text-xs font-bold uppercase tracking-widest text-neutral-400">Water details</div>
              <Field label="Litres / day">
                <input type="text" inputMode="decimal" value={litresPerDay} onChange={(e) => setLitresPerDay(e.target.value)} className="input" />
              </Field>
            </>
          )}

          <SolutionDetails division={division} value={extraDetails} onChange={setExtraDetails} extrasOnly/>
          <WorkflowFields value={workflow} onChange={setWorkflow} stage={stage} attachments={attachments} isNew={isNew}/>

          <Field label="Notes" span={2}>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input resize-y" />
          </Field>
        </div>

        {!isNew && (
          <div className="mt-6 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Attachments</div>
            <div className="space-y-1.5">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="min-w-0 flex-1 truncate">{a.filename}</span>
                  <span className="shrink-0 text-xs text-neutral-400">{formatFileSize(a.size)}</span>
                  <a href={a.dataUrl} download={a.filename} className="shrink-0 text-neutral-400 hover:text-pink-600">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <button type="button" onClick={() => handleDeleteAttachment(a.id)} className="shrink-0 text-neutral-400 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {attachments.length === 0 && <p className="text-sm text-neutral-400">No files attached yet.</p>}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold hover:border-neutral-400">
              <Paperclip className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Attach a file"}
              <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} disabled={uploading} className="hidden" />
            </label>
          </div>
        )}

        {!isNew && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Notes &amp; activity</span>
              <button type="button" onClick={handleAddFollowUp} className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600 hover:underline">
                <CalendarClock className="h-3.5 w-3.5" /> Add follow-up
              </button>
            </div>
            {showTask&&<TaskEditor dealId={deal?.id} onSaved={()=>{setShowTask(false);showToast("Follow-up saved");}}/>}
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                className="input"
                placeholder="Called client, waiting on their sign-off…"
              />
              <button type="button" onClick={handleAddNote} className="shrink-0 rounded-full bg-neutral-900 px-4 text-white">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto scroll-thin">
              {activities.map((a) => (
                <li key={a.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                  <div className="text-neutral-700">{a.body}</div>
                  <div className="mt-0.5 text-xs text-neutral-400">
                    {userName(a.userId)} · {formatDate(a.createdAt)}
                  </div>
                </li>
              ))}
              {activities.length === 0 && <li className="text-sm text-neutral-400">No activity logged yet.</li>}
            </ul>
          </div>
        )}

        {fieldConflict&&<section aria-label="Review changed field" className="mt-4 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4"><h3 className="font-bold">Review a changed field</h3><p className="text-sm">{fieldConflict.field.replace(/([A-Z])/g,' $1').split('.').join(' / ')} changed while this form was open.</p><div className="grid gap-3 sm:grid-cols-2"><div className="whitespace-pre-wrap text-sm"><strong>Latest saved value</strong><p>{conflictValue(fieldConflict.current)}</p></div><div className="whitespace-pre-wrap text-sm"><strong>Your entered value</strong><p>{conflictValue(fieldConflict.incoming)}</p></div></div><div className="flex gap-4 text-sm font-bold"><button type="button" onClick={()=>resolveField(true)}>Keep latest value</button><button type="button" onClick={()=>resolveField(false)}>Use my value</button></div></section>}
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isNew && (
              <>
                <button type="button" onClick={handleDelete} className="text-sm font-semibold text-red-600 hover:underline">
                  Delete deal
                </button>
                <button type="button" onClick={handleDuplicate} className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800">
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" disabled={saving} onClick={()=>closeEditorRef.current()} className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold">
              Cancel
            </button>
            <button
              type="button"
              onClick={()=>void handleSave()}
              disabled={saving||uploading}
              className="rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-brand"
            >
              {saving?"Saving…":mergeTarget?"Confirm reviewed merge":isNew ? "Create deal" : "Save deal"}
            </button>
          </div>
        </div>
        </fieldset>
      </div>
    </div>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <label className={`block ${span === 2 ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
