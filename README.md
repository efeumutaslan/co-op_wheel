# 🎡 Co-op Çark - Gerçek Zamanlı Çok Oyunculu Çark Çevirme

Arkadaşlarınla anlık senkronize çark çevir! Supabase Realtime ile gerçek zamanlı WebSocket bağlantısı.

![Co-op Çark](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green?style=flat-square&logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue?style=flat-square&logo=tailwindcss)

## ✨ Özellikler

- 🚀 **Anlık Senkronizasyon** - Supabase Realtime ile <50ms gecikme
- 👥 **Çok Oyunculu** - Sınırsız katılımcı desteği
- 👑 **Yetki Sistemi** - Admin ve Moderatör rolleri
- 🎨 **Modern UI** - Glassmorphism tasarım, animasyonlar
- 🎉 **Konfeti Efekti** - Kazanan açıklandığında
- 📜 **Geçmiş Takibi** - Tüm çevirmeler kaydedilir
- 📱 **Responsive** - Mobil uyumlu tasarım

## 🛠️ Kurulum

### 1. Supabase Projesi Oluştur (Ücretsiz)

1. [supabase.com](https://supabase.com) adresine git
2. "Start your project" ile yeni proje oluştur
3. Proje ayarlarından API anahtarlarını al:
   - Settings > API > Project URL
   - Settings > API > anon public key

### 2. Projeyi Klonla ve Kur

```bash
# Repo'yu klonla
git clone https://github.com/your-username/coop-wheel.git
cd coop-wheel

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env.local
```

### 3. Environment Variables

`.env.local` dosyasını düzenle:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

## 🚀 Vercel'e Deploy

### Tek Tıkla Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/coop-wheel&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

### Manuel Deploy

1. [vercel.com](https://vercel.com) adresine git
2. GitHub repo'nu import et
3. Environment variables ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## 📖 Kullanım

### Çark Kurma
1. "Çark Kur" butonuna tıkla
2. Kullanıcı adını gir
3. 6 haneli oda kodu oluşturulur
4. Kodu arkadaşlarınla paylaş

### Çarka Katılma
1. "Çarka Katıl" butonuna tıkla
2. Kullanıcı adını gir
3. Oda kodunu gir
4. Katıl!

### Yetki Sistemi
- 👑 **Admin**: Odayı kuran kişi
  - Moderatör atayabilir
  - Öğe ekleyip çıkarabilir
  - Tüm öğeleri temizleyebilir
- 🛡️ **Moderatör**: Admin tarafından atanır
  - Öğe ekleyip çıkarabilir
- 👤 **Katılımcı**: Sadece çarkı çevirebilir

## 🏗️ Teknik Detaylar

### Teknolojiler
- **Framework**: Next.js 14 (App Router)
- **Realtime**: Supabase Realtime (WebSocket)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Dosya Yapısı
```
coop-wheel/
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── Confetti.jsx
│   └── Wheel.jsx
├── lib/
│   └── supabase.js
├── public/
├── .env.example
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

### Realtime Events
- `room_update`: Oda verisi değiştiğinde
- `spin_start`: Çark çevrilmeye başladığında
- `spin_result`: Kazanan belirlendiğinde
- `user_joined`: Yeni kullanıcı katıldığında

## 🤝 Katkıda Bulunma

1. Fork et
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit et (`git commit -m 'Add amazing feature'`)
4. Push et (`git push origin feature/amazing-feature`)
5. Pull Request aç

## 📄 Lisans

MIT License - Dilediğiniz gibi kullanabilirsiniz!

## 💡 İpuçları

- Oda kodu büyük/küçük harf duyarsızdır
- Çark en az 2 öğe ile çevrilebilir
- Tüm çevirmeler geçmişte saklanır
- Sayfa yenilendiğinde oda verisi korunur

---

Made with ❤️ for fun wheel spinning with friends!
