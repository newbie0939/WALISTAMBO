<?php

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/db_connect.php';



$data = json_decode(
    file_get_contents('php://input'),
    true
);

$username = trim(
    $data['username'] ?? ''
);

$password = $data['password'] ?? '';



if (
    $username === '' ||
    $password === ''
) {

    echo json_encode([
        'success' => false,
        'message' =>
            'Username and password are required.'
    ]);

    exit;
}



$stmt = $pdo->prepare("
    SELECT
        admin_id,
        username,
        password,
        role
    FROM admins
    WHERE username = :username
    LIMIT 1
");

$stmt->execute([
    ':username' => $username
]);

$admin = $stmt->fetch();


if (
    !$admin ||
    !password_verify(
        $password,
        $admin['password']
    )
) {

    echo json_encode([
        'success' => false,
        'message' =>
            'Invalid username or password.'
    ]);

    exit;
}




if (
    !in_array(
        $admin['role'],
        [
            'Secretary',
            'Barangay Captain',
            'Captain'
        ],
        true
    )
) {

    echo json_encode([
        'success' => false,
        'message' =>
            'This account is not authorized to access the system.'
    ]);

    exit;
}



session_regenerate_id(true);




$_SESSION['logged_in'] = true;

$_SESSION['admin_id'] =
    (int) $admin['admin_id'];

$_SESSION['username'] =
    $admin['username'];

$_SESSION['role'] =
    $admin['role'];



if ($admin['role'] === 'Secretary') {

    $redirect =
        'index.php';

} else {

    $redirect =
        'admin/dashboard.php';

}



echo json_encode([
    'success' => true,

    'admin_id' =>
        (int) $admin['admin_id'],

    'username' =>
        $admin['username'],

    'role' =>
        $admin['role'],

    'redirect' =>
        $redirect
]);

exit;