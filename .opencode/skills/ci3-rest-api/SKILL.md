---
name: ci3-rest-api
description: >-
  CodeIgniter 3 REST API patterns and conventions: MVC structure (controllers/api/, models/, views/),
  RESTful endpoints with chriskacerguis/RestServer library, JWT authentication using firebase/php-jwt,
  full CRUD patterns, form validation, database query builder, error handling, and security
  (XSS filtering, CSRF protection, SQL injection prevention). Designed for the code-igniter-3-fullstack
  agent building production-grade CI3 REST APIs with consistent response envelopes and secure defaults.
version: "1.0.0"
author: opencode-agent-kit
license: MIT
metadata:
  target_agent: code-igniter-3-fullstack
  stack:
    - CodeIgniter 3
    - chriskacerguis/RestServer
    - firebase/php-jwt
    - MySQL
    - PostgreSQL
    - MVC Monolith
  tags:
    - codeigniter
    - rest-api
    - jwt
    - crud
    - mvc
---

# CI3 REST API Skill

**Target Agent:** @code-igniter-3-fullstack  
**Stack:** CodeIgniter 3 · RestServer · firebase/php-jwt · MySQL/PostgreSQL · MVC Monolith

Comprehensive reference for building production-grade REST APIs with CodeIgniter 3, covering project structure, controller patterns, JWT authentication flow, CRUD conventions, validation, security hardening, and error handling.

---

## 1. Project Structure

Standard CI3 MVC layout for REST API projects:

```
project_root/
├── application/
│   ├── controllers/
│   │   ├── api/               # REST API controllers
│   │   └── web/               # Optional web controllers
│   ├── models/                 # Data access layer
│   ├── views/                  # Templates (JSON views or HTML)
│   ├── config/                 # Configuration files
│   │   ├── rest.php            # RestServer config
│   │   ├── jwt.php             # JWT config (custom)
│   │   └── routes.php          # Route definitions
│   ├── libraries/              # Custom libraries (JWT helper, etc.)
│   ├── helpers/                # Custom helpers
│   ├── hooks/                  # Hooks (auth middleware, etc.)
│   ├── third_party/            # RestServer library
│   └── logs/                   # Error logs
├── assets/                     # Static assets (if any)
├── system/                     # CI3 system core
└── composer.json               # Dependency management (php-jwt, etc.)
```

### Rationale

- **`controllers/api/`** — All REST endpoints live here, separated from web controllers
- **`models/`** — Single responsibility: one model per entity/table
- **`views/`** — Can serve JSON via `$this->output->set_content_type('application/json')` or render HTML
- **`libraries/`** — Custom classes like `JWT_library` or `Auth_library`
- **`config/rest.php`** — RestServer configuration (auth methods, rate limiting, response formats)
- **`config/jwt.php`** — Custom config for JWT secret, expiry, algorithms

---

## 2. RestServer Library Setup

### Installation

1. Download `chriskacerguis/codeigniter-restserver` or add via Composer:
```bash
composer require chriskacerguis/codeigniter-restserver
```

2. Extend `RestController` instead of `CI_Controller` in API controllers:
```php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . '/libraries/REST_Controller.php';

use RestServer\REST_Controller;

class Users extends REST_Controller {
    // ...
}
```

### REST Controller Configuration (`application/config/rest.php`)

Key configuration options:

| Config Key | Description | Recommended Value |
|---|---|---|
| `$config['rest_default_format']` | Default response format | `'json'` |
| `$config['rest_supported_formats']` | Allowed formats | `['json', 'xml']` |
| `$config['rest_auth']` | Authentication method | `'basic'` or `'digest'` |
| `$config['rest_valid_logins']` | Valid credentials for basic auth | `[]` (use JWT instead) |
| `$config['rest_ip_whitelist_enabled']` | IP whitelist | `FALSE` |
| `$config['rest_ip_whitelist']` | Allowed IPs | `[]` |
| `$config['rest_enable_logging']` | Log API requests | `TRUE` in production |
| `$config['rest_enable_keys']` | API key system | `FALSE` (use JWT) |
| `$config['rest_limits_method']` | Rate limiting method | `'ROUTED_URL'` |
| `$config['rest_limits']` | Rate limits per method | `[]` |

### Core Methods

| RestController Method | HTTP Verb | Purpose |
|---|---|---|
| `$this->get('key')` | GET | Retrieve input from query string |
| `$this->post('key')` | POST | Retrieve input from POST body |
| `$this->put('key')` | PUT | Retrieve input from PUT body |
| `$this->delete('key')` | DELETE | Retrieve input from DELETE body |
| `$this->patch('key')` | PATCH | Retrieve input from PATCH body |
| `$this->options('key')` | OPTIONS | Retrieve input from OPTIONS body |
| `$this->response($data, $status)` | Any | Send JSON response with status code |
| `$this->set_response($data, $status)` | Any | Alternate response method |
| `$this->verify_request()` | Any | Validate auth (custom override) |

---

## 3. JWT Authentication

### Dependencies

```bash
composer require firebase/php-jwt
```

