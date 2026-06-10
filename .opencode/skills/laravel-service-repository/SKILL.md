---
name: laravel-service-repository
description: >-
  Service Layer pattern, Repository pattern, Eloquent ORM (relationships, scopes,
  accessors, mutators, eager loading), REST API (Resource Controller, API Resource,
  Form Request validation), JWT auth (tymon/jwt-auth), testing (PHPUnit, Feature tests,
  Model factories), migrations & seeders, error handling (Handler, validation errors,
  custom exceptions), performance (N+1 prevention, caching, query optimization).
  Skill khusus untuk @laravel — Laravel Backend Engineer.
version: 1.0.0
author: opencode-agent-kit
metadata:
  target_agent: laravel
  stack:
    - Laravel 10+
    - PHP 8.1+
    - Eloquent ORM
    - tymon/jwt-auth
    - MySQL / PostgreSQL
    - PHPUnit
  topics:
    - service-layer
    - repository-pattern
    - eloquent-orm
    - rest-api
    - jwt-auth
    - testing
    - migrations-seeders
    - error-handling
    - performance
---

# Laravel Service Repository Skill

Skill khusus untuk agent `@laravel` — Laravel Backend Engineer. Berisi pattern, kode contoh, dan workflow standar untuk membangun REST API dengan Service/Repository Layer, Eloquent ORM, JWT auth (tymon/jwt-auth), testing, error handling, dan optimasi performa.

**Stack:** Laravel 10+ · PHP 8.1+ · Eloquent ORM · tymon/jwt-auth · MySQL/PostgreSQL · PHPUnit

---

## 1. Service Layer Pattern

Service Layer memisahkan business logic dari Controller sehingga Controller hanya bertugas sebagai orchestrator I/O (request/response). Semua logika domain ditempatkan di `app/Services/`.

### Directory Convention

```
app/Services/
├── ProductService.php
├── AuthService.php
├── UserService.php
└── Contracts/
    └── ServiceInterface.php (opsional)
```

### Service Interface (Opsional)

```php
<?php

namespace App\Services\Contracts;

interface ServiceInterface
{
    public function getAll(array $filters = []);
    public function getById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
}
```

### Concrete Service Example

```php
<?php

namespace App\Services;

use App\Repositories\ProductRepository;
use App\Services\Contracts\ServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Exceptions\ServiceException;

class ProductService implements ServiceInterface
{
    public function __construct(
        protected ProductRepository $productRepository
    ) {}

    public function getAll(array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->productRepository->paginate($filters);
    }

    public function getById(int $id): ?\App\Models\Product
    {
        return $this->productRepository->findById($id);
    }

    public function create(array $data): \App\Models\Product
    {
        DB::beginTransaction();
        try {
            $product = $this->productRepository->create($data);

            // Business logic: log creation, dispatch events, etc.
            Log::info('Product created', ['product_id' => $product->id, 'user_id' => auth()->id()]);

            DB::commit();
            return $product;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new ServiceException('Failed to create product: ' . $e->getMessage(), 500, $e);
        }
    }

    public function update(int $id, array $data): \App\Models\Product
    {
        DB::beginTransaction();
        try {
            $product = $this->productRepository->update($id, $data);
            DB::commit();
            return $product;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new ServiceException('Failed to update product: ' . $e->getMessage(), 500, $e);
        }
    }

    public function delete(int $id): bool
    {
        DB::beginTransaction();
        try {
            $result = $this->productRepository->delete($id);
            DB::commit();
            return $result;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new ServiceException('Failed to delete product: ' . $e->getMessage(), 500, $e);
        }
    }
}
```

### Service Injection ke Controller

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ProductService;
use App\Http\Requests\StoreProductRequest;
use App\Http\Resources\ProductResource;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService
    ) {}

    public function index(): JsonResponse
    {
        $products = $this->productService->getAll(request()->all());
        return response()->json([
            'status' => true,
            'message' => 'OK',
            'data' => ProductResource::collection($products),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->create($request->validated());
        return response()->json([
            'status' => true,
            'message' => 'Product created',
            'data' => new ProductResource($product),
        ], 201);
    }
}
```

### Aturan Service Layer

1. **Jangan** langsung akses Eloquent Model dari Controller — selalu melalui Service.
2. **Gunakan** `DB::beginTransaction()` / `commit()` / `rollBack()` untuk operasi multi-tabel.
3. **Throw** custom exception, jangan return error array — biarkan Handler menangani format response.
4. **Logging** di Service layer, bukan di Controller.
5. **Event/Listener** dipicu dari Service, bukan dari Controller.

---

## 2. Repository Pattern

Repository memisahkan logic query/a database dari Service. Repository hanya bertanggung jawab mengembalikan data (Eloquent Model instance, Collection, Paginator) tanpa mengandung business logic.

### Directory Convention

```
app/Repositories/
├── ProductRepository.php
├── UserRepository.php
├── Contracts/
│   └── RepositoryInterface.php
└── Traits/
    └── HasFilterable.php
```

### Base Repository Interface

```php
<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

interface RepositoryInterface
{
    public function all(): Collection;
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): ?Model;
    public function findBy(string $field, mixed $value): ?Model;
    public function findAllBy(string $field, mixed $value): Collection;
    public function create(array $data): Model;
    public function update(int $id, array $data): Model;
    public function delete(int $id): bool;
    public function count(): int;
}
```

### Abstract Repository (Opsional)

```php
<?php

