# Flutter Test Command

Run Flutter tests with coverage.

## Usage
```
/flutter-test [type=all]
```

## Test Types
- `unit` — Run `flutter test test/unit/`
- `widget` — Run `flutter test test/widget/`
- `integration` — Run `flutter test test/integration/`
- `all` — Run all tests with coverage (default)

## Coverage
- `flutter test --coverage`
- Min coverage target: 80%
- Generate LCOV report at `coverage/lcov.info`

## Verification
- All tests pass
- No skipped tests
- Coverage >= 80%