### JWT Configuration (`application/config/jwt.php`)

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$config['jwt_key']            = getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production';
$config['jwt_algorithm']      = 'HS256';
$config['jwt_expiry']         = 3600;        // 1 hour in seconds
$config['jwt_refresh_expiry'] = 604800;      // 7 days in seconds
$config['jwt_issuer']         = 'ci3-api';
```

### JWT Library (`application/libraries/JWT_library.php`)

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

class JWT_library {
    protected $CI;
    protected $key;
    protected $algorithm;

    public function __construct() {
        $this->CI =& get_instance();
        $this->CI->load->config('jwt', TRUE);
        $this->key       = $this->CI->config->item('jwt_key', 'jwt');
        $this->algorithm = $this->CI->config->item('jwt_algorithm', 'jwt');
    }

    /**
     * Generate a JWT token for a given user.
     */
    public function encode(array $payload): string {
        $issuedAt  = time();
        $expiry    = $this->CI->config->item('jwt_expiry', 'jwt');

        $token = [
            'iss'  => $this->CI->config->item('jwt_issuer', 'jwt'),
            'iat'  => $issuedAt,
            'exp'  => $issuedAt + $expiry,
            'data' => $payload,
        ];

        return JWT::encode($token, $this->key, $this->algorithm);
    }

    /**
     * Decode and validate a JWT token.
     * Returns the payload data or throws on failure.
     */
    public function decode(string $token): object {
        try {
            $decoded = JWT::decode($token, new Key($this->key, $this->algorithm));
            return $decoded->data;
        } catch (ExpiredException $e) {
            throw new \RuntimeException('Token has expired');
        } catch (\Exception $e) {
            throw new \RuntimeException('Invalid token: ' . $e->getMessage());
        }
    }

    /**
     * Generate a refresh token with longer expiry.
     */
    public function encodeRefresh(array $payload): string {
        $issuedAt     = time();
        $refreshExpiry = $this->CI->config->item('jwt_refresh_expiry', 'jwt');

        $token = [
            'iss'  => $this->CI->config->item('jwt_issuer', 'jwt'),
            'iat'  => $issuedAt,
            'exp'  => $issuedAt + $refreshExpiry,
            'data' => $payload,
            'type' => 'refresh',
        ];

        return JWT::encode($token, $this->key, $this->algorithm);
    }
}
```

### JWT Validation Hook / Middleware

Option A — Per-controller `_is_logged_in()` method:

```php
/**
 * Verify JWT token from Authorization header.
 * Called at the start of protected methods.
 */
private function _is_logged_in(): bool {
    $this->load->library('JWT_library');

    $authHeader = $this->input->get_request_header('Authorization');

    if (!$authHeader) {
        $this->response([
            'status'  => false,
            'message' => 'Authorization header is missing',
        ], REST_Controller::HTTP_UNAUTHORIZED);
        return false;
    }

    $parts = explode(' ', $authHeader);
    if (count($parts) !== 2 || strtolower($parts[0]) !== 'bearer') {
        $this->response([
            'status'  => false,
            'message' => 'Invalid authorization format. Use: Bearer <token>',
        ], REST_Controller::HTTP_UNAUTHORIZED);
        return false;
    }

    try {
        $this->jwt_data = $this->jwt_library->decode($parts[1]);
        return true;
    } catch (\RuntimeException $e) {
        $this->response([
            'status'  => false,
            'message' => $e->getMessage(),
        ], REST_Controller::HTTP_UNAUTHORIZED);
        return false;
    }
}
```

Option B — CI3 Hook (global middleware):

In `application/config/hooks.php`:
```php
$hook['post_controller_constructor'][] = [
    'class'    => 'Auth_hook',
    'function' => 'authenticate',
    'filename' => 'Auth_hook.php',
    'filepath' => 'hooks',
];
```

### Login / Token Endpoint

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . '/libraries/REST_Controller.php';

use RestServer\REST_Controller;

