<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konfirmasi Registrasi Event</title>
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
        .success-badge {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .event-info {
            background-color: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .event-info h3 {
            margin: 0 0 15px 0;
            color: #1e40af;
            font-size: 18px;
        }
        .info-row {
            display: flex;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .info-label {
            font-weight: 600;
            color: #475569;
            min-width: 100px;
        }
        .info-value {
            color: #1e293b;
        }
        .token-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
            color: #ffffff;
        }
        .token-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        .token-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .token-note {
            font-size: 13px;
            opacity: 0.9;
            margin-top: 15px;
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
        .instruction-box {
            background-color: #eff6ff;
            border: 2px dashed #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .instruction-box h4 {
            margin: 0 0 15px 0;
            color: #1e40af;
            font-size: 16px;
        }
        .instruction-box ol {
            margin: 0;
            padding-left: 20px;
            color: #1e293b;
        }
        .instruction-box li {
            margin-bottom: 8px;
            font-size: 14px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .token-code {
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
            <div class="success-badge">✓ Registrasi Berhasil</div>
            <h1 style="color: #1e293b; margin: 10px 0;">Konfirmasi Registrasi Event</h1>
        </div>

        <p style="color: #475569; font-size: 16px;">
            Halo <strong>{{ $user_name ?? 'Peserta' }}</strong>,
        </p>

        <p style="color: #475569; font-size: 16px;">
            Terima kasih telah mendaftar pada event kami. Pendaftaran Anda telah berhasil dikonfirmasi!
        </p>

        <div class="event-info">
            <h3>📅 Detail Event</h3>
            <div class="info-row">
                <span class="info-label">Nama Event:</span>
                <span class="info-value"><strong>{{ $event_title ?? 'N/A' }}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">Tanggal:</span>
                <span class="info-value">{{ $event_date ?? 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Waktu:</span>
                <span class="info-value">{{ $event_time ?? 'N/A' }} WIB</span>
            </div>
            <div class="info-row">
                <span class="info-label">Lokasi:</span>
                <span class="info-value">{{ $event_location ?? 'N/A' }}</span>
            </div>
        </div>

        <div class="token-box">
            <div class="token-label">TOKEN KEHADIRAN ANDA</div>
            <div class="token-code">{{ $attendance_token ?? 'N/A' }}</div>
            <div class="token-note">
                Simpan token ini dengan aman! Token ini akan digunakan saat absensi di hari event.
            </div>
        </div>

        <div class="instruction-box">
            <h4>📝 Cara Menggunakan Token:</h4>
            <ol>
                <li>Buka halaman absensi event pada hari kegiatan</li>
                <li>Masukkan token <strong>{{ $attendance_token ?? 'N/A' }}</strong> di form absensi</li>
                <li>Klik tombol "Catat Kehadiran" untuk menyelesaikan absensi</li>
                <li>Setelah absensi berhasil, sertifikat akan tersedia untuk diunduh</li>
            </ol>
        </div>

        <div class="warning">
            <p class="warning-text">
                <strong>⚠️ Penting:</strong><br>
                • Token ini bersifat pribadi dan tidak boleh dibagikan kepada siapa pun<br>
                • Token dapat digunakan untuk absensi mulai 30 menit sebelum event dimulai<br>
                • Pastikan Anda hadir tepat waktu sesuai jadwal event
            </p>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            Jika Anda memiliki pertanyaan atau membutuhkan bantuan, silakan hubungi tim support kami.
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

