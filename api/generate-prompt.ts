import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateMusicPrompt } from '../src/lib/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lyrics, selectedOptions, modifyLyrics } = req.body;
    const result = await generateMusicPrompt(lyrics, selectedOptions, modifyLyrics);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Vercel API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
