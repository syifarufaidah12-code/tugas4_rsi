# Sistem Review Kantin — Tugas 4 (Frontend React & Integrasi Backend)

Aplikasi review warung kantin kampus yang terdiri dari:

| Bagian                         | Lokasi                      | Teknologi                                                   |
| ------------------------------ | --------------------------- | ----------------------------------------------------------- |
| Backend REST API (Tugas 2 & 3) | folder root (`src/`, `DB/`) | Express.js 5, TypeScript, Drizzle ORM, SQL Server, JWT, Zod |
| Frontend (Tugas 4)             | `frontend/`                 | React 19 + TypeScript, Vite, React Router, **Axios**        |

Metode komunikasi HTTP yang dipilih: **Axios** (satu instance terpusat di `frontend/src/api/client.ts`).

---

## 1. Fitur

**Warung (stalls)**

- Daftar warung dari `GET /stalls` + pencarian nama, filter kategori, dan pagination (query `search`, `category`, `page`, `limit`).
- Detail warung dari `GET /stalls/:id`, termasuk pesan 404 bila tidak ditemukan.
- Tambah (`POST /stalls`), ubah (`PUT /stalls/:id`), hapus (`DELETE /stalls/:id`) sesuai role.

**Autentikasi**

- Registrasi `POST /auth/register` (akun baru selalu role customer).
- Login `POST /auth/login` → token JWT disimpan di `localStorage` dan dikirim otomatis di header `Authorization: Bearer <token>`.
- Profil `GET /auth/me` (halaman **Profil Saya**). Token juga divalidasi ke `/auth/me` saat aplikasi dibuka.
- Logout: backend memakai JWT stateless, sehingga logout = menghapus token di client.

**Tampilan berdasarkan role**

| Role     | Yang terlihat di frontend                                                              |
| -------- | -------------------------------------------------------------------------------------- |
| Publik   | Daftar & detail warung, login, registrasi                                              |
| Admin    | Tambah, ubah, hapus semua warung                                                       |
| Owner    | Tambah warung, ubah **hanya warung miliknya** (label "Milik Anda"), tanpa tombol hapus |
| Customer | Daftar & detail saja; halaman tambah/ubah menampilkan "Akses ditolak (403)"            |

**Feedback UI**: loading (skeleton/spinner), empty state, error state (pesan backend + tombol coba lagi), alert sukses, dialog konfirmasi hapus, dan error validasi per field.

---

## 2. Perubahan pada backend

1. **CORS** — `src/middlewares/cors.ts`. Origin yang diizinkan diatur lewat env `CORS_ORIGIN` (default `http://localhost:5173`).
2. **PORT dari env** — `PORT` (default 3000).
3. **Seed password owner kedua** — `DB/04-seed-password-hashes.sql` memberi password ke `slamet@kantin.test` (sama dengan akun `tini@kantin.test`) untuk menguji owner tidak dapat mengubah warung owner lain.

---

## 3. Instalasi & Menjalankan

### Prasyarat

- Node.js 20+ dan npm
- SQL Server

### a. Database

Jalankan skrip di folder `DB/` secara berurutan: `00-setup-mixed-mode.sql`, `01-create-database-and-user.sql`, `02-schema.sql`, `03-seed.sql`, `04-seed-password-hashes.sql`.

### b. Backend

```bash
# dari folder root repository
npm install
copy .env.example .env    # lalu isi DB_*, JWT_SECRET, PORT, CORS_ORIGIN
npm run dev               # http://localhost:3000
```

### c. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev               # http://localhost:5173
```

### Konfigurasi environment

| File             | Variabel                                                    | Contoh                         | Keterangan                     |
| ---------------- | ----------------------------------------------------------- | ------------------------------ | ------------------------------ |
| `.env` (backend) | `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `localhost`, `1433`            | Koneksi SQL Server             |
|                  | `JWT_SECRET`, `JWT_EXPIRES_IN`                              | `rahasia-panjang`, `1d`        | Penandatanganan token JWT      |
|                  | `PORT`                                                      | `3000`                         | Port backend                   |
|                  | `CORS_ORIGIN`                                               | `http://localhost:5173`        | Origin frontend yang diizinkan |
| `frontend/.env`  | `VITE_API_BASE_URL`                                         | `http://localhost:3000/api/v1` | Base URL Axios                 |

> File `.env` berisi data rahasia dan tidak di-commit (ada di `.gitignore`). Gunakan `.env.example` sebagai acuan.

### Akun uji (dari seed)

| Role     | Email                                      |
| -------- | ------------------------------------------ |
| Admin    | `admin@kantin.test`                        |
| Owner    | `tini@kantin.test`, `slamet@kantin.test`   |
| Customer | `bagas@student.test` atau daftar akun baru |

---

## 4. Struktur frontend

```
frontend/src/
├── api/          # client.ts (instance Axios + interceptor JWT & error), authApi.ts, stallApi.ts
├── context/      # AuthContext.tsx (login, logout, cek /auth/me)
├── components/   # Navbar, ProtectedRoute, StallCard, StallForm, Pagination, dll.
├── pages/        # daftar, detail, tambah, ubah warung, login, registrasi, profil
├── utils/        # permissions.ts (aturan role)
└── types.ts      # tipe data sesuai respons backend
```
