---
name: flutter
description: Comprehensive Flutter patterns, architecture, state management, testing, and platform integration for production-grade cross-platform apps.
---

# Flutter Patterns & Best Practices

Comprehensive reference for building production-grade Flutter applications.

## Architecture Patterns

### Clean Architecture Layer Structure

```
lib/
├── core/                    # Shared utilities, constants, theme
├── data/
│   ├── datasources/         # Remote (API) + Local (DB) sources
│   ├── models/              # JSON serializable models (fromJson/toJson)
│   └── repositories/        # Repository implementations
├── domain/
│   ├── entities/            # Pure Dart domain objects
│   ├── repositories/        # Abstract repository interfaces
│   └── usecases/            # Business logic use cases
├── presentation/
│   ├── providers/           # State notifiers (Bloc/Riverpod)
│   ├── screens/             # Screen-level widgets
│   └── widgets/             # Reusable widgets
├── di/                      # Dependency injection setup
├── main.dart
└── app.dart
```

### Repository Pattern (Offline-First)

```dart
abstract class ProductRepository {
  Future<Either<Failure, List<Product>>> getProducts();
  Future<Either<Failure, Product>> getProduct(String id);
}

class ProductRepositoryImpl implements ProductRepository {
  final ProductRemoteDataSource remote;
  final ProductLocalDataSource local;

  ProductRepositoryImpl({required this.remote, required this.local});

  @override
  Future<Either<Failure, List<Product>>> getProducts() async {
    try {
      final remoteProducts = await remote.getProducts();
      await local.cacheProducts(remoteProducts);
      return Right(remoteProducts);
    } on ServerException {
      try {
        final localProducts = await local.getCachedProducts();
        return Right(localProducts);
      } on CacheException {
        return Left(CacheFailure());
      }
    }
  }
}
```

## State Management

### Riverpod

```dart
// Provider definition
final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepositoryImpl(
    remote: ref.watch(productRemoteDataSourceProvider),
    local: ref.watch(productLocalDataSourceProvider),
  );
});

// AsyncNotifierProvider
final productsProvider = AsyncNotifierProvider<ProductsNotifier, List<Product>>(
  ProductsNotifier.new,
);

class ProductsNotifier extends AsyncNotifier<List<Product>> {
  @override
  Future<List<Product>> build() async {
    final repo = ref.read(productRepositoryProvider);
    return repo.getProducts();
  }

  Future<void> addProduct(Product product) async { }
}

// In widget
class ProductList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);
    return productsAsync.when(
      data: (products) => ListView.builder(/*...*/),
      loading: () => const CircularProgressIndicator(),
      error: (e, _) => Text('Error: $e'),
    );
  }
}
```

### Bloc

```dart
// Event
sealed class ProductEvent {}
final class LoadProducts extends ProductEvent {}
final class SearchProducts extends ProductEvent {
  final String query;
  SearchProducts(this.query);
}

// State
sealed class ProductState {}
final class ProductInitial extends ProductState {}
final class ProductLoading extends ProductState {}
final class ProductLoaded extends ProductState {
  final List<Product> products;
  ProductLoaded(this.products);
}
final class ProductError extends ProductState {
  final String message;
  ProductError(this.message);
}

// Bloc
class ProductBloc extends Bloc<ProductEvent, ProductState> {
  final ProductRepository _repository;
  ProductBloc(this._repository) : super(ProductInitial()) {
    on<LoadProducts>(_onLoadProducts);
  }

  Future<void> _onLoadProducts(LoadProducts event, Emitter<ProductState> emit) async {
    emit(ProductLoading());
    final result = await _repository.getProducts();
    result.fold(
      (failure) => emit(ProductError(failure.message)),
      (products) => emit(ProductLoaded(products)),
    );
  }
}
```

## Navigation (GoRouter)

```dart
final router = GoRouter(
  initialLocation: '/products',
  routes: [
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(
          path: '/products',
          builder: (context, state) => const ProductListScreen(),
          routes: [
            GoRoute(
              path: ':id',
              builder: (context, state) => ProductDetailScreen(
                id: state.pathParameters['id']!,
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/cart',
          builder: (context, state) => const CartScreen(),
        ),
      ],
    ),
  ],
);
```

## Testing Strategy

| Layer | Test Type | Tools |
|-------|-----------|-------|
| Domain (entities, usecases) | Unit test | `flutter_test`, `mocktail` |
| Data (repositories, datasources) | Unit + Integration | `mocktail`, `http` mocking |
| Presentation (providers, blocs) | Unit (bloc test) | `bloc_test`, `riverpod` test utils |
| Widgets | Widget test | `WidgetTester`, `Finder` |
| Full app | Integration test | `integration_test` package |
| Visual | Golden test | `golden_toolkit`, `alchemist` |

### Widget Test Example

```dart
testWidgets('ProductList shows loading state', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: BlocProvider(
        create: (_) => ProductBloc(mockRepo)..add(LoadProducts()),
        child: ProductListScreen(),
      ),
    ),
  );

  expect(find.byType(CircularProgressIndicator), findsOneWidget);

  await tester.pumpAndSettle();

  expect(find.text('Product 1'), findsOneWidget);
});
```

## Platform Integration

### Method Channel

```dart
// Dart side
class PlatformService {
  static const _channel = MethodChannel('com.example.app/platform');

  Future<String> getDeviceId() async {
    try {
      return await _channel.invokeMethod('getDeviceId');
    } on PlatformException catch (e) {
      throw PlatformException(code: e.code, message: e.message);
    }
  }
}
```

### Firebase Integration

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}
```

## Material Design 3 Theming

```dart
class AppTheme {
  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF6750A4),
      brightness: Brightness.light,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      fontFamily: 'Inter',
      appBarTheme: AppBarTheme(
        centerTitle: true,
        backgroundColor: colorScheme.surface,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF6750A4),
      brightness: Brightness.dark,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      fontFamily: 'Inter',
    );
  }
}
```

## Performance Best Practices

1. **const constructors** — Always use `const` for widgets that don't change
2. **RepaintBoundary** — Wrap complex animations with `RepaintBoundary`
3. **ListView.builder** — Use builder instead of `ListView(children: [...])`
4. **Image caching** — Use `cached_network_image` or `ImageCache`
5. **Avoid rebuilds** — Use `const`, `Selector` (Bloc), `select` (Riverpod)
6. **Lazy loading** — Use `flutter_bloc` `Emitter` or Riverpod `AsyncNotifier` for pagination
7. **Memory** — Dispose controllers, streams, and subscriptions in `dispose()`
