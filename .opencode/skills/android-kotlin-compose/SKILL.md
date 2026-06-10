---
name: android-kotlin-compose
description: "Clean Architecture (data/domain/presentation), Jetpack Compose UI patterns (state hoisting, StateFlow, LaunchedEffect), Material 3 theme & component usage, Hilt DI (modules, ViewModel injection), Room database (Entity, DAO, migration), Retrofit + OkHttp networking, Navigation Compose (NavHost, navArgs), ViewModel + StateFlow pattern, Gradle KTS version catalog (libs.versions.toml), testing (JUnit, Compose UI test, MockK). Skill untuk agent @android — Android Developer."
version: 1.0.0
author: opencode-agent-kit
---

# Android Kotlin Compose Skill

Skill khusus untuk agent `@android` — Android Developer. Stack: **Kotlin, Jetpack Compose, Material Design 3, Gradle KTS, Hilt, Room, Retrofit, MVVM/Clean Architecture, Navigation Compose.**

---

## 1. Clean Architecture Package Structure

```
app/src/main/java/com/{domain}/{app}/
├── data/
│   ├── local/
│   │   ├── dao/              # Room DAO interfaces
│   │   ├── entity/           # Room entity classes
│   │   └── datastore/        # DataStore preferences
│   ├── remote/
│   │   ├── api/              # Retrofit service interfaces
│   │   ├── dto/              # API response/request DTOs
│   │   └── interceptor/      # OkHttp interceptors
│   ├── repository/           # Repository implementations
│   └── mapper/               # DTO <-> Domain mappers
├── domain/
│   ├── model/                # Domain models (plain Kotlin data classes)
│   ├── repository/           # Repository interfaces (contracts)
│   └── usecase/              # Use cases (single-responsibility business logic)
├── presentation/
│   ├── navigation/           # NavHost, nav graph, routes
│   ├── screen/               # Screen composables + ViewModels
│   │   └── {feature}/
│   │       ├── FeatureScreen.kt
│   │       ├── FeatureViewModel.kt
│   │       └── FeatureUiState.kt
│   ├── components/           # Shared/reusable composables
│   └── theme/                # Material 3 theme (Color, Type, Shape)
├── di/                       # Hilt modules
│   ├── AppModule.kt
│   ├── DatabaseModule.kt
│   └── NetworkModule.kt
└── util/                     # Utilities, extensions, constants
```

### DTO-to-Domain Mapping Pattern

```kotlin
// data/remote/dto/ProductDto.kt
data class ProductDto(
    val id: String,
    val name: String?,
    val price: Double?
)

// data/mapper/ProductMapper.kt
fun ProductDto.toDomain(): Product = Product(
    id = id,
    name = name ?: "",
    price = price ?: 0.0
)

// domain/model/Product.kt
data class Product(
    val id: String,
    val name: String,
    val price: Double
)
```

---

## 2. Jetpack Compose UI Patterns

### State Hoisting

All composables should be stateless — state is hoisted to the caller (usually a ViewModel or parent composable).

```kotlin
// Stateless composable — pure UI, receives state + events
@Composable
fun ProductListItem(
    product: Product,
    onFavoriteClick: (String) -> Unit,   // events flow UP
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .clickable { onFavoriteClick(product.id) }
            .padding(16.dp)
    ) {
        Text(text = product.name, style = MaterialTheme.typography.bodyLarge)
        Spacer(modifier = Modifier.weight(1f))
        Icon(
            imageVector = if (product.isFavorite) Icons.Filled.Favorite else Icons.Outlined.Favorite,
            contentDescription = "Toggle favorite"
        )
    }
}

// Stateful wrapper — only here if trivial; prefer ViewModel pattern
@Composable
fun ProductListItemWithState(
    initialProduct: Product,
    onFavoriteClick: (String) -> Unit,
) {
    var product by remember { mutableStateOf(initialProduct) }

    ProductListItem(
        product = product,
        onFavoriteClick = { id ->
            product = product.copy(isFavorite = !product.isFavorite)
            onFavoriteClick(id)
        }
    )
}
```

### LaunchedEffect for Side Effects