class Auth extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('User_model');
    }

    /**
     * POST /api/auth/login
     * Authenticate user and return JWT token.
     */
    public function login_post() {
        $this->load->library('form_validation');

        $this->form_validation->set_data([
            'email'    => $this->post('email'),
            'password' => $this->post('password'),
        ]);

        $this->form_validation->set_rules('email',    'Email',    'required|valid_email|trim');
        $this->form_validation->set_rules('password', 'Password', 'required|trim');

        if ($this->form_validation->run() === FALSE) {
            $this->response([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $this->form_validation->error_array(),
            ], REST_Controller::HTTP_UNPROCESSABLE_ENTITY);
            return;
        }

        $user = $this->User_model->get_by_email($this->post('email'));

        if (!$user || !password_verify($this->post('password'), $user->password)) {
            $this->response([
                'status'  => false,
                'message' => 'Invalid email or password',
            ], REST_Controller::HTTP_UNAUTHORIZED);
            return;
        }

        $this->load->library('JWT_library');

        $tokenPayload = [
            'user_id'  => $user->id,
            'email'    => $user->email,
            'role'     => $user->role ?? 'user',
        ];

        $token        = $this->jwt_library->encode($tokenPayload);
        $refreshToken = $this->jwt_library->encodeRefresh(['user_id' => $user->id]);

        $this->response([
            'status'  => true,
            'message' => 'Login successful',
            'data'    => [
                'token'         => $token,
                'refresh_token' => $refreshToken,
                'expires_in'    => $this->config->item('jwt_expiry', 'jwt'),
                'user'          => [
                    'id'    => $user->id,
                    'email' => $user->email,
                    'name'  => $user->name ?? '',
                    'role'  => $user->role ?? 'user',
                ],
            ],
        ], REST_Controller::HTTP_OK);
    }

    /**
     * POST /api/auth/refresh
     * Issue a new access token using a refresh token.
     */
    public function refresh_post() {
        $refreshToken = $this->post('refresh_token');

        if (!$refreshToken) {
            $this->response([
                'status'  => false,
                'message' => 'Refresh token is required',
            ], REST_Controller::HTTP_BAD_REQUEST);
            return;
        }

        $this->load->library('JWT_library');

        try {
            $data = $this->jwt_library->decode($refreshToken);
            $user = $this->User_model->get($data->user_id);

            if (!$user) {
                throw new \RuntimeException('User not found');
            }

            $newToken = $this->jwt_library->encode([
                'user_id' => $user->id,
                'email'   => $user->email,
                'role'    => $user->role ?? 'user',
            ]);

            $this->response([
                'status'  => true,
                'message' => 'Token refreshed',
                'data'    => [
                    'token'      => $newToken,
                    'expires_in' => $this->config->item('jwt_expiry', 'jwt'),
                ],
            ], REST_Controller::HTTP_OK);
        } catch (\RuntimeException $e) {
            $this->response([
                'status'  => false,
                'message' => $e->getMessage(),
            ], REST_Controller::HTTP_UNAUTHORIZED);
        }
    }
}
```

---

## 4. CRUD Patterns

### Base CRUD Controller Template

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . '/libraries/REST_Controller.php';

use RestServer\REST_Controller;

class Products extends REST_Controller {

    protected $model_name = 'Product_model';
    protected $validation_rules = [];

    public function __construct() {
        parent::__construct();
        $this->load->model($this->model_name);
        $this->load->library('form_validation');

        // Set validation rules
        $this->validation_rules = [
            [
                'field' => 'name',
                'label' => 'Name',
                'rules' => 'required|min_length[3]|max_length[255]|trim|xss_clean',
            ],
            [
                'field' => 'price',
                'label' => 'Price',
                'rules' => 'required|numeric|greater_than[0]|trim',
            ],
            [
                'field' => 'description',
                'label' => 'Description',
                'rules' => 'trim|xss_clean',
            ],
            [
                'field' => 'category_id',
                'label' => 'Category',
                'rules' => 'required|integer|trim',
            ],
        ];
    }

    /**
     * GET /api/products
     * List all products with optional filtering and pagination.
     */
    public function index_get() {
        $this->is_logged_in(); // JWT gate — see Section 3

        $page    = (int) $this->get('page') ?: 1;
        $limit   = (int) $this->get('limit') ?: 20;
        $offset  = ($page - 1) * $limit;

        $filters = [];
        if ($this->get('search'))     $filters['search']       = $this->get('search');
        if ($this->get('category_id')) $filters['category_id'] = $this->get('category_id');
        if ($this->get('status'))     $filters['status']       = $this->get('status');

        $result = $this->{$this->model_name}->get_all($filters, $limit, $offset);
        $total  = $this->{$this->model_name}->count_all($filters);

        $this->response([
            'status'  => true,
            'message' => 'Products retrieved successfully',
            'data'    => [
                'items'    => $result,
                'total'    => (int) $total,
                'page'     => $page,
                'per_page' => $limit,
                'pages'    => ceil($total / $limit),
            ],
        ], REST_Controller::HTTP_OK);
    }

    /**
     * GET /api/products/:id
     * Get a single product by ID.
     */
    public function show_get($id) {
        $this->is_logged_in();

        $product = $this->{$this->model_name}->get($id);

        if (!$product) {
            $this->response([
                'status'  => false,
                'message' => 'Product not found',
            ], REST_Controller::HTTP_NOT_FOUND);
            return;
        }

        $this->response([
            'status'  => true,
            'message' => 'Product retrieved successfully',
            'data'    => $product,
        ], REST_Controller::HTTP_OK);
    }

    /**
     * POST /api/products
     * Create a new product.
     */
    public function create_post() {
        $this->is_logged_in();

        $input = [
            'name'        => $this->post('name'),
            'price'       => $this->post('price'),
            'description' => $this->post('description'),
            'category_id' => $this->post('category_id'),
            'status'      => $this->post('status') ?: 'active',
        ];

        $this->form_validation->set_data($input);
        $this->form_validation->set_rules($this->validation_rules);

        if ($this->form_validation->run() === FALSE) {
            $this->response([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $this->form_validation->error_array(),
            ], REST_Controller::HTTP_UNPROCESSABLE_ENTITY);
            return;
        }

        $id = $this->{$this->model_name}->create($input);

        if (!$id) {
            $this->response([
                'status'  => false,
                'message' => 'Failed to create product',
            ], REST_Controller::HTTP_INTERNAL_SERVER_ERROR);
            return;
        }

        $product = $this->{$this->model_name}->get($id);

        $this->response([
            'status'  => true,
            'message' => 'Product created successfully',
            'data'    => $product,
        ], REST_Controller::HTTP_CREATED);
    }

    /**
     * PUT /api/products/:id
     * Update an existing product.
     */
    public function update_put($id) {
        $this->is_logged_in();

        $existing = $this->{$this->model_name}->get($id);
        if (!$existing) {
            $this->response([
                'status'  => false,
                'message' => 'Product not found',
            ], REST_Controller::HTTP_NOT_FOUND);
            return;
        }

        $input = [
            'name'        => $this->put('name'),
            'price'       => $this->put('price'),
            'description' => $this->put('description'),
            'category_id' => $this->put('category_id'),
            'status'      => $this->put('status'),
        ];

        // Remove nulls to allow partial updates
        $input = array_filter($input, function ($value) {
            return $value !== null;
        });

        if (!empty($input)) {
            $this->form_validation->set_data($input);
            $this->form_validation->set_rules($this->validation_rules);

            if ($this->form_validation->run() === FALSE) {
                $this->response([
                    'status'  => false,
                    'message' => 'Validation failed',
                    'errors'  => $this->form_validation->error_array(),
                ], REST_Controller::HTTP_UNPROCESSABLE_ENTITY);
                return;
            }

            $updated = $this->{$this->model_name}->update($id, $input);

            if (!$updated) {
                $this->response([
                    'status'  => false,
                    'message' => 'Failed to update product',
                ], REST_Controller::HTTP_INTERNAL_SERVER_ERROR);
                return;
            }
        }

        $product = $this->{$this->model_name}->get($id);

        $this->response([
            'status'  => true,
            'message' => 'Product updated successfully',
            'data'    => $product,
        ], REST_Controller::HTTP_OK);
    }

    /**
     * DELETE /api/products/:id
     * Delete a product (soft or hard).
     */
    public function delete_delete($id) {
        $this->is_logged_in();

        $existing = $this->{$this->model_name}->get($id);
        if (!$existing) {
            $this->response([
                'status'  => false,
                'message' => 'Product not found',
            ], REST_Controller::HTTP_NOT_FOUND);
            return;
        }

        $deleted = $this->{$this->model_name}->delete($id);

        if (!$deleted) {
            $this->response([
                'status'  => false,
                'message' => 'Failed to delete product',
            ], REST_Controller::HTTP_INTERNAL_SERVER_ERROR);
            return;
        }

        $this->response([
            'status'  => true,
            'message' => 'Product deleted successfully',
        ], REST_Controller::HTTP_OK);
    }

    /**
     * Validate JWT token. Halts execution on failure.
     */
    private function is_logged_in(): void {
        $this->load->library('JWT_library');
        $authHeader = $this->input->get_request_header('Authorization');

        if (!$authHeader) {
            $this->response([
                'status'  => false,
                'message' => 'Authorization header is missing',
            ], REST_Controller::HTTP_UNAUTHORIZED);
            exit;
        }

        $parts = explode(' ', $authHeader);
        if (count($parts) !== 2 || strtolower($parts[0]) !== 'bearer') {
            $this->response([
                'status'  => false,
                'message' => 'Invalid authorization format. Use: Bearer <token>',
            ], REST_Controller::HTTP_UNAUTHORIZED);
            exit;
        }

        try {
            $this->jwt_data = $this->jwt_library->decode($parts[1]);
        } catch (\RuntimeException $e) {
            $this->response([
                'status'  => false,
                'message' => $e->getMessage(),
            ], REST_Controller::HTTP_UNAUTHORIZED);
            exit;
        }
    }
}
```

