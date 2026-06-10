---
name: node-express-prisma
description: Express 5 route/controller/DTO pattern, Prisma ORM schema & migration workflow, JWT auth middleware, error handling, class-validator DTO, response envelope format, and testing strategy with Vitest/Supertest. Skill untuk agent @backend Node.js Backend Developer.
version: 1.0.0
author: opencode-agent-kit
---

# Node Express Prisma Skill

Skill khusus untuk agent `@backend` — Node.js Backend Developer. Berisi pattern, kode contoh, dan workflow standar untuk membangun REST API dengan Express 5, Prisma ORM, PostgreSQL, JWT auth, class-validator DTO, response envelope, dan testing Vitest/Supertest.

---

## 1. Project Structure Standar

```
src/
├── routes/             # Route definition files (*.route.ts)
├── controllers/        # Controller handlers (*.controller.ts)
├── dtos/               # Request & Response DTOs (*.dto.ts, *.response.dto.ts)
├── middlewares/        # Express middlewares (*.middleware.ts)
├── services/           # Business logic layer
├── utils/              # Helpers & utilities (*.util.ts)
├── prisma/             # Prisma schema & migrations
│   ├── schema.prisma
│   └── migrations/
├── tests/              # Vitest test files
├── app.ts              # Express app setup (middleware, routes)
└── server.ts           # Entry point (listen)
```

### File Naming Convention

| Tipe File        | Pattern               | Contoh                        |
|------------------|-----------------------|-------------------------------|
| Request DTO      | `*.dto.ts`            | `create-user.dto.ts`          |
| Response DTO     | `*.response.dto.ts`   | `user.response.dto.ts`        |
| Controller       | `*.controller.ts`     | `user.controller.ts`          |
| Route            | `*.route.ts`          | `user.route.ts`               |
| Middleware       | `*.middleware.ts`     | `auth.middleware.ts`          |
| Utility          | `*.util.ts`           | `envelope.util.ts`            |

---

## 2. Response Envelope Format

Semua API response harus melalui satu helper envelope yang konsisten.

### Envelope Utility (`envelope.util.ts`)

```typescript
// Response envelope shape
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  message: string
  errors?: Record<string, string[]>
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

// Success
export function success<T>(data: T, message = 'OK'): ApiResponse<T> {
  return { success: true, data, message }
}

// Success with pagination
export function paginated<T>(
  data: T[],
  meta: { page: number; limit: number; total: number },
  message = 'OK',
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    message,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
  }
}

// Error
export function error(
  message: string,
  errors?: Record<string, string[]>,
): ApiResponse<null> {
  return { success: false, data: null, message, errors }
}
```

**Aturan:**
- `success: true` untuk response sukses
- `success: false` untuk response error
- `data` berisi payload atau `null` saat error
- `message` memberikan konteks
- `errors` opsional untuk validasi field-level
- `meta` opsional untuk pagination metadata

---

## 3. DTO dengan class-validator

### Request DTO (`create-user.dto.ts`)

```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string
}
```

### Response DTO (`user.response.dto.ts`)

```typescript
import { Expose, Transform } from 'class-transformer'

export class UserResponseDto {
  @Expose()
  id!: string

  @Expose()
  name!: string

  @Expose()
  email!: string

  @Expose()
  createdAt!: Date

  // Jangan expose password
  @Expose()
  @Transform(() => undefined)
  password?: never
}
```

### Validation Middleware (`validate.middleware.ts`)

```typescript
import { Request, Response, NextFunction } from 'express'
import { validate, ValidationError } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { error } from '../utils/envelope.util'
import { ClassConstructor } from 'class-transformer'

export function validateDto(dtoClass: ClassConstructor<unknown>, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObj = plainToInstance(dtoClass, req[source])
    const errors: ValidationError[] = await validate(dtoObj as object)

    if (errors.length > 0) {
      const formatted: Record<string, string[]> = {}
      for (const err of errors) {
        formatted[err.property!] = Object.values(err.constraints!)
      }
      return res.status(400).json(error('Validation failed', formatted))
    }

    req[source] = dtoObj
    next()
  }
}
```