namespace App\Repositories;

use App\Repositories\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class BaseRepository implements RepositoryInterface
{
    protected Model $model;

    public function __construct()
    {
        $this->model = app($this->model());
    }

    abstract protected function model(): string;

    public function all(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->all();
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();
        $query = $this->applyFilters($query, $filters);
        return $query->paginate($perPage);
    }

    public function findById(int $id): ?Model
    {
        return $this->model->find($id);
    }

    public function findBy(string $field, mixed $value): ?Model
    {
        return $this->model->where($field, $value)->first();
    }

    public function findAllBy(string $field, mixed $value): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->where($field, $value)->get();
    }

    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Model
    {
        $record = $this->findById($id);
        if (!$record) {
            throw new \App\Exceptions\NotFoundException('Record not found');
        }
        $record->update($data);
        return $record->fresh();
    }

    public function delete(int $id): bool
    {
        $record = $this->findById($id);
        if (!$record) {
            throw new \App\Exceptions\NotFoundException('Record not found');
        }
        return $record->delete();
    }

    public function count(): int
    {
        return $this->model->count();
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        // Override di child class untuk filter custom
        return $query;
    }
}
```

### Concrete Repository

```php
<?php

namespace App\Repositories;

use App\Models\Product;

class ProductRepository extends BaseRepository
{
    protected function model(): string
    {
        return Product::class;
    }

    protected function applyFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): \Illuminate\Database\Eloquent\Builder
    {
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('sku', 'like', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['price_min'])) {
            $query->where('price', '>=', $filters['price_min']);
        }

        if (!empty($filters['price_max'])) {
            $query->where('price', '<=', $filters['price_max']);
        }

        if (!empty($filters['sort'])) {
            $direction = $filters['sort_direction'] ?? 'asc';
            $query->orderBy($filters['sort'], $direction);
        } else {
            $query->latest();
        }

        // Eager loading
        if (!empty($filters['with'])) {
            $query->with($filters['with']);
        }

        return $query;
    }

    public function findWithRelations(int $id, array $relations = []): ?Product
    {
        return Product::with($relations)->find($id);
    }

    public function getPopular(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return Product::withCount('orderItems')
            ->orderBy('order_items_count', 'desc')
            ->take($limit)
            ->get();
    }
}
```

### Aturan Repository

1. **Jangan** letakkan business logic di Repository — hanya query data.
2. **Gunakan** `applyFilters()` untuk filter yang reusable.
3. **Eager loading** via parameter `with` di filter atau method spesifik.
4. **Return** Eloquent Model/Collection, bukan array.

---

## 3. Eloquent ORM

### 3.1 Relationships

**One to One**
```php
class User extends Model
{
    public function profile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Profile::class);
    }
}

