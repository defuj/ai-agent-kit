# Flutter Build Command

Build a Flutter app for target platform.

## Usage
```
/flutter-build [target=apk]
```

## Targets
- `apk` — Android APK (default)
- `appbundle` — Android App Bundle (AAB) for Play Store
- `ios` — iOS build (requires macOS + Xcode)
- `web` — Web build
- `all` — Build all platforms

## Pre-build Checks
1. `flutter pub get` — dependencies resolved
2. `flutter analyze` — no static analysis issues
3. Version consistency (`pubspec.yaml`)

## Verification
- Build artifacts exist in `build/` directory
- No compile errors
- Analyze clean