```kotlin
@Composable
fun ProductDetailScreen(
    productId: String,
    viewModel: ProductDetailViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Trigger one-shot data load when screen enters composition
    LaunchedEffect(productId) {
        viewModel.loadProduct(productId)
    }

    // React to one-shot events (snackbar, navigation)
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is UiEvent.ShowSnackbar -> snackbarHostState.showSnackbar(event.message)
                is UiEvent.NavigateBack -> { /* navController.popBackStack() */ }
            }
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        when (val state = uiState) {
            is UiState.Loading -> CircularProgressIndicator(modifier = Modifier.padding(padding))
            is UiState.Success -> ProductContent(state.data, modifier = Modifier.padding(padding))
            is UiState.Error -> ErrorMessage(state.message, onRetry = { viewModel.loadProduct(productId) })
        }
    }
}
```

### Collecting Flow with Lifecycle Awareness

```kotlin
// build.gradle.kts — dependency
implementation(libs.androidx.lifecycle.runtime.compose)

// In composable — automatically stops collecting when lifecycle drops below STARTED
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
```

---

## 3. Material 3 Theme & Component Usage

### Theme Setup

```kotlin
// presentation/theme/Color.kt
data class AppColors(
    val primary: Color = Color(0xFF6750A4),
    val onPrimary: Color = Color.White,
    val primaryContainer: Color = Color(0xFFEADDFF),
    val secondary: Color = Color(0xFF625B71),
    val tertiary: Color = Color(0xFF7D5260),
    val background: Color = Color(0xFFFFFBFE),
    val surface: Color = Color(0xFFFFFBFE),
    val error: Color = Color(0xFFB3261E),
)

// presentation/theme/Type.kt
val AppTypography = Typography(
    displayLarge = TextStyle(fontWeight = FontWeight.Normal, fontSize = 57.sp, lineHeight = 64.sp),
    headlineLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 32.sp, lineHeight = 40.sp),
    titleLarge = TextStyle(fontWeight = FontWeight.Medium, fontSize = 22.sp, lineHeight = 28.sp),
    bodyLarge = TextStyle(fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp),
    labelLarge = TextStyle(fontWeight = FontWeight.Medium, fontSize = 14.sp, lineHeight = 20.sp),
)

// presentation/theme/Theme.kt
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) darkColorScheme(
        primary = Color(0xFFD0BCFF),
        onPrimary = Color(0xFF381E72),
        primaryContainer = Color(0xFF4F378B),
        background = Color(0xFF1C1B1F),
        surface = Color(0xFF1C1B1F),
    ) else lightColorScheme(
        primary = Color(0xFF6750A4),
        onPrimary = Color.White,
        primaryContainer = Color(0xFFEADDFF),
        background = Color(0xFFFFFBFE),
        surface = Color(0xFFFFFBFE),
    )

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}

// presentation/theme/Shape.kt
val AppShapes = Shapes(
    small = RoundedCornerShape(4.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
)
```

### Common M3 Components Usage

```kotlin
// TopAppBar
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppTopBar(title: String, onNavClick: () -> Unit) {
    TopAppBar(
        title = { Text(title) },
        navigationIcon = {
            IconButton(onClick = onNavClick) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
        )
    )
}

// Card
@Composable
fun ProductCard(product: Product, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(modifier = Modifier.padding(16.dp)) {
            Text(text = product.name, style = MaterialTheme.typography.titleMedium)
        }
    }
}

// Bottom Sheet
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterBottomSheet(
    sheetState: SheetState,
    onDismiss: () -> Unit,
    content: @Composable () -> Unit,
) {
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        content()
    }
}

// Scaffold with BottomNavigation
@Composable
fun MainScaffold(navController: NavHostController) {
    Scaffold(
        topBar = { AppTopBar("App Name", onNavClick = { }) },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = true,
                    onClick = { },
                    icon = { Icon(Icons.Filled.Home, contentDescription = "Home") },
                    label = { Text("Home") },
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { },
                    icon = { Icon(Icons.Filled.Favorite, contentDescription = "Favorites") },
                    label = { Text("Favorites") },
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            // NavHost goes here
        }
    }
}
```

---

## 4. Hilt Dependency Injection

### Hilt Modules

```kotlin
// di/AppModule.kt
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideGson(): Gson = GsonBuilder()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
        .setLenient()
        .create()

    @Provides
    @Singleton
    @IoDispatcher
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO
}

// di/NetworkModule.kt
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient, gson: Gson): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ProductApiService =
        retrofit.create(ProductApiService::class.java)
}

// di/DatabaseModule.kt
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app_database"
        ).addMigrations(MIGRATION_1_2)
         .build()

    @Provides
    fun provideProductDao(database: AppDatabase): ProductDao = database.productDao()

    @Provides
    fun provideCartDao(database: AppDatabase): CartDao = database.cartDao()
}
```

### Custom Qualifiers (for Dispatchers)

