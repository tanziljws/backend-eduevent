# Troubleshooting Admin Login Issues

## Masalah: Error 500 pada Login / Error 403 pada Dashboard

### Analisa Masalah

Error ini biasanya terjadi karena:

1. **Tabel `admins` belum ada di database** (migration belum dijalankan)
2. **Admin user belum dibuat** (seeder belum dijalankan)
3. **Token yang tersimpan adalah token User, bukan Admin**
4. **Token expired atau invalid**

### Solusi

#### 1. Pastikan Migration dan Seeder Sudah Dijalankan

Migration dan seeder akan otomatis dijalankan saat build di Railway melalui `nixpacks.toml`:

```toml
[phases.build]
cmds = [
  ...
  "php artisan migrate --force || true",
  "php artisan db:seed --class=AdminSeeder || true",
  ...
]
```

**Jika migration belum dijalankan**, jalankan secara manual di Railway console:

```bash
php artisan migrate --force
php artisan db:seed --class=AdminSeeder
```

#### 2. Verifikasi Tabel Admins Ada

Jalankan di Railway console atau database client:

```sql
SHOW TABLES LIKE 'admins';
```

Jika tidak ada, jalankan migration:

```bash
php artisan migrate --force
```

#### 3. Verifikasi Admin User Ada

Jalankan di Railway console:

```bash
php artisan tinker
```

Kemudian:

```php
use App\Models\Admin;
Admin::all();
```

Jika kosong, jalankan seeder:

```bash
php artisan db:seed --class=AdminSeeder
```

**Admin default:**
- Email: `admin@smkn4bogor.sch.id`
- Password: `admin123`

#### 4. Clear Token yang Salah

Jika masih error 403, kemungkinan token yang tersimpan adalah token User (bukan Admin).

**Di browser console:**

```javascript
// Clear semua auth data
localStorage.clear();
sessionStorage.clear();

// Atau clear secara spesifik
localStorage.removeItem('auth_token');
localStorage.removeItem('token');
localStorage.removeItem('user');
```

Kemudian:
1. Refresh halaman
2. Login ulang dengan admin credentials
3. Pastikan menggunakan email admin, bukan email user

#### 5. Cek Log Railway

Di Railway dashboard, buka tab "Logs" dan cari:

```
[ERROR] Admin login error
[WARNING] Admin route accessed with non-admin token
[ERROR] Admin middleware: admins table does not exist
```

Log akan menunjukkan:
- Apakah tabel `admins` ada
- Apakah admin user ditemukan
- Apakah token dibuat dengan benar
- Apakah `tokenable_type` adalah `App\Models\Admin` atau `App\Models\User`

#### 6. Debug Mode

Jika `APP_DEBUG=true` di Railway environment variables, response error akan berisi:
- Error message detail
- Stack trace
- Debug info (token type, expected type, dll)

**Untuk enable debug mode** di Railway:
1. Buka project di Railway
2. Buka tab "Variables"
3. Tambah/edit: `APP_DEBUG=true`
4. Redeploy

⚠️ **PERINGATAN:** Jangan enable `APP_DEBUG=true` di production! Hanya untuk troubleshooting.

### Cara Cek Token Type

Di browser console, setelah login:

```javascript
const token = localStorage.getItem('auth_token');
console.log('Token:', token);

// Cek response login (di Network tab browser)
// Pastikan response.user.role === 'admin'
```

Di Railway console (jika punya akses database):

```sql
SELECT 
  id, 
  tokenable_type, 
  tokenable_id, 
  name, 
  created_at 
FROM personal_access_tokens 
ORDER BY created_at DESC 
LIMIT 5;
```

Pastikan `tokenable_type` adalah `App\Models\Admin` untuk admin tokens.

### Troubleshooting Step-by-Step

1. ✅ **Cek apakah tabel `admins` ada**
   ```bash
   php artisan migrate:status
   ```
   Pastikan `2025_11_10_054059_create_admins_table` statusnya "Ran"

2. ✅ **Cek apakah admin user ada**
   ```bash
   php artisan tinker
   ```
   ```php
   \App\Models\Admin::count();
   ```
   Harus return > 0

3. ✅ **Clear browser storage**
   ```javascript
   localStorage.clear();
   ```

4. ✅ **Login dengan admin credentials**
   - Email: `admin@smkn4bogor.sch.id`
   - Password: `admin123`

5. ✅ **Cek Network tab di browser**
   - Request ke `/api/auth/admin/login` harus return 200
   - Response harus berisi `token` dan `user.role === 'admin'`

6. ✅ **Cek request ke `/api/admin/dashboard`**
   - Request header harus ada `Authorization: Bearer <token>`
   - Response harus 200 (bukan 403)

### Jika Masih Error

1. **Cek Railway logs** untuk error details
2. **Pastikan `APP_DEBUG=true`** untuk melihat error message lengkap
3. **Verify database connection** dan credentials di Railway
4. **Cek apakah migration dan seeder berhasil** di build logs

### Contact

Jika masalah masih berlanjut setelah mengikuti langkah-langkah di atas, berikan:
- Railway build logs (khususnya bagian migration/seeder)
- Railway runtime logs (error saat login)
- Browser console errors
- Network tab requests/responses