### Response DTO Serialization

```typescript
import { plainToInstance } from 'class-transformer'

// Dalam controller:
const userDto = plainToInstance(UserResponseDto, user, {
  excludeExtraneousValues: true,
})
```

---

## 4. Controller Pattern

### Thin Controller Rule

Controller hanya bertanggung jawab untuk: memanggil service, mapping response, dan error handling.

```typescript
// user.controller.ts
import { Request, Response, NextFunction } from 'express'
import { plainToInstance } from 'class-transformer'
import { UserService } from '../services/user.service'
import { UserResponseDto } from '../dtos/user.response.dto'
import { CreateUserDto } from '../dtos/create-user.dto'
import { success } from '../utils/envelope.util'

const userService = new UserService()

export class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as CreateUserDto
      const user = await userService.create(dto)
      const response = plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      })
      return res.status(201).json(success(response, 'User created'))
    } catch (err) {
      next(err) // Delegasikan ke error handler global
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 10
      const { data, total } = await userService.findAll(page, limit)
      const response = data.map(u =>
        plainToInstance(UserResponseDto, u, { excludeExtraneousValues: true }),
      )
      return res.status(200).json(success(response, 'Users fetched'))
    } catch (err) {
      next(err)
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.findById(req.params.id)
      if (!user) {
        return res.status(404).json(success(null, 'User not found'))
      }
      const response = plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      })
      return res.status(200).json(success(response, 'User fetched'))
    } catch (err) {
      next(err)
    }
  }
}
```

---

## 5. Route Registration

### User Route (`user.route.ts`)

```typescript
import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { validateDto } from '../middlewares/validate.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'
import { CreateUserDto } from '../dtos/create-user.dto'

const router = Router()
const controller = new UserController()

// Public routes
router.post('/users', validateDto(CreateUserDto), controller.create)

// Protected routes
router.get('/users', authMiddleware, controller.findAll)
router.get('/users/:id', authMiddleware, controller.findById)

export default router
```

**Aturan Routing:**
1. Tempatkan `explicit routes` sebelum `parameterized routes`
2. Auth middleware ditempatkan sebelum handler
3. Validation middleware dipasang per route
4. Route registration harus eksplisit dan readable

---

## 6. App Setup (`app.ts`)

```typescript
import express from 'express'
import { errorHandler } from './middlewares/error.middleware'
import userRoutes from './routes/user.route'

const app = express()

app.use(express.json())

// Routes
app.use('/api/v1', userRoutes)

// Global error handler (harus setelah routes)
app.use(errorHandler)

export default app
```

### Server Entry (`server.ts`)

```typescript
import app from './app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

async function main() {
  await prisma.$connect()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

export { prisma }
```

---

## 7. Global Error Handler (`error.middleware.ts`)

```typescript
import { Request, Response, NextFunction } from 'express'
import { error } from '../utils/envelope.util'

// Custom error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message)
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[ErrorHandler]', err)

  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(error(err.message, err.errors))
  }

  // Prisma known errors
  if (err.constructor?.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any
    if (prismaErr.code === 'P2002') {
      return res.status(409).json(error('Resource already exists'))
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json(error('Resource not found'))
    }
  }

  // Fallback — jangan bocorkan detail error ke client
  return res.status(500).json(error('Internal server error'))
}
```

---

## 8. JWT Auth Middleware (`auth.middleware.ts`)

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { error } from '../utils/envelope.util'
import { AppError } from './error.middleware'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing or invalid authorization header')
  }

  const token = authHeader.split(' ')[1]

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not configured')

    const decoded = jwt.verify(token, secret) as JwtPayload
    req.user = decoded
    next()
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError(401, 'Invalid or expired token')
  }
}

