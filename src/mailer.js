import { GoogleGenerativeAI } from "@google/generative-ai";
import nodemailer from "nodemailer";
gemini-1.5-pro
// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TOPIC      = process.env.LEARNING_TOPIC  || "JavaScript";
const TO_EMAIL   = process.env.TO_EMAIL;         // mailin gideceği adres
const FROM_EMAIL = process.env.GMAIL_USER;       // gmail adresin
// ─────────────────────────────────────────────────────────────────────────────

async function generateLesson() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const today = new Date().toLocaleDateString("tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const prompt = `Sen bir ${TOPIC} eğitmenisin. Bugün (${today}) öğrencine günlük bir ders e-postası yazacaksın.

Şu formatta HTML e-posta içeriği üret (sadece body içindekiler, tam HTML dökümanı değil):

1. Bugünün konusu: ${TOPIC} ile ilgili ilginç, pratik bir alt konu seç
2. 2-3 paragraf açıklama (Türkçe, sade dil)
3. Somut bir kod örneği (varsa) pre ve code tagları içinde
4. "Bugünün görevi": Okuyucunun 10 dakikada uygulayabileceği pratik bir egzersiz
5. Motivasyon cümlesi

HTML stilini inline css ile yap, arka plan beyaz, font sans-serif, kod blokları açık gri arka planlı olsun. Profesyonel ama samimi bir ton kullan.`;

    const result = await model.generateContent(prompt);
    const html   = result.response.text();

    return {
      subject: `📚 Günlük ${TOPIC} Dersin - ${today}`,
      html,
    };
  } catch (error) {
    console.error("❌ generateLesson Hatası:", error.message);
    throw error;
  }
}

async function sendEmail(subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail uygulama şifresi (normal şifre değil!)
      },
    });

    const mailOptions = {
      from: `"Günlük Öğrenme 📚" <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      subject,
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
          <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

            <!-- HEADER -->
            <div style="background:#1a1a2e;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#a0a8c8;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Günlük Öğrenme</p>
              <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:700;">${TOPIC}</h1>
            </div>

            <!-- CONTENT -->
            <div style="padding:32px;">
              ${html}
            </div>

            <!-- FOOTER -->
            <div style="padding:20px 32px;background:#f9f9f9;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">Bu mail otomatik olarak gönderilmiştir. Her gün yeni bir ders seni bekliyor 🚀</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Mail gönderildi:", info.messageId);
  } catch (error) {
    console.error("❌ sendEmail Hatası:", error.message);
    throw error;
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🎯 Konu: ${TOPIC}`);
  console.log("🤖 Gemini ile ders oluşturuluyor...");

  const { subject, html } = await generateLesson();
  console.log("✍️  Ders oluşturuldu:", subject);

  console.log("📨 Mail gönderiliyor...");
  await sendEmail(subject, html);
}

main().catch((err) => {
  console.error("❌ Hata:", err.message);
  process.exit(1);
});