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
  Sparkles
} from "lucide-react";

// --- Constants & Options ---

const OPTIONS = {
  genres: [
    "Dangdut", "Koplo", "Campursari", "Keroncong", "Pop Indonesia", "Indie Indo", "Reggae", "Ska", "Rock", "Heavy Metal", "Death Metal", 
    "Punk", "Pop Punk", "Synthwave", "Retrowave", "Lo-fi Hip Hop", "Trap", "Old School Rap", "R&B", "Soul", "Neo-soul", "Jazz", 
    "Bossa Nova", "Swing", "Blues", "Folk", "Bluegrass", "Country", "Americana", "Classical", "Orchestra", "Chamber", 
    "EDM", "Techno", "House", "Deep House", "Dubstep", "Future Bass", "Phonk", "K-Pop", "J-Pop", "J-Rock", "Anime Style", 
    "Gospel", "New Age", "Ambient", "Industrial", "Disco", "Funk", "Afrobeats", "Latin", "Salsa", "Flamenco"
  ],
  intros: [
    "Biola", "Grand Piano", "Saxophone", "Distortion Guitar", "Electric Guitar", "Acoustic Percussion", "Solo Guitar Sustain", "Solo Guitar Bending", "Solo Guitar Vibrato", "Solo High Note / Screaming Guitar", "Solo Guitar Lead (Lead Guitar)"
  ],
  instruments: [
    "Acoustic Guitar", "Electric Guitar", "Distortion Guitar", "Muted Guitar", "Slide Guitar", "12-String Guitar", "Nylon Guitar",
    "Violin", "Viola", "Cello", "Double Bass", "Harp", "Banjo", "Ukulele", "Mandolin", "Sitar",
    "Grand Piano", "Upright Piano", "Electric Piano", "Rhodes", "Hammond Organ", "Pipe Organ", "Accordion", "Celesta",
    "Synthesizer", "Analog Synth", "Moog Bass", "Wobble Bass", "FM Synth", "Pad", "Arpeggio Synth",
    "Trumpet", "Saxophone", "Trombone", "Tuba", "French Horn", "Flute", "Clarinet", "Oboe", "Bassoon", "Harmonica", "Bagpipes",
    "Drums", "808 Bass", "TR-909", "Drum Machine", "Acoustic Percussion", "Cinematic Percussion", "Timpani", "Xylophone", "Marimba",
    "Congas", "Bongos", "Tambourine", "Shaker", "Cowbell",
    "Gamelan", "Kendang", "Suling", "Angklung", "Koto", "Shamisen", "Erhu", "Tabla", "Djembe", "Didgeridoo"
  ],
  moods: [
    "Epic", "Melancholic", "Uplifting", "Aggressive", "Dreamy", "Dark", "Energetic", "Cinematic", "Romantic", 
    "Chill", "Spooky", "Nostalgic", "Hopeful", "Angry", "Calm", "Mysterious", "Ethereal", "Trippy", "Sad",
    "Whimsical", "Lounge", "Grandiose", "Intense", "Peaceful", "Sultry", "Heroic", "Gothic", "Cheerful", "Anxious",
    "Psychedelic", "Minimalist", "Sensual", "Sophisticated"
  ],
  vocals: [
    "Male", "Female", "Raspy", "Opera", "Choral", "Whispery", "Soulful", "Duo", "High-pitched", "Screaming", 
    "Deep Bass", "Auto-tune", "Vocaloid", "Rap", "Growl", "Breathy", "Harmonized", "Furry", "Kids Voice",
    "Falsetto", "Vibrato", "Monotone", "Spoken Word", "Scat Singing", "Yodeling", "Belting", "Head Voice", "Chest Voice",
    "Vocals Suprano", "Vocals Seriosa", "Vocals Orchestra", "Vocals Dangdut", "Vocals Slowrock Malaysia", "Chanting"
  ],
  tempos: ["40-60 BPM", "60-80 BPM", "80-100 BPM", "100-120 BPM", "Fast (140+ BPM)", "Very Fast (180+ BPM)"]
};

// --- Types ---

interface GeneratedResult {
  style: string;
  formattedLyrics: string;
}

// --- Components ---