// Role-based guard (opsional)
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions')
    }
    next()
  }
}
```

### JWT Utility (`jwt.util.ts`)

```typescript
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../middlewares/auth.middleware'

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')

  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')

  return jwt.verify(token, secret) as JwtPayload
}
```

**Security Checklist:**
- JWT_SECRET harus dari environment variable, jangan hardcoded
- Token expiry wajib (default: 7d)
- Gunakan `Bearer` scheme di Authorization header
- Jangan expose error detail invalid token ke client
- Role guard dipasang setelah authMiddleware

---

## 9. Prisma ORM — Schema & Migration Workflow

### Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### Migration Workflow

```bash
# 1. Buat migration baru
npx prisma migrate dev --name add_user_table

# 2. Apply migration ke production
npx prisma migrate deploy

# 3. Regenerate Prisma Client setelah schema berubah
npx prisma generate

# 4. Reset database (development only)
npx prisma migrate reset

# 5. Seed database
npx prisma db seed
```

### Prisma Service Pattern (`services/user.service.ts`)

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { prisma } from '../server'
import { CreateUserDto } from '../dtos/create-user.dto'

export class UserService {
  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12)

    return prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true, createdAt: true },
    })
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
    ])
    return { data, total }
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  }
}
```

### Transaction Pattern

```typescript
// Multi-step write dalam transaction
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { ... } })
  const profile = await tx.profile.create({ data: { userId: user.id, ... } })
  return user
})
```

**Aturan Database:**
- Gunakan atomic writes untuk consistency-critical operations
- Query hanya relasi dan field yang dibutuhkan (gunakan `select` atau `include` eksplisit)
- Hindari hidden N+1 queries
- Gunakan transaction untuk multi-step writes
- Index kolom yang sering difilter

---

## 10. Authentication / Login Endpoint

### Auth Route (`auth.route.ts`)

```typescript
import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { validateDto } from '../middlewares/validate.middleware'
import { LoginDto } from '../dtos/login.dto'

const router = Router()
const controller = new AuthController()

router.post('/auth/login', validateDto(LoginDto), controller.login)
router.post('/auth/register', validateDto(CreateUserDto), controller.register)

export default router
```

### Login DTO (`login.dto.ts`)

```typescript
import { IsEmail, IsString } from 'class-validator'

export class LoginDto {
  @IsEmail()
  email!: string

  @IsString()
  password!: string
}
```

### Auth Controller (`auth.controller.ts`)

```typescript
import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { UserService } from '../services/user.service'
import { generateToken } from '../utils/jwt.util'
import { LoginDto } from '../dtos/login.dto'
import { success, error } from '../utils/envelope.util'
import { AppError } from '../middlewares/error.middleware'

const userService = new UserService()

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as LoginDto
      const user = await userService.findByEmail(email)

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError(401, 'Invalid email or password')
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      return res.status(200).json(success({ token, userId: user.id }, 'Login successful'))
    } catch (err) {
      next(err)
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body)
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: 'user',
      })
      return res.status(201).json(success({ token, userId: user.id }, 'Registration successful'))
    } catch (err) {
      next(err)
    }
  }
}
```

---

## 11. Testing dengan Vitest + Supertest

### Setup Test (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 15000,
  },
})
```

### Test Setup (`tests/setup.ts`)

```typescript
import { PrismaClient } from '@prisma/client'
import { beforeAll, afterAll, afterEach } from 'vitest'

const prisma = new PrismaClient()

beforeAll(async () => {
  // Pastikan koneksi database test tersedia
  await prisma.$connect()
})

afterEach(async () => {
  // Bersihkan data test antar test (jika menggunakan database yang sama)
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

export { prisma }
```

### Integration Test (`tests/user.test.ts`)

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import supertest from 'supertest'
import app from '../app'

const request = supertest(app)

describe('POST /api/v1/users', () => {
  it('should create a new user', async () => {
    const res = await request
      .post('/api/v1/users')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data).toHaveProperty('name', 'Test User')
    expect(res.body.data).not.toHaveProperty('password') // Response DTO harus exclude
  })

  it('should reject invalid email', async () => {
    const res = await request
      .post('/api/v1/users')
      .send({
        name: 'Test',
        email: 'not-an-email',
        password: 'password123',
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.errors).toBeDefined()
  })
})

describe('GET /api/v1/users', () => {
  it('should require auth token', async () => {
    const res = await request.get('/api/v1/users')
    expect(res.status).toBe(401)
  })

  it('should return users list with valid token', async () => {
    // Create user & get token via login
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    const token = loginRes.body.data.token

    const res = await request
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})
```

### Unit Test — Controller (`tests/controllers/user.controller.test.ts`)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { UserController } from '../../controllers/user.controller'

// Mock UserService
vi.mock('../../services/user.service', () => ({
  UserService: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({
      id: '1',
      name: 'Test',
      email: 'test@test.com',
      createdAt: new Date(),
    }),
  })),
}))

