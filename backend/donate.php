<?php
// backend/donate.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
include 'db_connect.php';
header('Content-Type: text/plain');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        echo "Please login to donate.";
        exit;
    }

    $user_id = intval($_SESSION['user_id']);
    $orphanage_id = intval($_POST['orphanage_id'] ?? 0);
    $amount = round(floatval($_POST['amount'] ?? 0), 2); 
    
    // --- SIMULATION LOGIC ---
    if ($amount <= 0) {
        echo "Invalid donation amount. Please enter a positive value in INR.";
        exit;
    }
    
    // Generate a simulated transaction ID
    $transaction_id = "KK_TXN_" . time() . rand(100, 999);
    $status = "Completed"; 
    // ------------------------

    $stmt = $conn->prepare("INSERT INTO donations (user_id, orphanage_id, amount, transaction_id, status) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("iidsi", $user_id, $orphanage_id, $amount, $transaction_id, $status);

    if ($stmt->execute()) {
        // Success message for the popup from the orphanage's end
        echo "Thank you for your generous contribution! Your donation of INR " . number_format($amount, 2) . " has been successfully processed.";
    } else {
        echo "Error recording donation: " . $stmt->error;
    }
    $stmt->close();
    $conn->close();
} else {
    echo "Invalid request method.";
}
?>