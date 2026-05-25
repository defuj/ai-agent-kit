# Google Play Release Command

Publish Android app to Google Play Console via GPC.

## Usage
```
/gpc-release [track=internal]
```

## Track Options
- `internal` — Internal testing (default)
- `alpha` — Closed alpha testing
- `beta` — Open beta testing
- `production` — Production rollout

## Pre-flight
1. Run `gpc preflight` — check AAB/APK compliance
2. Verify signing key consistency
3. Check version code is incremented

## Workflow
1. Build AAB: `flutter build appbundle` or `./gradlew bundleRelease`
2. Preflight: `gpc preflight build/app/outputs/bundle/release/app-release.aab`
3. Upload: `gpc publish --track {track}`
4. Release: `gpc release promote --from internal --to alpha` (if promoting)

## Verification
- Upload successful with correct version code
- Release notes populated
- Rollout percentage confirmed
