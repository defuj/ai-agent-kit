---
name: flutter-state-management
description: >-
  Complete Flutter state management and architecture skill covering Bloc (Cubit vs Bloc, BlocProvider, BlocListener,
  BlocBuilder, BlocSelector, BlocConsumer), Riverpod (StateNotifierProvider, NotifierProvider, FutureProvider,
  StreamProvider, ref.watch/read/listen, autoDispose, family), GoRouter (declarative routing, deep links, redirect
  guards, ShellRoute for nested navigation, StatefulShellRoute, typed routes), Dio (interceptors, error handling,
  retry with dio_smart_retry, request cancellation, logging), Clean Architecture (data/domain/presentation layers,
  repository pattern, use cases, dependency injection), and testing (bloc_test, Riverpod test, widget test with
  ProviderScope, mocktail, unit testing repository/use cases). Designed for the Flutter Developer agent building
  production-grade Flutter applications.
license: MIT
metadata:
  author: opencode-agent-kit
  version: "1.0.0"
  target_agent: flutter-developer
  stack:
    - Dart 3
    - Flutter SDK
    - Material Design 3
    - Bloc
    - Riverpod
    - GoRouter
    - Dio
    - Clean Architecture
    - bloc_test
    - mocktail
    - flutter_test
---

# Flutter State Management & Architecture

**Target Agent:** @flutter-developer  
**Stack:** Dart 3 · Flutter SDK · Material Design 3 · Bloc · Riverpod · GoRouter · Dio · Clean Architecture · bloc_test · mocktail  

Comprehensive reference for state management, networking, routing, architecture, and testing in production-grade Flutter applications. Covers the two dominant state management ecosystems (Bloc and Riverpod) along with supporting libraries for routing, networking, and testability.

---

## Table of Contents

