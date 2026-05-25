# Android Gradle Rules

## Version Catalog (libs.versions.toml)
- Use TOML version catalog in `gradle/` directory
- Group dependencies by category (compose, hilt, room, retrofit, testing)
- Pin Compose BOM version; never pin individual Compose artifacts separately

```toml
[versions]
compose-bom = "2025.01.00"
hilt = "2.51"
room = "2.6.1"
kotlin = "2.0.21"

[libraries]
compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
ui = { group = "androidx.compose.ui", name = "ui" }
material3 = { group = "androidx.compose.material3", name = "material3" }
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-compiler", version.ref = "hilt" }
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

[plugins]
android-application = { id = "com.android.application", version = "8.7.0" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
compose-compiler = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version = "2.0.21-1.0.27" }
```

## Build Variants
- Use `debug` / `release` build types
- Configure `applicationIdSuffix` for debug builds
- Separate signing config for release
- Enable R8/ProGuard for release builds

## Core Dependencies
```kotlin
// compose-bom
implementation(platform(libs.compose.bom))
implementation(libs.ui)
implementation(libs.material3)
implementation(libs.navigation.compose)

// DI
implementation(libs.hilt.android)
ksp(libs.hilt.compiler)

// Room
implementation(libs.room.runtime)
ksp(libs.room.compiler)

// Networking
implementation(libs.retrofit)
implementation(libs.okhttp)
implementation(libs.gson)

// Testing
testImplementation(libs.junit)
androidTestImplementation(libs.compose.ui.test)
```
