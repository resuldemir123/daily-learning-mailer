import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
import nodemailer from "nodemailer";

// ─── ENV ─────────────────────────────────────────────
const {
  GROQ_API_KEY,
  TO_EMAIL,
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  LEARNING_TOPIC,
} = process.env;

if (!GROQ_API_KEY) throw new Error("❌ GROQ_API_KEY eksik!");
if (!TO_EMAIL || !GMAIL_USER || !GMAIL_APP_PASSWORD)
  throw new Error("❌ Gmail config eksik!");

const TOPIC = LEARNING_TOPIC || "JavaScript";
const FROM_EMAIL = GMAIL_USER;

// ─── GROQ ───────────────────────────────────────────
const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

// ─── LESSON GENERATOR ───────────────────────────────
async function generateLesson() {
  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `
Sen profesyonel bir JavaScript eğitmenisin.

🚨 KURALLAR:
- SADECE JavaScript anlat
- Konu dışına ASLA çıkma
- Uydurma teknik terim kullanma
- Türkçe sade anlatım

Bugünün konusu: ${TOPIC}

Bugün (${today}) öğrenciye günlük ders e-postası yaz.

📌 FORMAT:
- HTML body
- 2-3 kısa paragraf açıklama
- gerçek JavaScript kod örneği
- mini görev
- motivasyon

⚠️ SADECE HTML döndür. Açıklama yazma.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 1000,
  });

  let html = response?.choices?.[0]?.message?.content || "";

  // 🧼 temizleme
  html = html
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .trim();

  if (!html) {
    throw new Error("❌ Model boş içerik döndürdü!");
  }

  console.log("📄 HTML GENERATED:\n", html);

  return {
    subject: `📚 Günlük ${TOPIC} Dersi - ${today}`,
    html,
  };
}

// ─── EMAIL ───────────────────────────────────────────
async function sendEmail(subject, html) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Günlük Öğrenme 📚" <${FROM_EMAIL}>`,
    to: TO_EMAIL,
    subject,
    html: `
      <div style="font-family:Arial;background:#f6f6f6;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:12px;">
          ${html}
        </div>
      </div>
    `,
  });

  console.log("✅ Mail gönderildi");
}

// ─── MAIN ────────────────────────────────────────────
async function main() {
  try {
    console.log(`🎯 Konu: ${TOPIC}`);
    console.log("🤖 Ders oluşturuluyor...");

    const { subject, html } = await generateLesson();

    console.log("✍️ Ders hazır:", subject);
    console.log("📨 Mail gönderiliyor...");

    await sendEmail(subject, html);
  } catch (err) {
    console.error("❌ Sistem Hatası:", err.message);
    process.exit(1);
  }
}

main();