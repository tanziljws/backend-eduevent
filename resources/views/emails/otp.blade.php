<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP Verifikasi</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .otp-box {
            background-color: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #1e40af;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        .otp-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 10px;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-text {
            font-size: 14px;
            color: #92400e;
            margin: 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .otp-code {
                font-size: 24px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">EduEvent</div>
            <h1 style="color: #1e293b; margin: 10px 0;">Kode OTP Verifikasi</h1>
        </div>

        <p style="color: #475569; font-size: 16px;">
            Terima kasih telah menggunakan layanan kami. Untuk menyelesaikan proses verifikasi akun Anda, 
            silakan masukkan kode OTP berikut:
        </p>

        <div class="otp-box">
            <div class="otp-label">KODE OTP ANDA</div>
            <div class="otp-code">{{ $otp }}</div>
            <div class="otp-label" style="margin-top: 15px;">
                Berlaku selama <strong>10 menit</strong>
            </div>
        </div>

        <div class="warning">
            <p class="warning-text">
                <strong>⚠️ Peringatan Keamanan:</strong><br>
                Jangan bagikan kode OTP ini kepada siapa pun. Tim kami tidak akan pernah meminta kode OTP Anda melalui telepon, email, atau media lainnya.
            </p>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            Jika Anda tidak meminta kode ini, abaikan email ini atau hubungi tim support jika Anda merasa ada aktivitas mencurigakan.
        </p>

        <div class="footer">
            <p style="margin: 5px 0;">
                Email ini dikirim secara otomatis, mohon jangan membalas email ini.
            </p>
            <p style="margin: 5px 0;">
                © {{ date('Y') }} EduEvent. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>

