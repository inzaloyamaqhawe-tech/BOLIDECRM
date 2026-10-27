<?php
declare(strict_types=1);
require_once __DIR__.'/db.php';
// Keep CRM authentication isolated from stale root-domain cookies and other
// Bolide tools hosted alongside /crm. The versioned name also provides a clean
// cut-over for browsers that retained an older session cookie.
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('bolide_crm_v2');
session_set_cookie_params(['path'=>'/crm/', 'secure'=>true, 'httponly'=>true, 'samesite'=>'Strict']);
session_start();
header('Cache-Control: no-store');
function crm_session_user(): array {
    $q=crm_pdo()->prepare('SELECT id,name,email,role FROM users WHERE id=?');
    $q->execute([$_SESSION['user_id'] ?? '']); $user=$q->fetch();
    if (!$user) { crm_json(['ok'=>false,'error'=>'Please sign in.'],401); exit; }
    return $user;
}
function crm_csrf(): void {
    if (!hash_equals($_SESSION['csrf'] ?? bin2hex(random_bytes(32)), $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) {
        crm_json(['ok'=>false,'error'=>'Session expired. Reload and sign in.'],403); exit;
    }
}