describe('UserController.create', () => {
  it('should return 201 on success', async () => {
    const controller = new UserController()
    const req = { body: { name: 'Test', email: 'test@test.com', password: 'pw' } } as Request
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
    const next = vi.fn() as NextFunction

    await controller.create(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    )
  })
})
```

### Script Package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit"
  }
}
```

### Test Strategy Summary

| Layer           | Tools           | Fokus                                    |
|-----------------|-----------------|------------------------------------------|
| Unit (Service)  | Vitest + mock   | Business logic, validasi, edge cases     |
| Unit (DTO)      | class-validator | Validasi rules per field                 |
| Integration     | Vitest + Supertest | Full HTTP request/response cycle      |
| E2E (smoke)     | Supertest       | Critical paths: login, CRUD, auth guard  |

**Aturan Testing:**
- Jangan tes Prisma query langsung di unit test — mock service layer
- Integration test harus isolated: cleanup data antar test (`afterEach`)
- Test auth guard: pastikan 401 tanpa token, 403 tanpa role yang sesuai
- Test envelope shape: verifikasi `success`, `data`, `message` field ada

---

## 12. Endpoint Addition Workflow

1. **DTO Layer**: Buat/extend request DTO (`*.dto.ts`) + response DTO (`*.response.dto.ts`)
2. **Service Layer**: Implement business logic dengan Prisma queries
3. **Controller Layer**: Implement handler dengan standardized success/error + plainToInstance
4. **Route Layer**: Register route dengan middleware order yang benar (validate → auth → handler)
5. **Test Layer**: Tambah integration test di file test yang sesuai

### Query/List Pattern

1. Parse pagination/filter/sort secara aman dari `req.query`
2. Bangun `where`/`orderBy` clause yang deterministic
3. Query + count dengan filter yang sama (`Promise.all`)
4. Return envelope dengan pagination metadata

### Mutation Pattern

1. Validasi payload dengan DTO middleware
2. Cek ownership/authorization
3. Eksekusi transaction untuk multi-step writes
4. Emit log/audit entries jika domain-critical
5. Return mapped response DTO

---

## 13. Environment Variables (.env)

```
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
JWT_SECRET=your-super-secret-key-change-in-production
PORT=3000
NODE_ENV=development
```

**Wajib divalidasi di startup server.**

---

## 14. Package Dependencies

```json
{
  "dependencies": {
    "express": "^5.0.0",
    "@prisma/client": "^5.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "jsonwebtoken": "^9.x",
    "bcrypt": "^5.x",
    "reflect-metadata": "^0.2.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "prisma": "^5.x",
    "vitest": "^1.x",
    "supertest": "^6.x",
    "@types/express": "^5.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/bcrypt": "^5.x",
    "@types/supertest": "^6.x",
    "tsx": "^4.x"
  }
}
```

---

## 15. TypeScript Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Integration dengan Agent @backend

Skill ini dipanggil oleh agent `@backend` (Node.js Backend Developer) saat:

- Membangun endpoint REST API baru
- Melakukan perubahan schema database
- Implementasi auth & authorization
- Menulis integration/unit tests
- Refactor controller/service/route

**Pastikan konsisten dengan agent conventions:**
- File naming: `*.dto.ts`, `*.controller.ts`, `*.route.ts`
- Response envelope: `success()`, `paginated()`, `error()`
- Error handling: `AppError` + global `errorHandler`
- Validation: `validateDto()` middleware di route level
- Testing: `vitest` + `supertest` untuk integration test