```kotlin
// di/Qualifiers.kt
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class IoDispatcher

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class MainDispatcher

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class DefaultDispatcher
```

### ViewModel Injection

```kotlin
// ViewModel with Hilt — no factory needed
@HiltViewModel
class ProductViewModel @Inject constructor(
    private val getProductsUseCase: GetProductsUseCase,
    private val savedStateHandle: SavedStateHandle,
) : ViewModel() { ... }

// In composable — simply:
@Composable
fun ProductScreen(
    viewModel: ProductViewModel = hiltViewModel(),
) { ... }
```

### Application class

```kotlin
@HiltAndroidApp
class AppApplication : Application()
```

### Gradle Plugin Setup

```kotlin
// build.gradle.kts (project-level)
plugins {
    alias(libs.plugins.hilt) apply false
    alias(libs.plugins.ksp) apply false
}

// build.gradle.kts (app module)
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

dependencies {
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)
    ksp(libs.hilt.androidx.compiler)  // for @HiltViewModel
}
```

---

## 5. Room Database

### Entity

```kotlin
// data/local/entity/ProductEntity.kt
@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey
    val id: String,
    @ColumnInfo(name = "name")
    val name: String,
    @ColumnInfo(name = "price")
    val price: Double,
    @ColumnInfo(name = "description")
    val description: String?,
    @ColumnInfo(name = "is_favorite")
    val isFavorite: Boolean = false,
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis(),
)
```

### DAO

```kotlin
// data/local/dao/ProductDao.kt
@Dao
interface ProductDao {

    @Query("SELECT * FROM products ORDER BY updated_at DESC")
    fun getAllProducts(): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE id = :productId")
    fun getProductById(productId: String): Flow<ProductEntity?>

    @Query("SELECT * FROM products WHERE is_favorite = 1")
    fun getFavoriteProducts(): Flow<List<ProductEntity>>

    @Upsert
    suspend fun insertProducts(products: List<ProductEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: ProductEntity)

    @Delete
    suspend fun deleteProduct(product: ProductEntity)

    @Query("DELETE FROM products")
    suspend fun deleteAllProducts()

    @Query("UPDATE products SET is_favorite = :isFavorite WHERE id = :productId")
    suspend fun updateFavorite(productId: String, isFavorite: Boolean)
}
```

### Migration

```kotlin
// AppDatabase.kt
@Database(
    entities = [ProductEntity::class, CartEntity::class],
    version = 2,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun cartDao(): CartDao
}

val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE products ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0")
    }
}
```

### AutoMigration (Room 2.4+)

```kotlin
@Database(
    entities = [ProductEntity::class, CartEntity::class],
    version = 3,
    exportSchema = true,
    autoMigrations = [
        AutoMigration(from = 2, to = 3)
    ]
)
abstract class AppDatabase : RoomDatabase() { ... }

// For complex auto-migrations, provide a callback:
@AutoMigration(from = 2, to = 3, spec = AppDatabase.MyAutoMigration::class)
data class MyAutoMigration : AutoMigrationSpec {
    override fun onPostMigrate(db: SupportSQLiteDatabase) {
        db.execSQL("CREATE INDEX idx_products_name ON products(name)")
    }
}
```

### Database Type Converters

```kotlin
// data/local/converter/Converters.kt
class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? = value?.let { Date(it) }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? = date?.time

    @TypeConverter
    fun fromStringList(value: String): List<String> = value.split(",")

    @TypeConverter
    fun toStringList(list: List<String>): String = list.joinToString(",")
}

// In AppDatabase
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase()
```

---

## 6. Retrofit + OkHttp Networking

### API Service Interface

```kotlin
// data/remote/api/ProductApiService.kt
interface ProductApiService {

    @GET("products")
    suspend fun getProducts(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
    ): ApiResponse<List<ProductDto>>

    @GET("products/{id}")
    suspend fun getProductById(
        @Path("id") productId: String,
    ): ApiResponse<ProductDto>

    @POST("products")
    suspend fun createProduct(
        @Body product: CreateProductRequest,
    ): ApiResponse<ProductDto>

    @PUT("products/{id}")
    suspend fun updateProduct(
        @Path("id") productId: String,
        @Body product: UpdateProductRequest,
    ): ApiResponse<ProductDto>

    @DELETE("products/{id}")
    suspend fun deleteProduct(
        @Path("id") productId: String,
    ): ApiResponse<Unit>
}
```

### API Response Wrapper

