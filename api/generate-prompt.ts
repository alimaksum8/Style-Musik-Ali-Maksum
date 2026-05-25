import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lyrics, selectedOptions, modifyLyrics } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel environment." });
    }

    const ai = new GoogleGenAI({ apiKey }) as any;
    const hasSelections = Object.values(selectedOptions || {}).some((arr: any) => Array.isArray(arr) && arr.length > 0);
    
    const systemInstruction = `Anda adalah Music Producer AI profesional spesialis prompt musik untuk Suno dan Udio.
    Tugas Anda adalah menganalisis lirik dan pilihan user untuk membuat prompt gaya musik yang sangat akurat dan lirik yang terstruktur.

    ATURAN PRIORITAS GAYA:
    - JIKA USER TIDAK MEMILIH APA PUN: Buat style netral berdasarkan emosi lirik.
    - JIKA USER MEMILIH OPSI: Gunakan HANYA kata kunci tersebut.

    ${modifyLyrics ? `ATURAN PROTEKSI HAK CIPTA & OPTIMASI (MODIFIKASI AKTIF):
    - TUGAS UTAMA: Tulis ulang lirik (paraphrase) untuk menghindari deteksi hak cipta namun pertahankan ritme.
    - DISTORSI EJAAN: Gunakan tanda hubung secara fonetik untuk kata pemicu (Contoh: "Mimpi" -> "Miym-piy").
    - SINONIM: Ganti 1-2 kata populer dengan sinonim puitis.
    - JUMLAH KATA: WAJIB sama per baris.` : `ATURAN LIRIK: JANGAN ubah kata-kata lirik. Gunakan tag [Verse], [Chorus], dll.`}`;

    const userPrompt = `Lirik: "${lyrics}"
    Opsi: ${JSON.stringify(selectedOptions)}`;

    const modelsToTry = [
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash-8b",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];

    let responseText = "";
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

        responseText = result.response.text();
        if (responseText) break;
      } catch (err) {
        lastError = err;
        console.error(`Error with model ${modelName}:`, err);
      }
    }

    if (!responseText) {
      throw lastError || new Error("All models failed.");
    }

    res.status(200).json(JSON.parse(responseText));
  } catch (error: any) {
    console.error('Vercel API Detailed Error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
}
