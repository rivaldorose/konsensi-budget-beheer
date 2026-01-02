# Environment Variables Setup

Deze app heeft de volgende Supabase environment variabelen nodig:

## Vereiste Environment Variables

### 1. VITE_SUPABASE_URL
- **Wat is het?** De URL van je Supabase project
- **Waar te vinden?** 
  1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard)
  2. Selecteer je project
  3. Ga naar **Settings** > **API**
  4. Kopieer de **Project URL** (bijv. `https://xxxxx.supabase.co`)

### 2. VITE_SUPABASE_ANON_KEY
- **Wat is het?** De anon/public key van je Supabase project
- **Waar te vinden?**
  1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard)
  2. Selecteer je project
  3. Ga naar **Settings** > **API**
  4. Kopieer de **anon public** key (begint meestal met `eyJ...`)

## Waar in te stellen?

### Lokaal (Development)
Maak een `.env` bestand in de root van het project:

```bash
# .env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Belangrijk:** 
- Het `.env` bestand staat al in `.gitignore`, dus wordt niet naar GitHub gepusht
- Herstart je development server na het toevoegen van de variabelen

### Vercel (Production)
1. Ga naar je Vercel project dashboard
2. Ga naar **Settings** > **Environment Variables**
3. Voeg beide variabelen toe:
   - `VITE_SUPABASE_URL` → Je Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → Je Supabase anon key
4. Selecteer **Production**, **Preview**, en **Development** environments
5. Klik op **Save**
6. **Redeploy** je project (Vercel zal automatisch een nieuwe deployment starten)

## Verificatie

Na het instellen van de variabelen:

1. **Lokaal:** Start je dev server opnieuw en check de browser console - er zouden geen errors moeten zijn over missing environment variables
2. **Vercel:** Check de deployment logs - er zouden geen errors moeten zijn over missing environment variables

## Troubleshooting

### "Missing Supabase environment variables"
- Controleer of de variabelen correct zijn gespeld (moeten exact zijn: `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`)
- Controleer of ze beschikbaar zijn voor het juiste environment (Production/Preview/Development)
- Herstart je development server of redeploy op Vercel

### "No authenticated user: Auth session missing!"
- Dit kan betekenen dat de Supabase client niet correct is geïnitialiseerd
- Controleer of de environment variabelen correct zijn ingesteld
- Controleer of je Supabase project actief is en toegankelijk is

