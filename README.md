# EduEvent - Event Management System

Laravel + React monorepo untuk sistem manajemen event dan sertifikat.

## 🏗️ Struktur Project

### **Backend (Laravel)**
- API endpoints di `/api/*`
- Web routes untuk legacy CMS (opsional)
- Frontend React di-build ke `public/` folder

### **Frontend (React)**
- Source code: `resources/frontend/`
- Build output: `public/` (dihasilkan saat build)

## 🚀 Installation

### **1. Install Backend Dependencies**

```bash
composer install
```

### **2. Install Frontend Dependencies**

```bash
cd resources/frontend
npm install
cd ../..
```

### **3. Environment Setup**

```bash
cp .env.example .env
php artisan key:generate
```

### **4. Configure Database**

Edit `.env` file:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eduevent
DB_USERNAME=root
DB_PASSWORD=your_password
```

### **5. Configure Email (Brevo)**

Edit `.env` file:
```env
MAIL_MAILER=brevo
MAIL_FROM_ADDRESS="your-verified-email@example.com"
MAIL_FROM_NAME="EduEvent"
BREVO_API_KEY=your-brevo-api-key
```

### **6. Run Migrations**

```bash
php artisan migrate --seed
```

### **7. Setup Storage**

```bash
php artisan storage:link
```

### **8. Build Frontend**

```bash
cd resources/frontend
npm run build
cd ../..
```

Ini akan meng-copy build files ke `public/` folder.

### **9. Start Server**

```bash
php artisan serve
```

Aplikasi akan tersedia di `http://localhost:8000`

## 📦 Development

### **Backend Development**

```bash
php artisan serve
```

### **Frontend Development**

Untuk development mode dengan hot reload:

```bash
cd resources/frontend
npm start
```

Frontend akan berjalan di `http://localhost:3000` dan akan proxy API requests ke `http://localhost:8000/api`

### **Build Frontend for Production**

```bash
cd resources/frontend
npm run build
cd ../..
```

Build files akan otomatis di-copy ke `public/` folder.

## 🗄️ Database

### **Tables**
- `users` - User accounts
- `events` - Events
- `registrations` - Event registrations
- `attendances` - Attendance records
- `certificates` - Certificates
- `payments` - Payments
- `banners` - Banners
- `wishlists` - Wishlists

## 📡 API Routes

### **Public Routes**
- `GET /api/events` - List events
- `GET /api/events/{id}` - Event detail
- `GET /api/banners` - List banners
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/request-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### **Protected Routes (User)**
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/events/{id}/register` - Register for event
- `POST /api/events/{id}/attendance` - Submit attendance
- `GET /api/me/history` - Get event history
- `GET /api/me/certificates` - Get certificates
- `GET /api/wishlist` - Get wishlist
- `POST /api/events/{id}/wishlist` - Toggle wishlist

### **Admin Routes**
- `GET /api/admin/dashboard` - Dashboard stats
- `POST /api/admin/events` - Create event
- `PUT /api/admin/events/{id}` - Update event
- `DELETE /api/admin/events/{id}` - Delete event
- `POST /api/admin/banners` - Create banner
- Dan lainnya...

## 🔧 Configuration

### **API Base URL**

Frontend menggunakan relative path `/api` karena sekarang di-serve dari domain yang sama dengan backend. Ini menghilangkan masalah CORS.

Untuk development dengan hot reload, frontend akan proxy ke `http://localhost:8000/api`.

### **CORS**

CORS sudah dikonfigurasi di `config/cors.php` untuk allow origins:
- Local development: `http://localhost:3000`, `http://127.0.0.1:3000`
- Production: Railway subdomains (auto-detect)

## 🚀 Deployment

### **Railway Deployment**

1. Connect repository ke Railway
2. Set environment variables di Railway:
   - Database credentials
   - `BREVO_API_KEY`
   - `MAIL_FROM_ADDRESS`
   - `MAIL_FROM_NAME`
   - `APP_URL` (Railway public domain)
   - `FRONTEND_URL` (opsional, untuk CORS)
   - `REACT_APP_MIDTRANS_CLIENT_KEY` (untuk payment gateway - **WAJIB dengan prefix REACT_APP_** agar tersedia di React build)
   - `MIDTRANS_SERVER_KEY` (opsional, untuk backend)
   - `MIDTRANS_IS_PRODUCTION=false` (untuk sandbox mode)
   
   **Catatan:** Karena ini monorepo, semua environment variable di-set di Railway Variables (satu tempat). Variable dengan prefix `REACT_APP_` akan otomatis tersedia saat React build di Railway.

3. **Build Command untuk Railway (di Settings → Deploy):**
   ```bash
   composer install --optimize-autoloader --no-dev && cd resources/frontend && npm install && npm run build && cd ../..
   ```

4. **Start Command:**
   ```bash
   php artisan serve --host=0.0.0.0 --port=$PORT
   ```

5. **Alternatif: Gunakan Nixpacks (Recommended)**
   - Railway akan otomatis detect `nixpacks.toml`
   - File sudah dikonfigurasi untuk build frontend otomatis
   - Pastikan Node.js 18+ dan PHP 8.2+ tersedia

**Catatan:** Railway menggunakan file `nixpacks.toml` atau `railway.json` untuk konfigurasi build. Jika tidak menggunakan Nixpacks, set manual Build Command di Railway Settings.

### **Manual Deployment**

1. Clone repository
2. Install dependencies:
   ```bash
   composer install --optimize-autoloader --no-dev
   cd resources/frontend && npm install && npm run build && cd ../..
   ```
3. Setup environment variables
4. Run migrations: `php artisan migrate --force`
5. Optimize: `php artisan config:cache && php artisan route:cache`
6. Setup web server (Nginx/Apache) atau gunakan `php artisan serve`

## 📝 Notes

- Frontend dan backend sekarang dalam satu repository (monorepo)
- Frontend di-build ke `public/` folder dan di-serve sebagai static files
- API routes tetap di `/api/*`
- Tidak perlu environment variable `REACT_APP_API_URL` karena menggunakan relative path
- CORS issues sudah terselesaikan karena frontend dan backend di domain yang sama

## 📄 License

MIT License
