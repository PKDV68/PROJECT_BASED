<?php
// Small helpers used by the form handlers.

/** Trim a posted field, drop control characters and cap its length. */
function field(string $key, int $max = 200): string
{
    $value = isset($_POST[$key]) && is_string($_POST[$key]) ? $_POST[$key] : '';
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return mb_substr(trim($value), 0, $max);
}

/** Stop spreadsheet apps from treating a cell as a formula. */
function csv_safe(string $value): string
{
    return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
}

/** Send the visitor back to the form with a status in the query string. */
function back_to(string $page, array $query, string $anchor = 'support'): void
{
    header('Location: ' . $page . '?' . http_build_query($query) . '#' . $anchor, true, 303);
    exit;
}
