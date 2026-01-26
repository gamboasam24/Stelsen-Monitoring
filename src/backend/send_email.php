<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

function sendVerificationEmail($toEmail, $verificationCode) {
    $mail = new PHPMailer(true);


try {
    // Server settings
    $mail->isSMTP();                                      // Use SMTP
    $mail->Host       = 'smtp.gmail.com';                 // Gmail SMTP server
    $mail->SMTPAuth   = true;                             // Enable SMTP authentication
    $mail->Username   = 'stelsenintegratedsysteminc@gmail.com'; // Your Gmail
    $mail->Password   = 'qkemmedlmdvdioic';              // Your Gmail app password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;  // Encryption
    $mail->Port       = 587;    

        // Recipients
        $mail->setFrom('stelsenintegratedsysteminc@gmail.com', 'Stelsen System');
        $mail->addAddress($toEmail);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'Your Verification Code';
        $mail->Body    = "Your verification code is: <b>$verificationCode</b>";

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function sendGenericEmail($toEmail, $subject, $htmlBody, $plainBody = '') {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'stelsenintegratedsysteminc@gmail.com';
        $mail->Password   = 'qkemmedlmdvdioic';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom('stelsenintegratedsysteminc@gmail.com', 'Stelsen System');
        $mail->addAddress($toEmail);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        if ($plainBody) $mail->AltBody = $plainBody;

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function sendAnnouncementNotification($toEmail, $title, $content) {
    $subject = "New Announcement: " . $title;
    $html = "<p>Hello,</p><p>A new announcement has been posted:</p><h3>" . htmlspecialchars($title) . "</h3><p>" . nl2br(htmlspecialchars($content)) . "</p><p>Please check your dashboard for details.</p>";
    $plain = "New announcement: $title\n\n" . strip_tags($content);
    return sendGenericEmail($toEmail, $subject, $html, $plain);
}

function sendProjectAssignmentNotification($toEmail, $projectTitle, $projectDesc = '') {
    $subject = "Assigned to project: " . $projectTitle;
    $html = "<p>Hello,</p><p>You have been assigned to a project:</p><h3>" . htmlspecialchars($projectTitle) . "</h3>" . ($projectDesc ? "<p>" . nl2br(htmlspecialchars($projectDesc)) . "</p>" : "") . "<p>Please check your dashboard for details.</p>";
    $plain = "You have been assigned to project: $projectTitle\n\n" . strip_tags($projectDesc);
    return sendGenericEmail($toEmail, $subject, $html, $plain);
}
?>
