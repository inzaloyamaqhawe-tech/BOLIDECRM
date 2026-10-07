<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

crm_apply_cors();

try {
    $pdo = crm_pdo();
    $pdo->query('SELECT 1');
    crm_json(['ok' => true, 'database' => 'connected']);
} catch (Throwable $e) {
    crm_json(['ok' => false, 'error' => $e->getMessage()], 500);
}
