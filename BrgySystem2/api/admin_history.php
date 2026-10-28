<?php

header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

date_default_timezone_set('Asia/Manila');



if (
    !isset($_SESSION['logged_in']) ||
    $_SESSION['logged_in'] !== true
) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized.'
    ]);

    exit;
}


if (
    !isset($_SESSION['role']) ||
    !in_array(
        $_SESSION['role'],
        ['Barangay Captain', 'Captain'],
        true
    )
) {
    http_response_code(403);

    echo json_encode([
        'success' => false,
        'message' => 'Access denied.'
    ]);

    exit;
}



require_once __DIR__ . '/db_connect.php';

try {

    $sql = "
        SELECT
            al.id,
            al.incident_id,
            al.action,
            al.performed_by AS performed_by_id,
            COALESCE(
                a.username,
                CAST(al.performed_by AS CHAR)
            ) AS performed_by_name,
            al.old_data,
            al.new_data,
            al.created_at
        FROM audit_logs AS al
        LEFT JOIN admins AS a
            ON a.admin_id = CAST(al.performed_by AS UNSIGNED)
        ORDER BY al.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $rows = $stmt->fetchAll();

    $history = [];

    foreach ($rows as $row) {

        $performedBy = $row['performed_by_name'];
        $displayAction = $row['action'];

        $decodedNewData = json_decode(
            (string) ($row['new_data'] ?? ''),
            true
        );

        if (
            is_array($decodedNewData) &&
            ($decodedNewData['operation'] ?? '') === 'CAPTAIN_ARCHIVE'
        ) {
            $displayAction = 'ARCHIVE';
        }

        $history[] = [
            'id' => $row['id'],
            'incident_id' => $row['incident_id'],
            'action' => $displayAction,
            'performed_by_id' => $row['performed_by_id'],
            'performed_by' => $performedBy,
            'performed_by_name' => $performedBy,
            'performedBy' => $performedBy,
            'old_data' => $row['old_data'],
            'new_data' => $row['new_data'],
            'created_at' => $row['created_at']
        ];
    }

    echo json_encode([
        'success' => true,
        'history' => $history
    ], JSON_UNESCAPED_UNICODE);

    exit;

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load audit history.'
    ]);

    exit;
}