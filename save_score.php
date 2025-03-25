<?php
include_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['score']) || !is_numeric($data['score']) ||
    !isset($data['timestamp']) || !isset($data['duration']) || !is_numeric($data['duration'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid data']);
    exit;
}

// Database credentials (replace with your actual credentials)
if($environment == 'production') {
    $dbHost = $dbHostProd;
    $dbUser = $dbUserProd;
    $dbPass = $dbPassProd;
    $dbName = $dbNameProd;
}
else{

$dbHost = $dbHostLocal; 
$dbUser = $dbUserLocal; 
$dbPass = $dbPassLocal; 
$dbName = $dbNameLocal; 
}


// Connect to the database
$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Prepare and execute the SQL query (using prepared statements for security)
$stmt = $conn->prepare("INSERT INTO scores (score, timestamp, duration) VALUES (?, ?, ?)");
$stmt->bind_param("isi", $data['score'], $data['timestamp'], $data['duration']);

if ($stmt->execute()) {
    echo json_encode(['message' => 'Score saved successfully!']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Error saving score: ' . $stmt->error]);
}

$stmt->close();
$conn->close();

?>