1. [Bloc Pattern](#1-bloc-pattern)
2. [Riverpod](#2-riverpod)
3. [GoRouter](#3-gorouter)
4. [Dio](#4-dio)
5. [Clean Architecture](#5-clean-architecture)
6. [Testing](#6-testing)

---

## 1. Bloc Pattern

### 1.1 Cubit vs Bloc

| Aspect | Cubit | Bloc |
|--------|-------|------|
| **Trigger** | Functions/methods directly emit states | Events dispatched via `add()` |
| **Traceability** | Lower — no event log | Higher — every state change has an associated event |
| **Boilerplate** | Minimal — just a class with methods | More — requires separate Event and State classes |
| **Use case** | Simple UI-bound state (counter, form fields, toggle) | Complex business logic where tracking every action matters |
| **Debounce/Throttle** | Manual | Built-in via `on<T>()` transformer override |
| **Testing** | Directly call methods and check state | `blocTest` with event/state matchers |

**When to use Cubit:** Form validation, pagination offset, dark mode toggle, any simple counter/toggle state.

**When to use Bloc:** Authentication flow, checkout wizard, multi-step onboarding, real-time data sync.

### 1.2 Cubit Example

```dart
class CounterCubit extends Cubit<int> {
  CounterCubit() : super(0);

  void increment() => emit(state + 1);
  void decrement() => emit(state - 1);
  void reset() => emit(0);
}
```

### 1.3 Bloc Example

```dart
// --- Event ---
sealed class AuthEvent {
  const AuthEvent();
}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;
  const LoginRequested({required this.email, required this.password});
}

class LogoutRequested extends AuthEvent {
  const LogoutRequested();
}

// --- State ---
sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  final User user;
  const AuthAuthenticated(this.user);
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
}

// --- Bloc ---
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase _loginUseCase;

  AuthBloc(this._loginUseCase) : super(const AuthInitial()) {
    on<LoginRequested>(_onLoginRequested, transformer: (events, mapper) =>
        events.droppable()); // Prevent duplicate login spam
    on<LogoutRequested>(_onLogoutRequested);
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _loginUseCase(
      LoginParams(email: event.email, password: event.password),
    );
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (user) => emit(AuthAuthenticated(user)),
    );
  }

  void _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) {
    emit(const AuthInitial());
  }
}
```

### 1.4 BlocProvider (Dependency Injection)

`BlocProvider` provides a Bloc/Cubit to the widget tree. It automatically disposes the bloc when the widget is removed.

```dart
// Per-route scoped (disposed when route pops)
BlocProvider(
  create: (context) => CounterCubit(),
  child: CounterScreen(),
);

// App-wide singleton
MaterialApp(
  home: BlocProvider<AuthBloc>(
    create: (context) => AuthBloc(sl()),
    child: const AppShell(),
  ),
);

// Multi-provider for convenience
MultiBlocProvider(
  providers: [
    BlocProvider<AuthBloc>(create: (_) => AuthBloc(sl())),
    BlocProvider<CounterCubit>(create: (_) => CounterCubit()),
    BlocProvider<ThemeCubit>(create: (_) => ThemeCubit()),
  ],
  child: const AppShell(),
);
```

### 1.5 BlocBuilder

Rebuilds the widget tree whenever the Bloc state changes. Use `buildWhen` to filter rebuilds.

```dart
BlocBuilder<CounterCubit, int>(
  buildWhen: (previous, current) => current % 2 == 0, // Only rebuild on even numbers
  builder: (context, count) {
    return Text('Count: $count');
  },
);
```

### 1.6 BlocListener

Executes side effects (navigation, snackbar, dialog) once per state change. Does **not** rebuild the widget.

```dart
BlocListener<AuthBloc, AuthState>(
  listener: (context, state) {
    switch (state) {
      case AuthAuthenticated():
        context.go('/home');
      case AuthError(:final message):
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Colors.red),
        );
      case _:
        break;
    }
  },
  child: const LoginForm(),
);
```

### 1.7 BlocConsumer = BlocBuilder + BlocListener

```dart
BlocConsumer<AuthBloc, AuthState>(
  listener: (context, state) {
    if (state is AuthAuthenticated) context.go('/home');
  },
  builder: (context, state) {
    return switch (state) {
      AuthLoading() => const CircularProgressIndicator(),
      AuthError(:final message) => Text(message),
      _ => const LoginForm(),
    };
  },
);
```

### 1.8 BlocSelector

Rebuilds only when a derived value from the state changes. More efficient than BlocBuilder when you only need a slice of state.

```dart
BlocSelector<CartBloc, CartState, int>(
  selector: (state) => state.items.fold(0, (sum, item) => sum + item.quantity),
  builder: (context, totalQuantity) {
    return Badge(
      label: Text('$totalQuantity'),
      child: IconButton(icon: const Icon(Icons.shopping_cart), onPressed: () {}),
    );
  },
);
```

### 1.9 Event Transformers

Control how events are processed (debounce, throttle, droppable, restartable, sequential).

```dart
class SearchBloc extends Bloc<SearchEvent, SearchState> {
  SearchBloc() : super(const SearchInitial()) {
    on<SearchQueryChanged>(_onQueryChanged,
      transformer: debounce(const Duration(milliseconds: 300)),
    );
  }
}
```

---

## 2. Riverpod

### 2.1 Provider Types Overview

| Provider | Use Case | Auto-Dispose? |
|----------|----------|---------------|
| `Provider` | Synchronous dependencies (repos, config) | `autoDispose` variant |
| `NotifierProvider` | Mutable synchronous state (replace StateNotifierProvider in newer Riverpod) | `autoDispose` variant |
| `StateNotifierProvider` | Mutable synchronous state with `StateNotifier` | `autoDispose` variant |
| `FutureProvider` | One-shot async data (fetch from API on page load) | `autoDispose` variant |
| `StreamProvider` | Real-time data (WebSocket, Firestore stream) | `autoDispose` variant |
| `StateProvider` | Simple mutable value (counter, text field) | `autoDispose` variant |
| `ChangeNotifierProvider` | Interop with existing ChangeNotifier code | `autoDispose` variant |

**Rule of thumb:**
- Prefer `NotifierProvider` for new code (cleaner API than StateNotifierProvider).
- Use `autoDispose` for ephemeral screen-level state that should be garbage collected.
- Use `family` to create parameterized providers (e.g., `productProvider(id)`).

### 2.2 NotifierProvider (Recommended for mutable state)

```dart
// --- Notifier ---
class CounterNotifier extends Notifier<int> {
  @override
  int build() => 0; // Initial value

  void increment() => state = state + 1;
  void decrement() => state = state - 1;
  void reset() => state = 0;
}

// --- Provider ---
final counterProvider = NotifierProvider<CounterNotifier, int>(
  CounterNotifier.new,
);
```

### 2.3 StateNotifierProvider (Legacy pattern)

```dart
// --- StateNotifier ---
class AuthNotifier extends StateNotifier<AuthState> {
  final LoginUseCase _loginUseCase;

  AuthNotifier(this._loginUseCase) : super(const AuthInitial());

  Future<void> login(String email, String password) async {
    state = const AuthLoading();
    final result = await _loginUseCase(
      LoginParams(email: email, password: password),
    );
    result.fold(
      (failure) => state = AuthError(failure.message),
      (user) => state = AuthAuthenticated(user),
    );
  }

  void logout() => state = const AuthInitial();
}

// --- Provider ---
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(loginUseCaseProvider));
});
```

### 2.4 FutureProvider

```dart
final productListProvider = FutureProvider.autoDispose<List<Product>>((ref) async {
  final repository = ref.watch(productRepositoryProvider);
  return repository.getProducts();
});
```

**Usage with AsyncValue:**

```dart
final productsAsync = ref.watch(productListProvider);

return productsAsync.when(
  data: (products) => ProductListView(products: products),
  loading: () => const ShimmerList(),
  error: (err, stack) => ErrorRetryWidget(
    message: err.toString(),
    onRetry: () => ref.invalidate(productListProvider),
  ),
);
```

### 2.5 StreamProvider

```dart
final messageStreamProvider = StreamProvider.autoDispose<List<Message>>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return repo.messagesStream();
});
```

### 2.6 ref.watch / ref.read / ref.listen

| Method | Behavior | Where to use |
|--------|----------|-------------|
| `ref.watch(provider)` | Rebuilds the widget when provider value changes | Inside `build()` of ConsumerWidget or Consumer |
| `ref.read(provider)` | Reads the value once, **does not** rebuild | Inside callbacks (onPressed, initState-like logic) |
| `ref.listen(provider, callback)` | Runs a side effect when value changes (snackbar, navigation) | For one-shot side effects (snackbar, push route) |

```dart
class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // watch: rebuilds when auth state changes
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: authState.when(
        data: (state) => switch (state) {
          AuthInitial() => LoginForm(
            onLogin: (email, password) {
              // read: one-shot, no rebuild needed
              ref.read(authProvider.notifier).login(email, password);
            },
          ),
          AuthLoading() => const LoadingOverlay(),
          AuthError(:final message) => ErrorCard(message: message),
          AuthAuthenticated() => const HomeScreen(),
        },
        loading: () => const SplashScreen(),
        error: (e, _) => ErrorCard(message: e.toString()),
      ),
    );
  }
}
```

**Using ref.listen for side effects:**

```dart
class AuthListener extends ConsumerWidget {
  const AuthListener({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen<AsyncValue<AuthState>>(authProvider, (previous, next) {
      next.whenOrNull(
        data: (state) {
          if (state is AuthAuthenticated) {
            context.go('/home');
          }
        },
      );
    });
    // Return the actual UI tree
    return const SizedBox.shrink();
  }
}
```

### 2.7 Provider Modifiers

| Modifier | Purpose | Example |
|----------|---------|---------|
| `.autoDispose` | Dispose state when no longer watched | `FutureProvider.autoDispose` |
| `.family` | Parameterize a provider | `productProvider(id)` |

**Family example:**

```dart
final productProvider = FutureProvider.autoDispose.family<Product, String>((ref, id) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getProduct(id);
});

// Usage in widget:
final product = ref.watch(productProvider('abc-123'));
```

### 2.8 Riverpod with Code Generation (riverpod_generator)

```dart
// --- product_providers.dart ---
part 'product_providers.g.dart';

@riverpod
Future<List<Product>> products(ProductsRef ref) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getProducts();
}

@riverpod
Future<Product> product(ProductRef ref, String id) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getProduct(id);
}

@riverpod
class Cart extends _$Cart {
  @override
  List<CartItem> build() => [];

  void addItem(Product product, int quantity) {
    state = [...state, CartItem(product: product, quantity: quantity)];
  }

  void removeItem(String productId) {
    state = state.where((item) => item.product.id != productId).toList();
  }

  double get total => state.fold(0, (sum, item) => sum + item.total);
}
```

### 2.9 ProviderObserver (Logging & Debugging)

```dart
class LoggerObserver extends ProviderObserver {
  @override
  void didUpdateProvider(
    ProviderBase provider,
    Object? previousValue,
    Object? newValue,
    ProviderContainer container,
  ) {
    debugPrint('[${provider.name ?? provider.runtimeType}] $previousValue → $newValue');
  }
}

// In main.dart:
ProviderScope(
  observers: [LoggerObserver()],
  child: const MyApp(),
);
```

---

## 3. GoRouter

### 3.1 Declarative Routing Setup

```dart
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/products',
    debugLogDiagnostics: true,
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/products',
            name: 'products',
            builder: (context, state) => const ProductListScreen(),
            routes: [
              GoRoute(
                path: ':productId',
                name: 'product-detail',
                builder: (context, state) => ProductDetailScreen(
                  productId: state.pathParameters['productId']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/cart',
            name: 'cart',
            builder: (context, state) => const CartScreen(),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
    ],
  );
});
```

### 3.2 Deep Links

GoRouter handles deep links automatically on Android (AndroidManifest intent filters) and iOS (Associated Domains).

```dart
GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/product/:productId',
      builder: (context, state) => ProductDetailScreen(
        productId: state.pathParameters['productId']!,
      ),
    ),
    GoRoute(
      path: '/profile/:userId',
      builder: (context, state) => ProfileScreen(
        userId: state.pathParameters['userId']!,
      ),
    ),
  ],
);
```

**Android manifest (`AndroidManifest.xml`):**

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data
    android:scheme="https"
    android:host="example.com"
    android:pathPrefix="/product" />
</intent-filter>
```

**iOS (`Info.plist`):**

```xml
<key>FlutterDeepLinkingEnabled</key>
<true/>
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>https</string>
    </array>
  </dict>
</array>
```

### 3.3 Redirect Guards

Use `redirect` to enforce auth or conditional navigation. The redirect callback runs on every navigation and provider change.

```dart
GoRouter(
  redirect: (context, state) {
    final authState = ref.read(authProvider); // or use provider subscription
    final isLoggedIn = authState is AuthAuthenticated;
    final isOnLoginPage = state.matchedLocation == '/login';

    // Not logged in → redirect to login (except if already on login)
    if (!isLoggedIn && !isOnLoginPage) return '/login';

    // Already logged in and on login page → redirect to home
    if (isLoggedIn && isOnLoginPage) return '/products';

    // No redirect
    return null;
  },
  routes: [
    GoRoute(path: '/login', ...),
    GoRoute(path: '/products', ...),
    GoRoute(path: '/profile', ...),
  ],
);
```

**Reactive redirect with ref.watch:**

```dart
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    redirect: (context, state) {
      final isLoggedIn = authState is AsyncData<AuthAuthenticated>;
      // ...same pattern as above
    },
    ...
  );
});
```

### 3.4 ShellRoute for Nested Navigation (Bottom Tab Persistence)

```dart
class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child, // GoRouter renders the matched child here
      bottomNavigationBar: NavigationBar(
        selectedIndex: _calculateSelectedIndex(context),
        onDestinationSelected: (index) => _onItemTapped(index, context),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Products'),
          NavigationDestination(icon: Icon(Icons.shopping_cart), label: 'Cart'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/cart')) return 1;
    if (location.startsWith('/profile')) return 2;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0: context.go('/products');
      case 1: context.go('/cart');
      case 2: context.go('/profile');
    }
  }
}
```

### 3.5 StatefulShellRoute (Preserve Scroll Position per Tab)

```dart
final router = GoRouter(
  initialLocation: '/products',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return AppShell(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/products',
              builder: (context, state) => const ProductListScreen(),
              routes: [
                GoRoute(
                  path: ':productId',
                  builder: (context, state) => ProductDetailScreen(
                    productId: state.pathParameters['productId']!,
                  ),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/cart',
              builder: (context, state) => const CartScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);

// AppShell consumes navigationShell
class AppShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  const AppShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Products'),
          NavigationDestination(icon: Icon(Icons.shopping_cart), label: 'Cart'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
```

### 3.6 Navigation Helpers

```dart
// Push a named route
context.goNamed('product-detail', pathParameters: {'productId': productId});

// Push with extra data (not serialized in URL — use sparingly)
context.push('/product/${product.id}', extra: product);

// Pop back
context.pop();

// Replace current route
context.go('/products');

// Go back or to fallback
context.popUntilRoot();
```

### 3.7 Query Parameters

```dart
GoRoute(
  path: '/products',
  builder: (context, state) {
    final queryParams = state.uri.queryParameters;
    final category = queryParams['category'];
    final sort = queryParams['sort'] ?? 'newest';
    return ProductListScreen(category: category, sort: sort);
  },
);

// Navigate with query params
context.goNamed('products', queryParameters: {
  'category': 'electronics',
  'sort': 'price_asc',
});
```

---

## 4. Dio

### 4.1 Dio Client Setup

```dart
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  dio.interceptors.addAll([
    AuthInterceptor(ref),
    LogInterceptor(requestBody: true, responseBody: true),
    RetryInterceptor(dio: dio),
  ]);

  return dio;
});
```

### 4.2 Interceptors

**Auth Interceptor (attach token):**

```dart
class AuthInterceptor extends Interceptor {
  final Ref _ref;

  AuthInterceptor(this._ref);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _ref.read(secureStorageProvider).getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Attempt token refresh
      try {
        final newToken = await _ref.read(authRepositoryProvider).refreshToken();
        await _ref.read(secureStorageProvider).saveToken(newToken);
        // Retry original request with new token
        err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
        final response = await Dio(BaseOptions()).fetch(err.requestOptions);
        handler.resolve(response);
        return;
      } catch (_) {
        // Refresh failed — force logout
        _ref.read(authProvider.notifier).logout();
        _ref.read(routerProvider).go('/login');
      }
    }
    handler.next(err);
  }
}
```

**Log Interceptor:**

```dart
class LogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestHandlerInterceptor handler) {
    debugPrint('[DIO] ${options.method} ${options.path}');
    debugPrint('[DIO] Headers: ${options.headers}');
    debugPrint('[DIO] Body: ${options.data}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('[DIO] ${response.statusCode} ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint('[DIO] ERROR ${err.type} ${err.message}');
    handler.next(err);
  }
}
```

### 4.3 Error Handling (Structured)

```dart
class NetworkExceptions implements Exception {
  final String message;
  final int? statusCode;
  final DioException? originalError;

  const NetworkExceptions({
    required this.message,
    this.statusCode,
    this.originalError,
  });

  factory NetworkExceptions.fromDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkExceptions(message: 'Connection timed out. Please try again.');
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final body = e.response?.data;
        final serverMessage = body is Map ? body['message']?.toString() : null;
        return NetworkExceptions(
          message: serverMessage ?? _statusCodeMessage(statusCode),
          statusCode: statusCode,
          originalError: e,
        );
      case DioExceptionType.cancel:
        return NetworkExceptions(message: 'Request was cancelled.');
      case DioExceptionType.connectionError:
        return NetworkExceptions(message: 'No internet connection.');
      default:
        return NetworkExceptions(message: 'Something went wrong.');
    }
  }

  static String _statusCodeMessage(int? code) {
    return switch (code) {
      400 => 'Bad request.',
      401 => 'Unauthorized. Please log in again.',
      403 => 'Access denied.',
      404 => 'Resource not found.',
      422 => 'Validation error.',
      500 => 'Server error. Please try again later.',
      _ => 'Unexpected server error ($code).',
    };
  }
}