class Profile extends Model
{
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

**One to Many**
```php
class Category extends Model
{
    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class);
    }
}

class Product extends Model
{
    public function category(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
```

**Many to Many**
```php
class Product extends Model
{
    public function tags(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Tag::class)
            ->withTimestamps()
            ->withPivot('quantity');
    }
}
```

**Has Many Through**
```php
class Country extends Model
{
    public function posts(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(Post::class, User::class);
    }
}
```

**Polymorphic**
```php
class Post extends Model
{
    public function comments(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

class Product extends Model
{
    public function comments(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

class Comment extends Model
{
    public function commentable(): \Illuminate\Database\Eloquent\Relations\MorphTo
    {
        return $this->morphTo();
    }
}
```

### 3.2 Query Scopes

**Local Scope**
```php
class Product extends Model
{
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock(Builder $query): Builder
    {
        return $query->where('stock', '>', 0);
    }

    public function scopePriceRange(Builder $query, float $min, float $max): Builder
    {
        return $query->whereBetween('price', [$min, $max]);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('description', 'like', "%{$term}%");
        });
    }
}

// Usage
$products = Product::active()->inStock()->priceRange(10000, 50000)->get();
```

**Global Scope**
```php
<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ActiveScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('is_active', true);
    }
}

// Register in Model
class Product extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new ActiveScope);
    }
}
```

### 3.3 Accessors & Mutators

**Accessor (getter)**
```php
class Product extends Model
{
    // Format price to rupiah
    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->price, 0, ',', '.');
    }

    // Accessor with casting
    public function getNameAttribute(?string $value): ?string
    {
        return ucwords($value);
    }
}

// Usage
$product->formatted_price; // "Rp 150.000"
```

**Mutator (setter)**
```php
class User extends Model
{
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = bcrypt($value);
    }

    public function setEmailAttribute(string $value): void
    {
        $this->attributes['email'] = strtolower($value);
    }
}

// Usage
$user->password = 'plain-text'; // auto-hashed via mutator
```

**Casting (prefer over accessors when possible)**
```php
class Product extends Model
{
    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'published_at' => 'datetime:Y-m-d',
        'options' => AsEnumCollection::class . ':' . ProductOption::class,
    ];
}
```

### 3.4 Eager Loading

**Always prevent N+1**
```php
// BAD — N+1 query
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->user->name; // N queries!
}

// GOOD — Eager loaded
$orders = Order::with('user', 'items.product')->get();

// Lazy eager loading
$orders = Order::all();
if ($someCondition) {
    $orders->load('user', 'items.product');
}

// Nested eager loading
$orders = Order::with([
    'user' => function ($query) {
        $query->select('id', 'name', 'email');
    },
    'items.product.category',
])->get();

// Constrained eager loading
$posts = Post::with(['comments' => function ($query) {
    $query->where('is_approved', true)->latest();
}])->get();
```

**Default eager loading di Model**
```php
class Product extends Model
{
    protected $with = ['category']; // Always load category
}
```

**Count on relationship**
```php
$categories = Category::withCount('products')->get();
// $category->products_count
```

**Has (filter based on relationship existence)**
```php
$products = Product::has('tags', '>=', 3)->get();
$products = Product::whereHas('reviews', function ($query) {
    $query->where('rating', '>=', 4);
})->get();
```

---

## 4. REST API

### 4.1 Resource Controller

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService
    ) {}

    public function index(): JsonResponse
    {
        $products = $this->productService->getAll(request()->all());
        return $this->successResponse(
            ProductResource::collection($products),
            meta: [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        );
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->create($request->validated());
        return $this->successResponse(
            new ProductResource($product),
            'Product created',
            201
        );
    }

    public function show(int $id): JsonResponse
    {
        $product = $this->productService->getById($id);
        if (!$product) {
            return $this->errorResponse('Product not found', 404);
        }
        return $this->successResponse(new ProductResource($product));
    }

    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {
        $product = $this->productService->update($id, $request->validated());
        return $this->successResponse(new ProductResource($product), 'Product updated');
    }

    public function destroy(int $id): JsonResponse
    {
        $this->productService->delete($id);
        return $this->successResponse(null, 'Product deleted');
    }

    // Helper methods — bisa ditaruh di BaseController
    protected function successResponse(mixed $data, string $message = 'OK', int $code = 200, ?array $meta = null): JsonResponse
    {
        $response = [
            'status' => true,
            'message' => $message,
            'data' => $data,
        ];

        if ($meta) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $code);
    }

    protected function errorResponse(string $message, int $code = 400, ?array $errors = null): JsonResponse
    {
        $response = [
            'status' => false,
            'message' => $message,
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }
}
```

### 4.2 API Routes

```php
// routes/api.php
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\AuthController;

// Public
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/register', [AuthController::class, 'register']);

// Protected
Route::middleware('auth:api')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);

    Route::apiResource('products', ProductController::class);
    Route::apiResource('categories', CategoryController::class);
});
```

### 4.3 API Resource

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (float) $this->price,
            'formatted_price' => $this->formatted_price, // from accessor
            'stock' => $this->stock,
            'is_active' => $this->is_active,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'images' => MediaResource::collection($this->whenLoaded('media')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
```

