<?php
// backend/db_connect.php
$servername = "localhost";
$username = "root";
$password = "root"; // CHANGE THIS TO YOUR ACTUAL DB PASSWORD
$dbname = "kindkart"; 
$port = 8889;
$conn = new mysqli($servername, $username, $password, $dbname, $port);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>