### CRUD Method-to-Route Mapping

| HTTP Verb | URI Pattern | Controller Method | Purpose |
|---|---|---|---|
| GET | /api/resource | `index_get()` | List with pagination/filters |
| GET | /api/resource/:id | `show_get($id)` | Single resource detail |
| POST | /api/resource | `create_post()` | Create new resource |
| PUT | /api/resource/:id | `update_put($id)` | Full or partial update |
| PATCH | /api/resource/:id | `update_patch($id)` | Partial update (alt) |
| DELETE | /api/resource/:id | `delete_delete($id)` | Delete resource |

### Routing (`application/config/routes.php`)

```php
$route['api/products']             = 'api/products/index';
$route['api/products/(:num)']      = 'api/products/show/$1';
$route['api/products/create']      = 'api/products/create';
$route['api/products/update/(:num)'] = 'api/products/update/$1';
$route['api/products/delete/(:num)'] = 'api/products/delete/$1';

// Or use RestServer's built-in routing (auto-detect HTTP method)
$route['api/example']             = 'api/example';
$route['api/example/(:num)']      = 'api/example/show/$1';
```

---

## 5. Model Patterns (Database Query Builder)

### Base Model Template

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Product_model extends CI_Model {

    protected $table        = 'products';
    protected $primary_key  = 'id';
    protected $soft_delete  = TRUE;
    protected $allowed_fields = ['name', 'price', 'description', 'category_id', 'status'];

    public function __construct() {
        parent::__construct();
        $this->load->database();
    }

    /**
     * Get all records with filters, pagination, and ordering.
     */
    public function get_all(array $filters = [], int $limit = 20, int $offset = 0, string $order_by = 'created_at DESC'): array {
        $this->_apply_filters($filters);

        if ($this->soft_delete) {
            $this->db->where('deleted_at IS NULL');
        }

        $this->db->order_by($order_by);
        $this->db->limit($limit, $offset);

        $query = $this->db->get($this->table);
        return $query->result();
    }

    /**
     * Get a single record by primary key.
     */
    public function get($id): ?object {
        $this->db->where($this->primary_key, $id);

        if ($this->soft_delete) {
            $this->db->where('deleted_at IS NULL');
        }

        $query = $this->db->get($this->table);
        return $query->row() ?: null;
    }

    /**
     * Get by any column value.
     */
    public function get_by(string $field, $value): ?object {
        $this->db->where($field, $value);

        if ($this->soft_delete) {
            $this->db->where('deleted_at IS NULL');
        }

        $query = $this->db->get($this->table);
        return $query->row() ?: null;
    }

    /**
     * Get by email (convenience for auth).
     */
    public function get_by_email(string $email): ?object {
        return $this->get_by('email', $email);
    }

    /**
     * Create a new record. Returns inserted ID.
     */
    public function create(array $data): ?int {
        $data = $this->_filter_allowed($data);
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');

        if ($this->soft_delete) {
            $data['deleted_at'] = null;
        }

        return $this->db->insert($this->table, $data) ? $this->db->insert_id() : null;
    }

    /**
     * Update an existing record. Returns affected rows.
     */
    public function update($id, array $data): bool {
        $data = $this->_filter_allowed($data);
        $data['updated_at'] = date('Y-m-d H:i:s');

        $this->db->where($this->primary_key, $id);
        return $this->db->update($this->table, $data);
    }

    /**
     * Delete a record. Soft delete if enabled, hard delete otherwise.
     */
    public function delete($id): bool {
        if ($this->soft_delete) {
            return $this->update($id, ['deleted_at' => date('Y-m-d H:i:s')]);
        }

        $this->db->where($this->primary_key, $id);
        return $this->db->delete($this->table);
    }

    /**
     * Count total records (with optional filters).
     */
    public function count_all(array $filters = []): int {
        $this->_apply_filters($filters);

        if ($this->soft_delete) {
            $this->db->where('deleted_at IS NULL');
        }

        return $this->db->count_all_results($this->table);
    }

    /**
     * Apply safe WHERE conditions from filters.
     */
    protected function _apply_filters(array $filters): void {
        foreach ($filters as $field => $value) {
            if (in_array($field, $this->allowed_fields)) {
                if ($field === 'search') {
                    // Flexible search across multiple columns
                    $this->db->group_start();
                    $this->db->like('name', $value);
                    $this->db->or_like('description', $value);
                    $this->db->group_end();
                } else {
                    $this->db->where($field, $value);
                }
            }
        }
    }

    /**
     * Keep only allowed fields to prevent mass-assignment.
     */
    protected function _filter_allowed(array $data): array {
        return array_intersect_key($data, array_flip($this->allowed_fields));
    }
}
```

### Query Builder Best Practices

| Pattern | Description | Example |
|---|---|---|
| **Parameterized** | Always use Query Builder — never raw string interpolation | `$this->db->where('id', $id)` |
| **Whitelist fields** | Prevent mass-assignment via `_filter_allowed()` | `array_intersect_key($data, array_flip($allowed_fields))` |
| **Soft delete** | Use `deleted_at` column instead of hard delete | `$this->db->where('deleted_at IS NULL')` |
| **Joins** | Use Query Builder `join()` with escaped names | `$this->db->join('categories', 'categories.id = products.category_id')` |
| **Subqueries** | Use `$this->db->select()` with subquery | `$this->db->select('(SELECT COUNT(*) FROM orders WHERE product_id = products.id) as order_count')` |
| **Aggregates** | Safe COUNT, SUM, AVG | `$this->db->select_sum('price')` |
| **Transactions** | Wrap multi-table writes in transactions | See error handling section |

---

## 6. Form Validation

### Validation Rules Reference

CI3 built-in rules commonly used in REST APIs:

| Rule | Usage | Example |
|---|---|---|
| `required` | Field must not be empty | `'rules' => 'required'` |
| `valid_email` | Must be a valid email | `'rules' => 'required\|valid_email'` |
| `numeric` | Must be numeric | `'rules' => 'required\|numeric'` |
| `integer` | Must be an integer | `'rules' => 'required\|integer'` |
| `min_length[N]` | Min length N characters | `'rules' => 'required\|min_length[3]'` |
| `max_length[N]` | Max length N characters | `'rules' => 'required\|max_length[255]'` |
| `exact_length[N]` | Exactly N characters | `'rules' => 'exact_length[10]'` |
| `greater_than[N]` | Must be > N | `'rules' => 'greater_than[0]'` |
| `less_than[N]` | Must be < N | `'rules' => 'less_than[1000000]'` |
| `alpha` | Only alphabetic chars | `'rules' => 'alpha'` |
| `alpha_numeric` | Alpha + digits | `'rules' => 'alpha_numeric'` |
| `alpha_dash` | Alpha + digits + - _ | `'rules' => 'alpha_dash'` |
| `matches[field]` | Must match another field | `'rules' => 'matches[password_confirm]'` |
| `is_unique[table.field]` | Unique in DB | `'rules' => 'is_unique[users.email]'` |
| `xss_clean` | XSS filtering | `'rules' => 'xss_clean'` |
| `trim` | Strip whitespace | `'rules' => 'trim'` |
| `callback_*` | Custom validation method | `'rules' => 'callback_check_stock'` |

### Validation Pattern for REST Controllers

```php
// 1. Set input data explicitly (do not rely on $this->input->post())
$this->form_validation->set_data([
    'name'  => $this->post('name'),
    'email' => $this->post('email'),
]);

