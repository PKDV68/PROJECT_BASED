<?php
// Handles the "Stay updated" sign-up in the footer: validates, saves to CSV, emails the contact address, then redirects back.
declare(strict_types=1);

$config = require __DIR__ . '/config.php';
require __DIR__ . '/lib/helpers.php';

// Only return to a known page, never to an address taken from the request.
$page = field('page', 60);
$back = $config['updates_pages'][$page] ?? $config['updates_pages']['index'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . $back, true, 303);
    exit;
}

// Honeypot: real visitors never see this field, bots usually fill it. Pretend it worked.
if (field('website') !== '') {
    back_to($back, ['subscribed' => 1], 'updates');
}

$email = field('email', 160);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    back_to($back, ['subscribe_error' => 'missing'], 'updates');
}

$file  = $config['updates_file'];
$isNew = !is_file($file);
$fh = @fopen($file, 'ab');
if ($fh === false || !flock($fh, LOCK_EX)) {
    back_to($back, ['subscribe_error' => 'server'], 'updates');
}
if ($isNew) {
    fputcsv($fh, ['submitted_at', 'email', 'page']);
}
fputcsv($fh, array_map('csv_safe', [date('c'), $email, $page]));
flock($fh, LOCK_UN);
fclose($fh);

// Email is best effort: the sign-up is already saved.
if ($config['contact_to'] !== '') {
    $headers = [
        'From'         => $config['mail_from'],
        'Reply-To'     => $email, // already validated, so it cannot carry extra headers
        'Content-Type' => 'text/plain; charset=utf-8',
    ];
    @mail($config['contact_to'], 'Event updates sign-up: ' . $email, "$email signed up for event updates on the website.\n", $headers);
}

back_to($back, ['subscribed' => 1], 'updates');
