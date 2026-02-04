// src/pages/api/keep-supabase-alive.js
import { createClient } from '@supabase/supabase-js';

// Read from Vercel env (we prefixed with NEXT_PUBLIC_)
const supabaseUrl = process.env.NEXT_PUBLIC_VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_VITE_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.KEEP_ALIVE_SECRET;

export default async function handler(req, res) {
  // --- Security: Only allow requests with correct secret ---
  const requestSecret = req.query.secret || req.headers['x-secret'];
  if (requestSecret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // --- Validate env vars ---
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase env vars missing' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // --- PING: Replace 'ping_log' with any table you have ---
    // If you don't have one, create it (SQL below)
    const { data, error } = await supabase
      .from('ping_log')   // ← Change if needed
      .select('id')
      .limit(1);

    if (error) throw error;

    res.status(200).json({
      status: 'Supabase is ALIVE',
      project: process.env.NEXT_PUBLIC_VITE_SUPABASE_PROJECT_ID,
      timestamp: new Date().toISOString(),
      sample_row: data[0] || null,
    });
  } catch (err) {
    console.error('Supabase ping error:', err);
    res.status(500).json({
      error: 'Ping failed',
      message: err.message,
    });
  }
}
