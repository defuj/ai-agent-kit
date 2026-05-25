# Flutter State Management Rules

## Choice of Approach

| Approach | When to Use |
|----------|------------|
| Riverpod | Default for new projects; simpler API, no BuildContext needed |
| Bloc | Complex apps requiring strict unidirectional data flow |
| Provider | Legacy projects; not recommended for new apps |
| ValueNotifier + ListenableBuilder | Trivial local widget state only |

## Riverpod Patterns

### Provider Scoping
- Scoped providers via `family` modifier for parameterized repos
- Use `autoDispose` for ephemeral state (forms, search results)
- Use `keepAlive` for long-lived services (auth, API clients)

```dart
final productProvider = FutureProvider.family<Product, String>((ref, id) {
  return ref.read(productRepositoryProvider).getProduct(id);
});
```

### State Notifier
- Extend `AsyncNotifier` for async state with loading/error/data
- Use `Notifier` for synchronous state
- Never emit error states manually — let `AsyncNotifier` handle exceptions via `.when()`

## Bloc Patterns

### Event Design
- Use sealed classes for events with `const` constructors
- Events carry only primitive/immutable data
- One event per action type (avoid overloaded events with nullable fields)

### State Design
- Use sealed classes for states with `const` constructors
- Include user-friendly error messages in error states
- Never put mutable objects in state classes

### Testing
```dart
blocTest<CounterBloc, int>(
  'emits [1] when increment is added',
  build: () => CounterBloc(),
  act: (bloc) => bloc.add(Increment()),
  expect: () => [1],
);
```

## Anti-Patterns to Avoid
- ❌ Storing BuildContext in state notifiers
- ❌ Calling Provider.of/ref.watch outside widget tree
- ❌ Mixing multiple state management libs in one project
- ❌ Putting UI-only state (selected tab, text field focus) in global providers
- ❌ Neglecting `autoDispose` / `close()` leading to memory leaks