// Usage in repository
Future<Either<Failure, List<Product>>> getProducts() async {
  try {
    final response = await dio.get('/products');
    final products = (response.data as List).map((json) => Product.fromJson(json)).toList();
    return Right(products);
  } on DioException catch (e) {
    return Left(NetworkFailure(NetworkExceptions.fromDioException(e)));
  }
}
```

### 4.4 Retry with dio_smart_retry

```dart
import 'package:dio_smart_retry/dio_smart_retry.dart';

dio.interceptors.add(
  RetryInterceptor(
    dio: dio,
    logPrint: debugPrint,
    retries: 3,
    retryDelays: const [
      Duration(seconds: 1),
      Duration(seconds: 2),
      Duration(seconds: 3),
    ],
    retryableExtraStatuses: {408, 429, 500, 502, 503},
  ),
);
```

**Manual retry logic (without package):**

```dart
Future<Either<Failure, T>> _retryRequest<T>(Future<T> Function() request, {int maxRetries = 3}) async {
  for (int attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return Right(await request());
    } on DioException catch (e) {
      if (attempt == maxRetries - 1 || e.type == DioExceptionType.badResponse && e.response?.statusCode != null && ![408, 429, 500, 502, 503].contains(e.response!.statusCode)) {
        return Left(NetworkFailure(NetworkExceptions.fromDioException(e)));
      }
      await Future.delayed(Duration(seconds: (attempt + 1) * 2));
    }
  }
  return Left(NetworkFailure(const NetworkExceptions(message: 'Max retries exceeded.')));
}
```

### 4.5 Request Cancellation

```dart
class ApiService {
  final Dio _dio;
  final Map<String, CancelToken> _cancelTokens = {};