**Resource Collection**
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ProductCollection extends ResourceCollection
{
    public $collects = ProductResource::class;

    /**
     * Transform the resource collection into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
        ];
    }

    public function with(Request $request): array
    {
        return [
            'status' => true,
            'message' => 'OK',
        ];
    }
}
```

### 4.4 Form Request Validation

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Atau gate/policy: $this->user()->can('create', Product::class);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('products')],
            'description' => ['nullable', 'string', 'max:5000'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'category_id' => ['required', 'exists:categories,id'],
            'is_active' => ['boolean'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['exists:tags,id'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    /**
     * Custom validation error messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama produk wajib diisi.',
            'slug.unique' => 'Slug sudah digunakan.',
            'price.min' => 'Harga tidak boleh negatif.',
            'category_id.exists' => 'Kategori tidak ditemukan.',
            'images.*.max' => 'Ukuran gambar maksimal 2MB.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'slug' => $this->slug ?? str($this->name)->slug(),
        ]);
    }
}
```

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('products')->ignore($productId)],
            'description' => ['nullable', 'string', 'max:5000'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'category_id' => ['sometimes', 'required', 'exists:categories,id'],
            'is_active' => ['boolean'],
        ];
    }
}
```

### Aturan Form Request

1. **Gunakan** `sometimes` untuk update request — hanya validasi field yang dikirim.
2. **Handle** `Rule::unique()->ignore($id)` untuk update.
3. **Gunakan** `prepareForValidation()` untuk normalize data sebelum validasi.
4. **Jangan** tambah logika bisnis di Form Request — hanya validasi.
5. **Gunakan** `authorize()` jika perlu gate/policy check.

---

## 5. JWT Auth (tymon/jwt-auth)

### 5.1 Instalasi & Konfigurasi

```bash
composer require tymon/jwt-auth:^2.0
php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
php artisan jwt:secret
```

### 5.2 User Model Setup

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'avatar',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    // JWT
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role,
            'guard' => 'api',
        ];
    }
}
```

### 5.3 Config JWT (`config/jwt.php`)

```php
// Key settings
'ttl' => env('JWT_TTL', 60),        // minutes
'refresh_ttl' => env('JWT_REFRESH_TTL', 20160), // 14 days
'blacklist_enabled' => env('JWT_BLACKLIST_ENABLED', true),
'providers' => [
    'user' => App\Models\User::class,
    'storage' => Tymon\JWTAuth\Providers\Storage\IlluminateCache::class,
],
```

### 5.4 Auth Controller

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');
        $token = $this->authService->attemptLogin($credentials);

        if (!$token) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        return $this->respondWithToken($token);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register($request->validated());
        $token = auth('api')->login($user);

        return response()->json([
            'status' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => new \App\Http\Resources\UserResource($user),
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
            ],
        ], 201);
    }

    public function me(): JsonResponse
    {
        return response()->json([
            'status' => true,
            'data' => new \App\Http\Resources\UserResource(auth('api')->user()),
        ]);
    }

    public function logout(): JsonResponse
    {
        auth('api')->logout();
        return response()->json([
            'status' => true,
            'message' => 'Successfully logged out',
        ]);
    }

    public function refresh(): JsonResponse
    {
        return $this->respondWithToken(auth('api')->refresh());
    }

    protected function respondWithToken(string $token): JsonResponse
    {
        return response()->json([
            'status' => true,
            'message' => 'OK',
            'data' => [
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
            ],
        ]);
    }
}
```

### 5.5 Auth Service

```php
<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Exceptions\AuthenticationException;

class AuthService
{
    public function __construct(
        protected UserRepository $userRepository
    ) {}

    public function attemptLogin(array $credentials): ?string
    {
        if (!$token = auth('api')->attempt($credentials)) {
            return null;
        }
        return $token;
    }

    public function register(array $data): User
    {
        DB::beginTransaction();
        try {
            $data['password'] = Hash::make($data['password']);
            $user = $this->userRepository->create($data);
            DB::commit();
            return $user;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new AuthenticationException('Registration failed: ' . $e->getMessage());
        }
    }
}
```

### 5.6 Middleware JWT

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class JwtMiddleware
{
    public function handle($request, Closure $next)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not found',
                ], 404);
            }
        } catch (TokenExpiredException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Token has expired',
            ], 401);
        } catch (TokenInvalidException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Token is invalid',
            ], 401);
        } catch (JWTException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Token not provided',
            ], 401);
        }

        return $next($request);
    }
}
```

### 5.7 Register Middleware

```php
// app/Http/Kernel.php (Laravel 10) atau bootstrap/app.php (Laravel 11)
// Laravel 10:
protected $routeMiddleware = [
    // ...
    'jwt.verify' => \App\Http\Middleware\JwtMiddleware::class,
    'jwt.auth' => \Tymon\JWTAuth\Http\Middleware\Authenticate::class,
    'jwt.refresh' => \Tymon\JWTAuth\Http\Middleware\RefreshToken::class,
];

// Laravel 11 (bootstrap/app.php):
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'jwt.verify' => \App\Http\Middleware\JwtMiddleware::class,
    ]);
})
```

### Aturan JWT Auth

1. **Gunakan** `auth('api')->user()` untuk akses user terautentikasi.
2. **Always** set `JWT_TTL` di `.env` (default 60 menit).
3. **Jangan** simpan token di database — JWT stateless.
4. **Gunakan** `jwt:secret` untuk regenerasi secret key.
5. **Logout** = blacklist token (pastikan `jwt.php` blacklist enabled).

---

## 6. Testing (PHPUnit)

### 6.1 PHPUnit Config

```xml
<!-- phpunit.xml key settings -->
<phpunit>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
        <env name="CACHE_DRIVER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="JWT_SECRET" value="testing-secret-key-here"/>
    </php>
</phpunit>
```

### 6.2 Feature Tests

```php
<?php

namespace Tests\Feature\API;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class ProductControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $this->token = auth('api')->login($this->user);
    }

    /** @test */
    public function it_can_list_products(): void
    {
        Product::factory()->count(15)->create();

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
        ])->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'price', 'category'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    /** @test */
    public function it_can_create_a_product(): void
    {
        $category = Category::factory()->create();

        $payload = [
            'name' => 'Test Product',
            'slug' => 'test-product',
            'description' => 'A test product description',
            'price' => 150000,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ];

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
        ])->postJson('/api/products', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'status' => true,
                'message' => 'Product created',
            ])
            ->assertJsonPath('data.name', 'Test Product');

        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'slug' => 'test-product',
        ]);
    }

    /** @test */
    public function it_validates_required_fields(): void
    {
        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
        ])->postJson('/api/products', []);

        $response->assertStatus(422)
            ->assertJson([
                'status' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonStructure([
                'errors' => ['name', 'price', 'category_id'],
            ]);
    }

    /** @test */
    public function it_requires_authentication(): void
    {
        $response = $this->getJson('/api/products');
        $response->assertStatus(401);
    }

    /** @test */
    public function it_can_show_a_product(): void
    {
        $product = Product::factory()->withCategory()->create();

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
        ])->getJson("/api/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $product->id);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_product(): void
    {
        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
        ])->getJson('/api/products/99999');

        $response->assertStatus(404);
    }

    /** @test */
    public function it_can_update_a_product(): void
    {
        $product = Product::factory()->create();
        $newCategory = Category::factory()->create();

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
        ])->putJson("/api/products/{$product->id}", [
            'name' => 'Updated Name',
            'category_id' => $newCategory->id,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Name',
            'category_id' => $newCategory->id,
        ]);
    }

    /** @test */
    public function it_can_delete_a_product(): void
    {
        $product = Product::factory()->create();

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
        ])->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted($product);
    }

    /** @test */
    public function it_can_login_and_return_token(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => $this->user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => ['token', 'token_type', 'expires_in'],
            ]);
    }
}
```

### 6.3 Model Factories

```php
<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => fake()->unique()->words(3, true),
            'slug' => fn(array $attrs) => str($attrs['name'])->slug(),
            'description' => fake()->paragraph(),
            'price' => fake()->numberBetween(10000, 1000000),
            'stock' => fake()->numberBetween(0, 100),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn(array $attributes) => [
            'stock' => 0,
        ]);
    }

    public function expensive(): static
    {
        return $this->state(fn(array $attributes) => [
            'price' => fake()->numberBetween(1000000, 10000000),
        ]);
    }

    public function withCategory(): static
    {
        return $this->state(fn(array $attributes) => [
            'category_id' => Category::factory(),
        ]);
    }
}
```

### 6.4 Unit Test (Service)

```php
<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\ProductService;
use App\Repositories\ProductRepository;
use App\Models\Product;
use Mockery\MockInterface;