export default function App() {
  const [lyrics, setLyrics] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({
    genres: [],
    intros: [],
    instruments: [],
    moods: [],
    vocals: [],
    tempos: []
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

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
      let apiKey = process.env.GEMINI_API_KEY;
      const fallbackKey = "AIzaSyCDru48H9fAEbCWF3-M3rpyco2yjXp55H4";

      // Jika key dari env tidak valid, gunakan fallback
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined" || apiKey === "") {
        apiKey = fallbackKey;
      }
      
      if (!apiKey || apiKey === "undefined") {
        throw new Error("API Key Gemini tidak ditemukan. Silakan masukkan API Key yang valid.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `Anda adalah Music Producer AI profesional.
      Analisis lirik dan pilihan user. Buatlah JSON dengan field:
      1. "style": Prompt teknik musik Suno/Udio (Inggris).
      2. "formattedLyrics": Lirik dengan tag struktur [Verse], [Chorus], dll. 
      
      ATURAN MODIFIKASI LIRIK:
      - Jika satu baris terdiri dari 1 kata: JANGAN diubah.
      - Jika satu baris terdiri dari 3 atau 4 kata: Ubah 1 kata yang sesuai dan senada.
      - Jika satu baris terdiri dari 4 kata atau lebih: Ubah 2 kata yang sesuai dan senada.
      - Pastikan lirik tetap puitis dan mengalir dengan baik.`;

      const userPrompt = `Lirik: "${lyrics}". 
      Genre: ${selectedOptions.genres.join(', ')}. 
      Intro: ${selectedOptions.intros.join(', ')}. 
      Instrumen: ${selectedOptions.instruments.join(', ')}. 
      Mood: ${selectedOptions.moods.join(', ')}.
      Vokal: ${selectedOptions.vocals.join(', ')}.
      Tempo: ${selectedOptions.tempos.join(', ')}.`;

      // Step 1: Generate Prompt & Lyrics
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp", // Menggunakan model yang lebih stabil untuk browser
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

      if (!response.text) {
        throw new Error("Model tidak memberikan respon teks.");
      }

      const data = JSON.parse(response.text) as GeneratedResult;
      setResult(data);

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

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-4 tracking-tight">
              Music Prompt Architect
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
              Optimalkan lirik dan style musik untuk Suno & Udio dengan kekuatan AI.
            </p>
            <p className="text-slate-500 text-sm mt-2 font-semibold tracking-wider">
              Developer Ali Maksum
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-7 space-y-8">
            {/* Lyrics Input */}
            <section className="bg-[#1e293b] border border-[#334155] p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TypeIcon className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Lirik Lagu</h2>
              </div>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="w-full h-56 bg-[#0f172a] border border-slate-700 rounded-2xl p-5 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                placeholder="Tulis atau tempel lirik lagu Anda di sini..."
              />
            </section>

            {/* Style Customization */}
            <section className="bg-[#1e293b] border border-[#334155] p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Settings2 className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Kustomisasi Style</h2>
              </div>
              
              <div className="space-y-8 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {Object.entries(OPTIONS).map(([key, opts]) => (
                  <div key={key}>
                    <p className="text-xs font-black text-slate-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                      {key} <ChevronRight className="w-3 h-3" />
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {opts.map(opt => (
                        <button
                          key={opt}
                          onClick={() => toggleOption(key, opt)}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${
                            selectedOptions[key].includes(opt)
                              ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                              : "bg-[#0f172a] border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
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

          {/* Right Column: Results */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              <button
                onClick={generate}
                disabled={loading}
                className="w-full group relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg tracking-wide"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Membangun Komposisi...</span>
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
                    className="bg-[#1e293b] border border-[#334155] p-12 rounded-3xl flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                      <Zap className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Sedang Meramu...</h3>
                      <p className="text-slate-400 text-sm mt-1">Menganalisis lirik & merancang komposisi</p>
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
                    <div className="bg-[#1e293b] border border-[#334155] p-6 rounded-3xl shadow-2xl">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                          <Music className="w-4 h-4" /> Style Prompt
                        </h3>
                        <button
                          onClick={() => handleCopy(result.style, 'style')}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                          {copyStatus['style'] ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="p-4 bg-[#0f172a] rounded-xl text-sm font-mono border border-slate-700 leading-relaxed text-blue-100">
                        {result.style}
                      </div>
                    </div>

                    {/* Formatted Lyrics */}
                    <div className="bg-[#1e293b] border border-[#334155] p-6 rounded-3xl shadow-2xl">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                          <TypeIcon className="w-4 h-4" /> Struktur Lirik
                        </h3>
                        <button
                          onClick={() => handleCopy(result.formattedLyrics, 'lyrics')}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                          {copyStatus['lyrics'] ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="p-4 bg-[#0f172a] rounded-xl text-xs font-sans border border-slate-700 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent whitespace-pre-wrap leading-relaxed text-slate-300">
                        {result.formattedLyrics}
                      </div>
                    </div>
                  </motion.div>
                )}

                {!loading && !result && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#1e293b]/50 border border-[#334155] border-dashed p-12 rounded-3xl flex flex-col items-center justify-center text-center text-slate-500"
                  >
                    <Music className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">Hasil akan muncul di sini setelah Anda menekan tombol bangun.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {Object.values(copyStatus).some(Boolean) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 z-50"
          >
            <Check className="w-5 h-5" />
            Teks disalin ke papan klip!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
