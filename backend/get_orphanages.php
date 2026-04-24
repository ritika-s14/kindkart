<?php
// backend/get_orphanages.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
include 'db_connect.php';
header('Content-Type: application/json');

$response = ["success" => false, "data" => []];

$sql = "SELECT id, name, location, children_count, adults_count, needs, contact_phone, contact_email 
        FROM orphanages ORDER BY id DESC";
$res = $conn->query($sql);

if ($res) {
    if ($res->num_rows > 0) {
        $data = [];
        while ($row = $res->fetch_assoc()) {
            // Handle the 'needs' field properly
            $needs_list = array_filter(array_map('trim', explode(',', $row['needs'])));
            
            // Keep both the first item and the full list
            $row['needs_gist'] = !empty($needs_list) ? implode(', ', $needs_list) : 'No major needs listed.';
            $row['needs_list'] = $needs_list; // full list for detail view or JS use

            $data[] = $row;
        }
        $response['success'] = true;
        $response['data'] = $data;
    } else {
        $response['message'] = "No orphanages registered yet.";
    }
} else {
    $response['message'] = "Database error: " . $conn->error;
}

$conn->close();
echo json_encode($response);
?>