```kotlin
// data/remote/dto/ApiResponse.kt
data class ApiResponse<T>(
    val status: Int,
    val message: String?,
    val data: T?,
    val errors: Map<String, List<String>>?,
)

// Use either Result<T> or a sealed class for consumer safety
sealed class NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error(val message: String, val code: Int? = null) : NetworkResult<Nothing>()
    data object Loading : NetworkResult<Nothing>()
}

// Extension to map ApiResponse -> NetworkResult
suspend fun <T> safeApiCall(call: suspend () -> ApiResponse<T>): NetworkResult<T> {
    return try {
        val response = call()
        if (response.data != null) {
            NetworkResult.Success(response.data)
        } else {
            NetworkResult.Error(response.message ?: "Unknown error")
        }
    } catch (e: Exception) {
        NetworkResult.Error(e.message ?: "Network error")
    }
}
```

### OkHttp Interceptors (Advanced)

```kotlin
// Auth interceptor
class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = tokenProvider()
        val request = if (token != null) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }
        return chain.proceed(request)
    }
}

// Cache interceptor for offline support
class CacheInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = chain.proceed(request)

        val cacheControl = if (isNetworkAvailable()) {
            CacheControl.Builder()
                .maxAge(0, TimeUnit.SECONDS)
                .build()
        } else {
            CacheControl.Builder()
                .maxStale(7, TimeUnit.DAYS)
                .build()
        }

        return response.newBuilder()
            .header("Cache-Control", cacheControl.toString())
            .build()
    }

    private fun isNetworkAvailable(): Boolean {
        // Use ConnectivityManager
        return true // placeholder
    }
}

// Providing in NetworkModule
@Provides @Singleton
fun provideOkHttpClient(authInterceptor: AuthInterceptor): OkHttpClient =
    OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) BODY else NONE
        })
        .cache(Cache(File(context.cacheDir, "http_cache"), 10L * 1024 * 1024)) // 10MB
        .build()
```

---

## 7. Navigation Compose

### Route Definitions

```kotlin
// presentation/navigation/Routes.kt
object Routes {
    const val PRODUCT_LIST = "products"
    const val PRODUCT_DETAIL = "products/{productId}"
    const val CART = "cart"
    const val CHECKOUT = "checkout"
    const val PROFILE = "profile"

    fun productDetail(productId: String) = "products/$productId"
}
```

### NavHost Setup

```kotlin
// presentation/navigation/AppNavHost.kt
@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController(),
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController = navController,
        startDestination = Routes.PRODUCT_LIST,
        modifier = modifier,
    ) {
        composable(Routes.PRODUCT_LIST) {
            ProductScreen(
                onNavigateToDetail = { productId ->
                    navController.navigate(Routes.productDetail(productId))
                },
                onNavigateToCart = {
                    navController.navigate(Routes.CART)
                },
            )
        }

        composable(
            route = Routes.PRODUCT_DETAIL,
            arguments = listOf(navArgument("productId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId") ?: return@composable
            ProductDetailScreen(
                productId = productId,
                onNavigateBack = { navController.popBackStack() },
            )
        }

        composable(Routes.CART) {
            CartScreen(
                onNavigateToCheckout = { navController.navigate(Routes.CHECKOUT) },
                onNavigateBack = { navController.popBackStack() },
            )
        }

        composable(Routes.CHECKOUT) {
            CheckoutScreen(
                onOrderPlaced = {
                    navController.navigate(Routes.PRODUCT_LIST) {
                        popUpTo(Routes.PRODUCT_LIST) { inclusive = true }
                    }
                },
                onNavigateBack = { navController.popBackStack() },
            )
        }

        composable(Routes.PROFILE) {
            ProfileScreen(onNavigateBack = { navController.popBackStack() })
        }
    }
}
```

### Type-Safe Navigation (Navigation Compose 2.8+)

```kotlin
// Using KSerializer for type-safe arguments
@Serializable
sealed class Screen {
    @Serializable data object ProductList : Screen()
    @Serializable data class ProductDetail(val productId: String) : Screen()
    @Serializable data object Cart : Screen()
    @Serializable data object Checkout : Screen()
    @Serializable data object Profile : Screen()
}

// NavHost with type-safe routes
@Composable
fun AppNavHostTypeSafe(navController: NavHostController) {
    NavHost(navController = navController, startDestination = Screen.ProductList) {
        composable<Screen.ProductList> {
            ProductScreen(
                onNavigateToDetail = { id -> navController.navigate(Screen.ProductDetail(id)) },
            )
        }
        composable<Screen.ProductDetail> { backStackEntry ->
            val screen: Screen.ProductDetail = backStackEntry.toRoute()
            ProductDetailScreen(productId = screen.productId)
        }
        composable<Screen.Cart> { CartScreen() }
        composable<Screen.Checkout> { CheckoutScreen() }
    }
}
```

