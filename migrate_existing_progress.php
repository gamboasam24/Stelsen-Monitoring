<?php
// One-time migration: Copy existing progress_progress entries to project_comments
require_once 'src/backend/db.php';

try {
    // Get all progress entries that don't have a corresponding comment
    $result = $conn->query("
        SELECT 
            pp.id as progress_id,
            pp.project_id,
            pp.user_id,
            pp.progress_percentage,
            pp.status,
            pp.notes,
            pp.evidence_photo,
            pp.location_latitude,
            pp.location_longitude,
            pp.location_accuracy,
            pp.approval_status,
            pp.created_at
        FROM project_progress pp
        LEFT JOIN project_comments pc ON pp.id = pc.progress_id
        WHERE pc.comment_id IS NULL
    ");

    $migrated = 0;
    $errors = 0;

    while ($row = $result->fetch_assoc()) {
        $stmt = $conn->prepare("
            INSERT INTO project_comments 
            (project_id, user_id, comment, comment_type, progress_percentage, progress_status, 
             evidence_photo, location_latitude, location_longitude, location_accuracy, 
             progress_id, approval_status, created_at)
            VALUES (?, ?, ?, 'progress', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->bind_param(
            "iisissdddiss",
            $row['project_id'],
            $row['user_id'],
            $row['notes'],
            $row['progress_percentage'],
            $row['status'],
            $row['evidence_photo'],
            $row['location_latitude'],
            $row['location_longitude'],
            $row['location_accuracy'],
            $row['progress_id'],
            $row['approval_status'],
            $row['created_at']
        );

        if ($stmt->execute()) {
            $migrated++;
            echo "✓ Migrated progress ID {$row['progress_id']} to comments\n";
        } else {
            $errors++;
            echo "✗ Error migrating progress ID {$row['progress_id']}: {$stmt->error}\n";
        }
        $stmt->close();
    }

    echo "\n=========================\n";
    echo "Migration Complete!\n";
    echo "Migrated: $migrated\n";
    echo "Errors: $errors\n";
    echo "=========================\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
