<?php
// backend/register_orphanage.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

include 'db_connect.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "You must be logged in to register an orphanage."]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $userId = intval($_SESSION['user_id']);
    $name = trim($_POST['name'] ?? '');
    $ownerName = trim($_POST['owner_name'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $childrenCount = intval($_POST['children_count'] ?? 0);
    $adultsCount = intval($_POST['adults_count'] ?? 0);
    $contactPhone = trim($_POST['contact_phone'] ?? '');
    $contactEmail = trim($_POST['contact_email'] ?? '');
    $needs = trim($_POST['needs'] ?? ''); 
    $about = trim($_POST['about'] ?? '');
    $mission = trim($_POST['mission'] ?? '');

    // Basic validation
    if (!$name || !$location || !$ownerName) {
        echo json_encode(["success" => false, "message" => "Orphanage name, owner name, and location are required."]);
        exit;
    }

    $conn->begin_transaction();

    try {
        // Corrected bind_param types
        $stmt = $conn->prepare("INSERT INTO orphanages (owner_user_id, name, owner_name, location, children_count, adults_count, contact_phone, contact_email, needs, about, mission) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);

        // Bind parameters: i=integer, s=string
        $stmt->bind_param(
            "isssiisssss",
            $userId,
            $name,
            $ownerName,
            $location,
            $childrenCount,
            $adultsCount,
            $contactPhone,
            $contactEmail,
            $needs,
            $about,
            $mission
        );

        if (!$stmt->execute()) {
            throw new Exception("Error registering orphanage: " . $stmt->error);
        }
        $stmt->close();

        // Update user status to 'is_owner'
        $stmt = $conn->prepare("UPDATE users SET is_owner = TRUE WHERE id = ?");
        if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
        $stmt->bind_param("i", $userId);
        if (!$stmt->execute()) {
            throw new Exception("Error updating user status: " . $stmt->error);
        }
        $stmt->close();

        $conn->commit();
        $_SESSION['is_owner'] = TRUE;

        echo json_encode([
            "success" => true,
            "message" => "Orphanage registered successfully! Redirecting to home page..."
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Registration failed: " . $e->getMessage()]);
    }

    $conn->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}
?>