### Deep Link Support

```kotlin
composable(
    route = "products/{productId}",
    arguments = listOf(navArgument("productId") { type = NavType.StringType }),
    deepLinks = listOf(
        navDeepLink { uriPattern = "https://example.com/products/{productId}" },
        navDeepLink { uriPattern = "myapp://products/{productId}" },
    ),
) { backStackEntry ->
    val productId = backStackEntry.arguments?.getString("productId")
    ProductDetailScreen(productId = productId!!)
}
```

---

## 8. ViewModel + StateFlow Pattern

### UiState Sealed Class

```kotlin
// presentation/screen/product/UiState.kt
sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String, val throwable: Throwable? = null) : UiState<Nothing>
}
```

### One-shot Events (Single Event Channel)

```kotlin
// presentation/screen/product/UiEvent.kt
sealed interface UiEvent {
    data class ShowSnackbar(val message: String) : UiEvent
    data class NavigateTo(val route: String) : UiEvent
    data object NavigateBack : UiEvent
    data class ShowToast(val message: String) : UiEvent
}

// SharedFlow for one-shot events (replay = 0 = consume once)
// In ViewModel:
 private val _events = MutableSharedFlow<UiEvent>(extraBufferCapacity = 1)
 val events: SharedFlow<UiEvent> = _events.asSharedFlow()
```

### ViewModel with Event Handling

```kotlin
// presentation/screen/product/ProductViewModel.kt
@HiltViewModel
class ProductViewModel @Inject constructor(
    private val getProductsUseCase: GetProductsUseCase,
    private val toggleFavoriteUseCase: ToggleFavoriteUseCase,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    // UI State
    private val _uiState = MutableStateFlow<UiState<List<Product>>>(UiState.Loading)
    val uiState: StateFlow<UiState<List<Product>>> = _uiState.asStateFlow()

    // One-shot events
    private val _events = MutableSharedFlow<UiEvent>(extraBufferCapacity = 1)
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()

    init {
        loadProducts()
    }

    fun loadProducts() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            getProductsUseCase()
                .onSuccess { products ->
                    _uiState.value = UiState.Success(products)
                }
                .onFailure { error ->
                    _uiState.value = UiState.Error(error.message ?: "Unknown error")
                    _events.tryEmit(UiEvent.ShowSnackbar("Failed to load products"))
                }
        }
    }

    fun toggleFavorite(productId: String) {
        viewModelScope.launch {
            toggleFavoriteUseCase(productId)
                .onSuccess {
                    _events.tryEmit(UiEvent.ShowSnackbar("Favorite updated"))
                }
                .onFailure { error ->
                    _events.tryEmit(UiEvent.ShowSnackbar(error.message ?: "Failed to update"))
                }
        }
    }

    // Refresh for PullToRefresh / SwipeToRefresh
    fun refresh() = loadProducts()
}
```

### SavedStateHandle for Process Death Survival

```kotlin
@HiltViewModel
class ProductDetailViewModel @Inject constructor(
    private val getProductUseCase: GetProductUseCase,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    // Survives process death automatically
    private val productId: String = checkNotNull(savedStateHandle["productId"])

    private val _uiState = MutableStateFlow<UiState<Product>>(UiState.Loading)
    val uiState: StateFlow<UiState<Product>> = _uiState.asStateFlow()

    init { loadProduct() }

    fun loadProduct() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            getProductUseCase(productId)
                .onSuccess { _uiState.value = UiState.Success(it) }
                .onFailure { _uiState.value = UiState.Error(it.message ?: "Error") }
        }
    }
}
```

### Debounced Search Pattern

```kotlin
@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchProductsUseCase: SearchProductsUseCase,
) : ViewModel() {

    // Input from TextField
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    // Debounced results
    val searchResults: StateFlow<UiState<List<Product>>> = _searchQuery
        .debounce(300)
        .flatMapLatest { query ->
            if (query.isBlank()) {
                flowOf(UiState.Success(emptyList()))
            } else {
                searchProductsUseCase(query)
                    .map { result ->
                        result.fold(
                            onSuccess = { UiState.Success(it) },
                            onFailure = { UiState.Error(it.message ?: "Error") },
                        )
                    }
                    .catch { emit(UiState.Error(it.message ?: "Error")) }
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = UiState.Success(emptyList()),
        )

    fun onQueryChanged(query: String) {
        _searchQuery.value = query
    }
}
```

