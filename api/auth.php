<?php
declare(strict_types=1);
require __DIR__.'/session.php';
try {
    if ($_SERVER['REQUEST_METHOD']==='GET') {
        $user=crm_session_user();
        $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
        crm_json(['ok'=>true,'user'=>$user,'csrf'=>$_SESSION['csrf']]); exit;
    }
    if ($_SERVER['REQUEST_METHOD']!=='POST') { crm_json(['ok'=>false],405); exit; }
    // JSON-only requests plus same-origin checks prevent cross-site login/logout.
    $origin=$_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin && parse_url($origin,PHP_URL_HOST)!==explode(':',$_SERVER['HTTP_HOST'])[0]) { crm_json(['ok'=>false],403); exit; }
    if (!str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) { crm_json(['ok'=>false],415); exit; }
    $data=crm_input(); $action=$data['action'] ?? 'login';
    if($action==='logout') { crm_csrf(); session_destroy(); crm_json(['ok'=>true]); exit; }
    $email=strtolower(trim($data['email'] ?? '')); $password=$data['password'] ?? '';
    if(!filter_var($email,FILTER_VALIDATE_EMAIL) || !in_array(substr(strrchr($email,'@') ?: '',1),['bolide.co.za','airnergize.co.za','newgx.co.za'],true)) throw new InvalidArgumentException('Use your invited work email.');
    $pdo=crm_pdo();
    if($action==='signup') { $pdo->beginTransaction(); $pdo->query('SELECT revision FROM crm_revision WHERE id=1 FOR UPDATE'); }
    $q=$pdo->prepare('SELECT * FROM users WHERE email=?'); $q->execute([$email]); $user=$q->fetch();
    if(!$user) throw new InvalidArgumentException('Ask an administrator to invite your email address.');
    if($action==='signup') {
        if(strlen($password)<8 || !trim($data['name'] ?? '')) throw new InvalidArgumentException('Enter your name and a password of at least eight characters.');
        $q=$pdo->prepare('UPDATE users SET name=?,password_hash=? WHERE id=? AND (password_hash IS NULL OR password_hash=\'\')');
        $q->execute([trim($data['name']),password_hash($password,PASSWORD_DEFAULT),$user['id']]);
        if(!$q->rowCount()) throw new InvalidArgumentException('Account already registered. Please sign in.');
        $user['name']=trim($data['name']);
        $pdo->exec('UPDATE crm_revision SET revision=revision+1 WHERE id=1'); $pdo->commit();
    } elseif($action==='login') {
        if(!password_verify($password,$user['password_hash'] ?? '')) { usleep(500000); throw new InvalidArgumentException('Incorrect email/password, or invitation not yet registered.'); }
    } else throw new InvalidArgumentException('Invalid action.');
    session_regenerate_id(true); $_SESSION['user_id']=$user['id']; $_SESSION['csrf']=bin2hex(random_bytes(32));
    unset($user['password_hash'],$user['created_at'],$user['updated_at']);
    crm_json(['ok'=>true,'user'=>$user,'csrf'=>$_SESSION['csrf']]);
} catch(InvalidArgumentException $e) { if(isset($pdo) && $pdo->inTransaction()) $pdo->rollBack(); crm_json(['ok'=>false,'error'=>$e->getMessage()],400); }
catch(Throwable $e) { if(isset($pdo) && $pdo->inTransaction()) $pdo->rollBack(); error_log((string)$e); crm_json(['ok'=>false,'error'=>'Unable to sign in. Please contact the administrator.'],500); }
