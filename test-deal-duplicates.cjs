const ts=require('typescript'),fs=require('fs'),assert=require('assert'),{execFileSync}=require('child_process');
const code=ts.transpileModule(fs.readFileSync('src/lib/deal-duplicates.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const d={};new Function('exports',code)(d);
const target={companyName:'Mercedes-Benz',contact:{name:'Linda',phone:'0821111111',email:''},deal:{id:'test',companyId:'company',title:'Original',division:'energy',site:'Sandton',productLine:'Solar/PPA',onceOff:0,mrr:100,stage:'lead',notes:'Keep this',ownerId:'giana'}};
const incoming={companyName:' mercedes benz ',contact:{name:'Bob',phone:'0832222222',email:'bob@example.com'},deal:{...target.deal,title:'Incoming',mrr:200,onceOff:2000,notes:'Add this',closeDate:'2026-12-01'}};
assert.equal(d.duplicateKind(incoming,target.deal,target.companyName),'potential');
for(const change of [{site:'Durban'},{division:'water'},{productLine:'BESS'}])assert.equal(d.duplicateKind({...incoming,deal:{...incoming.deal,...change}},target.deal,target.companyName),'related');
assert.equal(d.duplicateKind({...incoming,deal:{...incoming.deal,site:''}},target.deal,target.companyName),'potential');
const fields=d.mergeFields(target,incoming);assert(!fields.find(f=>f.path==='onceOff').fill);assert(fields.find(f=>f.path==='closeDate').fill);assert(fields.some(f=>f.path==='contact'));assert(!fields.some(f=>f.path==='contact.phone'));
const merged=d.mergeDraft(target,incoming,['mrr','closeDate']);assert.equal(merged.deal.title,'Original');assert.equal(merged.deal.mrr,200);assert.equal(merged.deal.onceOff,0);assert.equal(merged.contact.name,'Linda');assert(merged.deal.notes.includes('Keep this')&&merged.deal.notes.includes('Add this'));
// Server and browser must calculate identical optimistic versions from JSON rows.
const php='C:/Users/LangelihleNgidi/.codex/tools/php/php.exe';
const script="require 'api/deal-duplicates.php';$v=json_decode(stream_get_contents(STDIN),true);echo deal_version($v[0],$v[1]);";
(async()=>{const server=execFileSync(php,['-r',script],{input:JSON.stringify([target.deal,target.contact]),windowsHide:true}).toString();assert.equal(await d.dealVersion(target.deal,target.contact),server);console.log('PASS: company/solution/location matching, missing-location review, zero amounts, grouped contact choices, explicit field selection, appended notes and identical PHP/browser versions.');})().catch(e=>{console.error(e);process.exitCode=1});