  ApiService(this._dio);

  Future<Response> get(String path, {String? tag, CancelToken? cancelToken}) async {
    final token = cancelToken ?? CancelToken();
    if (tag != null) _cancelTokens[tag] = token as CancelToken;

    return _dio.get(path, cancelToken: token);
  }

  void cancelRequest(String tag) {
    _cancelTokens[tag]?.cancel();
    _cancelTokens.remove(tag);
  }

  void cancelAllRequests() {
    for (final token in _cancelTokens.values) {
      token.cancel();
    }
    _cancelTokens.clear();
  }
}

// Usage in a Cubit
class SearchCubit extends Cubit<SearchState> {
  final ApiService _api;

  SearchCubit(this._api) : super(const SearchInitial());

  void search(String query) {
    _api.cancelRequest('search'); // Cancel previous request
    emit(const SearchLoading());
    _api.get('/search', queryParameters: {'q': query}, tag: 'search')
      .then(...);
  }
}
```

### 4.6 Dio Adapter for Testing

```dart
// test/mocks/mock_dio_adapter.dart
void setUpMockDioAdapter(Dio dio, {Map<String, Response>? responses}) {
  dio.httpClientAdapter = MockAdapter(requestCallback: (request) {
    final key = '${request.method}:${request.path}';
    if (responses?.containsKey(key) == true) {
      return responses![key];
    }
    return Response(requestOptions: request, statusCode: 404);
  });
}
```

---

## 5. Clean Architecture

### 5.1 Layered Structure

```
lib/
├── core/
│   ├── constants/           # API URLs, app config, enums
│   ├── error/               # Failure class, exceptions, error handling
│   ├── network/             # Dio client, interceptors, API service
│   ├── theme/               # Material 3 theme, colors, typography
│   └── utils/               # Extensions, helpers, typedefs
├── data/
│   ├── datasources/         # Remote (API) and Local (DB) data sources
│   ├── models/              # Data models with fromJson/toJson
│   └── repositories/        # Repository implementations
├── domain/
│   ├── entities/            # Pure domain objects (no framework deps)
│   ├── repositories/        # Abstract repository interfaces
│   └── usecases/            # Business logic use cases
├── presentation/
│   ├── providers/           # Blocs / StateNotifiers / Notifiers
│   ├── screens/             # Full-screen widgets
│   └── widgets/             # Reusable UI components
├── di/                      # Dependency injection (GetIt / Riverpod)
├── main.dart                # App entry point
└── app.dart                 # App widget with ProviderScope / MultiBlocProvider + GoRouter
```

### 5.2 Domain Layer (Pure Dart — No Framework Dependencies)

**Entity:**

```dart
// domain/entities/product.dart
class Product {
  final String id;
  final String name;
  final double price;
  final String? imageUrl;

