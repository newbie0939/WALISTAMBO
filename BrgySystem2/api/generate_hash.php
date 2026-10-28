<?php

$hash = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    if ($password !== '') {
        $hash = password_hash($password, PASSWORD_DEFAULT);
    }
}
?>
<!DOCTYPE html>
<html>
<head><title>Password Hash Generator</title></head>
<body style="font-family: sans-serif; max-width: 500px; margin: 60px auto;">
    <h2>Generate Password Hash</h2>
    <form method="POST">
        <input type="text" name="password" placeholder="Type the password" style="width:100%; padding:8px;" required>
        <button type="submit" style="margin-top:10px; padding:8px 16px;">Generate</button>
    </form>

    <?php if ($hash): ?>
        <h3>Copy this into the admins table's "password" column:</h3>
        <textarea readonly style="width:100%; height:60px;"><?= htmlspecialchars($hash) ?></textarea>
    <?php endif; ?>

    <p style="color:#b91c1c; margin-top:30px;">
        
    </p>
</body>
</html>