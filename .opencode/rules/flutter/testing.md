# Flutter Testing Rules

## Unit Tests
- Test domain logic (entities, usecases, models) with pure Dart tests
- Mock dependencies with `mocktail` or `mockito`
- Test repository implementations with mocked datasources
- Test Bloc events/states with `bloc_test`:
```dart
blocTest<ProductBloc, ProductState>(
  'emits [Loading, Loaded] when products are fetched',
  build: () => ProductBloc(mockRepo),
  act: (bloc) => bloc.add(LoadProducts()),
  expect: () => [ProductLoading(), ProductLoaded(products)],
);
```

## Widget Tests
- Use `WidgetTester` with `pumpWidget` and `pumpAndSettle`
- Verify widget existence with `Finder`:
  - `find.text('Title')` — by text
  - `find.byType(ProductCard)` — by type
  - `find.byKey(Key('product_card'))` — by key
- Test loading, error, empty, and data states
- Scroll with `scrollUntilVisible`, `drag`

## Integration Tests
- Use `integration_test` package for full app flows
- Test critical user paths (login → browse → cart → checkout)
- Run on emulators and physical devices

## Golden Tests
- Use `golden_toolkit` or `alchemist` for visual regression
- Snapshot widgets at multiple screen sizes
- Store goldens in `test/goldens/` directory

## Command Reference
```bash
flutter test                          # Run all tests
flutter test --coverage               # With coverage report
flutter test test/widget/             # Widget tests only
flutter test --name "product"         # Filter by name
```
