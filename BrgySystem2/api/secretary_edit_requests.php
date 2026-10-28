
<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_connect.php';

if (($_SESSION['role'] ?? '') !== 'Secretary') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Secretary access only.'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);
    exit;
}

$secretaryId = (int) ($_SESSION['admin_id'] ?? 0);

if ($secretaryId <= 0) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Please log in again.'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT
            request_id,
            incident_id,
            reason,
            status,
            review_reason,
            reviewed_at
        FROM incident_edit_requests
        WHERE requested_by = :secretary_id
        ORDER BY request_id DESC
    ");

    $stmt->execute([
        ':secretary_id' => $secretaryId
    ]);

    echo json_encode([
        'success' => true,
        'requests' => $stmt->fetchAll()
    ]);

} catch (Throwable $e) {
    error_log('Secretary request status error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to load request statuses.'
    ]);
}
