// Read-only preparation. The PHP importer separately requires --apply and a matching revision.
const fs=require('fs'),path=require('path'),ts=require('typescript'),{execFileSync}=require('child_process'),crypto=require('crypto');
const modules={};function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));if(modules[file])return modules[file];const exports={};modules[file]=exports;new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText)(exports,name=>load(path.resolve(path.dirname(file),name+(name.endsWith('.json')?'':'.ts'))));return exports;}
const php=process.env.CRM_PHP||'C:/Users/LangelihleNgidi/.codex/tools/php/php.exe';
const script="require 'api/db.php';require 'api/state-functions.php';$p=crm_pdo();$p->beginTransaction();$r=(int)$p->query('SELECT revision FROM crm_revision WHERE id=1')->fetchColumn();$s=read_state($p);$p->commit();echo json_encode(['revision'=>$r,'snapshot'=>$s]);";
const before=JSON.parse(execFileSync(php,['-d','extension_dir=C:/Users/LangelihleNgidi/.codex/tools/php/ext','-d','extension=pdo_mysql','-r',script],{windowsHide:true}).toString());
const source=JSON.parse(fs.readFileSync('src/data/deals-20261026.json','utf8'));
const after=load('src/lib/screenshot-import.ts').applyScreenshotImport(before.snapshot);
const sources=source.records.map(record=>({...record,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join('..','Deals',record.source))).digest('hex')}));
fs.mkdirSync('.import-work',{recursive:true});fs.writeFileSync('.import-work/screenshot-import-plan.json',JSON.stringify({revision:before.revision,before:before.snapshot,after,sources}));
console.log('Read-only import plan:',before.snapshot.deals.length,'existing ->',after.deals.length,'retained/enriched deals;',sources.length,'source screenshots verified.');
