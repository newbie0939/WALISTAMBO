<?php

header('Content-Type: application/json; charset=utf-8');

date_default_timezone_set('Asia/Manila');

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_connect.php';


function sendEditRequestJson(int $statusCode, array $payload): void
{
    http_response_code($statusCode);

    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}



if (
    !isset($_SESSION['admin_id']) ||
    !isset($_SESSION['username']) ||
    !isset($_SESSION['role']) ||
    $_SESSION['role'] !== 'Secretary'
) {
    sendEditRequestJson(401, [
        'success' => false,
        'message' => 'Unauthorized. Only the Secretary can submit edit requests.'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendEditRequestJson(405, [
        'success' => false,
        'message' => 'Method not allowed.'
    ]);
}



$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    sendEditRequestJson(400, [
        'success' => false,
        'message' => 'Invalid request data.'
    ]);
}


$incidentId = trim((string) ($data['incident_id'] ?? ''));
$reason = trim((string) ($data['reason'] ?? ''));
$password = (string) ($data['password'] ?? '');

if (!preg_match('/^INC-\d+$/i', $incidentId)) {
    sendEditRequestJson(400, [
        'success' => false,
        'message' => 'A valid incident ID is required.'
    ]);
}


if ($reason === '') {
    sendEditRequestJson(400, [
        'success' => false,
        'message' => 'A reason is required when requesting an edit.'
    ]);
}



if ($password === '') {
    sendEditRequestJson(400, [
        'success' => false,
        'message' => 'Please enter your password to verify your identity.'
    ]);
}

try {
    $authStmt = $pdo->prepare("
        SELECT admin_id, password, role
        FROM admins
        WHERE admin_id = :admin_id
        LIMIT 1
    ");

    $authStmt->execute([
        ':admin_id' => (int) $_SESSION['admin_id']
    ]);

    $currentAdmin = $authStmt->fetch(PDO::FETCH_ASSOC);

    if (
        !$currentAdmin ||
        $currentAdmin['role'] !== 'Secretary' ||
        !password_verify($password, $currentAdmin['password'])
    ) {
        sendEditRequestJson(403, [
            'success' => false,
            'message' => 'Password verification failed. Please check your password and try again.'
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
            captain_archived
        FROM incidents
        WHERE id = :id
        LIMIT 1
    ");

    $stmt->execute([
        ':id' => $incidentId
    ]);

    $incident = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$incident) {
        sendEditRequestJson(404, [
            'success' => false,
            'message' => 'Incident not found.'
        ]);
    }

    if ((int) $incident['secretary_deleted'] === 1) {
        sendEditRequestJson(409, [
            'success' => false,
            'message' => 'This incident has been deleted from the Secretary records.'
        ]);
    }

    if ((int) $incident['captain_archived'] === 1) {
        sendEditRequestJson(409, [
            'success' => false,
            'message' => 'This incident is archived and cannot be edited.'
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



    $proposedData = [
        'id' => $incident['id'],
        'date' => $incident['incident_date'],
        'time' => $incident['incident_time'],
        'type' => trim((string) ($data['type'] ?? $incident['incident_type'])),
        'location' => trim((string) ($data['location'] ?? $incident['location'])),
        'complainant' => trim((string) ($data['complainant'] ?? $incident['complainant'])),
        'respondent' => trim((string) ($data['respondent'] ?? $incident['respondent'])),
        'description' => trim((string) ($data['description'] ?? $incident['description'])),
        'status' => (string) ($data['status'] ?? $incident['status']),
        'recordedBy' => $incident['recorded_by'],
        'createdAt' => $incident['created_at']
    ];



    if (
        $proposedData['type'] === '' ||
        $proposedData['location'] === '' ||
        $proposedData['complainant'] === '' ||
        $proposedData['description'] === ''
    ) {
        sendEditRequestJson(400, [
            'success' => false,
            'message' => 'Incident type, location, complainant, and description are required.'
        ]);
    }

    $allowedStatuses = ['Pending', 'Ongoing', 'Resolved'];

    if (!in_array($proposedData['status'], $allowedStatuses, true)) {
        sendEditRequestJson(400, [
            'success' => false,
            'message' => 'Invalid incident status.'
        ]);
    }



    $checkStmt = $pdo->prepare("
        SELECT request_id
        FROM incident_edit_requests
        WHERE incident_id = :incident_id
          AND status = 'Pending'
        LIMIT 1
    ");

    $checkStmt->execute([
        ':incident_id' =>  $incidentId
    ]);

    if ($checkStmt->fetch(PDO::FETCH_ASSOC)) {
        sendEditRequestJson(409, [
            'success' => false,
            'message' => 'There is already a pending edit request for this incident.'
        ]);
    }


    $stmt = $pdo->prepare("
        INSERT INTO incident_edit_requests
        (
            incident_id,
            requested_by,
            reason,
            old_data,
            proposed_data,
            status
        )
        VALUES
        (
            :incident_id,
            :requested_by,
            :reason,
            :old_data,
            :proposed_data,
            'Pending'
        )
    ");

    $stmt->execute([
        ':incident_id' =>  $incidentId,
        ':requested_by' => (int) $_SESSION['admin_id'],
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

    sendEditRequestJson(201, [
        'success' => true,
        'request_id' => (int) $pdo->lastInsertId(),
        'message' => 'Edit request submitted successfully. It is now waiting for Barangay Captain approval.'
    ]);

} catch (PDOException $e) {
    error_log('Incident edit request error: ' . $e->getMessage());

    sendEditRequestJson(500, [
        'success' => false,
        'message' => 'Failed to submit edit request. Please try again.'
    ]);
} catch (Throwable $e) {
    error_log('Incident edit request error: ' . $e->getMessage());

    sendEditRequestJson(500, [
        'success' => false,
        'message' => 'An unexpected error occurred while submitting the edit request.'
    ]);
}
