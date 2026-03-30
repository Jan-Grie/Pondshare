<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your {{ $appName }} account has been created</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
        .header { background: #1a1a1a; color: #ffffff; padding: 32px 40px; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 32px 40px; color: #333333; line-height: 1.6; }
        .credentials { background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px 24px; margin: 24px 0; }
        .credentials p { margin: 4px 0; }
        .credentials .label { font-weight: bold; color: #555555; }
        .credentials .value { font-family: monospace; font-size: 15px; }
        .btn { display: inline-block; margin-top: 24px; padding: 12px 28px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { padding: 20px 40px; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>{{ $appName }}</h1>
        </div>
        <div class="body">
            <p>Hello {{ $recipientName }},</p>
            <p>An account has been created for you on <strong>{{ $appName }}</strong>. You can log in immediately with the credentials below.</p>

            <div class="credentials">
                <p><span class="label">Email:</span><br>
                   <span class="value">{{ $recipientEmail }}</span></p>
                <p style="margin-top: 12px;"><span class="label">Password:</span><br>
                   <span class="value">{{ $plainPassword }}</span></p>
            </div>

            <p>You will be prompted to change your password on first login. Please keep your credentials safe.</p>

            <a href="{{ $loginUrl }}" class="btn">Log in to {{ $appName }}</a>
        </div>
        <div class="footer">
            This email was sent automatically by {{ $appName }}. Please do not reply to this email.
        </div>
    </div>
</body>
</html>
