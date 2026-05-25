# Mobile Performance Rules

## App Startup
- Avoid synchronous initialization on main thread
- Use `SplashScreen` (Android) / launch screen (iOS/Flutter) while warming cache
- Lazy-initialize non-critical services
- Profile startup with Android Studio Profiler / Flutter DevTools

## Rendering Performance
- Keep widget tree shallow — avoid unnecessary nesting
- Use `const` constructors wherever possible
- Wrap expensive widgets in `RepaintBoundary`
- Use `ListView.builder` / `GridView.builder` for large lists
- Avoid `Opacity` and `ClipRect` in scrollables — prefer `AnimatedOpacity` with `visible:`

## Memory Management
- Dispose controllers, streams, subscriptions in `dispose()`
- Use `cached_network_image` for remote images
- Clear `ImageCache` when memory warning received
- Avoid retaining large Bitmaps in Activity/Fragment references
- Use `WeakReference` for long-lived caches

## Battery & Network
- Batch network requests with `connectivity_plus` checks
- Use `WorkManager` (Android) for deferrable background work
- Compress images server-side; never resize large bitmaps on-device
- Implement caching with `Room` (Android) / `Hive` (Flutter)
- Use `ETag` / `If-Modified-Since` headers for HTTP caching

## Tooling
```bash
flutter run --profile      # Profile mode with DevTools
flutter run --release      # Release mode for final perf testing
flutter build apk --split-per-abi   # Smaller APK per architecture
./gradlew assembleRelease --stats   # Android build stats
```
