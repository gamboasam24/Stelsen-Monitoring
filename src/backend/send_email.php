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
?>
