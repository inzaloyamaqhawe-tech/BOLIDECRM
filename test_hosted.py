from pathlib import Path
import subprocess,urllib.request,urllib.error,json,time,pymysql,re,secrets,copy
p=Path(__file__).parent
config=(p/'api/config.php').read_text(); cfg={k:re.search("'"+k+"'=>'([^']*)'",config).group(1) for k in ['db_host','db_user','db_pass','db_name']}
c=pymysql.connect(host=cfg['db_host'],user=cfg['db_user'],password=cfg['db_pass'],database=cfg['db_name'],autocommit=True)
q=c.cursor();testid='test-'+secrets.token_hex(8);email=testid+'@bolide.co.za';password=secrets.token_urlsafe(24)
q.execute('INSERT INTO users(id,name,email,role) VALUES(%s,%s,%s,%s)',(testid,'Temporary verification',email,'admin'))
php='C:/Users/LangelihleNgidi/.codex/tools/php/php.exe'
log=open(p/'php-test.log','w')
server=subprocess.Popen([php,'-d','extension_dir=C:/Users/LangelihleNgidi/.codex/tools/php/ext','-d','extension=pdo_mysql','-S','127.0.0.1:8765','-t',str(p)],stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
cookie='';csrf=''
def req(file,body=None):
 global cookie,csrf
 headers={'Content-Type':'application/json','Cookie':cookie,'X-CSRF-Token':csrf}
 r=urllib.request.Request('http://127.0.0.1:8765/api/'+file+'.php',None if body is None else json.dumps(body).encode(),headers)
 try:
  with urllib.request.urlopen(r) as response:
   if response.headers.get('Set-Cookie'):cookie=response.headers['Set-Cookie'].split(';')[0]
   data=json.load(response);csrf=data.get('csrf',csrf);return response.status,data
 except urllib.error.HTTPError as e:return e.code,json.load(e)
try:
 time.sleep(1)
 assert req('state')[0]==401
 assert req('auth',{'action':'signup','email':email,'name':'Temporary verification','password':password})[0]==200
 status,data=req('state');assert status==200
 assert all('passwordHash' not in u for u in data['snapshot']['users'])
 original=copy.deepcopy(data['snapshot']);revision=data['revision']
 status,saved=req('state',{'snapshot':original,'revision':revision});assert status==200,(status,saved)
 assert req('state',{'snapshot':original,'revision':revision})[0]==409
 revision=saved['revision'];invalid=copy.deepcopy(original);invalid['deals'][0]['stage']='lost';invalid['deals'][0]['lostReason']=' '
 assert req('state',{'snapshot':invalid,'revision':revision})[0]==400
 fixture=copy.deepcopy(original)
 lead=copy.deepcopy(fixture['deals'][0]);lead.update(id=testid,title='Temporary verification lead',stage='lost',lostReason='Verification only',receivedAt='2026-10-07T06:00:00Z',stageChangedAt='2026-10-07T06:00:00Z')
 fixture['deals'].append(lead)
 fixture['attachments'].append(dict(id=testid,dealId=testid,filename='verification.txt',mimeType='text/plain',size=2,dataUrl='data:text/plain;base64,b2s=',createdAt='2026-10-07T06:00:00Z'))
 status,res=req('state',{'snapshot':fixture,'revision':revision});assert status==200,(status,res)
 status,read=req('state');assert status==200
 assert any(d['id']==testid and d['lostReason']=='Verification only' for d in read['snapshot']['deals'])
 assert any(a['id']==testid for a in read['snapshot']['attachments'])
 status,res=req('state',{'snapshot':original,'revision':res['revision']});assert status==200,(status,res)
 q.execute('UPDATE users SET role=\'rep\' WHERE id=%s',(testid,))
 status,data=req('state');assert status==200
 changed=copy.deepcopy(data['snapshot']);changed['users'][0]['role']='admin' if changed['users'][0]['role']=='rep' else 'rep'
 assert req('state',{'snapshot':changed,'revision':data['revision']})[0]==400
 status,res=req('state',{'snapshot':data['snapshot'],'revision':data['revision']});assert status==200,(status,res)
 assert req('auth',{'action':'logout'})[0]==200
 assert req('state')[0]==401
 assert req('auth',{'action':'login','email':email,'password':password})[0]==200
 q.execute('SELECT COUNT(*) FROM deals');assert q.fetchone()[0]==42
 print('PASS: PHP/database connection, invitation signup, login/logout, session protection, shared save roundtrip, lead/attachment create-read-delete, conflict detection, compulsory lost reason, role enforcement, password hash exclusion, pipeline preserved.')
finally:
 server.terminate();server.wait();log.close();q.execute('DELETE FROM attachments WHERE id=%s',(testid,));q.execute('DELETE FROM deals WHERE id=%s',(testid,));q.execute('DELETE FROM users WHERE id=%s',(testid,));c.close()
