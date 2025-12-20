<?php
session_start();
require_once '../config/database.php';
require_once '../includes/auth.php';

// If already logged in, redirect to dashboard
if (isLoggedIn()) {
    header('Location: ../index.php');
    exit();
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['login'])) {
        // Handle login
        $username_or_email = sanitizeInput($_POST['username_or_email']);
        $password = $_POST['password'];
        $ip_address = $_SERVER['REMOTE_ADDR'];

        if (!validateCSRFToken($_POST['csrf_token'])) {
            $error = 'Invalid request. Please try again.';
        } else {
            $result = loginUser($username_or_email, $password, $ip_address);
            if ($result['success']) {
                header('Location: ../index.php');
                exit();
            } else {
                $error = $result['message'];
            }
        }
    } elseif (isset($_POST['register'])) {
        // Handle registration
        $username = sanitizeInput($_POST['reg_username']);
        $email = sanitizeInput($_POST['reg_email']);
        $password = $_POST['reg_password'];
        $confirm_password = $_POST['reg_confirm_password'];

        if (!validateCSRFToken($_POST['csrf_token'])) {
            $error = 'Invalid request. Please try again.';
        } elseif ($password !== $confirm_password) {
            $error = 'Passwords do not match.';
        } else {
            $result = registerUser($username, $email, $password);
            if ($result['success']) {
                $success = $result['message'] . ' You can now log in.';
            } else {
                $error = $result['message'];
            }
        }
    }
}

$csrf_token = generateCSRFToken();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Initiate</title>
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/auth.css">
</head>

<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1>Initiate</h1>
                <p>D&D Campaign Tracker</p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success"><?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>

            <?php if (isset($_GET['timeout'])): ?>
                <div class="alert alert-warning">Your session has expired. Please log in again.</div>
            <?php endif; ?>

            <div class="auth-tabs">
                <button class="tab-btn active" data-tab="login">Login</button>
                <button class="tab-btn" data-tab="register">Register</button>
            </div>

            <!-- Login Form -->
            <form id="login-form" class="auth-form active" method="POST">
                <input type="hidden" name="csrf_token" value="<?php echo $csrf_token; ?>">

                <div class="form-group">
                    <label for="username_or_email">Username or Email</label>
                    <input type="text" id="username_or_email" name="username_or_email" required>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>

                <button type="submit" name="login" class="btn btn-primary">Login</button>
            </form>

            <!-- Registration Form -->
            <form id="register-form" class="auth-form" method="POST">
                <input type="hidden" name="csrf_token" value="<?php echo $csrf_token; ?>">

                <div class="form-group">
                    <label for="reg_username">Username</label>
                    <input type="text" id="reg_username" name="reg_username" required minlength="3" maxlength="50">
                </div>

                <div class="form-group">
                    <label for="reg_email">Email</label>
                    <input type="email" id="reg_email" name="reg_email" required>
                </div>

                <div class="form-group">
                    <label for="reg_password">Password</label>
                    <input type="password" id="reg_password" name="reg_password" required minlength="8">
                </div>

                <div class="form-group">
                    <label for="reg_confirm_password">Confirm Password</label>
                    <input type="password" id="reg_confirm_password" name="reg_confirm_password" required>
                </div>

                <button type="submit" name="register" class="btn btn-primary">Register</button>
            </form>
        </div>
    </div>

    <script src="../assets/js/auth.js"></script>
</body>

</html>