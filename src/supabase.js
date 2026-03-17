import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════════════════
   CONFIGURAZIONE SUPABASE
   
   ISTRUZIONI:
   1. Vai su https://supabase.com → crea account gratuito
   2. Crea un nuovo progetto (es. "checklist-norme")
   3. Vai su Settings → API
   4. Sostituisci i valori sotto con i tuoi:
      - Project URL  →  VITE_SUPABASE_URL
      - anon/public  →  VITE_SUPABASE_ANON_KEY
   
   Poi crea il file .env nella root del progetto:
   
      VITE_SUPABASE_URL=https://xxxx.supabase.co
      VITE_SUPABASE_ANON_KEY=eyJhbGci...
   
   ══════════════════════════════════════════════════════ */

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://ynhlyxxzryqgbrvicloz.supabase.co";
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluaGx5eHh6cnlxZ2JydmljbG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDQwOTYsImV4cCI6MjA4OTE4MDA5Nn0.nNo6EsvLuaYstkXcWmBx3tOcifB-1z5hASeGE-G_qwU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── Auth helpers ─── */
export const auth = {
  signIn:  (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signOut: ()                => supabase.auth.signOut(),
  getUser: ()                => supabase.auth.getUser(),
  onAuthChange: (cb)         => supabase.auth.onAuthStateChange(cb),
};

/* ─── Database helpers ─── */
export const db = {

  // ── Profili utente ──
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return { data, error };
  },

  getAllProfiles: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .order("full_name");
    return { data, error };
  },

  // ── Progetti ──
  getMyProjects: async (userId) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*, profiles(full_name, email)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    return { data, error };
  },

  getAllProjects: async () => {
    // Solo admin
    const { data, error } = await supabase
      .from("projects")
      .select("*, profiles(full_name, email)")
      .order("updated_at", { ascending: false });
    return { data, error };
  },

  upsertProject: async (project) => {
    const { data, error } = await supabase
      .from("projects")
      .upsert({
        id:              project.id,
        user_id:         project.userId,
        name:            project.name,
        inspector:       project.inspector,
        selected_disc:   project.selectedDisc,
        active_sections: project.activeSections,
        checklist:       project.checklist,
        notes:           project.notes,
        remarks:         project.remarks,
        updated_at:      new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },

  deleteProject: async (id) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    return { error };
  },

  // ── Libreria Norme (condivisa tra tutti) ──
  getNorms: async () => {
    const { data, error } = await supabase
      .from("norms_library")
      .select("disciplines")
      .eq("id", 1)
      .single();
    return { data, error };
  },

  saveNorms: async (disciplines) => {
    const { error } = await supabase
      .from("norms_library")
      .upsert({ id: 1, disciplines, updated_at: new Date().toISOString() });
    return { error };
  },
};
