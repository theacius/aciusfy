# Aciusfy

**Müziği hisset, anlamı keşfet.**

Aciusfy; keşif, çalma listeleri, sosyal dinleme ve çoklu platform deneyimini bir araya getiren yeni nesil bir müzik streaming platformudur. Web, masaüstü, mobil ve Discord üzerinden aynı ekosistemi hedefleyen uçtan uca bir ürün çalışmasıdır.

---

## Öne çıkan özellikler

### Dinleme ve keşif
- Şarkı, albüm ve sanatçı kütüphanesi
- Arama, öneriler, radyo ve akıllı kanallar
- Ruh hali (mood) ve tür tabanlı keşif
- Çalma listeleri, iş birlikçi listeler ve yorumlar
- Blend — iki kullanıcının müzik zevkini birleştiren karışımlar

### Sosyal deneyim
- Takip, mesajlaşma ve arkadaş aktivitesi
- Birlikte dinleme oturumları
- Profil, rozet, süsleme ve unvan sistemi
- Uygulama içi mağaza ve coin ekonomisi

### Platformlar
- **Web** — modern, hızlı arayüz
- **Masaüstü** — Electron tabanlı Windows uygulaması
- **Mobil** — React Native / Expo ile native deneyim
- **Discord** — sunucularda müzik botu ve hesap köprüsü

### Yönetim ve içerik
- Kapsamlı admin paneli
- Sanatçı paneli ve içerik yükleme
- Podcast desteği
- Minecraft mod entegrasyonu (oyun içi müzik deneyimi)

### Yardımcı asistan
- Sohbet tabanlı müzik asistanı
- Kullanıcıya yönelik öneri ve rehberlik

---

## Teknoloji

| Alan | Teknolojiler |
|------|----------------|
| Ön yüz | Next.js, React, TypeScript, Tailwind CSS |
| Veri | PostgreSQL, Prisma |
| Kimlik doğrulama | NextAuth |
| Medya | S3 uyumlu depolama, ses akışı ve proxy katmanı |
| Masaüstü | Electron |
| Mobil | Expo, React Native |
| Bot | Discord.js, ses kanalı oynatma |
| 3D / görsel | Three.js, Framer Motion |

---

## Proje yapısı

```
src/           Web uygulaması ve API
public/        Statik varlıklar ve marka görselleri
prisma/        Veritabanı şeması
native-app/    Mobil istemci
discord-bot/   Discord müzik botu
android/       Capacitor Android projesi
aciusfy-fabric/ Minecraft mod (Fabric)
```

---

## Hakkında

Aciusfy, kişisel bir portfolyo ve ürün geliştirme projesidir. Tasarım, mimari ve özellik seti tek elden şekillendirilmiştir.

> Bu depo yalnızca portfolyo vitrinidir. API, yönetim paneli, Discord botu, veritabanı ve sunucu kaynak kodları güvenlik nedeniyle repoda yer almaz.

**Yapımcı:** Taha Kara — [LinkedIn](https://www.linkedin.com/in/tahakara26)