  const Product({
    required this.id,
    required this.name,
    required this.price,
    this.imageUrl,
  });

  Product copyWith({...}) => Product(
    id: id,
    name: name ?? this.name,
    price: price ?? this.price,
    imageUrl: imageUrl ?? this.imageUrl,
  );
}
```

**Repository Interface:**

```dart
// domain/repositories/product_repository.dart
abstract class ProductRepository {
  Future<Either<Failure, List<Product>>> getProducts({String? category, String? sort});
  Future<Either<Failure, Product>> getProduct(String id);
  Future<Either<Failure, Unit>> addToCart(Product product, int quantity);
}
```

**Use Case:**

```dart
// domain/usecases/get_products.dart
class GetProductsUseCase {
  final ProductRepository _repository;

  GetProductsUseCase(this._repository);

  Future<Either<Failure, List<Product>>> call({String? category, String? sort}) {
    return _repository.getProducts(category: category, sort: sort);
  }
}
```

**Failure class (either pattern):**

```dart
// core/error/failure.dart
sealed class Failure {
  final String message;
  const Failure(this.message);
}

class ServerFailure extends Failure {
  final int? statusCode;
  const ServerFailure({required String message, this.statusCode}) : super(message);
}

class CacheFailure extends Failure {
  const CacheFailure({super.message = 'Cached data not found.'});
}

class NetworkFailure extends Failure {
  const NetworkFailure({required String message}) : super(message);
}
```

### 5.3 Data Layer

**Model (extends Entity):**

```dart
// data/models/product_model.dart
class ProductModel extends Product {
  const ProductModel({
    required super.id,
    required super.name,
    required super.price,
    super.imageUrl,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] as String,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      imageUrl: json['image_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'price': price,
    'image_url': imageUrl,
  };
}
```

**Data Source:**

```dart
// data/datasources/product_remote_datasource.dart
abstract class ProductRemoteDataSource {
  Future<List<ProductModel>> getProducts({String? category, String? sort});
  Future<ProductModel> getProduct(String id);
}

class ProductRemoteDataSourceImpl implements ProductRemoteDataSource {
  final Dio _dio;

  ProductRemoteDataSourceImpl(this._dio);

