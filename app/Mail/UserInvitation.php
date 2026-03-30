<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $recipientName,
        public readonly string $recipientEmail,
        public readonly string $plainPassword,
        public readonly string $loginUrl,
        public readonly string $appName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your {$this->appName} account has been created",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.user-invitation',
        );
    }
}