class ProductServiceTest extends TestCase
{
    public function test_it_can_get_all_products(): void
    {
        $mockRepo = $this->mock(ProductRepository::class, function (MockInterface $mock) {
            $mock->shouldReceive('paginate')
                ->once()
                ->andReturn(\Mockery::mock(\Illuminate\Pagination\LengthAwarePaginator::class));
        });

        $service = new ProductService($mockRepo);
        $result = $service->getAll([]);

        $this->assertInstanceOf(\Illuminate\Pagination\LengthAwarePaginator::class, $result);
    }

    public function test_it_can_create_a_product(): void
    {
        $data = [
            'name' => 'Test Product',
            'price' => 50000,
            'category_id' => 1,
        ];

        $mockRepo = $this->mock(ProductRepository::class, function (MockInterface $mock) use ($data) {
            $mock->shouldReceive('create')
                ->once()
                ->with($data)
                ->andReturn(new Product($data));
        });

        $service = new ProductService($mockRepo);
        $product = $service->create($data);

        $this->assertEquals('Test Product', $product->name);
    }
}
```

### Aturan Testing

1. **Gunakan** `RefreshDatabase` untuk feature tests — setiap test database fresh.
2. **Gunakan** `WithFaker` untuk generate data realistis.
3. **Test** setiap endpoint: sukses, validasi gagal, 404, 401 (unauthorized).
4. **Mock** Repository di unit test Service — jangan test database di unit test.
5. **Gunakan** `assertJsonStructure()` untuk cek shape response, `assertJsonPath()` untuk specific value.

---

## 7. Migrations & Seeders

### 7.1 Migration Convention

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('slug', 255)->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->integer('stock')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('is_active');
            $table->index(['category_id', 'is_active']);
            $table->fullText(['name', 'description']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
```