  @override
  Future<List<ProductModel>> getProducts({String? category, String? sort}) async {
    final response = await _dio.get('/products', queryParameters: {
      if (category != null) 'category': category,
      if (sort != null) 'sort': sort,
    });
    return (response.data as List).map((json) => ProductModel.fromJson(json)).toList();
  }

  @override
  Future<ProductModel> getProduct(String id) async {
    final response = await _dio.get('/products/$id');
    return ProductModel.fromJson(response.data);
  }
}
```

**Repository Implementation:**

```dart
// data/repositories/product_repository_impl.dart
class ProductRepositoryImpl implements ProductRepository {
  final ProductRemoteDataSource _remoteDataSource;
  final ProductLocalDataSource _localDataSource;
  final NetworkInfo _networkInfo;

  ProductRepositoryImpl({
    required ProductRemoteDataSource remoteDataSource,
    required ProductLocalDataSource localDataSource,
    required NetworkInfo networkInfo,
  });

  @override
  Future<Either<Failure, List<Product>>> getProducts({String? category, String? sort}) async {
    if (await _networkInfo.isConnected) {
      try {
        final models = await _remoteDataSource.getProducts(category: category, sort: sort);
        await _localDataSource.cacheProducts(models); // Save for offline
        return Right(models);
      } on DioException catch (e) {
        return Left(ServerFailure(
          message: NetworkExceptions.fromDioException(e).message,
          statusCode: e.response?.statusCode,
        ));
      }
    } else {
      try {
        final cached = await _localDataSource.getCachedProducts();
        return Right(cached);
      } on CacheException {
        return Left(const CacheFailure());
      }
    }
  }
}
```

### 5.4 Presentation Layer

**Provider/Bloc wiring:**

```dart
// presentation/providers/product_providers.dart (Riverpod)
final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepositoryImpl(
    remoteDataSource: ref.watch(productRemoteDataSourceProvider),
    localDataSource: ref.watch(productLocalDataSourceProvider),
    networkInfo: ref.watch(networkInfoProvider),
  );
});

final getProductsUseCaseProvider = Provider<GetProductsUseCase>((ref) {
  return GetProductsUseCase(ref.watch(productRepositoryProvider));
});

final productListProvider = FutureProvider.autoDispose<List<Product>>((ref) async {
  final useCase = ref.watch(getProductsUseCaseProvider);
  final result = await useCase();
  return result.fold(
    (failure) => throw Exception(failure.message),
    (products) => products,
  );
});
```

### 5.5 Dependency Injection with GetIt (Alternative to Riverpod DI)

```dart
// di/injection_container.dart
final sl = GetIt.instance;

Future<void> initDependencies() async {
  // Core
  sl.registerLazySingleton<Dio>(() => createDioClient());
  sl.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl(sl()));

  // Data sources
  sl.registerLazySingleton<ProductRemoteDataSource>(
    () => ProductRemoteDataSourceImpl(sl()),
  );
  sl.registerLazySingleton<ProductLocalDataSource>(
    () => ProductLocalDataSourceImpl(sl()),
  );

  // Repository
  sl.registerLazySingleton<ProductRepository>(
    () => ProductRepositoryImpl(
      remoteDataSource: sl(),
      localDataSource: sl(),
      networkInfo: sl(),
    ),
  );

  // Use cases
  sl.registerLazySingleton(() => GetProductsUseCase(sl()));

  // Blocs
  sl.registerFactory(() => ProductBloc(sl()));
}
```

---

## 6. Testing

### 6.1 Bloc Testing (bloc_test)

**pubspec.yaml:**

```yaml
dev_dependencies:
  bloc_test: ^9.1.7
  mocktail: ^1.0.4
  flutter_test:
    sdk: flutter
```

**Test a Cubit:**

```dart
// test/unit/presentation/bloc/counter_cubit_test.dart
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CounterCubit', () {
    late CounterCubit cubit;

    setUp(() {
      cubit = CounterCubit();
    });

    tearDown(() {
      cubit.close();
    });

    test('initial state is 0', () {
      expect(cubit.state, equals(0));
    });

    blocTest<CounterCubit, int>(
      'emits [1] when increment() is called',
      build: () => CounterCubit(),
      act: (cubit) => cubit.increment(),
      expect: () => [1],
    );

    blocTest<CounterCubit, int>(
      'emits [1, 2, 2, 1, 0] for increment, increment, no-op, decrement, reset',
      build: () => CounterCubit(),
      act: (cubit) {
        cubit.increment();
        cubit.increment();
        cubit.increment(); // Already 3rd call to verify state
        cubit.decrement();
        cubit.reset();
      },
      expect: () => [1, 2, 3, 2, 0],
    );
  });
}
```

**Test a Bloc (with mocked use case):**

```dart
class MockGetProductsUseCase extends Mock implements GetProductsUseCase {}

