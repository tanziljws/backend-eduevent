# EduEvent Backend API

Laravel backend API untuk sistem EduEvent.

## 🏗️ Struktur Backend

### **Fitur Utama**
- ✅ **Authentication System**
  - User authentication dengan OTP email
  - Admin authentication
  - Petugas authentication
  - Password reset dengan OTP

- ✅ **Content Management**
  - Posts (Berita/Artikel)
  - Kategori
  - Galeri
  - Foto
  - Profile Sekolah
  - Testimoni

- ✅ **User Features**
  - Like galeri
  - Bookmark galeri
  - Comment galeri
  - Download foto
  - User profile management

- ✅ **Admin Features**
  - Dashboard dengan statistik
  - CRUD Posts
  - CRUD Kategori
  - CRUD Galeri
  - CRUD Foto
  - CRUD Petugas
  - Manage Testimoni
  - Edit Profile Sekolah

- ✅ **Petugas Features**
  - Dashboard dengan statistik terbatas
  - CRUD Posts
  - CRUD Galeri
  - CRUD Foto

## 🚀 Installation

### **1. Install Dependencies**

```bash
composer install
```

### **2. Environment Setup**

```bash
cp .env.example .env
php artisan key:generate
```

### **3. Configure Database**

Edit `.env` file:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eduevent
DB_USERNAME=root
DB_PASSWORD=your_password
```

### **4. Run Migrations**

```bash
php artisan migrate --seed
```

### **5. Configure Email (Brevo)**

Edit `.env` file:
```env
MAIL_MAILER=brevo
MAIL_FROM_ADDRESS="your-verified-email@example.com"
MAIL_FROM_NAME="EduEvent"
BREVO_API_KEY=your-brevo-api-key
```

### **6. Storage Setup**

```bash
php artisan storage:link
```

### **7. Start Server**

```bash
php artisan serve
```

## 📡 API Routes

### **Guest Routes (Public)**
- `GET /` - Home page
- `GET /profil` - Profile sekolah
- `GET /agenda` - List agenda
- `GET /agenda/{post}` - Detail agenda
- `GET /informasi` - List informasi
- `GET /informasi/{post}` - Detail informasi
- `GET /galeri` - List galeri
- `GET /galeri/{galery}` - Detail galeri

### **User Routes (Authenticated)**
- `POST /galleries/{galery}/like` - Like/unlike galeri
- `POST /galleries/{galery}/bookmark` - Bookmark/unbookmark galeri
- `POST /galleries/{galery}/comments` - Add comment
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile

### **Admin Routes (Protected)**
- `GET /admin` - Dashboard
- Resource routes for: posts, kategori, galery, foto, petugas, profile, testimonials

### **Petugas Routes (Protected)**
- `GET /petugas` - Dashboard
- Resource routes for: posts, galery, foto

## 🗄️ Database

### **Tables**
- `users` - User accounts
- `admins` - Admin accounts
- `petugas` - Petugas accounts
- `posts` - Posts/Artikel
- `kategori` - Kategori posts
- `galery` - Galeri foto
- `foto` - Foto dalam galeri
- `profile` - Profile sekolah
- `testimonials` - Testimoni
- `likes` - User likes
- `bookmarks` - User bookmarks
- `comments` - User comments
- `downloads` - Download tracking

## 🔧 Configuration

### **Mail Configuration**
- Default: Brevo API
- Alternative: SMTP, Resend, Postmark

### **Storage Configuration**
- Local storage: `storage/app/public`
- Public storage: `public/storage` (symlink)

## 📝 Models

### **Main Models**
- `User`, `Admin`, `Petugas`
- `Post`, `Kategori`, `Galery`, `Foto`
- `Profile`, `Testimonial`
- `Like`, `Bookmark`, `Comment`, `Download`

## 🧪 Testing

```bash
php artisan test
```

## 📦 Services

### **BrevoMailService**
- Send OTP emails via Brevo API
- Handle email verification
- Error handling and logging

## 🔒 Security

### **Authentication Guards**
- `user` - User authentication
- `admin` - Admin authentication
- `petugas` - Petugas authentication

### **HTTPS**
- Force HTTPS in production
- Secure cookies enabled
- Trust proxies for Railway/Heroku

## 🚀 Deployment

### **Production Setup**
1. Set `APP_ENV=production`
2. Set `APP_DEBUG=false`
3. Set `APP_URL=https://your-domain.com`
4. Configure database
5. Configure email service
6. Run migrations
7. Set up storage symlink
8. Clear cache: `php artisan config:clear`

## 📄 License

MIT License