**Best Practice Columns**

| Data Type    | Column                       | Notes                                 |
|-------------|------------------------------|---------------------------------------|
| ID          | `$table->id()`               | Auto-increment primary key             |
| FK          | `foreignId('user_id')->constrained()->cascadeOnDelete()` | |
| String      | `$table->string('name', 255)` |                                      |
| Unique      | `$table->string('slug')->unique()` |                                |
| Text        | `$table->text('description')->nullable()` | |
| Decimal     | `$table->decimal('price', 12, 2)` |                             |
| Boolean     | `$table->boolean('is_active')->default(true)` | |
| JSON        | `$table->json('metadata')->nullable()` | |
| Timestamps  | `$table->timestamps()`        | created_at, updated_at                |
| Soft Delete | `$table->softDeletes()`       | deleted_at (nullable)                 |
| Index       | `$table->index('column')`     | Untuk query yang sering filter       |
| Composite   | `$table->index(['col1', 'col2'])` | Multi-column index               |
| Fulltext    | `$table->fullText(['col1', 'col2'])` | Untuk search               |

**Pivot Table**
```php
Schema::create('product_tag', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->integer('quantity')->default(1);
    $table->timestamps();

    $table->unique(['product_id', 'tag_id']);
});
```

### 7.2 Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            ProductSeeder::class,
            TagSeeder::class,
        ]);
    }
}
```

```php
<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::all();

        // Create specific products
        Product::create([
            'category_id' => $categories->random()->id,
            'name' => 'Uniqlo Oversized T-Shirt',
            'slug' => 'uniqlo-oversized-t-shirt',
            'price' => 199000,
            'stock' => 50,
            'is_active' => true,
        ]);

        // Create random products using factory
        Product::factory()->count(50)->create([
            'category_id' => fn() => $categories->random()->id,
        ]);
    }
}
```

**Run seeders:**
```bash
php artisan db:seed
php artisan db:seed --class=ProductSeeder
php artisan migrate:fresh --seed
```

### Aturan Migration & Seeder

1. **Always** define `down()` method untuk rollback.
2. **Gunakan** `foreignId()->constrained()` dibanding `unsignedBigInteger()`.
3. **Tambahkan** index untuk kolom yang sering di-query (WHERE, ORDER BY, JOIN).
4. **Gunakan** `softDeletes()` daripada hard delete untuk data penting.
5. **Seeder** gunakan factory untuk data dummy, hardcode untuk data master (roles, categories).

---

## 8. Error Handling

### 8.1 Exception Handler (`app/Exceptions/Handler.php`)

```php
<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $levels = [
        //
    ];

    protected $dontReport = [
        //
    ];

    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Report or log an exception.
     */
    public function report(Throwable $e): void
    {
        parent::report($e);
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->renderApiException($e);
        }

        return parent::render($request, $e);
    }

    protected function renderApiException(Throwable $e): \Illuminate\Http\JsonResponse
    {
        // Model not found (404)
        if ($e instanceof ModelNotFoundException) {
            return response()->json([
                'status' => false,
                'message' => 'Resource not found',
            ], 404);
        }

        // HTTP Not Found (404)
        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'status' => false,
                'message' => 'Endpoint not found',
            ], 404);
        }

        // Validation errors (422)
        if ($e instanceof ValidationException) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        // Authentication (401)
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        // Authorization (403)
        if ($e instanceof AuthorizationException) {
            return response()->json([
                'status' => false,
                'message' => 'Forbidden',
            ], 403);
        }

        // Custom exceptions
        if ($e instanceof ServiceException) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        }

        if ($e instanceof AuthenticationException) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        }

        // HTTP errors (custom status codes)
        if ($e instanceof HttpException) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage() ?: 'HTTP Error',
            ], $e->getStatusCode());
        }

        // Unexpected errors (500)
        // Log the actual error for debugging
        \Illuminate\Support\Facades\Log::error($e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        if (config('app.debug')) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }

        return response()->json([
            'status' => false,
            'message' => 'Internal server error',
        ], 500);
    }
}
```

### 8.2 Custom Exceptions

```php
<?php

