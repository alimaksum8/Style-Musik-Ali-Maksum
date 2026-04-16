/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Music, 
  Type as TypeIcon, 
  Settings2, 
  Zap, 
  Copy, 
  Check, 
  Loader2, 
  ChevronRight,
  Sparkles,
  Youtube,
  History,
  Trash2,
  Share2,
  ExternalLink,
  Info
} from "lucide-react";

// --- Constants & Options ---

const OPTIONS = {
  genres: [
    "Dangdut", "Koplo", "Campursari", "Keroncong", "Pop Indonesia", "Indie Indo", "Reggae", "Ska", "Rock", "Heavy Metal", "Death Metal", 
    "Punk", "Pop Punk", "Synthwave", "Retrowave", "Lo-fi Hip Hop", "Trap", "Rap Klasik", "R&B", "Soul", "Neo-soul", "Jazz", 
    "Bossa Nova", "Swing", "Blues", "Folk", "Bluegrass", "Country", "Americana", "Klasik", "Orkestra", "Chamber", 
    "EDM", "Techno", "House", "Deep House", "Dubstep", "Future Bass", "Phonk", "K-Pop", "J-Pop", "J-Rock", "Gaya Anime", 
    "Gospel", "New Age", "Ambient", "Industrial", "Disco", "Funk", "Afrobeats", "Latin", "Salsa", "Flamenco"
  ],
  intros: [
    "Biola", "Grand Piano", "Saksofon", "Gitar Distorsi", "Gitar Elektrik", "Perkusi Akustik", "Solo Gitar Sustain", "Solo Gitar Bending", "Solo Gitar Vibrato", "Solo Nada Tinggi / Gitar Menjerit", "Solo Gitar Lead",
    "Intro Tematik Main Theme Preview With Solo Gitar Sustain",
    "Intro Tematik Chorus Preview With Solo Gitar Sustain",
    "Intro Tematik Main Theme Preview With Solo Biola",
    "Intro Tematik Chorus Preview With Solo Biola"
  ],
  instruments: [
    "Gitar Akustik", "Gitar Elektrik", "Gitar Distorsi", "Gitar Muted", "Gitar Slide", "Gitar 12-Senar", "Gitar Nilon",
    "Biola", "Viola", "Cello", "Double Bass", "Harpa", "Banjo", "Ukulele", "Mandolin", "Sitar",
    "Grand Piano", "Upright Piano", "Piano Elektrik", "Rhodes", "Organ Hammond", "Organ Pipa", "Akordeon", "Celesta",
    "Synthesizer", "Synth Analog", "Moog Bass", "Wobble Bass", "FM Synth", "Pad", "Arpeggio Synth",
    "Terompet", "Saksofon", "Trombon", "Tuba", "French Horn", "Seruling", "Klarinet", "Oboe", "Bassoon", "Harmonika", "Bagpipes",
    "Drum", "808 Bass", "TR-909", "Drum Machine", "Perkusi Akustik", "Perkusi Sinematik", "Timpani", "Xilofon", "Marimba",
    "Congas", "Bongos", "Tamborin", "Shaker", "Cowbell",
    "Gamelan", "Kendang", "Suling", "Angklung", "Koto", "Shamisen", "Erhu", "Tabla", "Djembe", "Didgeridoo"
  ],
  moods: [
    "Epik", "Melankolis", "Membangkitkan Semangat", "Agresif", "Bermimpi", "Gelap", "Enerjik", "Sinematik", "Romantis", 
    "Santai", "Menyeramkan", "Nostalgia", "Penuh Harapan", "Marah", "Tenang", "Misterius", "Ethereal", "Trippy", "Sedih",
    "Aneh", "Lounge", "Megah", "Intens", "Peaceful", "Seksi", "Heroik", "Gotik", "Ceria", "Cemas",
    "Psikedelik", "Minimalis", "Sensual", "Canggih"
  ],
  emotions: [
    "Appassionato (Penuh Gairah)", "Dolce (Manis & Lembut)", "Lacrimoso (Penuh Air Mata)", "Con Fuoco (Berapi-api)",
    "Cantabile (Seperti Menyanyi)", "Maestoso (Agung/Mulia)", "Espressivo (Ekspresif)", "Agitato (Gelisah/Cepat)",
    "Sotto Voce (Berbisik)", "Grave (Serius & Berat)", "Leggiero (Ringan & Halus)", "Doloroso (Pedih/Sedih)",
    "Furioso (Sangat Marah)", "Amoroso (Penuh Kasih)", "Misterioso (Misterius)"
  ],
  vocals: [
    "Pria", "Wanita", "Serak", "Opera", "Paduan Suara", "Berbisik", "Soulful", "Duo", "Nada Tinggi", "Berteriak", 
    "Bass Dalam", "Auto-tune", "Vocaloid", "Rap", "Growl", "Bernapas", "Harmonisasi", "Furry", "Suara Anak-anak",
    "Falsetto", "Vibrato", "Monoton", "Kata-kata Lisan", "Scat Singing", "Yodeling", "Belting", "Head Voice", "Chest Voice",
    "Vokal Sopran", "Vokal Seriosa", "Vokal Orkestra", "Vokal Dangdut", "Vokal Slowrock Malaysia", "Chanting"
  ],
  tempos: ["40-60 BPM", "60-80 BPM", "80-100 BPM", "100-120 BPM", "Cepat (140+ BPM)", "Sangat Cepat (180+ BPM)"]
};