// 2. Define rules as array
$this->form_validation->set_rules([
    [
        'field' => 'name',
        'label' => 'Name',
        'rules' => 'required|min_length[3]|max_length[255]|trim|xss_clean',
    ],
    [
        'field' => 'email',
        'label' => 'Email',
        'rules' => 'required|valid_email|trim|xss_clean|is_unique[users.email]',
    ],
    [
        'field' => 'password',
        'label' => 'Password',
        'rules' => 'required|min_length[8]|trim',
    ],
]);

// 3. Run validation
if ($this->form_validation->run() === FALSE) {
    // Return structured error response
    $this->response([
        'status'  => false,
        'message' => 'Validation failed',
        'errors'  => $this->form_validation->error_array(),
    ], REST_Controller::HTTP_UNPROCESSABLE_ENTITY); // 422
    return;
}
```

### Custom Validation Callback

```php
/**
 * Custom callback: check that category exists.
 * Usage: 'rules' => 'callback_valid_category'
 */
public function valid_category($category_id): bool {
    $this->load->model('Category_model');
    $exists = $this->Category_model->get($category_id);

    if (!$exists) {
        $this->form_validation->set_message('valid_category', 'The selected category does not exist.');
        return false;
    }

    return true;
}
```

---

## 7. Error Handling

### Consistent Error Response Envelope

**Success:**
```json
{
  "status": true,
  "message": "Products retrieved successfully",
  "data": { ... }
}
```

**Error (general):**
```json
{
  "status": false,
  "message": "Product not found"
}
```

**Error (validation):**
```json
{
  "status": false,
  "message": "Validation failed",
  "errors": {
    "email": "The Email field must contain a valid email address.",
    "name": "The Name field is required."
  }
}
```

**Error (server):**
```json
{
  "status": false,
  "message": "An internal error occurred. Please try again later."
}
```

### HTTP Status Code Usage

| Code | Constant | When to Use |
|---|---|---|
| 200 | `HTTP_OK` | Successful GET, PUT, DELETE |
| 201 | `HTTP_CREATED` | Successful POST (resource created) |
| 204 | `HTTP_NO_CONTENT` | Successful DELETE (no body needed) |
| 400 | `HTTP_BAD_REQUEST` | Missing required parameters or malformed request |
| 401 | `HTTP_UNAUTHORIZED` | Missing/invalid/expired JWT token |
| 403 | `HTTP_FORBIDDEN` | Valid token but insufficient permissions |
| 404 | `HTTP_NOT_FOUND` | Resource does not exist |
| 409 | `HTTP_CONFLICT` | Duplicate resource or state conflict |
| 422 | `HTTP_UNPROCESSABLE_ENTITY` | Validation errors |
| 429 | `HTTP_TOO_MANY_REQUESTS` | Rate limit exceeded |
| 500 | `HTTP_INTERNAL_SERVER_ERROR` | Unexpected server error |

### Database Transaction with Try-Catch

```php
/**
 * Example: create an order with items in a transaction.
 */
