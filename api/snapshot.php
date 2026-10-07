<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/import-functions.php';

crm_apply_cors();
crm_require_secret();

try {
    $pdo = crm_pdo();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        crm_json([
            'ok' => true,
            'snapshot' => [
                'users' => $pdo->query('SELECT * FROM users ORDER BY name')->fetchAll(),
                'companies' => $pdo->query('SELECT * FROM companies ORDER BY name')->fetchAll(),
                'contacts' => $pdo->query('SELECT * FROM contacts ORDER BY name')->fetchAll(),
                'deals' => $pdo->query('SELECT * FROM deals ORDER BY updated_at DESC')->fetchAll(),
                'activities' => $pdo->query('SELECT * FROM activities ORDER BY created_at DESC')->fetchAll(),
                'tasks' => $pdo->query('SELECT * FROM tasks ORDER BY created_at DESC')->fetchAll(),
                'division_overrides' => $pdo->query('SELECT * FROM division_overrides')->fetchAll(),
                'stage_overrides' => $pdo->query('SELECT * FROM stage_overrides')->fetchAll(),
                'attachments' => $pdo->query('SELECT * FROM attachments ORDER BY created_at DESC')->fetchAll(),
            ],
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        crm_json(['ok' => false, 'error' => 'Method not allowed'], 405);
        exit;
    }

    $data = crm_input();
    $snapshot = $data['snapshot'] ?? $data;
    if (!is_array($snapshot)) {
        crm_json(['ok' => false, 'error' => 'Missing snapshot object'], 400);
        exit;
    }

    $pdo->beginTransaction();

    $counts = [
        'users' => upsert_users($pdo, $snapshot['users'] ?? []),
        'companies' => upsert_companies($pdo, $snapshot['companies'] ?? []),
        'contacts' => upsert_contacts($pdo, $snapshot['contacts'] ?? []),
        'deals' => upsert_deals($pdo, $snapshot['deals'] ?? []),
        'activities' => upsert_activities($pdo, $snapshot['activities'] ?? []),
        'tasks' => upsert_tasks($pdo, $snapshot['tasks'] ?? []),
        'division_overrides' => upsert_division_overrides($pdo, $snapshot['divisionOverrides'] ?? $snapshot['division_overrides'] ?? []),
        'stage_overrides' => upsert_stage_overrides($pdo, $snapshot['stageOverrides'] ?? $snapshot['stage_overrides'] ?? []),
        'attachments' => upsert_attachments($pdo, $snapshot['attachments'] ?? []),
    ];

    $pdo->commit();
    crm_json(['ok' => true, 'imported' => $counts]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    crm_json(['ok' => false, 'error' => $e->getMessage()], 500);
}
