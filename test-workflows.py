"""Integration checks against configured MySQL using temporary records only.
Never changes existing lead fields; optimistic revision checks protect concurrent saves.
"""
from pathlib import Path
import subprocess, urllib.request, urllib.error, json, time, re, secrets, copy, pymysql

p=Path(__file__).parent
config=(p/'api/config.php').read_text()
cfg={k:re.search(r"'"+k+r"'\s*=>\s*'([^']*)'",config).group(1) for k in ['db_host','db_user','db_pass','db_name']}
c=pymysql.connect(host=cfg['db_host'],user=cfg['db_user'],password=cfg['db_pass'],database=cfg['db_name'],autocommit=True)
q=c.cursor(); marker='verify-'+secrets.token_hex(8); uid=marker+'-a'; uid2=marker+'-b'; password=secrets.token_urlsafe(24)
php='C:/Users/LangelihleNgidi/.codex/tools/php/php.exe'
log=open(p/'php-test.log','w')
server=subprocess.Popen([php,'-d','extension_dir=C:/Users/LangelihleNgidi/.codex/tools/php/ext','-d','extension=pdo_mysql','-S','127.0.0.1:8766','-t',str(p)],stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
cookie='';csrf=''
def req(file,body=None):
 global cookie,csrf
 headers={'Content-Type':'application/json','Cookie':cookie,'X-CSRF-Token':csrf}
 request=urllib.request.Request('http://127.0.0.1:8766/api/'+file+'.php',None if body is None else json.dumps(body).encode(),headers)
 try:
  with urllib.request.urlopen(request) as response:
   if response.headers.get('Set-Cookie'):cookie=response.headers['Set-Cookie'].split(';')[0]
   data=json.load(response);csrf=data.get('csrf',csrf);return response.status,data
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def state():
 status,data=req('state');assert status==200,(status,data);return data
def save(data,expected=200):
 status,result=req('state',{'revision':data['revision'],'snapshot':data['snapshot']});assert status==expected,(status,result);return result
def change_deal(patch,expected=200):
 data=state();deal=next(d for d in data['snapshot']['deals'] if d['id']==marker);deal.update(patch);return save(data,expected)
try:
 time.sleep(1)
 q.execute('SELECT COUNT(*) FROM deals');original_count=q.fetchone()[0]
 q.execute('INSERT INTO users(id,name,email,role) VALUES(%s,%s,%s,%s)',(uid,'Temporary workflow verification',uid+'@bolide.co.za','rep'))
 q.execute('INSERT INTO users(id,name,email,role) VALUES(%s,%s,%s,%s)',(uid2,'Other temporary person',uid2+'@bolide.co.za','rep'))
 assert req('auth',{'action':'signup','email':uid+'@bolide.co.za','name':'Temporary workflow verification','password':password})[0]==200
 initial=state();save(initial)
 data=state();template=copy.deepcopy(data['snapshot']['deals'][0]);template.update(id=marker,title='Temporary workflow check',stage='lead',ownerId=uid,receivedAt='2026-10-16T06:00:00Z',createdAt='2026-10-16T06:00:00Z',updatedAt='2026-10-16T06:00:00Z');template.pop('leadTracker',None);template.pop('proposalSentAt',None);template.pop('lostReason',None);template.pop('workflow',None)
 data['snapshot']['deals'].append(template);save(data,400)
 workflow={'nextAction':{'title':'Verify documents','assigneeId':uid,'dueDate':'2026-10-30'},'escalationUserId':uid2}
 template['workflow']=workflow;save(data)
 data=state();data['snapshot']['tasks'].append({'id':marker,'title':'Private task reminder','assigneeId':uid,'priority':'high','reminderAt':'2026-10-16T07:00:00Z','recurrence':'monthly','dueDate':'2026-10-31','dealId':marker,'done':False,'createdAt':'2026-10-16T06:00:00Z'})
 me=next(u for u in data['snapshot']['users'] if u['id']==uid);me['savedViews']=[{'id':marker,'name':'My overdue proposals','filters':{'owner':uid,'attention':'proposal-overdue'}}];save(data)
 data=state();task=next(t for t in data['snapshot']['tasks'] if t['id']==marker);assert task['assigneeId']==uid and task['reminderAt']=='2026-10-16T07:00:00Z' and task['recurrence']=='monthly'
 assert next(u for u in data['snapshot']['users'] if u['id']==uid)['savedViews'][0]['name']=='My overdue proposals'
 change_deal({'stage':'quote'},400)
 change_deal({'stage':'won'},400)
 changed=copy.deepcopy(workflow);changed['proposalDueOverride']='2026-11-12';change_deal({'workflow':changed},400)
 changed['deadlineReason']='Client asked to reschedule';change_deal({'workflow':changed})
 data=state()
 for suffix in ['kyc','signed']:
  data['snapshot']['attachments'].append({'id':marker+'-'+suffix,'dealId':marker,'filename':suffix+'.txt','mimeType':'text/plain','size':2,'dataUrl':'data:text/plain;base64,b2s=','createdAt':'2026-10-16T06:00:00Z'})
 save(data)
 changed['kyc']=[{'id':key,'label':key,'required':True,'status':'verified','attachmentId':marker+'-kyc','verifiedBy':uid,'verifiedAt':'2026-10-16T08:00:00Z'} for key in ['registration','identity','address']]
 change_deal({'workflow':changed,'stage':'quote'})
 changed['signedOn']='2026-10-15';changed['signedAttachmentId']=marker+'-signed';change_deal({'workflow':changed,'stage':'won'})
 data=state();record=next(d for d in data['snapshot']['deals'] if d['id']==marker);assert record['workflow']['signedOn']=='2026-10-15'
 history=[a for a in data['snapshot']['activities'] if a.get('dealId')==marker and a.get('changes')]
 assert history and all(a['userId']==uid for a in history)
 assert any(any(ch['field']=='stage' and ch['before']=='quote' and ch['after']=='won' for ch in a['changes']) for a in history)
 change_deal({'ownerId':uid2})
 data=state();assert any(any(ch['field']=='ownerId' and ch['before']==uid and ch['after']==uid2 for ch in a.get('changes',[])) for a in data['snapshot']['activities'])
 # Tampering with an audit event is ignored; the server keeps the original.
 target=next(a for a in data['snapshot']['activities'] if a.get('dealId')==marker and a.get('changes'));audit_id=target['id'];target['userId']=uid2;target['changes']=[];save(data)
 data=state();assert next(a for a in data['snapshot']['activities'] if a['id']==audit_id)['userId']==uid
 another=next(u for u in data['snapshot']['users'] if u['id']==uid2);another['savedViews']=[{'name':'tampered'}];save(data,400)
 stale=state();save(stale);save(stale,409)
 print('PASS: Xneelo database round trips for next actions, escalation, task assignment/priority/reminder/recurrence, personal saved views, KYC documents and verification, signature date/document, attributed immutable field history, mandatory gates, deadline explanations and revision conflicts.')
finally:
 # Delete only explicitly created test IDs; never restore a whole old snapshot.
 q.execute('START TRANSACTION');q.execute('SELECT revision FROM crm_revision WHERE id=1 FOR UPDATE')
 q.execute('DELETE FROM activities WHERE deal_id=%s',(marker,));q.execute('DELETE FROM attachments WHERE deal_id=%s',(marker,));q.execute('DELETE FROM tasks WHERE id=%s',(marker,));q.execute('DELETE FROM deals WHERE id=%s',(marker,));q.execute('DELETE FROM users WHERE id IN (%s,%s)',(uid,uid2));q.execute('UPDATE crm_revision SET revision=revision+1 WHERE id=1');c.commit()
 q.execute('SELECT COUNT(*) FROM deals');print('Lead count after test cleanup:',q.fetchone()[0]);c.close();server.terminate();server.wait();log.close()
