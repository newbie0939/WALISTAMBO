<?php

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Manila');

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_connect.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$role = $_SESSION['role'] ?? '';
$username = trim((string) ($_SESSION['username'] ?? ''));
$isCaptain = in_array($role, ['Barangay Captain', 'Captain'], true);

if (!in_array($role, ['Secretary', 'Barangay Captain', 'Captain'], true)) {
    sendJson(403, [
        'success' => false,
        'message' => 'Access denied.'
    ]);
}

if ($method === 'GET') {
    try {
        $sql = "
            SELECT
                id,
                incident_date AS date,
                incident_time AS time,
                incident_type AS type,
                location,
                complainant,
                respondent,
                description,
                status,
                recorded_by AS recordedBy,
                created_at AS createdAt,
                secretary_deleted,
                captain_archived,
                captain_archive_reason,
                captain_archived_by,
                captain_archived_at
            FROM incidents
        ";

        if ($role === 'Secretary') {
            $sql .= " WHERE secretary_deleted = 0 AND captain_archived = 0 ";
        }

        $sql .= ' ORDER BY created_at DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        echo json_encode(
            $stmt->fetchAll(PDO::FETCH_ASSOC),
            JSON_UNESCAPED_UNICODE
        );
    } catch (Throwable $e) {
        error_log('Incident GET error: ' . $e->getMessage());

        sendJson(500, [
            'success' => false,
            'message' => 'Failed to load incidents.'
        ]);
    }

    exit;
}


