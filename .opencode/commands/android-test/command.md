# Android Test Command

Run Android tests with coverage.

## Usage
```
/android-test [type=all]
```

## Test Types
- `unit` — Run `./gradlew test` (JVM unit tests)
- `instrumented` — Run `./gradlew connectedAndroidTest` (device/emulator required)
- `all` — Run both unit + instrumented tests

## Coverage
- Unit test coverage via JaCoCo
- Min coverage target: 80%
- Generate HTML report at `app/build/reports/`

## Verification
- All tests pass (green)
- No flaky tests
- Edge states covered (loading, error, empty)