public function create_order_post() {
    $this->is_logged_in();

    $this->load->model('Order_model');
    $this->load->model('Order_item_model');

    $this->db->trans_start(); // Begin transaction

    try {
        $orderId = $this->Order_model->create([
            'user_id'     => $this->jwt_data->user_id,
            'total'       => $this->post('total'),
            'status'      => 'pending',
        ]);

        if (!$orderId) {
            throw new \RuntimeException('Failed to create order');
        }

        $items = $this->post('items') ?: [];
        foreach ($items as $item) {
            $itemCreated = $this->Order_item_model->create([
                'order_id'   => $orderId,
                'product_id' => $item['product_id'],
                'quantity'   => $item['quantity'],
                'price'      => $item['price'],
            ]);

            if (!$itemCreated) {
                throw new \RuntimeException('Failed to create order item');
            }
        }

        $this->db->trans_complete(); // Commit

        $this->response([
            'status'  => true,
            'message' => 'Order created successfully',
            'data'    => ['order_id' => $orderId],
        ], REST_Controller::HTTP_CREATED);

    } catch (\Exception $e) {
        $this->db->trans_rollback(); // Rollback on failure

        log_message('error', 'Order creation failed: ' . $e->getMessage());

        $this->response([
            'status'  => false,
            'message' => 'Failed to create order. Please try again.',
        ], REST_Controller::HTTP_INTERNAL_SERVER_ERROR);
    }
}
```

### Global Exception Handling

In `application/config/config.php`, enable hook-based error handling:

```php
$config['log_threshold'] = 1; // Log error messages only
```

Create `application/hooks/App_hook.php`:

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class App_hook {

    /**
     * Catch 404 errors and return JSON for API routes.
     */
    public function handle_404() {
        $ci =& get_instance();

        // Only intercept API routes
        if (strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
            $ci->load->library('REST_Controller');

            $ci->response([
                'status'  => false,
                'message' => 'Endpoint not found',
            ], REST_Controller::HTTP_NOT_FOUND);
            exit;
        }
    }
}
```

