<?php
// Handles the support form on downloads.html: validates, saves to CSV, optionally emails, then redirects back.
declare(strict_types=1);

$config = require __DIR__ . '/config.php';
require __DIR__ . '/lib/helpers.php';

$back = $config['return_to'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . $back, true, 303);
    exit;
}

// Honeypot: real visitors never see this field, bots usually fill it. Pretend it worked.
if (field('website') !== '') {
    back_to($back, ['sent' => 1]);
}

$name         = field('name', 120);
$email        = field('email', 160);
$organisation = field('organisation', 160);
$type         = field('support_type', 20);
$message      = field('message', 3000);
$consent      = field('consent', 1) === '1';

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !isset($config['support_types'][$type])) {
    back_to($back, ['error' => 'missing']);
}
if (!$consent) {
    back_to($back, ['error' => 'consent']);
}

$row = [date('c'), $name, $email, $organisation, $config['support_types'][$type], $message];

// Append to the CSV, writing a header row the first time.
$file  = $config['storage_file'];
$isNew = !is_file($file);
$fh = @fopen($file, 'ab');
if ($fh === false || !flock($fh, LOCK_EX)) {
    back_to($back, ['error' => 'server']);
}
if ($isNew) {
    fputcsv($fh, ['submitted_at', 'name', 'email', 'organisation', 'support_type', 'message']);
}
fputcsv($fh, array_map('csv_safe', $row));
flock($fh, LOCK_UN);
fclose($fh);

// Email is best effort: the request is already saved.
if ($config['mail_to'] !== '') {
    $subject = 'Support request: ' . $config['support_types'][$type] . ' from ' . $name;
    $body = "Name: $name\nEmail: $email\nOrganisation: $organisation\nSupport: {$config['support_types'][$type]}\n\n$message\n";
    $headers = [
        'From'         => $config['mail_from'],
        'Reply-To'     => $email, // already validated, so it cannot carry extra headers
        'Content-Type' => 'text/plain; charset=utf-8',
    ];
    @mail($config['mail_to'], $subject, $body, $headers);
}

back_to($back, ['sent' => 1]);
