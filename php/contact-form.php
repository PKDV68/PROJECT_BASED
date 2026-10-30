<?php
// Handles the "Get in contact" form on the field pages: validates, saves to CSV, emails, then redirects back.
declare(strict_types=1);

$config = require __DIR__ . '/config.php';
require __DIR__ . '/lib/helpers.php';

// Only return to a known field page, never to an address taken from the request.
$page = field('page', 40);
if (!isset($config['contact_pages'][$page])) {
    $page = array_key_first($config['contact_pages']);
}
$back  = '../fields/' . $page . '.html';
$topic = $config['contact_pages'][$page];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . $back, true, 303);
    exit;
}

// Honeypot: real visitors never see this field, bots usually fill it. Pretend it worked.
if (field('website') !== '') {
    back_to($back, ['sent' => 1], 'contact');
}

$name    = field('name', 120);
$email   = field('email', 160);
$message = field('message', 3000);
$consent = field('consent', 1) === '1';

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $message === '') {
    back_to($back, ['error' => 'missing'], 'contact');
}
if (!$consent) {
    back_to($back, ['error' => 'consent'], 'contact');
}

$file  = $config['contact_file'];
$isNew = !is_file($file);
$fh = @fopen($file, 'ab');
if ($fh === false || !flock($fh, LOCK_EX)) {
    back_to($back, ['error' => 'server'], 'contact');
}
if ($isNew) {
    fputcsv($fh, ['submitted_at', 'field', 'name', 'email', 'message']);
}
fputcsv($fh, array_map('csv_safe', [date('c'), $topic, $name, $email, $message]));
flock($fh, LOCK_UN);
fclose($fh);

// Email is best effort: the message is already saved.
if ($config['contact_to'] !== '') {
    $headers = [
        'From'         => $config['mail_from'],
        'Reply-To'     => $email, // already validated, so it cannot carry extra headers
        'Content-Type' => 'text/plain; charset=utf-8',
    ];
    @mail($config['contact_to'], 'Contact: ' . $topic . ' from ' . $name, "Field: $topic\nName: $name\nEmail: $email\n\n$message\n", $headers);
}

back_to($back, ['sent' => 1], 'contact');