namespace App\Exceptions;

use Exception;

class ServiceException extends Exception
{
    protected int $statusCode;

    public function __construct(string $message = 'Service error', int $statusCode = 500, ?\Throwable $previous = null)
    {
        parent::__construct($message, $statusCode, $previous);
        $this->statusCode = $statusCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
```

```php
<?php

namespace App\Exceptions;

use Exception;

class NotFoundException extends Exception
{
    protected int $statusCode = 404;

    public function __construct(string $message = 'Resource not found')
    {
        parent::__construct($message, $this->statusCode);
    }
}
```

```php
<?php

namespace App\Exceptions;

use Exception;

class AuthenticationException extends Exception
{
    protected int $statusCode = 401;

    public function __construct(string $message = 'Authentication failed')
    {
        parent::__construct($message, $this->statusCode);
    }
}
```

```php
<?php

namespace App\Exceptions;

use Exception;

class BusinessRuleException extends Exception
{
    protected int $statusCode = 422;

    public function __construct(string $message = 'Business rule violation')
    {
        parent::__construct($message, $this->statusCode);
    }
}
```

### 8.3 Validation Error Customization

Override `failedValidation()` di Form Request untuk response konsisten:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class BaseFormRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422));
    }
}
```

**Atau** override di Exception Handler sudah mencakup semua — gunakan pendekatan Handler jika ingin response global.

### Aturan Error Handling

1. **Selalu** return response konsisten `{ status, message, data?, errors? }`.
2. **Tangani** exception spesifik di Handler, jangan try-catch di setiap Controller.
3. **Gunakan** custom exception class untuk business logic error.
4. **Log** unexpected errors (500) jangan sampai bocor ke client.
5. **Jangan** expose `$e->getTraceAsString()` di production.

---

## 9. Performance

### 9.1 N+1 Prevention

**Detect N+1:**
```bash
composer require beyondcode/laravel-query-detector --dev
```

**Atau gunakan Laravel built-in:**
```php
// app/Providers/AppServiceProvider.php
public function boot(): void
{
    // Only in non-production
    if (!app()->isProduction()) {
        \Illuminate\Support\Facades\DB::listen(function ($query) {
            if ($query->time > 100) {
                logger()->warning('Slow query: ' . $query->sql, $query->bindings);
            }
        });
    }
}
```

**Best practices:**
- **Always** add `$with` array on Model for always-loaded relations.
- **Always** use `with()` when listing collections.
- **Always** use `whenLoaded()` in API Resources to avoid loading relations that weren't requested.
- **Gunakan** `load()` for lazy eager loading when conditionally needed.

### 9.2 Caching

**Cache query results:**
```php
use Illuminate\Support\Facades\Cache;

class ProductRepository extends BaseRepository
{
    public function getPopular(int $limit = 10): Collection
    {
        $cacheKey = "products:popular:{$limit}";

        return Cache::remember($cacheKey, 3600, function () use ($limit) {
            return Product::withCount('orderItems')
                ->orderBy('order_items_count', 'desc')
                ->take($limit)
                ->get();
        });
    }

    public function findBySlug(string $slug): ?Product
    {
        return Cache::remember("product:slug:{$slug}", 3600, function () use ($slug) {
            return Product::with('category', 'tags')->where('slug', $slug)->first();
        });
    }
}
```

**Clear cache on update:**
```php
class ProductService
{
    public function update(int $id, array $data): Product
    {
        DB::beginTransaction();
        try {
            $product = $this->productRepository->update($id, $data);

            // Clear related caches
            Cache::forget("product:{$id}");
            Cache::forget("product:slug:{$product->slug}");
            Cache::tags(['products'])->flush();

            DB::commit();
            return $product;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
```

**Cache tags (Redis/Memcached only):**
```php
// Store with tags
Cache::tags(['products', 'categories'])->remember('products:all', 3600, function () {
    return Product::with('category')->get();
});

// Flush entire group
Cache::tags(['products'])->flush();
```

**Helper trait:**
```php
<?php

namespace App\Services\Traits;

use Illuminate\Support\Facades\Cache;

trait CacheableService
{
    protected function cacheGet(string $key, callable $callback, int $ttl = 3600): mixed
    {
        return Cache::remember($key, $ttl, $callback);
    }

    protected function cacheForget(string $key): void
    {
        Cache::forget($key);
    }

    protected function cacheTags(array $tags): \Illuminate\Cache\TaggedCache
    {
        return Cache::tags($tags);
    }

    protected function flushByTags(array $tags): void
    {
        Cache::tags($tags)->flush();
    }
}
```

### 9.3 Query Optimization

**Select only needed columns:**
```php
// BAD
$users = User::all();

// GOOD
$users = User::select('id', 'name', 'email')->get();
```

**Use chunk for large datasets:**
```php
// Process large dataset without memory issues
Product::chunk(100, function ($products) {
    foreach ($products as $product) {
        // Process $product
    }
});

// Lazy loading with cursor (even lower memory)
foreach (Product::cursor() as $product) {
    // Process $product
}
```

**Use simplePaginate for faster pagination:**
```php
// simplePaginate — no total count, just "has more pages"
$products = Product::simplePaginate(15);

// Or use cursor pagination (Laravel 8+)
$products = Product::cursorPaginate(15);
```

**Avoid lazy loading in loops:**
```php
// BAD — N+1
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->user->name; // Query per iteration
}

// GOOD
$orders = Order::with('user')->get();
foreach ($orders as $order) {
    echo $order->user->name;
}
```

**Use eager loading with constraint:**
```php
// Only load active comments, limited to 5
$posts = Post::with(['comments' => function ($query) {
    $query->where('is_approved', true)->latest()->limit(5);
}])->get();
```

**Use `whereHas` with subquery optimization instead of loading all:**
```php
// BAD — loads all users and their posts
$users = User::with('posts')->get();

// GOOD — only get users with posts
$users = User::whereHas('posts', function ($query) {
    $query->where('is_published', true);
})->with('posts')->get();
```

**Use `exists()` instead of `count() > 0`:**
```php
// BAD — executes COUNT query
if (Product::where('category_id', $id)->count() > 0) { ... }

// GOOD — executes EXISTS query (faster)
if (Product::where('category_id', $id)->exists()) { ... }
```

**Raw expressions for complex queries:**
```php
// Using DB::raw for native SQL functions
$products = Product::select('*')
    ->selectRaw('(price * (1 - COALESCE(discount, 0) / 100)) as final_price')
    ->get();

// Using whereRaw
$users = User::whereRaw('TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) >= 17')->get();
```

### 9.4 Performance Checklist

| Area | Check |
|------|-------|
| N+1 | All `with()` or `load()` used for relationships |
| Columns | `select()` only needed columns, no `select *` |
| Pagination | Use paginate/simplePaginate/cursorPaginate |
| Cache | Frequent read queries cached |
| Cache invalidation | Cache cleared on create/update/delete |
| Indexes | Columns in WHERE/ORDER BY/JOIN indexed |
| Lazy loading in views | Preload relations before passing to views |
| Chunking | Large dataset processing uses chunk/cursor |
| Query count | Minimize queries per request |
| JSON response | No `toArray()` on huge collections |

---

## Quick Reference: Artisan Commands

```bash
# Instalasi & Konfigurasi JWT
composer require tymon/jwt-auth:^2.0
php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
php artisan jwt:secret

# Scaffolding
php artisan make:model Product -m
php artisan make:controller API/ProductController --api
php artisan make:request StoreProductRequest
php artisan make:request UpdateProductRequest
php artisan make:resource ProductResource
php artisan make:seeder ProductSeeder
php artisan make:factory ProductFactory
php artisan make:test 'Feature/API/ProductControllerTest'

# Database
php artisan migrate:fresh --seed
php artisan db:seed --class=ProductSeeder

# Testing
php artisan test --filter=ProductControllerTest
php artisan test --testsuite=Feature --stop-on-failure
php artisan test --parallel  # ParaTest

# Optimization
php artisan optimize
php artisan route:cache
php artisan config:cache
php artisan view:cache
```

---

## Directory Structure Summary

```
app/
├── Http/
│   ├── Controllers/API/    # Resource Controllers
│   ├── Requests/           # Form Request Validation
│   ├── Resources/          # API Resources
│   └── Middleware/         # JWT Middleware
├── Models/                 # Eloquent Models
├── Services/               # Business Logic Layer
│   ├── Contracts/          # Service Interfaces
│   └── Traits/             # Service Traits (Cacheable, etc.)
├── Repositories/           # Data Access Layer
│   ├── Contracts/          # Repository Interfaces
│   └── Traits/             # Repository Traits
├── Exceptions/             # Custom Exception Classes
├── Providers/              # Service Providers
└── Policies/               # Authorization Policies

database/
├── migrations/             # Schema Migrations
├── seeders/                # Database Seeders
└── factories/              # Model Factories

tests/
├── Feature/API/            # Feature Tests for API
├── Unit/Services/          # Unit Tests for Services
└── Unit/Repositories/      # Unit Tests for Repositories
```
