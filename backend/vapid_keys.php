<?php
// VAPID keys used for Web Push. Preferred loading order:
// 1) Environment variables VAPID_PUBLIC / VAPID_PRIVATE
// 2) Values set below (placeholders)
// Generate keys with: npx web-push generate-vapid-keys

$VAPID_PUBLIC = getenv('VAPID_PUBLIC') ?: 'BKD3u2Xov_Ay1KhxJZWBlq9wvgnxnLaXYI1ToPQbfvrTaGTBtsj7c12BknvY6MUlexDjCWHY1qz9HbTBTiuuBJQ';
$VAPID_PRIVATE = getenv('VAPID_PRIVATE') ?: 'yWob8f6lI_cE7NP0ic3kh13wBJxlw-3cXtRz25lGlcM';

// Optional: mailto or URL that identifies who is sending (used by some push services)
$VAPID_SUBJECT = getenv('VAPID_SUBJECT') ?: 'mailto:samuelgamboa2244@gmail.com';
