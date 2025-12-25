# Flutter Mobile App Setup voor Konsensi App

Deze guide helpt je bij het opzetten en deployen van de Flutter mobile app voor Konsensi.

## Stap 1: Flutter Installatie

1. Installeer Flutter via [flutter.dev](https://flutter.dev/docs/get-started/install)
2. Controleer installatie:
   ```bash
   flutter doctor
   ```
3. Zorg dat alle checks groen zijn

## Stap 2: Project Structuur

De Flutter app staat in: `~/Desktop/konsensi apps/konsensi-app-flutter/`

## Stap 3: Dependencies Installeren

```bash
cd ~/Desktop/konsensi\ apps/konsensi-app-flutter
flutter pub get
```

## Stap 4: Supabase Configuratie

1. Maak een `.env` bestand in de root van de Flutter app:
   ```bash
   cd ~/Desktop/konsensi\ apps/konsensi-app-flutter
   touch .env
   ```

2. Voeg Supabase credentials toe:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Installeer flutter_dotenv package (als nog niet gedaan):
   ```yaml
   # In pubspec.yaml
   dependencies:
     flutter_dotenv: ^5.1.0
   ```

## Stap 5: Supabase Service Setup

Controleer of `lib/services/supabase_service.dart` correct is geconfigureerd:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class SupabaseService {
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: dotenv.env['SUPABASE_URL']!,
      anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
    );
  }
  
  static SupabaseClient get client => Supabase.instance.client;
}
```

## Stap 6: App Runnen

### iOS (macOS vereist):
```bash
flutter run -d ios
```

### Android:
```bash
flutter run -d android
```

### Web (voor testen):
```bash
flutter run -d chrome
```

## Stap 7: Build voor Productie

### iOS Build:
```bash
flutter build ios --release
```

### Android Build:
```bash
flutter build apk --release
# Of voor App Bundle:
flutter build appbundle --release
```

## Stap 8: App Store / Play Store Deployment

### iOS (App Store):
1. Open Xcode project:
   ```bash
   open ios/Runner.xcworkspace
   ```
2. Configureer signing & capabilities
3. Archive en upload via Xcode

### Android (Play Store):
1. Genereer signed APK/AAB
2. Upload naar Google Play Console
3. Volg de Play Store deployment guide

## Stap 9: CI/CD Setup (Optioneel)

Maak `.github/workflows/flutter.yml` voor automatische builds:

```yaml
name: Flutter CI/CD

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.0'
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test
      - run: flutter build apk --release
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Stap 10: Firebase Setup (Optioneel voor Push Notifications)

1. Maak Firebase project aan
2. Voeg iOS en Android apps toe
3. Download configuratiebestanden:
   - `GoogleService-Info.plist` voor iOS
   - `google-services.json` voor Android
4. Plaats in respectievelijke mappen

## Troubleshooting

### Probleem: "Missing Supabase credentials"
**Oplossing**: 
- Controleer of `.env` bestand bestaat
- Zorg dat `flutter_dotenv` is geïnstalleerd
- Laad `.env` in `main.dart`:
  ```dart
  await dotenv.load(fileName: ".env");
  ```

### Probleem: "Build failed"
**Oplossing**: 
- Run `flutter clean`
- Run `flutter pub get`
- Check `flutter doctor` voor issues

### Probleem: "iOS signing errors"
**Oplossing**: 
- Open Xcode project
- Configureer signing in Xcode
- Zorg dat je Apple Developer account is gekoppeld

## Volgende Stappen

Na setup:

1. ✅ Flutter app is geconfigureerd
2. ✅ Supabase is verbonden
3. ✅ App kan lokaal worden getest
4. ✅ Klaar voor App Store / Play Store deployment

Je kunt nu verdergaan met:
- [GitHub Setup](./GITHUB_SETUP.md)
- [Vercel Setup](./VERCEL_SETUP.md) (voor web app)