---

## 8. Security

### 8.1 XSS Prevention

| Layer | Implementation | Notes |
|---|---|---|
| **Input filtering** | Use `xss_clean` in validation rules | `'rules' => 'required\|xss_clean'` |
| **Global XSS filter** | `$config['global_xss_filtering'] = TRUE;` in `config.php` | Filters all `$_GET`, `$_POST`, `$_COOKIE` (deprecated but still works in CI3) |
| **Output encoding** | Use `htmlspecialchars()` or `$this->security->xss_clean()` | Never trust user data in output |
| **Security helper** | `$this->load->helper('security');` | Provides `xss_clean()` function |

### 8.2 CSRF Protection

For REST APIs, CSRF is typically **disabled** because APIs use token-based auth (JWT). However, if your API also serves web views:

```php
// In application/config/config.php
$config['csrf_protection']   = TRUE;
$config['csrf_token_name']   = 'csrf_token';
$config['csrf_cookie_name']  = 'csrf_cookie';
$config['csrf_expire']       = 7200;

// Exempt API routes from CSRF (in application/config/config.php or custom hook)
$config['csrf_exclude_uris'] = [
    'api/.*',   // Regex to exempt all API routes
];
```

### 8.3 SQL Injection Prevention

CI3's Query Builder automatically escapes values. **Never bypass it.**

```php
// ✅ SAFE — Query Builder escapes automatically
$this->db->where('email', $email);
$this->db->get('users');

// ✅ SAFE — Parameterized with bind markers
$this->db->query('SELECT * FROM users WHERE email = ?', [$email]);

// ❌ DANGEROUS — Raw string interpolation
$this->db->query("SELECT * FROM users WHERE email = '$email'");

// ❌ DANGEROUS — Unescaped like/where with user input concatenated
$this->db->where("name LIKE '%" . $search . "%'"); // Use $this->db->like() instead
```

**Anti-pattern checklist:**

| Anti-pattern | Fix |
|---|---|
| `$this->db->query("WHERE id = $id")` | `$this->db->where('id', $id)` |
| `"email = '$email'"` | `$this->db->where('email', $email)` |
| `LIKE '%$term%'` | `$this->db->like('name', $term)` |
| `IN ($ids)` | `$this->db->where_in('id', $ids_array)` |
| `ORDER BY $_GET['sort']` | Whitelist allowed sort columns |

### 8.4 Additional Security Measures

**Password hashing:**
```php
// Registration
$data['password'] = password_hash($this->post('password'), PASSWORD_BCRYPT, ['cost' => 12]);

// Verification
if (password_verify($this->post('password'), $user->password)) { /* valid */ }
```

**Rate limiting (RestServer built-in):**
```php
// In application/config/rest.php
$config['rest_limits'] = [
    'api/products/index' => 60,   // 60 requests per hour
    'api/products/create' => 30,
    'api/auth/login'     => 10,   // Limit login attempts
];
```

**Input sanitization before database:**
```php
// Filter only allowed fields (prevents mass assignment)
$allowed = ['name', 'email', 'role'];
$data    = array_intersect_key($input, array_flip($allowed));

// Strip null bytes
$data = array_map(function ($value) {
    return is_string($value) ? str_replace("\0", '', $value) : $value;
}, $data);
```

**CORS headers (for client-side apps):**
```php
// In application/config/hooks.php
$hook['post_controller_constructor'] = [
    'class'    => 'Cors_hook',
    'function' => 'set_headers',
    'filename' => 'Cors_hook.php',
    'filepath' => 'hooks',
];

// application/hooks/Cors_hook.php
class Cors_hook {
    public function set_headers() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
}
```

