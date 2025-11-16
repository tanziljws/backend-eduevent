# Konfigurasi Brevo Email Service

Panduan lengkap untuk mengkonfigurasi Brevo (formerly Sendinblue) sebagai email service provider untuk EduEvent.

## 📋 Prerequisites

1. Akun Brevo (gratis tersedia di https://www.brevo.com/)
2. Domain email yang akan digunakan sebagai pengirim (opsional untuk testing)
3. API Key dari Brevo dashboard

## 🚀 Setup Brevo Account

### 1. Buat Akun Brevo
- Kunjungi https://www.brevo.com/
- Daftar untuk mendapatkan akun gratis (300 email/hari)

### 2. Verifikasi Email Pengirim
- Login ke Brevo dashboard
- Pergi ke **Settings** > **Senders**
- Tambahkan dan verifikasi email yang akan digunakan sebagai pengirim
- Email harus diverifikasi sebelum bisa digunakan

### 3. Dapatkan API Key
- Pergi ke **Settings** > **API Keys**
- Klik **Generate a new API key**
- Beri nama untuk API key (misal: "EduEvent Production")
- **Salin API key** (hanya ditampilkan sekali!)

## ⚙️ Konfigurasi Laravel

### 1. Update File `.env`

Tambahkan konfigurasi berikut ke file `.env`:

```env
# Brevo Configuration
BREVO_API_KEY=your_brevo_api_key_here

# Mail Configuration
MAIL_MAILER=log
MAIL_FROM_ADDRESS="your-verified-email@example.com"
MAIL_FROM_NAME="EduEvent"

# Note: Pastikan email di MAIL_FROM_ADDRESS sudah diverifikasi di Brevo
```

### 2. Verifikasi Konfigurasi

Jalankan perintah berikut untuk memverifikasi konfigurasi:

```bash
php artisan tinker
```

Kemudian jalankan:

```php
$service = new App\Services\BrevoMailService();
$result = $service->testConfiguration();
print_r($result);
```

Anda akan melihat:
- ✅ `status: 'success'` jika konfigurasi valid
- ❌ `status: 'error'` dengan pesan error jika ada masalah

## 🔧 Implementasi

### BrevoMailService

Service ini sudah terintegrasi dengan baik dan menyediakan:

1. **Validasi Lengkap**
   - Validasi API key
   - Validasi email pengirim
   - Validasi email penerima
   - Validasi format OTP

2. **Error Handling yang Baik**
   - Retry logic (2x retry dengan delay 1 detik)
   - Detailed error logging
   - Specific error messages untuk berbagai kasus

3. **Features**
   - Auto-retry pada connection errors
   - Comprehensive logging
   - Email template yang responsif

### Penggunaan di Controller

Service ini sudah digunakan di:
- `Api/AuthController` - Registrasi & Reset Password
- `UserAuthController` - Web-based authentication

Contoh penggunaan:

```php
use App\Services\BrevoMailService;

try {
    $brevoService = new BrevoMailService();
    $sent = $brevoService->sendOtpEmail($user->email, $otp);
    
    if (!$sent) {
        // Handle failure (otp sudah tersimpan di DB, user bisa request resend)
        Log::warning('Failed to send OTP email');
    }
} catch (\Exception $e) {
    // Handle configuration errors
    Log::error('Brevo configuration error: ' . $e->getMessage());
}
```

## 📧 Email Template

Template email OTP tersedia di `resources/views/emails/otp.blade.php`

Template ini sudah:
- ✅ Responsive design (mobile-friendly)
- ✅ Professional styling
- ✅ Security warnings
- ✅ Clear OTP display

Anda dapat memodifikasi template sesuai kebutuhan.

## 🐛 Troubleshooting

### Error: "Brevo API key not configured"
**Solusi:**
- Pastikan `BREVO_API_KEY` sudah diset di `.env`
- Jalankan `php artisan config:clear`
- Restart server jika perlu

### Error: "MAIL_FROM_ADDRESS tidak dikonfigurasi"
**Solusi:**
- Set `MAIL_FROM_ADDRESS` di `.env`
- Pastikan email sudah diverifikasi di Brevo dashboard
- Format: `MAIL_FROM_ADDRESS="email@example.com"` (boleh dengan atau tanpa quotes)

### Error: "Brevo API key tidak valid atau tidak memiliki akses" (401)
**Solusi:**
- Periksa API key di Brevo dashboard
- Generate API key baru jika perlu
- Pastikan API key memiliki permission untuk mengirim email

### Error: "Akses ditolak. Pastikan email pengirim sudah diverifikasi di Brevo" (403)
**Solusi:**
- Login ke Brevo dashboard
- Pergi ke **Settings** > **Senders**
- Verifikasi email yang digunakan di `MAIL_FROM_ADDRESS`

### Email tidak terkirim tapi tidak ada error
**Solusi:**
- Cek log: `storage/logs/laravel.log`
- Periksa Brevo dashboard untuk status email
- Pastikan tidak melewati limit email harian (300 untuk free plan)

### Connection Timeout
**Solusi:**
- Periksa koneksi internet server
- Brevo service mungkin sedang maintenance
- Retry otomatis sudah diimplementasi (2x retry)

## 📊 Monitoring

### Log Files
Semua aktivitas email tercatat di:
- `storage/logs/laravel.log`

Cari keyword:
- `Brevo API` untuk semua aktivitas Brevo
- `OTP email sent successfully` untuk email berhasil
- `Brevo API returned error` untuk error

### Brevo Dashboard
- Login ke Brevo dashboard
- Pergi ke **Statistics** untuk melihat:
  - Jumlah email terkirim
  - Delivery rate
  - Bounce rate
  - Error logs

## 🔒 Security Best Practices

1. **Jangan commit `.env` file ke repository**
   - File ini sudah ada di `.gitignore`
   - Pastikan API key tidak terekspos

2. **Gunakan Environment Variables di Production**
   - Set langsung di server/hosting environment
   - Jangan hardcode credentials

3. **Rotasi API Key**
   - Ganti API key secara berkala
   - Segera revoke API key yang tidak digunakan

4. **Monitor Usage**
   - Pantau penggunaan email di Brevo dashboard
   - Set up alerts jika melewati threshold

## 📈 Optimasi

### Rate Limiting
Brevo free plan: 300 email/hari
- Implementasi rate limiting di aplikasi jika perlu
- Monitor usage secara berkala

### Retry Strategy
Service sudah memiliki:
- Auto-retry: 2x dengan delay 1 detik
- Connection timeout: 30 detik
- Detailed error logging

### Email Queue (Recommended untuk Production)
Untuk production, disarankan menggunakan queue:

```php
// Queue email sending
dispatch(new SendOtpEmailJob($user, $otp));
```

Ini memastikan:
- Non-blocking request
- Better error handling
- Retry mechanism via queue workers

## ✅ Testing

### Test Email Sending
```bash
php artisan tinker
```

```php
$service = new App\Services\BrevoMailService();
$result = $service->sendOtpEmail('test@example.com', '123456');
// Returns: true or false
```

### Test Configuration
```php
$service = new App\Services\BrevoMailService();
$result = $service->testConfiguration();
print_r($result);
```

## 📞 Support

Jika mengalami masalah:
1. Cek dokumentasi: https://developers.brevo.com/
2. Periksa log file: `storage/logs/laravel.log`
3. Hubungi support Brevo jika masalah terkait API

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Implementasi BrevoMailService
- ✅ Email template OTP
- ✅ Error handling lengkap
- ✅ Retry logic
- ✅ Configuration validation
- ✅ Comprehensive logging

---

**Last Updated:** November 2024
**Maintained by:** EduEvent Development Team

