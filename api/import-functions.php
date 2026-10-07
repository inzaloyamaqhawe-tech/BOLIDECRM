<?php
function json_or_null(mixed $value): ?string
{
    if ($value === null) {
        return null;
    }
    return json_encode($value, JSON_UNESCAPED_SLASHES);
}

function upsert_users(PDO $pdo, array $rows): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO users (id, name, email, password_hash, role)
         VALUES (:id, :name, :email, :password_hash, :role)
         ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email),
         password_hash = VALUES(password_hash), role = VALUES(role)'
    );
    foreach ($rows as $row) {
        $stmt->execute([
            ':id' => $row['id'],
            ':name' => $row['name'],
            ':email' => strtolower($row['email']),
            ':password_hash' => ($row['passwordHash'] ?? $row['password_hash'] ?? '') ?: null,
            ':role' => $row['role'] ?? 'rep',
        ]);
    }
    return count($rows);
}

function upsert_companies(PDO $pdo, array $rows): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO companies (id, name, industry, status, website, phone, address, divisions_json, created_at)
         VALUES (:id, :name, :industry, :status, :website, :phone, :address, :divisions_json, :created_at)
         ON DUPLICATE KEY UPDATE name = VALUES(name), industry = VALUES(industry),
         status = VALUES(status), website = VALUES(website), phone = VALUES(phone),
         address = VALUES(address), divisions_json = VALUES(divisions_json)'
    );
    foreach ($rows as $row) {
        $stmt->execute([
            ':id' => $row['id'],
            ':name' => $row['name'],
            ':industry' => $row['industry'] ?? '',
            ':status' => $row['status'] ?? 'Prospect',
            ':website' => $row['website'] ?? null,
            ':phone' => $row['phone'] ?? null,
            ':address' => $row['address'] ?? null,
            ':divisions_json' => json_or_null($row['divisions'] ?? []),
            ':created_at' => crm_iso_to_mysql($row['createdAt'] ?? $row['created_at'] ?? null) ?? gmdate('Y-m-d H:i:s'),
        ]);
    }
    return count($rows);
}

function upsert_contacts(PDO $pdo, array $rows): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO contacts (id, company_id, name, email, phone, role, created_at)
         VALUES (:id, :company_id, :name, :email, :phone, :role, :created_at)
         ON DUPLICATE KEY UPDATE company_id = VALUES(company_id), name = VALUES(name),
         email = VALUES(email), phone = VALUES(phone), role = VALUES(role)'
    );
    foreach ($rows as $row) {
        $stmt->execute([
            ':id' => $row['id'],
            ':company_id' => $row['companyId'] ?? $row['company_id'],
            ':name' => $row['name'],
            ':email' => $row['email'],
            ':phone' => $row['phone'] ?? null,
            ':role' => $row['role'] ?? null,
            ':created_at' => crm_iso_to_mysql($row['createdAt'] ?? $row['created_at'] ?? null) ?? gmdate('Y-m-d H:i:s'),
        ]);
    }
    return count($rows);
}

