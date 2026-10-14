from pathlib import Path
import sys,zipfile,xml.etree.ElementTree as E,json,re,datetime,hashlib,collections
ROOT=Path(__file__).parent
SOURCE=Path(sys.argv[1])
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
TODAY='2026-10-14T08:00:00Z'
def clean(s):return re.sub(r'\s+',' ',str(s or '')).strip()
def day(s):
 try:return (datetime.date(1899,12,30)+datetime.timedelta(days=float(s))).isoformat()
 except (ValueError,TypeError):return None
def iso(s):return s+'T08:00:00+02:00' if s else None
with zipfile.ZipFile(SOURCE) as z:
 strings=[''.join(e.itertext()) for e in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS)] if 'xl/sharedStrings.xml' in z.namelist() else []
 rows=[]
 for row in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//s:row',NS):
  cells={}
  for cell in row.findall('s:c',NS):
   v=cell.find('s:v',NS);inline=cell.find('s:is',NS);value=v.text if v is not None else ''.join(inline.itertext()) if inline is not None else ''
   if cell.get('t')=='s':value=strings[int(value)]
   if value:cells[re.sub(r'\d','',cell.get('r'))]=value
  if int(row.get('r'))>=3 and cells.get('C'):rows.append({'row':int(row.get('r')),'cells':cells})
groups={}
for row in rows:groups.setdefault(clean(row['cells']['C']).lower(),[]).append(row)
companies=[];contacts=[];deals=[]
labels={'A':'Lead originator','B':'Partner','C':'Company and contact','D':'Lead maturity','E':'Enquiry received','F':'Intro email sent','G':'Follow-up 1','H':'Follow-up 2','I':'Follow-up 3','J':'Assigned engineer','K':'Proposal sent','L':'Approved for modelling','M':'Bank model status','N':'Contract signature date (unconfirmed)','O':'Operations start date','P':'CAPEX PPA incl contingency','Q':'CAPEX Rental incl contingency','R':'PPA IRR','S':'Rental IRR'}
for group in groups.values():
 merged={}
 for row in group:merged.update({k:v for k,v in row['cells'].items() if clean(v)})
 sourceRows=[r['row'] for r in group];id=str(sourceRows[0]);rawname=merged['C'].strip();name=clean(rawname.split('\n')[0]);contact=None
 if 'Claudette Erasmus' in rawname:contact='Claudette Erasmus'
 company_id='c-tracker-'+id;division='secure' if 'Vumacam' in rawname else 'energy'
 received=day(merged.get('E'));proposal=day(merged.get('K'));proposaltext=clean(merged.get('K'));approval=clean(merged.get('L'))
 if proposaltext.lower().startswith('closed'):stage='lost';reason=proposaltext
 elif proposal:stage='quote';reason=None
 else:stage='qualified';reason=None
 engineer=clean(merged.get('J')).lower();origin=clean(merged.get('A')).lower()
 owner='u-welcome' if engineer.startswith('welcome') else 'u-herman' if engineer.startswith('herman') else 'u-suhail' if origin.startswith('suhail') else 'u-khudusela' if origin.startswith('khudu') else 'u-langelihle'
 notes=['Imported from Lead_Tracker_v1.xlsx, source rows '+', '.join(map(str,sourceRows))+'.', 'Approval refers to modelling approval, not a signed proposal.', 'Contract signature dates are unconfirmed; no Won status inferred.', 'Sales contract value and MRR were not provided; CAPEX is retained separately in Financing.']
 if not received:notes.append('Enquiry received date not recorded; proposal deadline is unavailable until entered.')
 if len(group)>1:notes.append('Duplicate Sasol Raceway entries consolidated; both original rows are retained below.')
 for row in group:
  notes.append('Source row '+str(row['row'])+':')
  for k,v in row['cells'].items():notes.append(labels[k]+': '+(day(v) or clean(v) if k in 'EFGHIKLNO' else clean(v)))
 financing={}
 if merged.get('M'):financing['bankModelStatus']=clean(merged['M'])
 for col,key in [('N','contractSignatureDate'),('O','operationsStartDate')]:
  value=day(merged.get(col))
  if value:financing[key]=value
 for col,key in [('P','capexPpa'),('Q','capexRental'),('R','ppaIrr'),('S','rentalIrr')]:
  value=clean(merged.get(col))
  if value and value.lower()!='n/a':financing[key]=float(value.rstrip('%'))*(100 if col in 'RS' and '%' not in value else 1)
 company={'id':company_id,'name':name,'industry':'Security prospect' if division=='secure' else 'Energy prospect','status':'Prospect','divisions':[division],'createdAt':iso(received) or TODAY}
 companies.append(company)
 deal={'id':'d-tracker-'+id,'title':name+(' — Vumacam AI security' if division=='secure' else ' — Solar/PPA'),'companyId':company_id,'site':name,'division':division,'productLine':'Security' if division=='secure' else 'Solar','stage':stage,'onceOff':0,'mrr':0,'ownerId':owner,'notes':'\n'.join(notes),'financingDetails':financing,'createdAt':iso(received) or TODAY,'updatedAt':TODAY,'leadTracker':{'source':'Lead_Tracker_v1.xlsx','sourceRows':sourceRows,'rawRows':group,'maturity':clean(merged.get('D')),'partner':clean(merged.get('B')),'originator':clean(merged.get('A')),'modellingApproval':approval}}
 if received:deal['receivedAt']=iso(received);deal['leadTracker']['enquiryReceived']=received
 if proposal:deal['proposalSentAt']=iso(proposal);deal['stageChangedAt']=iso(proposal)
 elif stage=='qualified' and received:deal['stageChangedAt']=iso(day(merged.get('F')) or received)
 if reason:deal['lostReason']=reason
 if contact:
  cid='ct-tracker-'+id;contacts.append({'id':cid,'companyId':company_id,'name':contact,'email':'','role':'Numeri (source tracker)','createdAt':TODAY});deal.update(primaryContactId=cid,primaryContactName=contact)
 deals.append(deal)
snapshot={'datasetVersion':'lead-tracker-2026-10-14-'+hashlib.sha256(SOURCE.read_bytes()).hexdigest()[:12],'companies':companies,'contacts':contacts,'deals':deals}
assert len(rows)==37 and len(deals)==36
assert all(d['stage']!='lost' or d.get('lostReason') for d in deals)
(ROOT/'src/data').mkdir(exist_ok=True)
(ROOT/'src/data/lead-tracker.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2),encoding='utf-8')
print('Source rows:',len(rows),'Leads:',len(deals),'Companies:',len(companies),'Contacts:',len(contacts))
print('Stages:',dict(collections.Counter(d['stage'] for d in deals)))
print('Missing received dates:',sum(not d.get('receivedAt') for d in deals))
print('CAPEX PPA:',sum(d['financingDetails'].get('capexPpa',0) for d in deals),'CAPEX rental:',sum(d['financingDetails'].get('capexRental',0) for d in deals))
