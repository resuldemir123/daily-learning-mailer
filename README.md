# 📚 Daily Learning Mailer

Claude API kullanarak her gün belirli bir konuda otomatik öğrenme maili gönderir.

## Nasıl Çalışır?

```
GitHub Actions (cron) → Node.js → Claude API → Resend → Senin Mailin
```

Her sabah GitHub Actions tetiklenir → Claude o günün dersini yazar → Resend ile mailin gelir.

---

## Kurulum (5 Adım)

### 1. Bu repoyu fork'la veya klonla

```bash
git clone https://github.com/kullanici/daily-learning-mailer
cd daily-learning-mailer
npm install
```

### 2. API Anahtarlarını al

| Servis | Nereden | Ücretsiz mi? |
|--------|---------|--------------|
| **Anthropic API** | [console.anthropic.com](https://console.anthropic.com) | Ücretli (çok ucuz) |
| **Resend** | [resend.com](https://resend.com) | 3000 mail/ay ücretsiz |

> **Resend alternatifi:** SendGrid veya nodemailer+Gmail da kullanabilirsin. `src/mailer.js` içindeki `sendEmail` fonksiyonunu değiştir.

### 3. Resend'de domain doğrula

`resend.com` → Domains → Add Domain → DNS kayıtlarını ekle.
Kendi domainin yoksa Resend'in `onboarding@resend.dev` adresini test için kullanabilirsin.

### 4. GitHub Secrets ekle

Repo → Settings → Secrets and variables → Actions → New repository secret

| Secret Adı | Değer |
|------------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `RESEND_API_KEY` | `re_...` |
| `TO_EMAIL` | `senin@email.com` |
| `FROM_EMAIL` | `learning@domainin.com` |
| `LEARNING_TOPIC` | `JavaScript` (veya Python, React, SQL...) |

### 5. Workflow'u aktif et

Repo → Actions → "Daily Learning Mailer" → Enable

Artık her sabah 08:00'de (İstanbul saati) mailin gelecek!

---

## Manuel Test

Actions → Daily Learning Mailer → Run workflow → Run

---

## Saati Değiştirmek

`.github/workflows/daily-mailer.yml` içindeki cron'u düzenle:

```yaml
- cron: "0 5 * * *"   # 05:00 UTC = 08:00 İstanbul
- cron: "0 7 * * 1-5" # Sadece hafta içi 10:00 İstanbul
- cron: "0 17 * * *"  # 20:00 İstanbul (akşam)
```

[Crontab Guru](https://crontab.guru) ile kolayca oluşturabilirsin.

---

## Konuyu Değiştirmek

`LEARNING_TOPIC` secret'ını güncelle → Bir sonraki gönderimde yeni konu aktif olur.

Örnek konular: `Python`, `React`, `SQL`, `Docker`, `System Design`, `TypeScript`, `AWS`
