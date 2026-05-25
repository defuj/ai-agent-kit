# Android Build Command

Build and install an Android app.

## Usage
```
/android-build [variant=debug]
```

## Behavior
1. Detects Gradle wrapper (`./gradlew`) or system Gradle
2. Runs `./gradlew assemble{Variant}` with version catalog
3. Reports build status and APK/AAB path
4. On success, suggests install command

## Variants
- `debug` — Default, builds unsigned debug APK
- `release` — Builds signed release app bundle
- `bundle` — Builds Android App Bundle (AAB)
- `profile` — Builds profile variant for performance testing

## Verification
- Check Gradle daemon health
- Verify compileSdk/targetSdk alignment
- Validate version catalog consistency
