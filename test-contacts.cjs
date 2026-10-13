const ts=require('typescript'),fs=require('fs'),path=require('path'),assert=require('assert');
const data=new Map();global.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};global.window={addEventListener(){}};
const modules={};
function load(file){
 file=path.resolve(file);
 if(file.endsWith('/remote.ts') || file.endsWith('\\remote.ts'))return {hosted:false};
 if(file.endsWith('/attachments.ts') || file.endsWith('\\attachments.ts'))return {};
 if(modules[file])return modules[file];
 const exports={};modules[file]=exports;
 const source=fs.readFileSync(file,'utf8').replaceAll('import.meta.env.BASE_URL','"/"');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('exports','require',code)(exports,name=>load(path.resolve(path.dirname(file),name+'.ts')));return exports;
}
const store=load('src/lib/store.ts');
const linda=store.saveDealContact({companyId:'c-aj',name:'Linda',phone:'+27 82 123 4567',email:''});
const deal=store.createDeal({title:'Contact verification',companyId:'c-aj',primaryContactId:linda.id,primaryContactName:linda.name,division:'secure',stage:'lead',onceOff:0,mrr:0,ownerId:'u-langelihle'});
assert.equal(store.getContacts().find(c=>c.id===store.getDeal(deal.id).primaryContactId).phone,'+27 82 123 4567');
assert.equal(store.saveDealContact({companyId:'c-aj',name:' Linda ',phone:'+27 82 123 4567',email:''}).id,linda.id);
assert.equal(store.saveDealContact({companyId:'c-aj',name:'Linda',phone:'0829999999',email:'LINDA@EXAMPLE.COM'},linda.id).id,linda.id);
assert.equal(store.getContacts().find(c=>c.id===linda.id).email,'linda@example.com');
assert.notEqual(store.saveDealContact({companyId:'c-alt',name:'Linda',phone:'0829999999',email:'linda@example.com'}).id,linda.id);
assert.notEqual(store.saveDealContact({companyId:'c-aj',name:'Bob',phone:'0835555555',email:''},linda.id).id,linda.id);
assert.equal(store.getContacts().find(c=>c.id===linda.id).name,'Linda');
console.log('PASS: saved deal links to Contacts, phone-only contact, duplicate reuse, contact edits, email normalization, company isolation, replacement person preserves original.');
