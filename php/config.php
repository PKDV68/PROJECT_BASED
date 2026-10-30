<?php
// Settings shared by every PHP handler. Change these before going live.
return [
    // Where support requests are emailed. Leave empty to only save them to storage/.
    'mail_to'   => 'contact@projectbased.de',
    // Sender for every email the site sends. Keep it on the projectbased.de domain, or mail servers may mark it as spam.
    'mail_from' => 'Project Based website <no-reply@projectbased.de>',

    // Requests are appended to this CSV file. The folder is blocked from the web by storage/.htaccess.
    'storage_file' => __DIR__ . '/storage/support-requests.csv',

    // Page the form returns to, relative to this folder.
    'return_to' => '../downloads.html',

    // Allowed values for the "How would you like to support?" choice.
    'support_types' => [
        'sponsor' => 'Sponsor',
        'mentor'  => 'Mentor or jury',
        'venue'   => 'Venue or equipment',
        'brief'   => 'Provide a brief',
        'other'   => 'Other',
    ],

    // Contact form on the field pages (fields/*.html): where messages are emailed and saved.
    'contact_to'   => 'contact@projectbased.de',
    'contact_file' => __DIR__ . '/storage/contact-messages.csv',

    // Event updates sign-up in the footer of every page: saved here, and each new sign-up is emailed to contact_to.
    'updates_file' => __DIR__ . '/storage/update-signups.csv',

    // Pages the footer sign-up may return to (value of its hidden "page" field => path from this folder).
    'updates_pages' => [
        'index'                          => '../index.html',
        'plan'                           => '../plan.html',
        'downloads'                      => '../downloads.html',
        'legal-notice'                   => '../legal-notice.html',
        'privacy'                        => '../privacy.html',
        'fields/data-ml'                 => '../fields/data-ml.html',
        'fields/product-development'     => '../fields/product-development.html',
        'fields/bio-simulation'          => '../fields/bio-simulation.html',
        'fields/research-collaborations' => '../fields/research-collaborations.html',
    ],

    // Field pages the contact form may return to (file name without .html => name used in the email).
    'contact_pages' => [
        'data-ml'                 => 'Data analysis and machine learning',
        'product-development'     => 'Product development and simulation',
        'bio-simulation'          => 'Genetics and bio simulation',
        'research-collaborations' => 'Research collaborations',
    ],
];
