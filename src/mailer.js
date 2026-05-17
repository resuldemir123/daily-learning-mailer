import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TOPIC = process.env.LEARNING_TOPIC || "JavaScript";
const TO_EMAIL = process.env.TO_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL || "learning@yourdomain.com";

// Konuları sırayla göndermek istersen topics.json'dan okuyabilirsin.
// Şimdilik Claude rastgele ilgi çekici bir alt konu seçiyor.
// ─────────────────────────────────────────────────────────────────────────────

async function generateLesson() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `Sen bir ${TOPIC} eğitmenisin. Bugün (${today}) öğrencine günlük bir ders e-postası yazacaksın.

Şu formatta HTML e-posta içeriği üret (sadece <body> içindekiler, tam HTML dökümanı değil):

1. Bugünün konusu: ${TOPIC} ile ilgili ilginç, pratik bir alt konu seç
2. 2-3 paragraf açıklama (Türkçe, sade dil)
3. Somut bir kod örneği (varsa) <pre><code> içinde
4. "Bugünün görevi": Okuyucunun 10 dakikada uygulayabileceği pratik bir egzersiz
5. Motivasyon cümlesi

HTML stilini inline css ile yap, arka plan beyaz, font sans-serif, kod blokları açık gri arka planlı olsun. Profesyonel ama samimi bir ton kullan.`,
      },
    ],
  });

  return {
    subject: `📚 Günlük ${TOPIC} Dersin - ${today}`,
    html: message.content[0].text,
  };
}

async function sendEmail(subject, html) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
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
            <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:700;">${process.env.LEARNING_TOPIC || "JavaScript"}</h1>
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
  });

  if (error) throw new Error(`Mail gönderilemedi: ${JSON.stringify(error)}`);
  console.log("✅ Mail gönderildi:", data.id);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🎯 Konu: ${TOPIC}`);
  console.log("🤖 Claude ile ders oluşturuluyor...");

  const { subject, html } = await generateLesson();
  console.log("✍️  Ders oluşturuldu:", subject);

  console.log("📨 Mail gönderiliyor...");
  await sendEmail(subject, html);
}

main().catch((err) => {
  console.error("❌ Hata:", err.message);
  process.exit(1);
});
