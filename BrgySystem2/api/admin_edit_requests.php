<?php

header('Content-Type: application/json');

date_default_timezone_set('Asia/Manila');

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_connect.php';



if (
    !isset($_SESSION['admin_id']) ||
    !isset($_SESSION['username'])
) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized.'
    ]);

    exit;
}




$method = $_SERVER['REQUEST_METHOD'];




if ($method === 'GET') {

    try {

        $stmt = $pdo->query("
            SELECT
                r.request_id,
                r.incident_id,
                r.requested_by,
                r.reason,
                r.old_data,
                r.proposed_data,
                r.status,
                r.reviewed_by,
                r.review_reason,
                r.requested_at,
                r.reviewed_at,

                requester.username AS requested_by_username,

                reviewer.username AS reviewed_by_username

            FROM incident_edit_requests r

            LEFT JOIN admins requester
                ON requester.admin_id = r.requested_by

            LEFT JOIN admins reviewer
                ON reviewer.admin_id = r.reviewed_by

            ORDER BY
                CASE
                    WHEN r.status = 'Pending' THEN 1
                    WHEN r.status = 'Approved' THEN 2
                    WHEN r.status = 'Rejected' THEN 3
                    ELSE 4
                END,
                r.requested_at DESC
        ");


        $requests = $stmt->fetchAll();


        foreach ($requests as &$request) {

            $request['old_data'] =
                json_decode(
                    $request['old_data'],
                    true
                );

            $request['proposed_data'] =
                json_decode(
                    $request['proposed_data'],
                    true
                );

        }

        unset($request);


        echo json_encode([
            'success' => true,
            'requests' => $requests
        ]);

        exit;


    } catch (PDOException $e) {

        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' => 'Failed to load edit requests.'
        ]);

        exit;
    }
}


http_response_code(405);

echo json_encode([
    'success' => false,
    'message' => 'Method not allowed.'
]);

exit;