if ($method === 'POST') {
    if ($role !== 'Secretary') {
        sendJson(403, [
            'success' => false,
            'message' => 'Only the Secretary can create incident records.'
        ]);
    }

    if ($username === '') {
        sendJson(401, [
            'success' => false,
            'message' => 'User session is invalid.'
        ]);
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        sendJson(400, [
            'success' => false,
            'message' => 'Invalid incident data.'
        ]);
    }

    $type = trim((string) ($data['type'] ?? ''));
    $location = trim((string) ($data['location'] ?? ''));
    $complainant = trim((string) ($data['complainant'] ?? ''));
    $respondent = trim((string) ($data['respondent'] ?? ''));
    $description = trim((string) ($data['description'] ?? ''));
    $status = trim((string) ($data['status'] ?? 'Pending'));

    if (
        $type === '' ||
        $location === '' ||
        $complainant === '' ||
        $respondent === '' ||
        $description === ''
    ) {
        sendJson(400, [
            'success' => false,
            'message' => 'Please complete all required incident fields.'
        ]);
    }

    $auditActor = $_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? null;

    if ($auditActor === null || $auditActor === '') {
        $auditActor = $username;
    }

    try {
        $pdo->beginTransaction();

        $newId = generateIncidentId($pdo);
        $currentDate = date('Y-m-d');
        $currentTime = date('H:i:s');

        $stmt = $pdo->prepare("
            INSERT INTO incidents
            (
                id,
                incident_date,
                incident_time,
                incident_type,
                location,
                complainant,
                respondent,
                description,
                status,
                recorded_by,
                secretary_deleted
            )
            VALUES
            (
                :id,
                :incident_date,
                :incident_time,
                :incident_type,
                :location,
                :complainant,
                :respondent,
                :description,
                :status,
                :recorded_by,
                0
            )
        ");

        $stmt->execute([
            ':id' => $newId,
            ':incident_date' => $currentDate,
            ':incident_time' => $currentTime,
            ':incident_type' => $type,
            ':location' => $location,
            ':complainant' => $complainant,
            ':respondent' => $respondent,
            ':description' => $description,
            ':status' => $status,
            ':recorded_by' => $username
        ]);

        $newData = [
            'id' => $newId,
            'incident_date' => $currentDate,
            'incident_time' => $currentTime,
            'incident_type' => $type,
            'location' => $location,
            'complainant' => $complainant,
            'respondent' => $respondent,
            'description' => $description,
            'status' => $status,
            'recorded_by' => $username,
            'operation' => 'CREATE'
        ];

        $audit = $pdo->prepare("
            INSERT INTO audit_logs
                (incident_id, action, performed_by, old_data, new_data, created_at)
            VALUES
                (:incident_id, 'CREATE', :performed_by, :old_data, :new_data, NOW())
        ");

        $audit->execute([
            ':incident_id' => $newId,
            ':performed_by' => $auditActor,
            ':old_data' => json_encode(
                [],
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ),
            ':new_data' => json_encode(
                $newData,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            )
        ]);

        $pdo->commit();

        sendJson(201, [
            'success' => true,
            'id' => $newId,
            'message' => 'Incident record created successfully.'
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log('Incident INSERT/audit error: ' . $e->getMessage());

        sendJson(500, [
            'success' => false,
            'message' => 'Failed to create incident or record its audit history.'
        ]);
    }
}


if ($method === 'PUT') {
    sendJson(403, [
        'success' => false,
        'message' =>
            'Direct incident editing is not allowed. Please submit an edit request for Captain approval.'
    ]);
}


if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        $data = [];
    }

    $action = trim((string) ($data['action'] ?? ''));
    $incidentId = trim((string) ($data['id'] ?? ''));

    if ($incidentId === '') {
        sendJson(400, [
            'success' => false,
            'message' => 'Incident ID is required.'
        ]);
    }

    if (in_array($action, ['archive', 'unarchive', 'restore_secretary_deleted'], true)) {
        if (!$isCaptain) {
            sendJson(403, [
                'success' => false,
                'message' => 'Only the Barangay Captain can perform this action.'
            ]);
        }

        if ($username === '') {
            sendJson(401, [
                'success' => false,
                'message' => 'User session is invalid.'
            ]);
        }

        $performedBy = (int) ($_SESSION['admin_id'] ?? 0);

        if ($performedBy <= 0) {
            sendJson(401, [
                'success' => false,
                'message' => 'Administrator session ID is missing. Please log in again.'
            ]);
        }

        $reason = trim((string) ($data['reason'] ?? ''));

        if ($action === 'archive') {
            if ($reason === '') {
                sendJson(400, [
                    'success' => false,
                    'message' => 'An archive reason is required.'
                ]);
            }

            $reasonLength = function_exists('mb_strlen')
                ? mb_strlen($reason, 'UTF-8')
                : strlen($reason);

            if ($reasonLength > 1000) {
                sendJson(400, [
                    'success' => false,
                    'message' => 'The archive reason must be 1,000 characters or fewer.'
                ]);
            }
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                SELECT
                    id,
                    incident_date,
                    incident_time,
                    incident_type,
                    location,
                    complainant,
                    respondent,
                    description,
                    status,
                    recorded_by,
                    created_at,
                    secretary_deleted,
                    captain_archived,
                    captain_archive_reason,
                    captain_archived_by,
                    captain_archived_at
                FROM incidents
                WHERE id = :id
                LIMIT 1
                FOR UPDATE
            ");

            $stmt->execute([':id' => $incidentId]);
            $oldData = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$oldData) {
                $pdo->rollBack();

                sendJson(404, [
                    'success' => false,
                    'message' => 'Incident record not found.'
                ]);
            }

            if ($action === 'archive') {
                if ((int) $oldData['captain_archived'] === 1) {
                    $pdo->rollBack();

                    sendJson(409, [
                        'success' => false,
                        'message' => 'This incident is already archived.'
                    ]);
                }

                $stmt = $pdo->prepare("
                    UPDATE incidents
                    SET
                        captain_archived = 1,
                        captain_archive_reason = :reason,
                        captain_archived_by = :archived_by,
                        captain_archived_at = NOW()
                    WHERE id = :id
                      AND captain_archived = 0
                ");

                $stmt->execute([
                    ':reason' => $reason,
                    ':archived_by' => $username,
                    ':id' => $incidentId
                ]);

                $operation = 'CAPTAIN_ARCHIVE';
                $message = 'Incident archived successfully.';
            } elseif ($action === 'unarchive') {
                if ((int) $oldData['captain_archived'] !== 1) {
                    $pdo->rollBack();

                    sendJson(409, [
                        'success' => false,
                        'message' => 'This incident is not archived.'
                    ]);
                }

                $stmt = $pdo->prepare("
                    UPDATE incidents
                    SET
                        captain_archived = 0,
                        captain_archive_reason = NULL,
                        captain_archived_by = NULL,
                        captain_archived_at = NULL
                    WHERE id = :id
                      AND captain_archived = 1
                ");

                $stmt->execute([':id' => $incidentId]);

                $operation = 'CAPTAIN_UNARCHIVE';
                $message = 'Incident unarchived successfully.';
            } else {
                if ((int) $oldData['secretary_deleted'] !== 1) {
                    $pdo->rollBack();

                    sendJson(409, [
                        'success' => false,
                        'message' => 'This incident is not marked as deleted by the Secretary.'
                    ]);
                }

                $stmt = $pdo->prepare("
                    UPDATE incidents
                    SET secretary_deleted = 0
                    WHERE id = :id
                      AND secretary_deleted = 1
                ");

                $stmt->execute([':id' => $incidentId]);

                $operation = 'SECRETARY_DELETE_RESTORED';
                $message = 'Incident restored to the Secretary records successfully.';
            }

            if ($stmt->rowCount() !== 1) {
                $pdo->rollBack();

                sendJson(409, [
                    'success' => false,
                    'message' =>
                        'The incident could not be updated because its state changed. Refresh and try again.'
                ]);
            }

            $stmt = $pdo->prepare("
                SELECT
                    id,
                    incident_date,
                    incident_time,
                    incident_type,
                    location,
                    complainant,
                    respondent,
                    description,
                    status,
                    recorded_by,
                    created_at,
                    secretary_deleted,
                    captain_archived,
                    captain_archive_reason,
                    captain_archived_by,
                    captain_archived_at
                FROM incidents
                WHERE id = :id
                LIMIT 1
            ");

            $stmt->execute([':id' => $incidentId]);
            $newData = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$newData) {
                throw new RuntimeException('Unable to read updated incident for audit logging.');
            }

            $newData['operation'] = $operation;
            $newData['action_by_username'] = $username;

            if ($action === 'archive') {
                $newData['archive_reason'] = $reason;
            }

            $audit = $pdo->prepare("
                INSERT INTO audit_logs
                    (incident_id, action, performed_by, old_data, new_data, created_at)
                VALUES
                    (:incident_id, 'UPDATE', :performed_by, :old_data, :new_data, NOW())
            ");

            $audit->execute([
                ':incident_id' => $incidentId,
                ':performed_by' => $performedBy,
                ':old_data' => json_encode(
                    $oldData,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                ),
                ':new_data' => json_encode(
                    $newData,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                )
            ]);

            $pdo->commit();

            sendJson(200, [
                'success' => true,
                'message' => $message
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            error_log('Incident Captain action error: ' . $e->getMessage());

            sendJson(500, [
                'success' => false,
                'message' => 'Failed to process the incident action.'
            ]);
        }
    }

    if ($action !== '' && $role !== 'Secretary') {
        sendJson(400, [
            'success' => false,
            'message' => 'Invalid incident action.'
        ]);
    }

    if ($role !== 'Secretary') {
        sendJson(403, [
            'success' => false,
            'message' => 'Only the Secretary can submit a deletion request.'
        ]);
    }

    if ($username === '') {
        sendJson(401, [
            'success' => false,
            'message' => 'User session is invalid.'
        ]);
    }

    $requesterId = (int) ($_SESSION['admin_id'] ?? 0);

    if ($requesterId <= 0) {
        sendJson(401, [
            'success' => false,
            'message' => 'Administrator session ID is missing. Please log in again.'
        ]);
    }

    $reason = trim((string) ($data['reason'] ?? ''));

    if ($reason === '') {
        // Keeps the existing Delete button working until its reason prompt is added.
        $reason = 'Secretary requested deletion.';
    }

    $reasonLength = function_exists('mb_strlen')
        ? mb_strlen($reason, 'UTF-8')
        : strlen($reason);

    if ($reasonLength > 1000) {
        sendJson(400, [
            'success' => false,
            'message' => 'The deletion reason must be 1,000 characters or fewer.'
        ]);
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            SELECT
                id,
                incident_date,
                incident_time,
                incident_type,
                location,
                complainant,
                respondent,
                description,
                status,
                recorded_by,
                created_at,
                secretary_deleted,
                captain_archived
            FROM incidents
            WHERE id = :id
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([':id' => $incidentId]);
        $incident = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$incident) {
            $pdo->rollBack();

            sendJson(404, [
                'success' => false,
                'message' => 'Incident record not found.'
            ]);
        }

        if ((int) $incident['secretary_deleted'] === 1) {
            $pdo->rollBack();

            sendJson(409, [
                'success' => false,
                'message' => 'This incident has already been deleted from the Secretary records.'
            ]);
        }

        if ((int) $incident['captain_archived'] === 1) {
            $pdo->rollBack();

            sendJson(409, [
                'success' => false,
                'message' => 'This incident is archived by the Captain and cannot be requested for deletion from the Secretary panel.'
            ]);
        }

        $oldData = [
            'id' => $incident['id'],
            'date' => $incident['incident_date'],
            'time' => $incident['incident_time'],
            'type' => $incident['incident_type'],
            'location' => $incident['location'],
            'complainant' => $incident['complainant'],
            'respondent' => $incident['respondent'],
            'description' => $incident['description'],
            'status' => $incident['status'],
            'recordedBy' => $incident['recorded_by'],
            'createdAt' => $incident['created_at']
        ];

        $check = $pdo->prepare("
            SELECT request_id
            FROM incident_edit_requests
            WHERE incident_id = :incident_id
              AND status = 'Pending'
            LIMIT 1
            FOR UPDATE
        ");

        $check->execute([':incident_id' => $incidentId]);

        if ($check->fetch(PDO::FETCH_ASSOC)) {
            $pdo->rollBack();

            sendJson(409, [
                'success' => false,
                'message' => 'There is already a pending request for this incident. Wait for the Captain to review it first.'
            ]);
        }


        $proposedData = $oldData;
        $proposedData['operation'] = 'SECRETARY_DELETE_REQUEST';
        $proposedData['requestType'] = 'DELETE';
        $proposedData['requestedByUsername'] = $username;

        $stmt = $pdo->prepare("
            INSERT INTO incident_edit_requests
                (incident_id, requested_by, reason, old_data, proposed_data, status)
            VALUES
                (:incident_id, :requested_by, :reason, :old_data, :proposed_data, 'Pending')
        ");

        $stmt->execute([
            ':incident_id' => $incidentId,
            ':requested_by' => $requesterId,
            ':reason' => $reason,
            ':old_data' => json_encode(
                $oldData,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ),
            ':proposed_data' => json_encode(
                $proposedData,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            )
        ]);

        $requestId = (int) $pdo->lastInsertId();

        $auditNewData = $oldData;
        $auditNewData['operation'] = 'SECRETARY_DELETE_REQUEST';
        $auditNewData['requestType'] = 'DELETE';
        $auditNewData['request_id'] = $requestId;
        $auditNewData['request_status'] = 'Pending';
        $auditNewData['request_reason'] = $reason;
        $auditNewData['requested_by_username'] = $username;

        $audit = $pdo->prepare("
            INSERT INTO audit_logs
                (incident_id, action, performed_by, old_data, new_data, created_at)
            VALUES
                (:incident_id, 'UPDATE', :performed_by, :old_data, :new_data, NOW())
        ");

        $audit->execute([
            ':incident_id' => $incidentId,
            ':performed_by' => $requesterId,
            ':old_data' => json_encode(
                $oldData,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ),
            ':new_data' => json_encode(
                $auditNewData,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            )
        ]);

        $pdo->commit();

        sendJson(201, [
            'success' => true,
            'request_id' => $requestId,
            'message' => 'Deletion request submitted. The incident remains in the Secretary records until the Captain approves the request.'
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log('Incident deletion request error: ' . $e->getMessage());

        sendJson(500, [
            'success' => false,
            'message' => 'Failed to submit the deletion request.'
        ]);
    }
}

sendJson(405, [
    'success' => false,
    'message' => 'Method not allowed.'
]);


function sendJson(int $statusCode, array $payload): void
{
    http_response_code($statusCode);

    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function generateIncidentId(PDO $pdo): string
{
    $stmt = $pdo->query("
        SELECT id
        FROM incidents
        ORDER BY CAST(SUBSTRING(id, 5) AS UNSIGNED) DESC
        LIMIT 1
    ");

    $last = $stmt->fetchColumn();

    if (!$last) {
        return 'INC-00001';
    }

    $num = (int) substr((string) $last, 4) + 1;

    return 'INC-' . str_pad(
        (string) $num,
        5,
        '0',
        STR_PAD_LEFT
    );
}