function upsert_deals(PDO $pdo, array $rows): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO deals (id, title, company_id, primary_contact_id, primary_contact_name, site,
         division, segment, product_line, stage, once_off, mrr, owner_id, close_date, notes,
         lost_reason, secure_details_json, energy_details_json, water_details_json,
         financing_details_json, received_at, proposal_sent_at, stage_changed_at, created_at, updated_at)
         VALUES (:id, :title, :company_id, :primary_contact_id, :primary_contact_name, :site,
         :division, :segment, :product_line, :stage, :once_off, :mrr, :owner_id, :close_date,
         :notes, :lost_reason, :secure_details_json, :energy_details_json, :water_details_json,
         :financing_details_json, :received_at, :proposal_sent_at, :stage_changed_at, :created_at, :updated_at)
         ON DUPLICATE KEY UPDATE title = VALUES(title), company_id = VALUES(company_id),
         primary_contact_id = VALUES(primary_contact_id), primary_contact_name = VALUES(primary_contact_name),
         site = VALUES(site), division = VALUES(division), segment = VALUES(segment),
         product_line = VALUES(product_line), stage = VALUES(stage), once_off = VALUES(once_off),
         mrr = VALUES(mrr), owner_id = VALUES(owner_id), close_date = VALUES(close_date),
         notes = VALUES(notes), lost_reason = VALUES(lost_reason),
         secure_details_json = VALUES(secure_details_json), energy_details_json = VALUES(energy_details_json),
         water_details_json = VALUES(water_details_json), financing_details_json = VALUES(financing_details_json),
         received_at = VALUES(received_at), proposal_sent_at = VALUES(proposal_sent_at), stage_changed_at = VALUES(stage_changed_at), updated_at = VALUES(updated_at)'
    );
    foreach ($rows as $row) {
        if (($row["stage"] ?? "lead") === "lost" && !trim($row["lostReason"] ?? $row["lost_reason"] ?? "")) throw new InvalidArgumentException("Lost reason required");
        $stmt->execute([
            ':id' => $row['id'],
            ':title' => $row['title'],
            ':company_id' => $row['companyId'] ?? $row['company_id'],
            ':primary_contact_id' => $row['primaryContactId'] ?? $row['primary_contact_id'] ?? null,
            ':primary_contact_name' => $row['primaryContactName'] ?? $row['primary_contact_name'] ?? null,
            ':site' => $row['site'] ?? null,
            ':division' => $row['division'],
            ':segment' => $row['segment'] ?? null,
            ':product_line' => $row['productLine'] ?? $row['product_line'] ?? null,
            ':stage' => $row['stage'] ?? 'lead',
            ':once_off' => $row['onceOff'] ?? $row['once_off'] ?? 0,
            ':mrr' => $row['mrr'] ?? 0,
            ':owner_id' => $row['ownerId'] ?? $row['owner_id'],
            ':close_date' => crm_date_or_null($row['closeDate'] ?? $row['close_date'] ?? null),
            ':notes' => $row['notes'] ?? null,
            ':lost_reason' => $row['lostReason'] ?? $row['lost_reason'] ?? null,
            ':secure_details_json' => json_or_null($row['secureDetails'] ?? $row['secure_details_json'] ?? null),
            ':energy_details_json' => json_or_null($row['energyDetails'] ?? $row['energy_details_json'] ?? null),
            ':water_details_json' => json_or_null($row['waterDetails'] ?? $row['water_details_json'] ?? null),
            ':received_at' => crm_iso_to_mysql($row['receivedAt'] ?? $row['createdAt'] ?? null),
            ':proposal_sent_at' => crm_iso_to_mysql($row['proposalSentAt'] ?? null),
            ':stage_changed_at' => crm_iso_to_mysql($row['stageChangedAt'] ?? $row['createdAt'] ?? null),
            ':financing_details_json' => json_or_null($row['financingDetails'] ?? $row['financing_details_json'] ?? null),
            ':created_at' => crm_iso_to_mysql($row['createdAt'] ?? $row['created_at'] ?? null) ?? gmdate('Y-m-d H:i:s'),
            ':updated_at' => crm_iso_to_mysql($row['updatedAt'] ?? $row['updated_at'] ?? null) ?? gmdate('Y-m-d H:i:s'),
        ]);
    }
    return count($rows);
}

function upsert_activities(PDO $pdo, array $rows): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO activities (id, deal_id, company_id, type, body, user_id, created_at)
         VALUES (:id, :deal_id, :company_id, :type, :body, :user_id, :created_at)
         ON DUPLICATE KEY UPDATE deal_id = VALUES(deal_id), company_id = VALUES(company_id),
         type = VALUES(type), body = VALUES(body), user_id = VALUES(user_id)'
    );
    foreach ($rows as $row) {
        if (empty($row['dealId']) && empty($row['deal_id']) && empty($row['companyId']) && empty($row['company_id'])) throw new InvalidArgumentException('Activity must belong to a deal or company.');
        $stmt->execute([
            ':id' => $row['id'],
            ':deal_id' => $row['dealId'] ?? $row['deal_id'] ?? null,
            ':company_id' => $row['companyId'] ?? $row['company_id'] ?? null,
            ':type' => $row['type'] ?? 'note',
            ':body' => $row['body'],
            ':user_id' => ($row['userId'] ?? $row['user_id'] ?? null) === 'system' ? null : ($row['userId'] ?? $row['user_id'] ?? null),
            ':created_at' => crm_iso_to_mysql($row['createdAt'] ?? $row['created_at'] ?? null) ?? gmdate('Y-m-d H:i:s'),
        ]);
    }
    return count($rows);
}