### Screen Composable Integration

```kotlin
@Composable
fun ProductScreen(
    viewModel: ProductViewModel = hiltViewModel(),
    onNavigateToDetail: (String) -> Unit,
    onNavigateToCart: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    // Collect one-shot events
    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is UiEvent.ShowSnackbar -> snackbarHostState.showSnackbar(event.message)
                is UiEvent.NavigateTo -> { /* handled by nav callback */ }
                is UiEvent.NavigateBack -> { /* handled by nav callback */ }
                is UiEvent.ShowToast -> { /* Toast.makeText() */ }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Products") },
                actions = {
                    IconButton(onClick = onNavigateToCart) {
                        Icon(Icons.Filled.ShoppingCart, contentDescription = "Cart")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (val state = uiState) {
                is UiState.Loading -> LoadingIndicator()
                is UiState.Success -> ProductList(
                    products = state.data,
                    onProductClick = { onNavigateToDetail(it.id) },
                    onFavoriteClick = viewModel::toggleFavorite,
                )
                is UiState.Error -> ErrorMessage(
                    message = state.message,
                    onRetry = viewModel::refresh,
                )
            }
        }
    }
}
```

---

## 9. Gradle KTS Version Catalog

### `gradle/libs.versions.toml`

```toml
[versions]
agp = "8.7.3"
kotlin = "2.1.0"
compose-bom = "2024.12.01"
compose-compiler = "2.1.0"
hilt = "2.53.1"
hilt-navigation-compose = "1.2.0"
room = "2.6.1"
retrofit = "2.11.0"
okhttp = "4.12.0"
navigation-compose = "2.8.5"
lifecycle = "2.8.7"
coroutines = "1.9.0"
ksp = "2.1.0-1.0.29"
junit = "4.13.2"
mockk = "1.13.13"
compose-ui-test = "1.7.6"
androidx-test-ext = "1.2.1"
espresso = "3.6.1"
datastore = "1.1.1"
coil = "2.7.0"
gson = "2.11.0"

[libraries]
# Compose BOM
compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
ui = { group = "androidx.compose.ui", name = "ui" }
ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
material3 = { group = "androidx.compose.material3", name = "material3" }
material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
compose-ui-test = { group = "androidx.compose.ui", name = "ui-test-junit4" }
compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }

# Lifecycle
lifecycle-runtime-compose = { group = "androidx.lifecycle", name = "lifecycle-runtime-compose", version.ref = "lifecycle" }
lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycle" }

# Navigation
navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigation-compose" }

# Hilt
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-compiler", version.ref = "hilt" }
hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version.ref = "hilt-navigation-compose" }
hilt-androidx-compiler = { group = "androidx.hilt", name = "hilt-compiler", version.ref = "hilt-navigation-compose" }

# Room
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

# Networking
retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-gson = { group = "com.squareup.retrofit2", name = "converter-gson", version.ref = "retrofit" }
okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }
gson = { group = "com.google.code.gson", name = "gson", version.ref = "gson" }

# DataStore
datastore-preferences = { group = "androidx.datastore", name = "datastore-preferences", version.ref = "datastore" }

# Image Loading
coil-compose = { group = "io.coil-kt", name = "coil-compose", version.ref = "coil" }

# Coroutines
coroutines-core = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-core", version.ref = "coroutines" }
coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

# Testing
junit = { group = "junit", name = "junit", version.ref = "junit" }
mockk = { group = "io.mockk", name = "mockk", version.ref = "mockk" }
coroutines-test = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-test", version.ref = "coroutines" }
espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espresso" }
androidx-test-ext = { group = "androidx.test.ext", name = "junit", version.ref = "androidx-test-ext" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
compose-compiler = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
```