void main() {
  late MockGetProductsUseCase mockUseCase;
  late ProductBloc bloc;

  setUp(() {
    mockUseCase = MockGetProductsUseCase();
    bloc = ProductBloc(mockUseCase);
  });

  tearDown(() {
    bloc.close();
  });

  group('ProductBloc', () {
    blocTest<ProductBloc, ProductState>(
      'emits [ProductLoading, ProductLoaded] when products are fetched successfully',
      build: () {
        when(() => mockUseCase()).thenAnswer(
          (_) async => Right([Product(id: '1', name: 'Test', price: 9.99)]),
        );
        return bloc;
      },
      act: (bloc) => bloc.add(const LoadProducts()),
      expect: () => [
        const ProductLoading(),
        isA<ProductLoaded>().having((s) => s.products.first.name, 'name', 'Test'),
      ],
    );

    blocTest<ProductBloc, ProductState>(
      'emits [ProductLoading, ProductError] when fetch fails',
      build: () {
        when(() => mockUseCase()).thenAnswer(
          (_) async => Left(ServerFailure(message: 'Server error')),
        );
        return bloc;
      },
      act: (bloc) => bloc.add(const LoadProducts()),
      expect: () => [
        const ProductLoading(),
        isA<ProductError>().having((s) => s.message, 'message', 'Server error'),
      ],
    );
  });
}
```

### 6.2 Riverpod Testing

**pubspec.yaml:**

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  mocktail: ^1.0.4
```

**Test a NotifierProvider:**

```dart
// test/unit/presentation/providers/counter_notifier_test.dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CounterNotifier', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('initial value is 0', () {
      expect(container.read(counterProvider), equals(0));
    });

    test('increment increases count by 1', () {
      container.read(counterProvider.notifier).increment();
      expect(container.read(counterProvider), equals(1));
    });

    test('decrement decreases count by 1', () {
      container.read(counterProvider.notifier).increment();
      container.read(counterProvider.notifier).increment();
      container.read(counterProvider.notifier).decrement();
      expect(container.read(counterProvider), equals(1));
    });
  });
}
```

**Test a FutureProvider with mocked repository:**

```dart
// test/unit/presentation/providers/product_list_provider_test.dart
class MockProductRepository extends Mock implements ProductRepository {}

void main() {
  late MockProductRepository mockRepository;

  setUp(() {
    mockRepository = MockProductRepository();
  });

  test('productListProvider returns products when repository succeeds', () async {
    when(() => mockRepository.getProducts()).thenAnswer(
      (_) async => Right([Product(id: '1', name: 'Test', price: 9.99)]),
    );

    final container = ProviderContainer(overrides: [
      productRepositoryProvider.overrideWithValue(mockRepository),
    ]);

    final productsAsync = container.read(productListProvider);
    expect(productsAsync, const AsyncValue<List<Product>>.loading());

    // Wait for async resolution
    await container.read(productListProvider.future);
    final result = container.read(productListProvider);
    expect(result.hasValue, isTrue);
    expect(result.value!.length, equals(1));
    expect(result.value!.first.name, equals('Test'));

    container.dispose();
  });

  test('productListProvider returns error when repository fails', () async {
    when(() => mockRepository.getProducts()).thenAnswer(
      (_) async => Left(ServerFailure(message: 'API error')),
    );

    final container = ProviderContainer(overrides: [
      productRepositoryProvider.overrideWithValue(mockRepository),
    ]);

    await expectLater(
      () => container.read(productListProvider.future),
      throwsA(isA<Exception>()),
    );

    container.dispose();
  });
}
```

### 6.3 Widget Testing (with ProviderScope)

```dart
// test/widget/screens/product_list_screen_test.dart
Widget createTestWidget({ProviderContainer? container, Override? override}) {
  return ProviderScope(
    overrides: override != null ? [override] : [],
    child: MaterialApp.router(
      routerConfig: createTestRouter(),
      title: 'Test App',
    ),
  );
}

void main() {
  group('ProductListScreen', () {
    late MockProductRepository mockRepository;

    setUp(() {
      mockRepository = MockProductRepository();
    });

    testWidgets('shows loading indicator initially', (tester) async {
      when(() => mockRepository.getProducts()).thenAnswer(
        (_) async => Right<ProductFailure, List<Product>>([]),
      );

      await tester.pumpWidget(createTestWidget(
        override: productRepositoryProvider.overrideWithValue(mockRepository),
      ));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows product list when data is loaded', (tester) async {
      final products = [
        Product(id: '1', name: 'Widget A', price: 19.99),
        Product(id: '2', name: 'Gadget B', price: 29.99),
      ];

      when(() => mockRepository.getProducts()).thenAnswer(
        (_) async => Right<ProductFailure, List<Product>>(products),
      );

      await tester.pumpWidget(createTestWidget(
        override: productRepositoryProvider.overrideWithValue(mockRepository),
      ));

      // Wait for async
      await tester.pumpAndSettle();

      expect(find.text('Widget A'), findsOneWidget);
      expect(find.text('Gadget B'), findsOneWidget);
    });

    testWidgets('shows error message on failure', (tester) async {
      when(() => mockRepository.getProducts()).thenAnswer(
        (_) async => Left(ServerFailure(message: 'API error')),
      );

      await tester.pumpWidget(createTestWidget(
        override: productRepositoryProvider.overrideWithValue(mockRepository),
      ));

      await tester.pumpAndSettle();

      expect(find.textContaining('API error'), findsOneWidget);
    });
  });
}
```

### 6.4 Mocktail Patterns

```dart
// Mocking classes
class MockProductRepository extends Mock implements ProductRepository {}
class MockDio extends Mock implements Dio {}
class MockSharedPreferences extends Mock implements SharedPreferences {}

// Mocking async methods
when(() => mockRepository.getProducts()).thenAnswer(
  (_) async => Right([Product(id: '1', name: 'Test', price: 9.99)]),
);

// Mocking streams
when(() => mockRepository.observeProducts()).thenAnswer(
  (_) => Stream.value([Product(id: '1', name: 'Live', price: 9.99)]),
);

// Mocking void methods
when(() => mockRepository.deleteProduct('1')).thenAnswer((_) async => const Right(unit));

// Verify interactions
verify(() => mockRepository.getProducts()).called(1);
verify(() => mockRepository.getProduct('1')).called(1);
verifyNoMoreInteractions(mockRepository);

// Capture arguments
final captured = verify(() => mockRepository.addToCart(captureAny(), captureAny())).captured;
expect((captured[0] as Product).name, 'Test');
expect(captured[1], 2);
```

