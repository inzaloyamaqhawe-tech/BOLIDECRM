"""Transactional duplicate/merge checks using isolated temporary Xneelo records.
Only test-owned IDs are removed; concurrent production changes are preserved.
"""
from pathlib import Path
import concurrent.futures, copy, json, re, secrets, subprocess, time, urllib.request, urllib.error
import pymysql

p=Path(__file__).parent
config=(p/'api/config.php').read_text()
cfg={k:re.search(r"'"+k+r"'\s*=>\s*'([^']*)'",config).group(1) for k in ['db_host','db_user','db_pass','db_name']}
c=pymysql.connect(host=cfg['db_host'],user=cfg['db_user'],password=cfg['db_pass'],database=cfg['db_name'],autocommit=True)
q=c.cursor(); marker='dup-test-'+secrets.token_hex(8); users=[marker+'-a',marker+'-b']; password=secrets.token_urlsafe(24)
servers=[]; logs=[]; deal_ids=set(); company_ids=set()
class Client:
 def __init__(self,port): self.port=port; self.cookie=''; self.csrf=''
 def req(self,file,body=None):
  request=urllib.request.Request(f'http://127.0.0.1:{self.port}/api/{file}.php',None if body is None else json.dumps(body).encode(),{'Content-Type':'application/json','Cookie':self.cookie,'X-CSRF-Token':self.csrf})
  try:
   with urllib.request.urlopen(request,timeout=60) as response:
    if response.headers.get('Set-Cookie'):self.cookie=response.headers['Set-Cookie'].split(';')[0]
    data=json.load(response);self.csrf=data.get('csrf',self.csrf);return response.status,data
  except urllib.error.HTTPError as error:return error.code,json.load(error)
 def deals(self,action,draft,expected=200,**options):
  status,data=self.req('deals',dict(action=action,draft=draft,**options));assert status==expected,(status,data)
  if data.get('id'):
   deal_ids.add(data['id']); row=next(d for d in data['snapshot']['deals'] if d['id']==data['id']);company_ids.add(row['companyId'])
  return data
 def version(self,draft,id):return next(m for m in self.deals('check',draft)['matches'] if m['deal']['id']==id)['version']

def draft(name,**changes):
 deal=dict(title=name+' opportunity',division='energy',productLine='Solar/PPA',site='Sandton',stage='lead',onceOff=10000,mrr=1000,ownerId=users[0],receivedAt='2026-10-21T08:00:00+02:00',notes='Original notes')
 deal.update(changes)
 return dict(companyName=name,contact=dict(name='Linda',phone='0821234567',email=''),deal=deal)

