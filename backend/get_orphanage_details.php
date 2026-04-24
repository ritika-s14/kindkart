<?php
// backend/get_orphanage_details.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
include 'db_connect.php';
header('Content-Type: application/json');

if (!isset($_GET['id'])) {
    echo json_encode(["success" => false, "message" => "Orphanage ID not provided."]);
    exit;
}

$orphanageId = intval($_GET['id']);
$stmt = $conn->prepare("SELECT id, name, location, children_count, adults_count, needs, about, mission, contact_phone, contact_email FROM orphanages WHERE id = ?");
$stmt->bind_param("i", $orphanageId);
$stmt->execute();
$res = $stmt->get_result();

if ($res && $res->num_rows > 0) {
    $row = $res->fetch_assoc();
    $needsArr = [];
    if (!empty($row['needs'])) {
        $needsArr = array_filter(array_map('trim', explode(',', $row['needs'])));
    }
    $row['needs'] = $needsArr;
    echo json_encode(["success" => true, "data" => $row]);
} else {
    echo json_encode(["success" => false, "message" => "Orphanage not found."]);
}

$stmt->close();
$conn->close();
?>