function upsert_tasks(PDO $pdo, array $rows): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO tasks (id, title, due_date, deal_id, done, created_at)
         VALUES (:id, :title, :due_date, :deal_id, :done, :created_at)
         ON DUPLICATE KEY UPDATE title = VALUES(title), due_date = VALUES(due_date),
         deal_id = VALUES(deal_id), done = VALUES(done)'
    );
    foreach ($rows as $row) {
        $stmt->execute([
            ':id' => $row['id'],
            ':title' => $row['title'],
            ':due_date' => crm_date_or_null($row['dueDate'] ?? $row['due_date'] ?? null),
            ':deal_id' => $row['dealId'] ?? $row['deal_id'] ?? null,
            ':done' => !empty($row['done']) ? 1 : 0,
            ':created_at' => crm_iso_to_mysql($row['createdAt'] ?? $row['created_at'] ?? null) ?? gmdate('Y-m-d H:i:s'),
        ]);
    }
    return count($rows);
}

function upsert_division_overrides(PDO $pdo, array $rows): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO division_overrides (division_key, description, product_lines_json)
         VALUES (:division_key, :description, :product_lines_json)
         ON DUPLICATE KEY UPDATE description = VALUES(description),
         product_lines_json = VALUES(product_lines_json)'
    );
    $count = 0;
    foreach ($rows as $key => $row) {
        if (!is_array($row)) {
            continue;
        }
        $stmt->execute([
            ':division_key' => is_string($key) ? $key : ($row['division_key'] ?? $row['key']),
            ':description' => $row['description'] ?? null,
            ':product_lines_json' => json_or_null($row['productLines'] ?? $row['product_lines_json'] ?? null),
        ]);
        $count++;
    }
    return $count;
}

function upsert_stage_overrides(PDO $pdo, array $rows): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO stage_overrides (stage_key, label, probability)
         VALUES (:stage_key, :label, :probability)
         ON DUPLICATE KEY UPDATE label = VALUES(label), probability = VALUES(probability)'
    );
    $count = 0;
    foreach ($rows as $key => $row) {
        if (!is_array($row)) {
            continue;
        }
        $stmt->execute([
            ':stage_key' => is_string($key) ? $key : ($row['stage_key'] ?? $row['key']),
            ':label' => $row['label'] ?? null,
            ':probability' => $row['probability'] ?? null,
        ]);
        $count++;
    }
    return $count;
}

function upsert_attachments(PDO $pdo, array $rows): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO attachments (id, deal_id, filename, mime_type, size_bytes, data_url, created_at)
         VALUES (:id, :deal_id, :filename, :mime_type, :size_bytes, :data_url, :created_at)
         ON DUPLICATE KEY UPDATE filename = VALUES(filename), mime_type = VALUES(mime_type),
         size_bytes = VALUES(size_bytes), data_url = VALUES(data_url)'
    );
    foreach ($rows as $row) {
        $stmt->execute([
            ':id' => $row['id'],
            ':deal_id' => $row['dealId'] ?? $row['deal_id'],
            ':filename' => $row['filename'],
            ':mime_type' => $row['mimeType'] ?? $row['mime_type'] ?? 'application/octet-stream',
            ':size_bytes' => $row['size'] ?? $row['size_bytes'] ?? 0,
            ':data_url' => $row['dataUrl'] ?? $row['data_url'],
            ':created_at' => crm_iso_to_mysql($row['createdAt'] ?? $row['created_at'] ?? null) ?? gmdate('Y-m-d H:i:s'),
        ]);
    }
    return count($rows);
}