try:
 for port in [8767,8768]:
  log=open(p/f'.import-work/duplicates-{port}.log','w');logs.append(log)
  servers.append(subprocess.Popen(['C:/Users/LangelihleNgidi/.codex/tools/php/php.exe','-d','extension_dir=C:/Users/LangelihleNgidi/.codex/tools/php/ext','-d','extension=pdo_mysql','-S',f'127.0.0.1:{port}','-t',str(p)],stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW))
 time.sleep(1)
 for uid in users:q.execute('INSERT INTO users(id,name,email,role) VALUES(%s,%s,%s,%s)',(uid,'Temporary duplicate verification',uid+'@bolide.co.za','rep'))
 clients=[Client(8767),Client(8768)]
 for client,uid in zip(clients,users):assert client.req('auth',dict(action='signup',email=uid+'@bolide.co.za',name='Temporary duplicate verification',password=password))[0]==200
 a,b=clients
 incoming=draft('Mercedes '+marker)
 first=a.deals('create',incoming);target=first['id']
 assert next(d for d in first['snapshot']['deals'] if d['id']==target)['createdById']==users[0]
 repeated=copy.deepcopy(incoming);repeated['companyName']=incoming['companyName'].upper().replace(' ',' - ')
 assert next(m for m in a.deals('check',repeated)['matches'] if m['deal']['id']==target)['potential']
 a.deals('create',repeated,409)
 different=draft(incoming['companyName'],site='Durban');a.deals('create',different)
 different=draft(incoming['companyName'],division='water',productLine='Water supply');a.deals('create',different)
 missing=draft(incoming['companyName'],site='');assert next(m for m in a.deals('check',missing)['matches'] if m['deal']['id']==target)['potential']
 repeated['deal'].update(title='Separate project phase',mrr=2000,ownerId=users[1],notes='Source notes')
 repeated['contact']=dict(name='Giana contact',phone='0839999999',email='giana-contact@example.com')
 reviewed=[dict(id=m['deal']['id'],version=m['version']) for m in a.deals('check',repeated)['matches'] if m['potential']]
 second=b.deals('create',repeated,separate=dict(reason='Separate project phase',matches=reviewed));source=second['id']
 a.deals('create',repeated,409,separate=dict(reason='Another separate phase',matches=reviewed))
 status,state=b.req('state');assert status==200
 state['snapshot']['tasks'].append(dict(id=marker+'-task',title='Keep task assignee',assigneeId=users[1],dealId=source,priority='high',recurrence='monthly',dueDate='2026-10-30',done=False,createdAt='2026-10-21T08:00:00Z'))
 state['snapshot']['activities'].append(dict(id=marker+'-activity',dealId=source,type='note',body='Preserve history',userId=users[1],createdAt='2026-10-21T08:00:00Z'))
 state['snapshot']['attachments'].append(dict(id=marker+'-attachment',dealId=source,filename='test.txt',mimeType='text/plain',size=2,dataUrl='data:text/plain;base64,b2s=',createdAt='2026-10-21T08:00:00Z'))
 next(d for d in state['snapshot']['deals'] if d['id']==source)['workflow']={'kyc':[dict(id='identity',label='Identity',required=True,status='verified',attachmentId=marker+'-attachment')]}
 status,result=b.req('state',dict(revision=state['revision'],snapshot=state['snapshot']));assert status==200,(status,result)
 status,latest=a.req('state');source_workflow=next(d for d in latest['snapshot']['deals'] if d['id']==source)['workflow'];repeated['deal']['workflow']=copy.deepcopy(source_workflow)
 source_version=a.version(repeated,source);target_version=a.version(repeated,target)
 merged=a.deals('merge',repeated,sourceId=source,sourceVersion=source_version,targetId=target,targetVersion=target_version,choices=['mrr','workflow.kyc'])
 saved=next(d for d in merged['snapshot']['deals'] if d['id']==target)
 assert saved['mrr']==2000 and saved['ownerId']==users[0] and saved['createdById']==users[0]
 assert 'Original notes' in saved['notes'] and 'Source notes' in saved['notes']
 assert saved['primaryContactName']=='Linda'
 assert saved['workflow']['kyc']==source_workflow['kyc'] and saved['workflow']['kyc'][0]['verifiedBy']==users[1]
 assert any(ct['name']=='Giana contact' for ct in merged['snapshot']['contacts'])
 assert not any(d['id']==source for d in merged['snapshot']['deals'])
 for table,suffix in [('tasks','task'),('activities','activity'),('attachments','attachment')]:
  row=next(r for r in merged['snapshot'][table] if r['id']==marker+'-'+suffix);assert row['dealId']==target
  if table=='tasks':assert row['assigneeId']==users[1] and row['recurrence']=='monthly'
  if table=='activities':assert row['userId']==users[1] and row['body']=='Preserve history'
 q.execute('SELECT deal_id FROM attachments WHERE id=%s',(marker+'-attachment',));assert q.fetchone()[0]==target
 q.execute('SELECT snapshot_json FROM deal_merge_history WHERE source_deal_id=%s',(source,));archive=json.loads(q.fetchone()[0]);assert archive['source']['notes']=='Source notes' and archive['choices']==['mrr','workflow.kyc']
 # Both stale target and source versions are rejected, without replacing stored values.
 a.deals('merge',incoming,409,targetId=target,targetVersion=target_version,choices=[])
 a.deals('update',incoming,409,sourceId=target,sourceVersion=target_version)
 # Two independent PHP processes compete on the same database transaction lock.
 race=draft('Race '+marker)
 with concurrent.futures.ThreadPoolExecutor() as pool:
  results=list(pool.map(lambda client:client.req('deals',dict(action='create',draft=race)),clients))
 assert sorted(status for status,data in results)==[200,409],results
 for status,data in results:
  if status==200:
   deal_ids.add(data['id']);company_ids.add(next(d for d in data['snapshot']['deals'] if d['id']==data['id'])['companyId'])
 # Snapshot path cannot bypass the dedicated duplicate guard.
 status,state=a.req('state');clone=copy.deepcopy(next(d for d in state['snapshot']['deals'] if d['id']==target));clone['id']=marker+'-bypass';clone.pop('duplicateDetails',None);state['snapshot']['deals'].append(clone)
 status,result=a.req('state',dict(revision=state['revision'],snapshot=state['snapshot']));assert status==409,(status,result)
 print('PASS: case-insensitive live matching; company/solution/location distinctions; reviewed separation; concurrent create protection; stale-edit rejection; selected-field merge; retained notes, creator, contact, task assignee, activities, attachment links and immutable source archive; snapshot bypass blocked.')
finally:
 q.execute('START TRANSACTION');q.execute('SELECT revision FROM crm_revision WHERE id=1 FOR UPDATE')
 q.execute('DELETE FROM deal_merge_history WHERE merged_by IN (%s,%s)',users)
 for id in deal_ids:
  for table in ['activities','attachments','tasks']:q.execute('DELETE FROM '+table+' WHERE deal_id=%s',(id,))
  q.execute('DELETE FROM deals WHERE id=%s',(id,))
 for id in company_ids:q.execute('DELETE FROM contacts WHERE company_id=%s',(id,));q.execute('DELETE FROM companies WHERE id=%s',(id,))
 q.execute('DELETE FROM users WHERE id IN (%s,%s)',users);q.execute('UPDATE crm_revision SET revision=revision+1 WHERE id=1');c.commit()
 q.execute('SELECT COUNT(*) FROM deals');print('Lead count after temporary-record cleanup:',q.fetchone()[0]);c.close()
 for server in servers:server.terminate();server.wait()
 for log in logs:log.close()
