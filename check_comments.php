<?php
require_once 'src/backend/db.php';

$result = $conn->query("SELECT comment_id, comment, email FROM project_comments LIMIT 10");
$comments = [];
while ($row = $result->fetch_assoc()) {
    $comments[] = $row;
}

echo "<pre>";
print_r($comments);
echo "</pre>";
?>