### 6.5 Unit Testing Use Cases and Repositories

```dart
// test/unit/domain/usecases/get_products_test.dart
void main() {
  late GetProductsUseCase useCase;
  late MockProductRepository mockRepository;

  setUp(() {
    mockRepository = MockProductRepository();
    useCase = GetProductsUseCase(mockRepository);
  });

  test('should return products from repository', () async {
    final products = [Product(id: '1', name: 'Test', price: 9.99)];
    when(() => mockRepository.getProducts()).thenAnswer(
      (_) async => Right(products),
    );

    final result = await useCase();

    expect(result, Right(products));
    verify(() => mockRepository.getProducts()).called(1);
  });

  test('should return failure when repository fails', () async {
    when(() => mockRepository.getProducts()).thenAnswer(
      (_) async => Left(ServerFailure(message: 'Server error')),
    );

    final result = await useCase();

    expect(result, Left(ServerFailure(message: 'Server error')));
  });
}
```

```dart
// test/unit/data/repositories/product_repository_impl_test.dart
void main() {
  late ProductRepositoryImpl repository;
  late MockProductRemoteDataSource mockRemote;
  late MockProductLocalDataSource mockLocal;
  late MockNetworkInfo mockNetworkInfo;

  setUp(() {
    mockRemote = MockProductRemoteDataSource();
    mockLocal = MockProductLocalDataSource();
    mockNetworkInfo = MockNetworkInfo();
    repository = ProductRepositoryImpl(
      remoteDataSource: mockRemote,
      localDataSource: mockLocal,
      networkInfo: mockNetworkInfo,
    );
  });

  group('getProducts', () {
    const tCategory = 'electronics';
    final tModels = [ProductModel(id: '1', name: 'Test', price: 9.99)];

    test('should return remote data when online', () async {
      when(() => mockNetworkInfo.isConnected).thenAnswer((_) async => true);
      when(() => mockRemote.getProducts(category: tCategory)).thenAnswer((_) async => tModels);
      when(() => mockLocal.cacheProducts(tModels)).thenAnswer((_) async => {});

      final result = await repository.getProducts(category: tCategory);

      expect(result, Right(tModels));
      verify(() => mockRemote.getProducts(category: tCategory)).called(1);
      verify(() => mockLocal.cacheProducts(tModels)).called(1);
      verifyNoMoreInteractions(mockRemote);
      verifyNoMoreInteractions(mockLocal);
    });

    test('should return cached data when offline', () async {
      when(() => mockNetworkInfo.isConnected).thenAnswer((_) async => false);
      when(() => mockLocal.getCachedProducts()).thenAnswer((_) async => tModels);

      final result = await repository.getProducts(category: tCategory);

      expect(result, Right(tModels));
      verifyZeroInteractions(mockRemote);
      verify(() => mockLocal.getCachedProducts()).called(1);
    });
  });
}
```

### 6.6 Test Organization

```
test/
├── unit/
│   ├── core/                  # Error, constants, utils tests
│   ├── domain/
│   │   ├── entities/          # Entity value equality, copyWith
│   │   └── usecases/          # Use case logic with mocks
│   ├── data/
│   │   ├── datasources/       # Remote/Local data source tests
│   │   ├── models/            # fromJson/toJson round-trip
│   │   └── repositories/      # Repository implementation with mocks
│   └── presentation/
│       ├── blocs/             # bloc_test for each Bloc/Cubit
│       └── providers/         # ProviderContainer tests for Riverpod
├── widget/
│   ├── screens/               # Full-screen widget tests with ProviderScope
│   └── widgets/               # Reusable widget tests
└── integration/               # Full flow integration tests
```

### 6.7 Testing Commands

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html

# Run specific directory
flutter test test/unit/presentation/bloc/

# Run single file
flutter test test/unit/domain/usecases/get_products_test.dart

# Run with name filter
flutter test --name "emits [ProductLoading, ProductLoaded]"

# Update golden files
flutter test --update-goldens

# Watch mode (auto-rerun on change)
flutter test --watch
```

---

## Quick Reference: Bloc vs Riverpod Decision Guide

| Scenario | Recommended | Reason |
|----------|-------------|--------|
| Deeply nested state with complex events | Bloc | Event log, transformers, traceability |
| Simple form or toggle state | Cubit or Riverpod Notifier | Less boilerplate |
| Async data fetching (one-shot) | Riverpod FutureProvider | autoDispose, AsyncValue.when |
| Real-time streams (WebSocket, Firestore) | Riverpod StreamProvider | `.when` on connection state |
| Auth flow with token refresh | Bloc | Events track login/logout/refresh steps |
| Cross-cutting dependencies (repos, config) | Riverpod Provider | No BuildContext needed |
| Multi-tab app preserving scroll position | GoRouter StatefulShellRoute | Built-in indexed stack |
| Team prefers strict structure | Bloc + Clean Architecture | Enforced separation of concerns |
| Rapid prototyping / small apps | Riverpod | Less files, less boilerplate |