**Environment-based secret management:**
```php
// .env (not committed)
JWT_SECRET=your-production-secret-here
DB_PASSWORD=secure-db-pass

// application/config/jwt.php
$config['jwt_key'] = getenv('JWT_SECRET') ?: 'fallback-dev-only';
```

---

## 9. Response Envelope (Standard Contract)

Every API response **must** follow this contract:

```json
{
  "status":  "<boolean> true | false",
  "message": "<string> human-readable summary",
  "data":    "<object|array|null> payload (omitted on simple errors)"
}
```

For validation errors, include an `errors` object:

```json
{
  "status":  false,
  "message": "Validation failed",
  "errors": {
    "field_name": "Error message for that field"
  }
}
```

For paginated lists, `data` contains:

```json
{
  "status":  true,
  "message": "Products retrieved successfully",
  "data": {
    "items":    [ ... ],
    "total":    42,
    "page":     1,
    "per_page": 20,
    "pages":    3
  }
}
```

---

## 10. Verification & Testing

### Curl Commands for Manual Testing

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'

# List products (with JWT)
curl http://localhost:8000/api/products?page=1&limit=20 \
  -H "Authorization: Bearer <TOKEN>"

# Get single product
curl http://localhost:8000/api/products/1 \
  -H "Authorization: Bearer <TOKEN>"

# Create product
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"New Product","price":29.99,"category_id":1}'

# Update product
curl -X PUT http://localhost:8000/api/products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Updated Name","price":39.99}'

# Delete product
curl -X DELETE http://localhost:8000/api/products/1 \
  -H "Authorization: Bearer <TOKEN>"

# Refresh token
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<REFRESH_TOKEN>"}'
```

### Postman Collection

If the IT Leader's delegation includes `postmanSync: true`, use the `api-documentation` skill to sync a collection with:
1. Auth endpoints (login, refresh)
2. CRUD endpoints (list, detail, create, update, delete)
3. Error scenarios (401, 404, 422, 500)
4. Environment variables (`base_url`, `token`, `refresh_token`)

---

## 11. Quick Reference — File Creation Checklist

When building a new CRUD resource:

| Step | File | Action |
|---|---|---|
| 1 | `application/controllers/api/<Resource>.php` | Create REST controller extending `REST_Controller` |
| 2 | `application/models/<Resource>_model.php` | Create model with Query Builder methods |
| 3 | `application/config/routes.php` | Add route entries for the resource |
| 4 | — | Ensure JWT library is available in `application/libraries/JWT_library.php` |
| 5 | — | Add validation rules matching the resource schema |
| 6 | — | Test each endpoint with curl |

---

## 12. Do's and Don'ts

**Do:**
- Always use Query Builder for database interactions
- Always validate input with form_validation
- Always hash passwords with `password_hash(PASSWORD_BCRYPT)`
- Always return consistent response envelopes
- Always handle missing resources with 404
- Always log errors server-side with `log_message()`
- Always filter allowed fields before insert/update
- Use transactions for multi-table writes

**Don't:**
- Never use raw SQL with string interpolation
- Never expose stack traces or debug output in responses
- Never bypass JWT validation on protected endpoints
- Never store plaintext passwords
- Never trust user input without validation
- Never hardcode secrets in config files (use environment variables)
- Never allow mass-assignment without field whitelisting
- Never use `extract()` or `parse_str()` on user input
- Never commit `.env` files to version control

---

## 13. Common Mistakes

| Mistake | Consequence | Fix |
|---|---|---|
| Forgetting JWT check on create/update/delete | Unauthenticated access | Call `$this->is_logged_in()` at start of protected methods |
| Using `$this->input->post()` instead of `$this->post()` | Mixed input sources | Use RestServer's `$this->post('key')` |
| Not filtering allowed fields | Mass-assignment vulnerability | Always use `_filter_allowed()` in models |
| Returning raw DB error messages | Information leakage to client | Always wrap DB operations and return safe messages |
| Missing pagination on list endpoints | Performance issues for large datasets | Always implement `limit`/`offset` with `page`/`per_page` |
| Hardcoding JWT secret | Security breach | Use `getenv('JWT_SECRET')` with fallback |
| Not setting CORS headers | Frontend CORS errors | Add CORS hook for client-side apps |
| Using `$config['global_xss_filtering']` = TRUE | Modifies POST/PUT data unexpectedly | Use per-field `xss_clean` rule instead |

---

## 14. Skill Usage Examples

```
@ci3-rest-api Create GET /api/categories endpoint with JWT auth and pagination
@ci3-rest-api Add form validation for product create/update
@ci3-rest-api Implement JWT login/register flow
@ci3-rest-api Build soft-delete pattern for the inventory model
@ci3-rest-api Set up CORS and rate limiting for public endpoints
```

---

_This skill provides complete CI3 REST API development patterns: RestServer controllers, JWT auth, CRUD models, form validation, security hardening, and consistent response contracts. Every endpoint follows the same predictable structure for maintainability and developer experience._
