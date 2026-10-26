"""Run the real production build/API with a temporary user and isolated MySQL records."""
from pathlib import Path
import json,re,secrets,shutil,subprocess,time
import pymysql
p=Path(__file__).parent;work=p/'.import-work';root=work/'hosted-company-ui';crm=root/'crm';crm.mkdir(parents=True,exist_ok=True)
shutil.copytree(p/'dist',crm,dirs_exist_ok=True)
api=crm/'api'
if not api.exists():subprocess.run(['powershell','-NoProfile','-Command',"New-Item -ItemType Junction -Path '"+str(api).replace("'","''")+"' -Target '"+str(p/'api').replace("'","''")+"' | Out-Null"],check=True,creationflags=subprocess.CREATE_NO_WINDOW)
text=(p/'api/config.php').read_text();cfg={k:re.search(r"'"+k+r"'\s*=>\s*'([^']*)'",text).group(1) for k in ['db_host','db_user','db_pass','db_name']};c=pymysql.connect(host=cfg['db_host'],user=cfg['db_user'],password=cfg['db_pass'],database=cfg['db_name'],autocommit=True,cursorclass=pymysql.cursors.DictCursor);q=c.cursor()
uid='company-ui-'+secrets.token_hex(8);password=secrets.token_urlsafe(24);server=None;log=open(work/'company-hosted-ui.log','w')
try:
 q.execute('INSERT INTO users(id,name,email,role) VALUES(%s,%s,%s,%s)',(uid,'Temporary company UI check',uid+'@bolide.co.za','rep'))
 q.execute('INSERT INTO companies(id,name,industry,status,divisions_json,created_at) VALUES(%s,%s,%s,%s,%s,UTC_TIMESTAMP())',(uid,'Existing '+uid,'Test','Prospect','["energy"]'))
 q.execute('SELECT * FROM deals WHERE id=%s',('d-tracker-26',));model=q.fetchone();model.update(id=uid,title='Existing unknown-date '+uid,company_id=uid,owner_id=uid,primary_contact_id=None,primary_contact_name=None,created_by_id=uid,energy_details_json=json.dumps(dict(solarKwp=160,landlord='Keep existing landlord',anchorTenant='Keep existing anchor')))
 q.execute('INSERT INTO deals ('+','.join('`'+key+'`' for key in model)+') VALUES ('+','.join(['%s']*len(model))+')',tuple(model.values()))
 server=subprocess.Popen(['C:/Users/LangelihleNgidi/.codex/tools/php/php.exe','-d','extension_dir=C:/Users/LangelihleNgidi/.codex/tools/php/ext','-d','extension=pdo_mysql','-S','127.0.0.1:8769','-t',str(root)],stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW);time.sleep(1)
 result=subprocess.run(['C:/Users/LangelihleNgidi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe','test-company-hosted-ui.cjs'],input=json.dumps(dict(uid=uid,password=password)),text=True,creationflags=subprocess.CREATE_NO_WINDOW,timeout=180);assert result.returncode==0,'Hosted browser check failed'
 q.execute('SELECT COUNT(*) AS n FROM deals WHERE created_by_id=%s',(uid,));assert q.fetchone()['n']==4
 q.execute('SELECT d.mrr,d.notes,c.phone,c.email,d.energy_details_json,d.lead_tracker_json FROM deals d JOIN contacts c ON c.id=d.primary_contact_id WHERE d.id=%s',(uid,));saved=q.fetchone();assert saved['phone']=='0835557777' and saved['email']=='ui-contact@example.com' and float(saved['mrr'])==1234.56 and saved['notes']=='My entered note'
 assert json.loads(saved['energy_details_json'])['landlord']=='Keep existing landlord'
 assert not json.loads(saved['lead_tracker_json']).get('enquiryReceived')
 print('PASS: production browser edits persisted to Xneelo, unknown receipt date stayed unknown, original landlord retained, and retry after a committed/lost response produced exactly three new solution cards.')
finally:
 q.execute('START TRANSACTION');q.execute('SELECT revision FROM crm_revision WHERE id=1 FOR UPDATE');q.execute('SELECT id,company_id FROM deals WHERE created_by_id=%s',(uid,));rows=q.fetchall();companies={uid}|{r['company_id'] for r in rows}
 for row in rows:
  for table in ['activities','attachments','tasks']:q.execute('DELETE FROM '+table+' WHERE deal_id=%s',(row['id'],))
  q.execute('DELETE FROM deals WHERE id=%s',(row['id'],))
 for id in companies:q.execute('DELETE FROM contacts WHERE company_id=%s',(id,));q.execute('DELETE FROM companies WHERE id=%s',(id,))
 q.execute('DELETE FROM users WHERE id=%s',(uid,));q.execute('UPDATE crm_revision SET revision=revision+1 WHERE id=1');c.commit();q.execute('SELECT COUNT(*) AS n FROM deals');print('Original deal count after UI cleanup:',q.fetchone()['n']);c.close()
 if server:server.terminate();server.wait()
 log.close()
