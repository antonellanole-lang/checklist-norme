# 🏗️ Piattaforma Verifiche Normative — Guida Installazione

## FILE NECESSARI
- App-supabase.jsx  → src/App.jsx
- supabase.js       → src/supabase.js
- supabase-setup.sql → eseguire su Supabase

---

## PASSO 1 — Crea il progetto Vite

```bash
npm create vite@latest checklist-norme -- --template react
cd checklist-norme
npm install
npm install @supabase/supabase-js
```

---

## PASSO 2 — Copia i file

```
checklist-norme/
├── src/
│   ├── App.jsx        ← sostituisci con App-supabase.jsx
│   └── supabase.js    ← file nuovo da aggiungere
├── .env               ← file nuovo da creare (vedi sotto)
```

---

## PASSO 3 — Crea account Supabase

1. Vai su https://supabase.com → Sign Up (gratuito)
2. Crea nuovo progetto (es. "checklist-norme")
3. Aspetta ~2 minuti che il progetto si avvii
4. Vai su **Settings → API**
5. Copia:
   - **Project URL** (es. https://abcdefgh.supabase.co)
   - **anon / public key** (stringa lunga che inizia con eyJ...)

---

## PASSO 4 — Crea il file .env

Nella cartella root del progetto crea un file chiamato `.env`:

```
VITE_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...la-tua-chiave...
```

⚠️ Non condividere mai questo file — contiene le tue credenziali!

---

## PASSO 5 — Crea le tabelle su Supabase

1. Vai su **SQL Editor** nel menu Supabase
2. Copia tutto il contenuto di `supabase-setup.sql`
3. Incolla nell'editor e clicca **Run**
4. Dovresti vedere "Success" senza errori

---

## PASSO 6 — Crea il primo utente Admin (TU)

1. Vai su **Authentication → Users → Invite user**
2. Inserisci la tua email
3. Controlla la email e imposta la password
4. Poi torna su **SQL Editor** e esegui:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'tua@email.com';
```

---

## PASSO 7 — Aggiungi gli ispettori

Per ogni ispettore:
1. Vai su **Authentication → Users → Invite user**
2. Inserisci la email dell'ispettore
3. L'ispettore riceve una email per impostare la password
4. Il ruolo sarà automaticamente "inspector"

---

## PASSO 8 — Avvia l'app

```bash
npm run dev
```

Apri http://localhost:5173 → vedrai la schermata di login.

---

## PASSO 9 — Pubblica online (opzionale)

```bash
npm run build
```

Poi vai su https://netlify.com:
1. Trascina la cartella `dist` sulla pagina
2. L'app è online con un link pubblico
3. ⚠️ Su Netlify aggiungi le variabili d'ambiente:
   - Site Settings → Environment Variables
   - Aggiungi VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

---

## DIFFERENZE rispetto alla versione locale

| Funzione | Versione locale | Versione Supabase |
|----------|----------------|-------------------|
| Login | ❌ | ✅ email + password |
| Dati | Browser locale | ☁️ Cloud condiviso |
| Multi-utente | ❌ | ✅ |
| Dashboard admin | ❌ | ✅ vede tutti i progetti |
| Offline | ✅ | ⚠️ richiede internet |
| Backup automatico | ❌ | ✅ |

---

## STRUTTURA DATABASE

```
profiles     → utenti (id, email, full_name, role)
projects     → progetti ispettori (con tutti i dati JSON)
norms_library → libreria norme condivisa (unica riga)
```

---

## DOMANDE FREQUENTI

**Gli ispettori vedono i progetti degli altri?**
No. Ogni ispettore vede solo i propri. Solo l'admin vede tutto.

**La libreria norme è condivisa?**
Sì. Quando un admin modifica una norma, tutti la vedono aggiornata.

**Posso usare ancora la versione locale?**
Sì. I due file (App.jsx e App-supabase.jsx) sono indipendenti.

**Quanto costa Supabase?**
Il piano gratuito include: 500MB database, 2GB storage, 50.000 utenti.
È più che sufficiente per un team di ispettori.
