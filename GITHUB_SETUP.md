# GitHub Setup Guide voor Konsensi App

Deze guide helpt je bij het koppelen van de Konsensi App aan GitHub en het configureren van automatische deployments.

## Stap 1: GitHub Repository Aanmaken

1. Ga naar [github.com](https://github.com) en log in
2. Klik op het "+" icoon rechtsboven en selecteer "New repository"
3. Vul de details in:
   - **Repository name**: `konsensi-app` (of een andere naam)
   - **Description**: "Konsensi Budgetbeheer App - Web app en Flutter mobile app"
   - **Visibility**: Kies Public of Private
   - **NIET** "Initialize with README" aanvinken
4. Klik op "Create repository"

## Stap 2: Lokale Repository Koppelen

Open een terminal in het project directory en voer uit:

```bash
cd ~/Desktop/konsensi\ apps/konsensi-app

# Controleer of git al geïnitialiseerd is
git status

# Als nog niet geïnitialiseerd:
git init

# Voeg alle bestanden toe
git add .

# Maak eerste commit
git commit -m "Initial commit: Konsensi App gemigreerd van base44 naar Supabase"

# Voeg remote repository toe (vervang USERNAME)
git remote add origin https://github.com/USERNAME/konsensi-app.git

# Push naar GitHub
git branch -M main
git push -u origin main
```

## Stap 3: GitHub CLI (Alternatief)

Als je GitHub CLI hebt geïnstalleerd:

```bash
cd ~/Desktop/konsensi\ apps/konsensi-app
gh repo create konsensi-app --public --source=. --remote=origin --push
```

## Stap 4: GitHub Secrets Configureren

Voor automatische deployment naar Vercel via GitHub Actions:

1. Ga naar je GitHub repository
2. Klik op **Settings** > **Secrets and variables** > **Actions**
3. Klik op **New repository secret**
4. Voeg de volgende secrets toe:

### Vereiste Secrets:

- **`VITE_SUPABASE_URL`**: Je Supabase project URL (bijv. `https://xxxxx.supabase.co`)
- **`VITE_SUPABASE_ANON_KEY`**: Je Supabase anon public key
- **`VERCEL_TOKEN`**: Je Vercel access token
  - Krijg je via: [Vercel Settings > Tokens](https://vercel.com/account/tokens)
- **`VERCEL_ORG_ID`**: Je Vercel organization ID
  - Krijg je via: Vercel Dashboard > Settings > General
- **`VERCEL_PROJECT_ID`**: Je Vercel project ID
  - Krijg je na het importeren van het project in Vercel

## Stap 5: GitHub Actions Workflow

De repository bevat een GitHub Actions workflow (`.github/workflows/deploy.yml`) voor automatische deployment naar Vercel.

De workflow wordt automatisch getriggerd wanneer je:
- Code pusht naar de `main` of `master` branch
- Een Pull Request maakt naar `main` of `master`

## Stap 6: Verificatie

1. Ga naar je GitHub repository
2. Controleer of alle bestanden zijn geüpload
3. Check de **Actions** tab om te zien of de workflow correct werkt
4. Na een push naar main, zou automatisch een deployment naar Vercel moeten starten

## Volgende Stappen

Na het koppelen aan GitHub:

1. ✅ Code is veilig opgeslagen in de cloud
2. ✅ Automatische deployments naar Vercel bij elke push
3. ✅ Samenwerking mogelijk via Pull Requests

Je kunt nu verdergaan met:
- [Vercel Deployment Setup](./VERCEL_SETUP.md)
- [Flutter Mobile App Setup](./FLUTTER_SETUP.md)
