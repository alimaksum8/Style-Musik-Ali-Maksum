import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini
  app.post("/api/generate-prompt", async (req, res) => {
    try {
      const { lyrics, selectedOptions, modifyLyrics } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey }) as any;
      
      const hasSelections = Object.values(selectedOptions).some((arr: any) => arr.length > 0);
      
      const systemInstruction = `Anda adalah Music Producer AI profesional spesialis prompt musik untuk Suno dan Udio.
      Tugas Anda adalah menganalisis lirik dan pilihan user untuk membuat prompt gaya musik yang sangat akurat dan lirik yang terstruktur.

      ATURAN PRIORITAS GAYA:
      - JIKA USER TIDAK MEMILIH APA PUN (Genre/Mood/Instrumen kosong): Buatlah prompt gaya musik yang sangat netral dan minimalis berdasarkan emosi lirik saja (contoh: "melodic, expressive vocals"). JANGAN mengarang genre spesifik (seperti Jazz, Pop, Rock) jika tidak dipilih.
      - JIKA USER MEMILIH OPSI: Gunakan HANYA kata kunci yang dipilih user sebagai fondasi utama. Anda dilarang menambahkan genre tambahan yang bertentangan dengan pilihan user.

      ATURAN PENTING UNTUK VOKAL & GAYA:
      - JANGAN menyertakan tag "screaming", "shouting", "shouted", "growl", "aggressive vocals", "death metal", atau "distorted vocals" kecuali user memilih opsi "Berteriak" atau "Growl".
      - Jika lagu bersifat "Slow" atau "Melankolis", prioritaskan kata: "clean vocals", "clear diction", "soft", "intimate".
      - Jika user memilih "Vokal Slowrock Malaysia", gunakan keyword wajib: "melodic soaring vocals", "vibrato", "heartfelt", "mendayu-dayu", "smooth powerful melodic delivery", "80s/90s slow rock production". Hindari kesan metal modern yang kasar.
      
      ATURAN PRODUKSI & REVERB:
      - JANGAN gunakan "heavy reverb", "massive echo", "washy", atau "underwater sound" kecuali diminta secara spesifik. 
      - Gunakan "professional studio mix", "balanced reverb", "crisp", "clear mixing" untuk memastikan vokal tidak tenggelam dalam gema.

      Buatlah JSON dengan field:
      1. "style": Prompt teknik musik Suno/Udio (dalam bahasa Inggris). Gabungkan genre, instrumen, mood, vokal, dan tempo ke dalam deskripsi yang koheren. Gunakan koma untuk memisahkan keyword.
      2. "formattedLyrics": Lirik dengan tag struktur [Verse], [Chorus], [Bridge], [Instrumental Solo], [Outro], dll. 
      
      ${modifyLyrics ? `ATURAN PROTEKSI HAK CIPTA & OPTIMASI (MODIFIKASI AKTIF):
      - TUGAS UTAMA: Tulis ulang lirik untuk menghindari deteksi hak cipta namun pertahankan ritme dan jiwa lagu.
      - DISTORSI EJAAN (TRIK TERBAIK): Untuk kata-kata yang berpotensi memicu filter hak cipta, ubah pengejaannya dengan tanda hubung secara fonetik. Contoh: "Kemesraan" -> "Kemes-ra-an iy-niy", "Mimpi" -> "Miym-piy". Ini membantu AI Suno/Udio melafalkan dengan mulus tanpa memicu filter teks.
      - SINONIM KATA: Ganti 1-2 kata populer dengan padanannya yang lebih puitis (Contoh: "bintang di surga" -> "lentera cakrawala").
      - ATURAN JUMLAH KATA: Baris baru WAJIB memiliki JUMLAH KATA YANG SAMA dengan lirik asli untuk menjaga ritme.
      - Pastikan lirik tetap puitis, mengalir indah, dan memiliki makna yang berdekatan dengan aslinya.` : `ATURAN LIRIK:
      - JANGAN mengubah kata-kata dalam lirik. Biarkan lirik tetap original sesuai input user.
      - Anda hanya diperbolehkan menambahkan tag struktur seperti [Verse], [Chorus], [Bridge], [Outro], dll.`}`;

      const userPrompt = `Lirik Asli: "${lyrics}"
      ${hasSelections ? 'Pilihan User:' : 'User tidak memilih opsi apa pun, buat style netral berdasarkan lirik.'}
      ${(selectedOptions as any).genres?.length > 0 ? `- Genre: ${(selectedOptions as any).genres.join(', ')}` : ''}
      ${(selectedOptions as any).intros?.length > 0 ? `- Intro: ${(selectedOptions as any).intros.join(', ')}` : ''}
      ${(selectedOptions as any).instruments?.length > 0 ? `- Instrumen: ${(selectedOptions as any).instruments.join(', ')}` : ''}
      ${(selectedOptions as any).moods?.length > 0 ? `- Suasana/Mood: ${(selectedOptions as any).moods.join(', ')}` : ''}
      ${(selectedOptions as any).vocals?.length > 0 ? `- Vokal: ${(selectedOptions as any).vocals.join(', ')}` : ''}
      ${(selectedOptions as any).tempos?.length > 0 ? `- Tempo: ${(selectedOptions as any).tempos.join(', ')}` : ''}`;

      const modelsToTry = [
        "gemini-2.0-flash-exp", 
        "gemini-1.5-flash",
        "gemini-1.5-pro"
      ];
      
      let response = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          const model = ai.getGenerativeModel({ model: modelName, systemInstruction } as any);
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  style: { type: Type.STRING },
                  formattedLyrics: { type: Type.STRING }
                },
                required: ["style", "formattedLyrics"]
              }
            }
          } as any);
          response = result.response;
          if (response) break;
        } catch (err) {
          lastError = err;
          console.error(`Error with model ${modelName}:`, err);
        }
      }

      if (!response) {
        throw lastError || new Error("All models failed.");
      }

      res.json(JSON.parse(response.text()));
    } catch (error: any) {
      console.error("Server API Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