const CATEGORY_LABELS: Record<string, string> = {
  genres: "Genre",
  intros: "Intro",
  instruments: "Instrumen",
  moods: "Suasana / Mood",
  emotions: "Ekspresi Emosional",
  vocals: "Vokal",
  tempos: "Tempo"
};

// --- Types ---

interface GeneratedResult {
  style: string;
  formattedLyrics: string;
  timestamp: number;
  originalLyrics?: string;
  options?: Record<string, string[]>;
}

// --- Components ---

export default function App() {
  const [lyrics, setLyrics] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [modifyLyrics, setModifyLyrics] = useState(true);
  const [isBocilMode, setIsBocilMode] = useState(false);
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({
    genres: [],
    intros: [],
    instruments: [],
    moods: [],
    emotions: [],
    vocals: [],
    tempos: []
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [history, setHistory] = useState<GeneratedResult[]>([]);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('ali_maksum_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('ali_maksum_history', JSON.stringify(history));
  }, [history]);

  const toggleOption = (category: string, option: string) => {
    setSelectedOptions(prev => {
      const current = prev[category];
      if (current.includes(option)) {
        return { ...prev, [category]: current.filter(o => o !== option) };
      } else {
        return { ...prev, [category]: [...current, option] };
      }
    });
  };

  const analyzeYoutube = async () => {
    if (!youtubeUrl.trim()) {
      alert("Masukkan link YouTube!");
      return;
    }
    setLoadingYoutube(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined" || apiKey === "") {
        throw new Error("API Key Gemini tidak ditemukan. Silakan masukkan API Key Anda di panel Secrets AI Studio.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `Anda adalah Ali Maksum, seorang ahli musik. 
      Tugas Anda adalah menganalisis video YouTube berikut: ${youtubeUrl}.
      
      Gunakan Google Search untuk menemukan informasi tentang video ini (judul, deskripsi, artis, genre).
      Berdasarkan informasi tersebut, identifikasi genre, instrumen, mood, dan tempo yang paling akurat.
      
      Pilih opsi yang paling cocok HANYA dari daftar kategori berikut:
      Genres: ${OPTIONS.genres.join(', ')}
      Instruments: ${OPTIONS.instruments.join(', ')}
      Moods: ${OPTIONS.moods.join(', ')}
      Tempos: ${OPTIONS.tempos.join(', ')}
      
      Berikan jawaban dalam format JSON:
      {
        "genres": ["Genre1", "Genre2"],
        "instruments": ["Instrumen1"],
        "moods": ["Mood1"],
        "tempos": ["Tempo1"]
      }`;

      const modelsToTry = [
        { name: "gemini-3.1-pro-preview", useSearch: true },
        { name: "gemini-3-flash-preview", useSearch: true },
        { name: "gemini-3.1-flash-lite-preview", useSearch: true },
        { name: "gemini-3.1-flash-lite-preview", useSearch: false } // Last resort: No search
      ];

      let response = null;
      let lastError = null;

      for (const config of modelsToTry) {
        try {
          const genConfig: any = { 
            systemInstruction, 
            responseMimeType: "application/json"
          };
          
          if (config.useSearch) {
            genConfig.tools = [{ googleSearch: {} }];
          }

          response = await ai.models.generateContent({
            model: config.name,
            contents: [{ role: "user", parts: [{ text: `Tolong analisis video YouTube ini: ${youtubeUrl}. ${config.useSearch ? 'Gunakan Google Search untuk hasil akurat.' : 'Analisis berdasarkan pengetahuan Anda.'}` }] }],
            config: genConfig
          });
          
          if (response && response.text) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${config.name} (${config.useSearch ? 'with' : 'without'} search) gagal:`, err.message);
          
          // Wait 1 second before next attempt to avoid rapid firing
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }

      if (!response || !response.text) {
        const isQuotaError = lastError?.message?.includes("429") || lastError?.message?.includes("quota");
        throw new Error(isQuotaError 
          ? "Kuota API Gemini sedang sangat sibuk. Silakan tunggu beberapa saat atau coba ganti link." 
          : "Gagal menganalisis video. Pastikan link YouTube valid.");
      }

      if (response.text) {
        const analysis = JSON.parse(response.text);
        
        // Reset and apply new options
        const newOptions = { ...selectedOptions };
        Object.keys(analysis).forEach(key => {
          if (newOptions[key]) {
            newOptions[key] = analysis[key];
          }
        });
        setSelectedOptions(newOptions);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert(error instanceof Error ? error.message : "Gagal menganalisis video.");
    } finally {
      setLoadingYoutube(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const generate = async () => {
    if (!lyrics.trim()) {
      alert("Masukkan lirik lagu Anda!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Logika pengambilan API Key yang lebih kuat
      let apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined" || apiKey === "") {
        throw new Error("API Key Gemini tidak ditemukan. Silakan masukkan API Key Anda di panel Secrets AI Studio.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `Anda adalah Ali Maksum, seorang Arsitek Musik AI & Produser Musik Profesional kelas dunia.
      Tugas Anda adalah merancang "Style Prompt" teknis untuk Suno/Udio dan mengoptimalkan struktur lirik.
      
      STYLE PROMPT GUIDELINES:
      - Gunakan terminologi musik profesional (misal: "staccato strings", "analog warm synths", "syncopated rhythm").
      - Gabungkan genre, mood, instrumen, dan tempo menjadi satu paragraf deskriptif yang koheren dalam bahasa Inggris.
      - Fokus pada tekstur suara, dinamika, dan atmosfer.
      - Jika user memilih "Intro Tematik ...", pastikan prompt mendeskripsikan intro instrumen tersebut secara mendetail sebagai pembuka lagu.
      
      LYRIC STRUCTURE GUIDELINES:
      - Gunakan tag struktur standar: [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro], [End].
      - Tambahkan petunjuk vokal di dalam tag jika perlu (misal: [Chorus: Powerful Vocals]).
      - Jika user memilih "Intro Tematik Main Theme Preview With Solo [Instrument]", buatlah tag [Intro] yang mendeskripsikan melodi utama dimainkan oleh instrumen tersebut.
      - Jika user memilih "Intro Tematik Chorus Preview With Solo [Instrument]", buatlah tag [Intro] yang mendeskripsikan melodi chorus dimainkan oleh instrumen tersebut sebagai teaser.
      - WAJIB memberikan baris baru (line break) yang jelas antar bait dan antar baris lirik. JANGAN menggabungkan semua lirik dalam satu paragraf.
      
      ${isBocilMode ? `ATURAN BOCIL MODE (PHONETIC STYLE):
      - WAJIB mengubah penulisan lirik menjadi gaya fonetik/suku kata untuk pengucapan AI yang lebih jelas.
      - Gunakan tanda hubung (-) untuk memisahkan suku kata.
      - Ubah vokal agar lebih panjang: 'u' menjadi 'uw', 'i' menjadi 'iy', 'a' menjadi 'aw' (jika perlu).
      - Contoh: "Kujalani hubungan rumit" -> "Kuw- ja- laniy huw- bungan ruw- mit".
      - Contoh: "sakit" -> "sa- kiyt", "istana" -> "is- tana".
      - Pastikan seluruh lirik mengikuti pola fonetik ini.
      - TETAP pertahankan struktur baris lirik asli, jangan menggabungkan baris.` : ''}

      ${modifyLyrics ? `ATURAN MODIFIKASI LIRIK (OPTIMASI):
      - Analisis rima dan meteran lirik.
      - Jika satu baris terdiri dari 1 kata: JANGAN diubah.
      - Jika satu baris terdiri dari 3-4 kata: Ganti 1 kata dengan sinonim yang lebih puitis atau berima lebih baik.
      - Jika satu baris terdiri dari 5+ kata: Ganti 2 kata untuk meningkatkan aliran emosional.
      - Pastikan makna asli tetap terjaga namun terdengar lebih profesional.` : `ATURAN LIRIK (ORIGINAL):
      - JANGAN mengubah kata-kata dalam lirik (kecuali jika BOCIL MODE aktif, maka ikuti aturan fonetik).
      - Biarkan lirik tetap original sesuai input user.
      - Anda hanya diperbolehkan menambahkan tag struktur.`}`;

      const userPrompt = `Lirik: "${lyrics}". 
      Genre: ${selectedOptions.genres.join(', ')}. 
      Intro: ${selectedOptions.intros.join(', ')}. 
      Instrumen: ${selectedOptions.instruments.join(', ')}. 
      Suasana/Mood: ${selectedOptions.moods.join(', ')}.
      Ekspresi Emosional: ${selectedOptions.emotions.join(', ')}.
      Vokal: ${selectedOptions.vocals.join(', ')}.
      Tempo: ${selectedOptions.tempos.join(', ')}.`;

      // Step 1: Generate Prompt & Lyrics with Fallback & Retry
      const modelsToTry = [
        "gemini-2.5-flash-preview", 
        "gemini-3.1-flash-lite-preview",
        "gemini-3-flash-preview", 
        "gemini-3.1-pro-preview"
      ];
      
      let response = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        let retries = 0;
        const maxRetries = 2;

        while (retries <= maxRetries) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
              config: {
                systemInstruction,
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
            });
            if (response) break; 
          } catch (err: any) {
            lastError = err;
            const is503 = err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE");
            
            if (is503 && retries < maxRetries) {
              retries++;
              console.warn(`Model ${modelName} sibuk (503), mencoba ulang ke-${retries}...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Tunggu 2 detik
              continue;
            }
            
            console.warn(`Model ${modelName} gagal (${err?.message}), mencoba model berikutnya...`);
            break; // Lanjut ke model berikutnya di list modelsToTry
          }
        }
        if (response) break; // Jika sudah berhasil dengan satu model, berhenti
      }

      if (!response || !response.text) {
        const isQuotaError = lastError?.message?.includes("429") || lastError?.message?.includes("quota");
        const finalMessage = isQuotaError 
          ? "Kuota API Gratis Anda telah habis atau mencapai batas limit menit. Silakan tunggu 1-2 menit lalu coba lagi."
          : "Semua model AI sedang sibuk karena trafik tinggi dari Google. Silakan coba lagi dalam beberapa saat.";
        throw new Error(finalMessage);
      }

      const data = JSON.parse(response.text) as GeneratedResult;
      const resultWithTime = { 
        ...data, 
        timestamp: Date.now(),
        originalLyrics: lyrics,
        options: { ...selectedOptions }
      };
      setResult(resultWithTime);
      setHistory(prev => [resultWithTime, ...prev].slice(0, 10)); // Keep last 10

    } catch (error) {
      console.error("Detailed Generation error:", error);
      let errorMessage = "Terjadi kesalahan yang tidak diketahui.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      alert(`Kesalahan: ${errorMessage}\n\nTips: Pastikan koneksi internet stabil dan API Key valid.`);
    } finally {
      setLoading(false);
    }
  };

  const clearSelections = () => {
    setSelectedOptions({
      genres: [],
      intros: [],
      instruments: [],
      moods: [],
      emotions: [],
      vocals: [],
      tempos: []
    });
    setLyrics('');
    setYoutubeUrl('');
  };

  const restoreHistoryItem = (item: GeneratedResult) => {
    if (item.originalLyrics) setLyrics(item.originalLyrics);
    if (item.options) setSelectedOptions(item.options);
    setResult(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (timestamp: number) => {
    setHistory(prev => prev.filter(item => item.timestamp !== timestamp));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] p-4 md:p-8 font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3" /> Production Grade AI
            </div>
            <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mb-6 tracking-tighter">
              Ali Maksum <span className="text-white/20 font-light">PRO</span>
            </h1>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              Arsitek Musik AI untuk Suno & Udio. Rancang komposisi profesional dengan presisi tinggi.
            </p>
            
            <div className="mt-10 max-w-xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col md:flex-row gap-2 bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 p-2 rounded-2xl">
                  <div className="flex-1 flex items-center px-4 gap-3">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="Tempel link YouTube untuk inspirasi..."
                      className="bg-transparent border-none text-sm text-white focus:ring-0 outline-none w-full placeholder:text-slate-600"
                    />
                  </div>
                  <button
                    onClick={analyzeYoutube}
                    disabled={loadingYoutube}
                    className="px-8 py-3 bg-white text-black hover:bg-slate-200 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loadingYoutube ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {loadingYoutube ? "Menganalisis..." : "Analisis"}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-[0.2em] font-bold">
                Powered by Gemini 3.1 Pro & Google Search Grounding
              </p>
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-8 space-y-10">
            {/* Lyrics Input */}
            <section className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <TypeIcon className="w-32 h-32" />
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <TypeIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Lirik & Narasi</h2>
                    <p className="text-slate-500 text-xs font-medium">Input lirik utama untuk diolah AI</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setIsBocilMode(!isBocilMode)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                      isBocilMode 
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    BOCIL {isBocilMode ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setModifyLyrics(true)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                      modifyLyrics 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    OPTIMASI AI
                  </button>
                  <button
                    onClick={() => setModifyLyrics(false)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                      !modifyLyrics 
                        ? "bg-slate-700 text-white shadow-lg shadow-slate-700/20" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    LIRIK ASLI
                  </button>
                </div>
              </div>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="w-full h-64 bg-black/20 border border-white/5 rounded-2xl p-6 text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all resize-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent text-lg leading-relaxed placeholder:text-slate-700 font-medium"
                placeholder="Tulis lirik Anda di sini..."
              />
            </section>

            {/* Style Customization */}
            <section className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <Settings2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Arsitektur Musik</h2>
                    <p className="text-slate-500 text-xs font-medium">Tentukan karakteristik instrumen & mood</p>
                  </div>
                </div>
                <button 
                  onClick={clearSelections}
                  className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-slate-500 hover:text-red-400 group"
                  title="Reset Semua"
                >
                  <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              
              <div className="space-y-10 max-h-[600px] overflow-y-auto pr-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {Object.entries(OPTIONS).map(([key, opts]) => (
                  <div key={key} className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {CATEGORY_LABELS[key] || key}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {opts.map(opt => (
                        <button
                          key={opt}
                          onClick={() => toggleOption(key, opt)}
                          className={`px-5 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
                            selectedOptions[key].includes(opt)
                              ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-105"
                              : "bg-black/20 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Results & History */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-8 space-y-8">
              <button
                onClick={generate}
                disabled={loading}
                className="w-full group relative overflow-hidden bg-white text-black font-black py-6 rounded-2xl shadow-2xl transition-all active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-xl tracking-tight"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Membangun...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Bangun Komposisi</span>
                  </>
                )}
              </button>

              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#1e293b]/40 backdrop-blur-md border border-white/5 p-12 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-6 shadow-2xl"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                      <Zap className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Merancang Arsitektur...</h3>
                      <p className="text-slate-500 text-sm mt-2 leading-relaxed">AI sedang menganalisis harmoni dan struktur lirik Anda.</p>
                    </div>
                  </motion.div>
                )}

                {!loading && result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Style Prompt */}
                    <div className="bg-[#1e293b]/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl border-t-blue-500/30">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Music className="w-4 h-4" /> Style Prompt
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(result.style, 'style')}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                          >
                            {copyStatus['style'] ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="p-6 bg-black/40 rounded-2xl text-sm font-mono border border-white/5 leading-relaxed text-blue-100/90 break-words">
                        {result.style}
                      </div>
                    </div>

                    {/* Formatted Lyrics */}
                    <div className="bg-[#1e293b]/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl border-t-purple-500/30">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <TypeIcon className="w-4 h-4" /> Struktur Lirik
                        </h3>
                        <button
                          onClick={() => handleCopy(result.formattedLyrics, 'lyrics')}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                        >
                          {copyStatus['lyrics'] ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="p-6 bg-black/40 rounded-2xl text-xs font-sans border border-white/5 h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent whitespace-pre-wrap leading-relaxed text-slate-300 font-medium">
                        {result.formattedLyrics}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* History Section */}
                {!loading && history.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#1e293b]/20 border border-white/5 p-8 rounded-[2rem]"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <History className="w-4 h-4" /> Riwayat Terakhir
                      </h3>
                      <button 
                        onClick={() => { if(confirm("Hapus semua riwayat?")) setHistory([]) }}
                        className="text-[10px] font-bold text-red-500/50 hover:text-red-500 transition-colors"
                      >
                        BERSIHKAN
                      </button>
                    </div>
                    <div className="space-y-4">
                      {history.map((item) => (
                        <div key={item.timestamp} className="group relative bg-black/20 border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] text-slate-500 font-mono">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </p>
                            <button 
                              onClick={() => deleteHistoryItem(item.timestamp)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 font-medium mb-3">
                            {item.style}
                          </p>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setResult(item)}
                              className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-wider"
                            >
                              LIHAT HASIL
                            </button>
                            <button 
                              onClick={() => restoreHistoryItem(item)}
                              className="text-[9px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-wider"
                            >
                              PULIHKAN SETTING
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {!loading && !result && history.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#1e293b]/20 border border-white/5 border-dashed p-16 rounded-[2rem] flex flex-col items-center justify-center text-center text-slate-600"
                  >
                    <div className="p-4 bg-white/5 rounded-full mb-6">
                      <Music className="w-10 h-10 opacity-20" />
                    </div>
                    <p className="text-sm font-bold tracking-tight">Siap Memulai?</p>
                    <p className="text-xs mt-2 leading-relaxed">Masukkan lirik dan pilih arsitektur musik Anda untuk melihat keajaiban AI.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        <footer className="mt-24 pb-12 text-center border-t border-white/5 pt-12">
          <div className="flex items-center justify-center gap-6 mb-6">
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Share2 className="w-5 h-5" /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><ExternalLink className="w-5 h-5" /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Info className="w-5 h-5" /></a>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
            &copy; 2026 Ali Maksum Pro &bull; Professional Music AI Architect
          </p>
        </footer>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {Object.values(copyStatus).some(Boolean) && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white text-black px-10 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-black text-sm flex items-center gap-3 z-50 border border-white/20"
          >
            <div className="p-1 bg-green-500 rounded-full">
              <Check className="w-3 h-3 text-white" />
            </div>
            TEKS DISALIN KE PAPAN KLIP
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
