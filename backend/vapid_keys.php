<?php
// VAPID keys used for Web Push. Preferred loading order:
// 1) Environment variables VAPID_PUBLIC / VAPID_PRIVATE
// 2) Values set below (placeholders)
// Generate keys with: npx web-push generate-vapid-keys

$VAPID_PUBLIC = getenv('VAPID_PUBLIC') ?: 'REPLACE_WITH_YOUR_PUBLIC_KEY_BASE64_URL_SAFE';
$VAPID_PRIVATE = getenv('VAPID_PRIVATE') ?: 'REPLACE_WITH_YOUR_PRIVATE_KEY_BASE64_URL_SAFE';

// Optional: mailto or URL that identifies who is sending (used by some push services)
$VAPID_SUBJECT = getenv('VAPID_SUBJECT') ?: 'mailto:admin@example.com';