### `settings.gradle.kts`

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolution {
    @Suppress("UnstableApiUsage")
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "MyApp"
include(":app")
```

---

## 10. Testing

### Unit Tests with JUnit + MockK

```kotlin
// src/test/java/.../ProductViewModelTest.kt
@OptIn(ExperimentalCoroutinesApi::class)
class ProductViewModelTest {

    @MockK
    private lateinit var getProductsUseCase: GetProductsUseCase

    private lateinit var viewModel: ProductViewModel

    private val testDispatcher = UnconfinedTestDispatcher()

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadProducts emits Loading then Success`() = runTest {
        // Given
        val expectedProducts = listOf(
            Product(id = "1", name = "Product 1", price = 10.0),
        )
        coEvery { getProductsUseCase() } returns Result.success(expectedProducts)

        // When
        viewModel = ProductViewModel(getProductsUseCase, ...)

        // Then
        assert(viewModel.uiState.value is UiState.Loading)
        // Advance dispatcher
        advanceUntilIdle()
        val state = viewModel.uiState.value
        assert(state is UiState.Success)
        assertEquals(expectedProducts, (state as UiState.Success).data)
    }

    @Test
    fun `loadProducts emits Error on failure`() = runTest {
        // Given
        val errorMessage = "Network error"
        coEvery { getProductsUseCase() } returns Result.failure(Exception(errorMessage))

        // When
        viewModel = ProductViewModel(getProductsUseCase, ...)
        advanceUntilIdle()

        // Then
        val state = viewModel.uiState.value
        assert(state is UiState.Error)
        assertEquals(errorMessage, (state as UiState.Error).message)
    }
}
```

### Use Case Unit Test

```kotlin
// src/test/java/.../GetProductsUseCaseTest.kt
class GetProductsUseCaseTest {

    @MockK
    private lateinit var productRepository: ProductRepository

    private lateinit var useCase: GetProductsUseCase

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        useCase = GetProductsUseCase(productRepository)
    }

    @Test
    fun `invoke maps repository result correctly`() = runTest {
        val products = listOf(Product("1", "Test", 9.99))
        coEvery { productRepository.getProducts() } returns Result.success(products)

        val result = useCase()

        assert(result.isSuccess)
        assertEquals(products, result.getOrNull())
    }

    @Test
    fun `invoke propagates error`() = runTest {
        coEvery { productRepository.getProducts() } returns Result.failure(Exception("Timeout"))

        val result = useCase()

        assert(result.isFailure)
        assertEquals("Timeout", result.exceptionOrNull()?.message)
    }
}
```

### Repository Unit Test

```kotlin
// src/test/java/.../ProductRepositoryImplTest.kt
class ProductRepositoryImplTest {

    @MockK
    private lateinit var productDao: ProductDao

    @MockK
    private lateinit var productApi: ProductApiService

    private lateinit var repository: ProductRepositoryImpl

    @Before
    fun setUp() {
        MockKAnnotations.init(this)
        repository = ProductRepositoryImpl(productDao, productApi)
    }

    @Test
    fun `getProducts returns cached data first when available`() = runTest {
        val cachedProducts = flowOf(listOf(ProductEntity("1", "Cached", 5.0)))
        every { productDao.getAllProducts() } returns cachedProducts

        val result = repository.getProducts()

        assertEquals(listOf(Product("1", "Cached", 5.0)), result.getOrNull())
    }
}
```

### Compose UI Tests

```kotlin
// src/androidTest/java/.../ProductScreenTest.kt
@RunWith(AndroidJUnit4::class)
class ProductScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun displaysLoadingIndicatorInitially() {
        composeTestRule.setContent {
            AppTheme {
                ProductScreen(
                    viewModel = FakeProductViewModel(UiState.Loading),
                    onNavigateToDetail = {},
                    onNavigateToCart = {},
                )
            }
        }

        composeTestRule
            .onNodeWithTag("loading_indicator")
            .assertIsDisplayed()
    }

    @Test
    fun displaysProductListOnSuccess() {
        val products = listOf(
            Product("1", "Product A", 10.0),
            Product("2", "Product B", 20.0),
        )

        composeTestRule.setContent {
            AppTheme {
                ProductScreen(
                    viewModel = FakeProductViewModel(UiState.Success(products)),
                    onNavigateToDetail = {},
                    onNavigateToCart = {},
                )
            }
        }

        composeTestRule
            .onNodeWithText("Product A")
            .assertIsDisplayed()
        composeTestRule
            .onNodeWithText("Product B")
            .assertIsDisplayed()
    }

    @Test
    fun displaysErrorMessageOnError() {
        composeTestRule.setContent {
            AppTheme {
                ProductScreen(
                    viewModel = FakeProductViewModel(UiState.Error("Something went wrong")),
                    onNavigateToDetail = {},
                    onNavigateToCart = {},
                )
            }
        }

        composeTestRule
            .onNodeWithText("Something went wrong")
            .assertIsDisplayed()
        composeTestRule
            .onNodeWithText("Retry")
            .assertIsDisplayed()
    }

    @Test
    fun navigatesToDetailOnProductClick() {
        var navigatedProductId: String? = null
        val products = listOf(Product("42", "Clickable", 5.0))

        composeTestRule.setContent {
            AppTheme {
                ProductScreen(
                    viewModel = FakeProductViewModel(UiState.Success(products)),
                    onNavigateToDetail = { navigatedProductId = it },
                    onNavigateToCart = {},
                )
            }
        }

        composeTestRule.onNodeWithText("Clickable").performClick()
        assertEquals("42", navigatedProductId)
    }
}

// Fake ViewModel for UI tests
class FakeProductViewModel(initialState: UiState<List<Product>>) : ViewModel() {
    private val _uiState = MutableStateFlow(initialState)
    val uiState: StateFlow<UiState<List<Product>>> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<UiEvent>(extraBufferCapacity = 1)
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()
}
```

### Compose UI Test with Semantics Tags

```kotlin
// In your composable — add test tags
@Composable
fun LoadingIndicator() {
    CircularProgressIndicator(
        modifier = Modifier.semantics { testTagsAsResourceId = true }
    )
}

// Or use contentDescription / testTag:
@Composable
fun ErrorMessage(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .wrapContentSize(Alignment.Center)
            .testTag("error_container"),
    ) {
        Text(
            text = message,
            modifier = Modifier.testTag("error_message"),
        )
        Button(
            onClick = onRetry,
            modifier = Modifier.testTag("retry_button"),
        ) {
            Text("Retry")
        }
    }
}

// In test:
composeTestRule.onNodeWithTag("error_container").assertIsDisplayed()
composeTestRule.onNodeWithTag("retry_button").performClick()
```

### Hilt Testing (Integration)

```kotlin
// src/test/.../HiltTestRunner.kt
// Custom test runner: run with @HiltAndroidTest
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class ProductRepositoryTest {

    @get:Rule
    val hiltRule = HiltAndroidRule(this)

    @Inject
    lateinit var productDao: ProductDao

    @Inject
    lateinit var database: AppDatabase

    @Before
    fun setUp() {
        hiltRule.inject()
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun insertAndRetrieveProduct() = runTest {
        val entity = ProductEntity(id = "1", name = "Test", price = 9.99)
        productDao.insertProduct(entity)

        val result = productDao.getProductById("1").first()
        assertNotNull(result)
        assertEquals("Test", result!!.name)
    }
}
```

---

## Verification Commands

```bash
# Build
./gradlew assembleDebug                      # Build debug APK
./gradlew assembleRelease                    # Build release APK
./gradlew bundleRelease                      # Build Android App Bundle

# Tests
./gradlew test                               # Run all unit tests
./gradlew :app:test                           # Run unit tests for app module
./gradlew connectedAndroidTest               # Run instrumented tests (emulator/device)
./gradlew :app:connectedDebugAndroidTest      # Run Compose UI tests

# Lint & Analysis
./gradlew lint                               # Static analysis
./gradlew ktlintCheck                        # Kotlin formatting check
./gradlew detekt                             # Advanced code analysis

# Dependency
./gradlew :app:dependencies                  # Full dependency tree
./gradlew :app:dependencies --configuration debugRuntimeClasspath
./gradlew dependencyUpdates                  # Check for outdated deps

# Clean
./gradlew clean                              # Clean build artifacts
```

---

## Quick Reference — Common Patterns

| Pattern | Implementation |
|---------|---------------|
| **State Hoisting** | Composable receives state + callbacks, no internal mutable state |
| **ViewModel + StateFlow** | `MutableStateFlow` + `asStateFlow()` in VM, `collectAsStateWithLifecycle()` in UI |
| **One-Shot Events** | `MutableSharedFlow<UiEvent>(extraBufferCapacity=1)` |
| **DI with Hilt** | `@HiltViewModel`, `@Inject constructor`, `hiltViewModel()` |
| **Navigation** | `NavHost` + `composable(route)` + `navArgument()` |
| **Type-Safe Nav** | `@Serializable sealed class Screen` + `composable<T>` |
| **Room DAO** | `@Dao` interface with `Flow` return type for reactive queries |
| **Retrofit** | `suspend fun` in service interface, `safeApiCall()` wrapper |
| **Debounced Search** | `.debounce(300).flatMapLatest { }` in ViewModel |
| **UI Test Fake** | Inject a ViewModel with fixed `UiState` instead of real one |

---

*Referenced by agent `@android`. For full agent profile, see `.opencode/agents/android-developer.md`.*
