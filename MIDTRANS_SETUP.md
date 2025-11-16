# Midtrans Payment Gateway Setup

## 📋 Overview

Midtrans Snap digunakan untuk payment gateway untuk event berbayar. Environment variable harus dikonfigurasi dengan benar agar payment gateway berfungsi.

## 🔧 Environment Variables

### **Untuk Development (Local)**

Buat file `.env` di root project (sama dengan Laravel .env), tambahkan:

```env
# Midtrans Configuration (untuk frontend React)
REACT_APP_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx

# Optional: Untuk backend (jika diperlukan)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

**Catatan:** Variable dengan prefix `REACT_APP_` akan di-inject ke React build saat `npm run build`.

### **Untuk Production (Railway)**

Di Railway Dashboard, set environment variable berikut:

1. **Buka Railway Dashboard** → Pilih project → **Variables** tab
2. **Tambah variable:**
   - Key: `REACT_APP_MIDTRANS_CLIENT_KEY`
   - Value: Client key dari Midtrans dashboard
   - Example: `SB-Mid-client-xxxxxxxxxxxx` (Sandbox) atau `Mid-client-xxxxxxxxxxxx` (Production)

3. **Optional - Backend variables (jika diperlukan):**
   - `MIDTRANS_SERVER_KEY`: Server key dari Midtrans
   - `MIDTRANS_IS_PRODUCTION`: `true` untuk production, `false` untuk sandbox

## ⚠️ Important Notes

### **1. Prefix `REACT_APP_` Required**

Create React App hanya membaca environment variable yang dimulai dengan `REACT_APP_`. Variable lain akan diabaikan untuk security reasons.

### **2. Build Time vs Runtime**

- Environment variable di-inject saat **build time** (`npm run build`)
- Setelah build, variable sudah di-bundle ke JavaScript files
- Jika mengubah variable di Railway, **harus rebuild** aplikasi

### **3. Railway Deployment**

Railway akan otomatis:
1. Membaca environment variables dari Railway dashboard
2. Meng-inject ke build process saat `npm run build` dijalankan
3. Variable `REACT_APP_MIDTRANS_CLIENT_KEY` akan tersedia di `process.env.REACT_APP_MIDTRANS_CLIENT_KEY`

## 🔍 Testing

### **1. Check Environment Variable di Browser Console**

Setelah build dan deploy, buka browser console di halaman event berbayar:

```javascript
console.log(process.env.REACT_APP_MIDTRANS_CLIENT_KEY);
```

Harus menampilkan client key (tidak `undefined`).

### **2. Check Midtrans Snap Loading**

Di browser console, cek apakah `window.snap` tersedia:

```javascript
console.log(window.snap);
```

Jika `undefined`, berarti script Midtrans belum load. Cek:
- Apakah `REACT_APP_MIDTRANS_CLIENT_KEY` sudah di-set di Railway?
- Apakah sudah rebuild setelah set variable?
- Apakah ada error di Network tab untuk script Midtrans?

## 🚀 Quick Setup Checklist

- [ ] Dapatkan Midtrans Client Key dari dashboard Midtrans
- [ ] Set `REACT_APP_MIDTRANS_CLIENT_KEY` di Railway Variables
- [ ] Set `MIDTRANS_SERVER_KEY` di Railway Variables (jika diperlukan)
- [ ] Set `MIDTRANS_IS_PRODUCTION=false` untuk sandbox mode
- [ ] Trigger rebuild di Railway (atau push commit baru)
- [ ] Test di browser console: `console.log(process.env.REACT_APP_MIDTRANS_CLIENT_KEY)`
- [ ] Test payment flow untuk event berbayar

## 🔗 Links

- [Midtrans Dashboard](https://dashboard.midtrans.com/)
- [Midtrans Documentation](https://docs.midtrans.com/)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

