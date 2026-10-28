<?php

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Manila');

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_connect.php';



if (
    !isset($_SESSION['admin_id']) ||
    !isset($_SESSION['username']) ||
    !isset($_SESSION['role'])
) {
    sendJson(401, [
        'success' => false,
        'message' => 'Unauthorized.'
    ]);
}

$allowedRoles = ['Barangay Captain', 'Captain', 'Admin'];
$role = (string) $_SESSION['role'];
$username = trim((string) $_SESSION['username']);
$reviewerId = (int) $_SESSION['admin_id'];

if (!in_array($role, $allowedRoles, true) || $reviewerId <= 0) {
    sendJson(403, [
        'success' => false,
        'message' => 'You do not have permission to review requests.'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(405, [
        'success' => false,
        'message' => 'Method not allowed.'
    ]);
}



$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    sendJson(400, [
        'success' => false,
        'message' => 'Invalid request data.'
    ]);
}

$requestId = (int) ($data['request_id'] ?? 0);
$action = trim((string) ($data['action'] ?? ''));
$reviewReason = trim((string) ($data['review_reason'] ?? ''));

if ($requestId <= 0) {
    sendJson(400, [
        'success' => false,
        'message' => 'Request ID is required.'
    ]);
}

if (!in_array($action, ['approve', 'reject'], true)) {
    sendJson(400, [
        'success' => false,
        'message' => 'Invalid review action.'
    ]);
}

if ($action === 'reject' && $reviewReason === '') {
    sendJson(400, [
        'success' => false,
        'message' => 'A reason is required when rejecting a request.'
    ]);
}

try {
    $pdo->beginTransaction();


    $stmt = $pdo->prepare("
        SELECT
            request_id,
            incident_id,
            requested_by,
            reason,
            old_data,
            proposed_data,
            status
        FROM incident_edit_requests
        WHERE request_id = :request_id
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute([
        ':request_id' => $requestId
    ]);

    $request = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$request) {
        $pdo->rollBack();

        sendJson(404, [
            'success' => false,
            'message' => 'Request not found.'
        ]);
    }

    if ($request['status'] !== 'Pending') {
        $pdo->rollBack();

        sendJson(409, [
            'success' => false,
            'message' => 'This request has already been reviewed.'
        ]);
    }

    $oldData = json_decode((string) $request['old_data'], true);
    $proposedData = json_decode((string) $request['proposed_data'], true);

    if (!is_array($oldData) || !is_array($proposedData)) {
        $pdo->rollBack();

        sendJson(500, [
            'success' => false,
            'message' => 'The saved request data is invalid.'
        ]);
    }


    $isDeleteRequest =
        (($proposedData['operation'] ?? '') === 'SECRETARY_DELETE_REQUEST') ||
        (($proposedData['requestType'] ?? '') === 'DELETE');



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
        WHERE id = :incident_id
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute([
        ':incident_id' => $request['incident_id']
    ]);

    $incident = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$incident) {
        $pdo->rollBack();

        sendJson(404, [
            'success' => false,
            'message' => 'The incident no longer exists.'
        ]);
    }

    $currentData = [
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



    if ($action === 'reject') {
        $stmt = $pdo->prepare("
            UPDATE incident_edit_requests
            SET
                status = 'Rejected',
                reviewed_by = :reviewed_by,
                review_reason = :review_reason,
                reviewed_at = NOW()
            WHERE request_id = :request_id
              AND status = 'Pending'
        ");

        $stmt->execute([
            ':reviewed_by' => $reviewerId,
            ':review_reason' => $reviewReason,
            ':request_id' => $requestId
        ]);

        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException('The request could not be marked as rejected.');
        }


        $auditData = $currentData;
        $auditData['operation'] = $isDeleteRequest
            ? 'SECRETARY_DELETE_REJECTED'
            : 'EDIT_REQUEST_REJECTED';
        $auditData['request_id'] = $requestId;
        $auditData['request_status'] = 'Rejected';
        $auditData['request_reason'] = $request['reason'];
        $auditData['review_reason'] = $reviewReason;
        $auditData['reviewed_by_username'] = $username;

        insertAuditLog(
            $pdo,
            (string) $request['incident_id'],
            'UPDATE',
            $reviewerId,
            $currentData,
            $auditData
        );

        $pdo->commit();

        sendJson(200, [
            'success' => true,
            'message' => $isDeleteRequest
                ? 'Deletion request rejected. The incident remains in the Secretary records.'
                : 'Edit request rejected successfully.'
        ]);
    }



    if ($isDeleteRequest) {
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
                'message' => 'This incident has been archived by the Captain. The deletion request cannot be approved.'
            ]);
        }


        if (!incidentDataMatches($oldData, $currentData)) {
            $pdo->rollBack();

            sendJson(409, [
                'success' => false,
                'message' => 'This deletion request is outdated because the incident has changed. Review the current record before submitting a new request.'
            ]);
        }

        $stmt = $pdo->prepare("
            UPDATE incidents
            SET secretary_deleted = 1
            WHERE id = :id
              AND secretary_deleted = 0
              AND captain_archived = 0
        ");

        $stmt->execute([
            ':id' => $request['incident_id']
        ]);

        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException('The incident could not be marked as deleted.');
        }

        $stmt = $pdo->prepare("
            UPDATE incident_edit_requests
            SET
                status = 'Approved',
                reviewed_by = :reviewed_by,
                review_reason = :review_reason,
                reviewed_at = NOW()
            WHERE request_id = :request_id
              AND status = 'Pending'
        ");

        $stmt->execute([
            ':reviewed_by' => $reviewerId,
            ':review_reason' => $reviewReason !== ''
                ? $reviewReason
                : 'Deletion request approved.',
            ':request_id' => $requestId
        ]);

        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException('The deletion request could not be marked as approved.');
        }

        $newData = $currentData;
        $newData['operation'] = 'SECRETARY_DELETE_APPROVED';
        $newData['secretary_deleted'] = 1;
        $newData['request_id'] = $requestId;
        $newData['request_status'] = 'Approved';
        $newData['request_reason'] = $request['reason'];
        $newData['review_reason'] = $reviewReason !== ''
            ? $reviewReason
            : 'Deletion request approved.';
        $newData['approved_by_username'] = $username;

        insertAuditLog(
            $pdo,
            (string) $request['incident_id'],
            'DELETE',
            $reviewerId,
            $currentData,
            $newData
        );

        $pdo->commit();

        sendJson(200, [
            'success' => true,
            'message' => 'Deletion request approved. The incident is now removed from the Secretary active records.'
        ]);
    }



    if ((int) $incident['secretary_deleted'] === 1) {
        $pdo->rollBack();

        sendJson(409, [
            'success' => false,
            'message' => 'This incident has been deleted from the Secretary records and cannot be edited through this request.'
        ]);
    }

    if ((int) $incident['captain_archived'] === 1) {
        $pdo->rollBack();

        sendJson(409, [
            'success' => false,
            'message' => 'This incident is archived. Unarchive it before approving the edit request.'
        ]);
    }

    if (!incidentDataMatches($oldData, $currentData)) {
        $pdo->rollBack();

        sendJson(409, [
            'success' => false,
            'message' => 'This edit request is outdated because the incident has changed since the request was submitted.'
        ]);
    }

    $newType = trim((string) ($proposedData['type'] ?? ''));
    $newLocation = trim((string) ($proposedData['location'] ?? ''));
    $newComplainant = trim((string) ($proposedData['complainant'] ?? ''));
    $newRespondent = trim((string) ($proposedData['respondent'] ?? ''));
    $newDescription = trim((string) ($proposedData['description'] ?? ''));
    $newStatus = (string) ($proposedData['status'] ?? '');

    if (
        $newType === '' ||
        $newLocation === '' ||
        $newComplainant === '' ||
        $newDescription === ''
    ) {
        $pdo->rollBack();

        sendJson(400, [
            'success' => false,
            'message' => 'The proposed incident fields are incomplete.'
        ]);
    }

    if (!in_array($newStatus, ['Pending', 'Ongoing', 'Resolved'], true)) {
        $pdo->rollBack();

        sendJson(400, [
            'success' => false,
            'message' => 'The proposed incident status is invalid.'
        ]);
    }

    $stmt = $pdo->prepare("
        UPDATE incidents
        SET
            incident_type = :type,
            location = :location,
            complainant = :complainant,
            respondent = :respondent,
            description = :description,
            status = :status
        WHERE id = :id
    ");

    $stmt->execute([
        ':type' => $newType,
        ':location' => $newLocation,
        ':complainant' => $newComplainant,
        ':respondent' => $newRespondent,
        ':description' => $newDescription,
        ':status' => $newStatus,
        ':id' => $request['incident_id']
    ]);

    $newData = [
        'id' => $incident['id'],
        'date' => $incident['incident_date'],
        'time' => $incident['incident_time'],
        'type' => $newType,
        'location' => $newLocation,
        'complainant' => $newComplainant,
        'respondent' => $newRespondent,
        'description' => $newDescription,
        'status' => $newStatus,
        'recordedBy' => $incident['recorded_by'],
        'createdAt' => $incident['created_at']
    ];

    insertAuditLog(
        $pdo,
        (string) $request['incident_id'],
        'UPDATE',
        $reviewerId,
        $currentData,
        $newData
    );

    $stmt = $pdo->prepare("
        UPDATE incident_edit_requests
        SET
            status = 'Approved',
            reviewed_by = :reviewed_by,
            review_reason = :review_reason,
            reviewed_at = NOW()
        WHERE request_id = :request_id
          AND status = 'Pending'
    ");

    $stmt->execute([
        ':reviewed_by' => $reviewerId,
        ':review_reason' => $reviewReason !== ''
            ? $reviewReason
            : 'Edit request approved.',
        ':request_id' => $requestId
    ]);

    if ($stmt->rowCount() !== 1) {
        throw new RuntimeException('The edit request could not be marked as approved.');
    }

    $pdo->commit();

    sendJson(200, [
        'success' => true,
        'message' => 'Edit request approved successfully.'
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Review incident request error: ' . $e->getMessage());

    sendJson(500, [
        'success' => false,
        'message' => 'Failed to review the request. Check the server error log for details.'
    ]);
}



function incidentDataMatches(array $stored, array $current): bool
{
    $keys = [
        'id',
        'date',
        'time',
        'type',
        'location',
        'complainant',
        'respondent',
        'description',
        'status',
        'recordedBy',
        'createdAt'
    ];

    foreach ($keys as $key) {
        if (!array_key_exists($key, $stored) || !array_key_exists($key, $current)) {
            return false;
        }

        if ((string) $stored[$key] !== (string) $current[$key]) {
            return false;
        }
    }

    return true;
}

function insertAuditLog(
    PDO $pdo,
    string $incidentId,
    string $action,
    int $performedBy,
    array $oldData,
    array $newData
): void {
    $stmt = $pdo->prepare("
        INSERT INTO audit_logs
            (incident_id, action, performed_by, old_data, new_data, created_at)
        VALUES
            (:incident_id, :action, :performed_by, :old_data, :new_data, NOW())
    ");

    $stmt->execute([
        ':incident_id' => $incidentId,
        ':action' => $action,
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
}

function sendJson(int $statusCode, array $payload): void
{
    http_response_code($statusCode);

    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}
