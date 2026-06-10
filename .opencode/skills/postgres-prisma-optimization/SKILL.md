---
name: postgres-prisma-optimization
description: >-
  PostgreSQL + Prisma ORM optimization: schema design patterns (relations, enums, composite keys, indexes),
  migration workflow (dev/deploy/resolve), N+1 query prevention (include, select, raw queries),
  PostgreSQL indexing strategy (B-tree, GIN, partial, composite), query performance (EXPLAIN ANALYZE,
  connection pooling with PgBouncer), data modeling patterns (soft delete, auditing, versioning, polymorphic),
  migration safety (reversible migrations, data migration), Prisma transaction patterns (interactive, nested write).
version: 1.0.0
author: opencode-agent-kit
agent: database-specialist
---

# Postgres Prisma Optimization Skill

Skill khusus untuk agent `@database` — Database Specialist. Berisi pattern, strategi, workflow, dan best practices untuk
optimasi PostgreSQL dengan Prisma ORM: schema design, indexing, query performance, migration safety, dan data modeling.

---

## 1. Prisma Schema Design Patterns

### 1.1 Relations — One-to-One

```prisma
model User {
  id      String    @id @default(uuid()) @db.Uuid
  email   String    @unique
  profile Profile?
}

model Profile {
  id        String @id @default(uuid()) @db.Uuid
  fullName  String @map("full_name")
  bio       String?
  avatarUrl String? @map("avatar_url")
  userId    String @unique @map("user_id") @db.Uuid
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}
```

**Key points:**
- Field `userId` harus `@unique` agar one-to-one enforced di database.
- Gunakan `@map()` untuk snake_case di database, camelCase di Prisma.
- Selalu tentukan `onDelete` (Cascade, Restrict, SetNull, NoAction).
- `@@map("table_name")` untuk nama tabel snake_case di PostgreSQL.

### 1.2 Relations — One-to-Many

```prisma
model User {
  id    String @id @default(uuid()) @db.Uuid
  posts Post[]
}

model Post {
  id       String   @id @default(uuid()) @db.Uuid
  title    String
  content  String?
  authorId String   @map("author_id") @db.Uuid
  author   User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId], name: "idx_post_author_id")
  @@map("posts")
}
```

**Key points:**
- Foreign key di sisi "many" (Post).
- Index foreign key secara eksplisit dengan `@@index` untuk JOIN performance.
- Naming convention: `authorId` → `@map("author_id")`.

### 1.3 Relations — Many-to-Many (Junction Table)

```prisma
model Post {
  id     String   @id @default(uuid()) @db.Uuid
  title  String
  tags   TagOnPost[]
}

model Tag {
  id    String      @id @default(uuid()) @db.Uuid
  name  String      @unique
  posts TagOnPost[]
}

model TagOnPost {
  postId String @map("post_id") @db.Uuid
  tagId  String @map("tag_id") @db.Uuid
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@index([tagId], name: "idx_tag_on_post_tag_id")
  @@map("tags_on_posts")
}
```

**Key points:**
- Junction table dengan `@@id([postId, tagId])` — composite primary key.
- Index pada foreign key kedua (`tagId`) untuk reverse lookup.
- Nama tabel junction: plural + `_on_` atau `_` connector.

### 1.4 Enums

```prisma
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

Gunakan Prisma enum (bukan native PostgreSQL enum) agar kompatibel dengan migration engine.
Untuk PostgreSQL native enum, gunakan `@pgEnum('status_type')` attribute di Prisma 5+.

### 1.5 Composite Keys

```prisma
model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  entityId  String   @map("entity_id") @db.Uuid
  entityType String  @map("entity_type")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  // Composite unique constraint
  @@unique([entityId, entityType, createdAt], name: "uq_audit_entity_time")
  // Composite index for common query pattern
  @@index([entityType, createdAt], name: "idx_audit_entity_type_created_at")
  @@map("audit_logs")
}
```

### 1.6 Custom Indexes

```prisma
model Order {
  id         String   @id @default(uuid()) @db.Uuid
  status     String?
  userId     String   @map("user_id") @db.Uuid
  totalAmount Decimal  @map("total_amount") @db.Decimal(12, 2)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  // Composite index with order
  @@index([userId, status, createdAt], name: "idx_order_user_status_created")
  // Partial index via raw SQL (not expressible in Prisma schema)
  @@index([status], name: "idx_order_status_active",   where: "status = 'ACTIVE'")
  @@map("orders")
}
```

**Catatan:** Partial index `where` clause didukung Prisma sejak versi 5.10+. Untuk versi lebih lama, buat via migration manual.

---

## 2. Migration Workflow

### 2.1 Development — `prisma migrate dev`

```bash
# Membuat migration baru berdasarkan perubahan schema
npx prisma migrate dev --name add_user_profile

# Reset database dan apply semua migration (destructive!)
npx prisma migrate reset

# Apply migration tanpa prompt
npx prisma migrate dev --name add_user_profile --skip-generate

# Hanya generate Prisma Client tanpa migration
npx prisma generate
```

**Best practice:**
1. Ubah `schema.prisma` terlebih dahulu.
2. Jalankan `prisma migrate dev --name <description>`.
3. Review file SQL migration yang dihasilkan di `prisma/migrations/<timestamp>_<name>/migration.sql`.
4. Jika ada data transformation, tambahkan raw SQL di migration file sebelum commit.
5. Generate Prisma Client: `prisma generate`.
6. Test query baru di aplikasi.

### 2.2 Production — `prisma migrate deploy`

```bash
# Apply semua migration yang belum dijalankan (read-only operation)
npx prisma migrate deploy

# Verifikasi status migration
npx prisma migrate status
```

**Best practice:**
- `migrate deploy` adalah operasi idempotent — aman dijalankan multiple times.
- Jangan pernah jalankan `migrate dev` di production.
- Selalu backup database sebelum deploy migration.
- Monitor log migration untuk error.

### 2.3 Resolving Migration Conflicts

Ketika migration conflict terjadi (baseline berbeda):

```bash
# 1. Resolve secara manual
# Edit migration.sql yang conflict untuk menyelaraskan state
npx prisma migrate resolve --applied "20250101000000_add_user_profile"

# 2. Baseline ulang (untuk development)
npx prisma migrate dev --create-only  # Buat migration kosong
npx prisma migrate --help              # Lihat opsi resolve

# 3. Jika sudah terlanjur apply di production
# Gunakan --rolled-back untuk menandai migration yang gagal
npx prisma migrate resolve --rolled-back "20250101000000_bad_migration"
```

**Strategi conflict resolution:**
1. Identifikasi migration mana yang berbeda baseline.
2. Gunakan `migrate resolve --applied` untuk menandai migration sebagai applied (tanpa menjalankannya).
3. Gunakan `migrate resolve --rolled-back` untuk menandai migration sebagai rolled back.
4. Buat migration korektif baru.

### 2.4 Migration SQL Review Checklist

Setiap migration harus di-review:

```sql
-- ❌ BURUK — Menghapus kolom dalam 1 step (breaking change)
ALTER TABLE "posts" DROP COLUMN "old_column";

-- ✅ BAIK — Additive change (backward compatible)
ALTER TABLE "posts" ADD COLUMN "new_column" TEXT;

-- ✅ BAIK — Buat index terpisah
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_posts_author_id" ON "posts" ("author_id");

-- ❌ BURUK — Default value mengunci tabel
ALTER TABLE "posts" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;

-- ✅ BAIK — Default tanpa lock (PostgreSQL 11+)
ALTER TABLE "posts" ADD COLUMN "views" INTEGER;
ALTER TABLE "posts" ALTER COLUMN "views" SET DEFAULT 0;
```

### 2.5 Migration Rollback Strategy

Prisma tidak memiliki `migrate down` built-in. Strategi:

1. **Siapkan rollback SQL** di dokumentasi migration.
2. **Simpan rollback script** sebagai file terpisah: `prisma/migrations/<name>/rollback.sql`.
3. **Gunakan pendekatan reversible:** Setiap migration additive harus memiliki migration "undo" terpisah.
4. **Data migration** harus memiliki script rollback data juga.

```sql
-- Contoh rollback.sql untuk migration tertentu
-- Step 1: Kembalikan data jika ada
UPDATE posts SET old_column = new_column WHERE new_column IS NOT NULL;
-- Step 2: Drop kolom baru
ALTER TABLE "posts" DROP COLUMN "new_column";
```

---

## 3. N+1 Query Prevention

### 3.1 The N+1 Problem

```typescript
// ❌ N+1 — Setiap iterasi query user memicu 1 query tambahan
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });
  // 1 query untuk users + N query untuk posts = N+1
}
```

### 3.2 Eager Loading dengan `include`

```typescript
// ✅ Eager loading — 1 query dengan JOIN
const usersWithPosts = await prisma.user.findMany({
  include: {
    posts: true,                     // One-to-many
    profile: true,                   // One-to-one
    tags: { include: { tag: true } }, // Nested include (many-to-many via junction)
  },
});

// Filtered include
const filteredPosts = await prisma.user.findMany({
  include: {
    posts: {
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 10, // Batasi jumlah related records
    },
  },
});
```

### 3.3 Projection dengan `select`

```typescript
// ✅ Select — Hanya fetching field yang diperlukan
const usersPartial = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    posts: {
      select: {
        id: true,
        title: true,
      },
      where: { status: 'PUBLISHED' },
    },
  },
});
```

**Perbandingan `include` vs `select`:**
| Aspect        | `include`                          | `select`                             |
|---------------|------------------------------------|--------------------------------------|
| Penggunaan    | Seluruh field dari relation        | Field tertentu saja                  |
| Performance   | Lebih berat (semua field)          | Lebih ringan (subset field)          |
| Use case      | Detail view, full entity           | List view, API response partial      |
| Nested query  | Mendukung                          | Mendukung                            |

### 3.4 Batch Loading dengan Prisma

```typescript
// ✅ Batch loading — Hindari loop query
const userIds = ['id-1', 'id-2', 'id-3'];
const usersInBatch = await prisma.user.findMany({
  where: { id: { in: userIds } },
  include: { posts: true },
});

// Group by user (manual)
const userMap = new Map(usersInBatch.map(u => [u.id, u]));
```

### 3.5 Raw Query untuk Complex Aggregation

```typescript
// ✅ Raw query — Ketika Prisma query tidak cukup optimal
const result = await prisma.$queryRaw<Array<{
  id: string;
  email: string;
  post_count: bigint;
}>>`
  SELECT
    u.id,
    u.email,
    COUNT(p.id)::BIGINT as post_count
  FROM "users" u
  LEFT JOIN "posts" p ON p.author_id = u.id
  WHERE u.id = ANY(${userIds}::UUID[])
  GROUP BY u.id, u.email
  ORDER BY post_count DESC
`;

// ✅ Gunakan prisma.$queryRawUnsafe untuk dynamic query (hati-hati SQL injection)
```

### 3.6 Monitoring Query Count

```typescript
// ✅ Log query count di development
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Atau middleware untuk count query
let queryCount = 0;
prisma.$use(async (params, next) => {
  queryCount++;
  console.log(`Query #${queryCount}: ${params.model}.${params.action}`);
  return next(params);
});
```

---

## 4. PostgreSQL Indexing Strategy

### 4.1 Index Type Reference

| Index Type | Use Case | Contoh PostgreSQL DDL |
|------------|----------|----------------------|
| **B-tree** (default) | Equality & range, ORDER BY, <, <=, >, >=, BETWEEN, LIKE (prefix) | `CREATE INDEX ...` |
| **GIN** | Full-text search, array contains, JSONB queries, trigram/pattern matching | `CREATE INDEX ... USING GIN` |
| **GiST** | Full-text search, geometric data, range types | `CREATE INDEX ... USING GiST` |
| **BRIN** | Large tables with naturally ordered data (log, time-series) | `CREATE INDEX ... USING BRIN` |
| **Hash** | Simple equality (jarang digunakan, B-tree lebih baik) | `CREATE INDEX ... USING HASH` |

### 4.2 B-tree Index

```prisma
// Prisma — B-tree (default)
model User {
  email    String @unique  // Unique index = B-tree
  status   String?
  @@index([status], name: "idx_user_status")
}
```

```sql
-- SQL equivalent
CREATE INDEX IF NOT EXISTS "idx_user_status" ON "users" ("status");
```

**Best practice B-tree:**
- Komposit index untuk multi-column query: `@@index([status, createdAt])`.
- ORDER BY field di akhir composite index.
- Unique constraint otomatis membuat B-tree index.

### 4.3 GIN Index

GIN untuk full-text search dan JSONB:

```sql
-- Full-text search GIN
CREATE INDEX IF NOT EXISTS "idx_posts_content_gin"
ON "posts" USING GIN (to_tsvector('english', "content"));

-- JSONB GIN index
CREATE INDEX IF NOT EXISTS "idx_products_metadata_gin"
ON "products" USING GIN ("metadata");

-- Array contains GIN
CREATE INDEX IF NOT EXISTS "idx_tags_array_gin"
ON "posts" USING GIN ("tags");
```

Di Prisma, GIN index harus dibuat via migration manual karena Prisma belum support `@@index` dengan `using`:

```prisma
// schema.prisma — placeholder
model Post {
  id      String @id @default(uuid()) @db.Uuid
  title   String
  content String
}
```

```sql
-- migration.sql — tambahkan secara manual
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_posts_content_search"
ON "posts" USING GIN (to_tsvector('english', "content"));
```

### 4.4 Partial Index

Partial index untuk subset data yang sering di-query:

```prisma
// Prisma 5.10+ support partial index di schema
model Order {
  status  String?
  @@index([status], name: "idx_order_active", where: "status = 'ACTIVE'")
}
```

```sql
-- SQL equivalent (semua versi)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_order_active"
ON "orders" ("status")
WHERE status = 'ACTIVE';
```

**Use case partial index:**
- Filter `WHERE status = 'ACTIVE'` pada tabel dengan mayoritas data inactive.
- Filter `WHERE deleted_at IS NULL` untuk soft delete query.
- Filter `WHERE is_verified = true` pada user verification.

### 4.5 Composite Index

```prisma
model Transaction {
  userId    String   @map("user_id") @db.Uuid
  status    String?
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  amount    Decimal  @map("amount") @db.Decimal(12, 2)

  // Query: WHERE user_id = ? AND status = ? ORDER BY created_at DESC
  @@index([userId, status, createdAt], name: "idx_txn_user_status_created")
}
```

**Composite index rules:**
- **Leftmost prefix rule:** Index `[A, B, C]` bisa digunakan untuk `A`, `A+B`, `A+B+C`, tapi **tidak** untuk `B` saja.
- **Order matters:** Letakkan kolom dengan high cardinality (banyak unique values) di depan.
- **Order BY:** Kolom ORDER BY harus di posisi paling kanan dari index.
- **Range condition:** Kolom dengan range operator (`<`, `>`, `BETWEEN`) harus di posisi paling kanan.

### 4.6 Indexing Decision Matrix

| Query Pattern | Index Type | Example |
|---------------|------------|---------|
| `WHERE id = ?` | B-tree (PK) | `@id` |
| `WHERE email = ?` | B-tree unique | `@unique` |
| `WHERE user_id = ?` | B-tree | `@@index([userId])` |
| `WHERE user_id = ? AND status = ?` | B-tree composite | `@@index([userId, status])` |
| `WHERE content ILIKE '%keyword%'` | GIN (trigram) | `USING GIN (content gin_trgm_ops)` |
| `WHERE metadata @> '{"key":"val"}'` | GIN JSONB | `USING GIN (metadata)` |
| `WHERE status = 'ACTIVE'` | Partial B-tree | `WHERE status = 'ACTIVE'` |
| `WHERE created_at BETWEEN ? AND ?` | B-tree (range) | `@@index([createdAt])` |
| `WHERE deleted_at IS NULL` | Partial B-tree | `WHERE deleted_at IS NULL` |
| Full-text search | GIN | `USING GIN (to_tsvector(...))` |

### 4.7 Anti-Patterns Indexing

- ❌ **Over-indexing:** Setiap index tambahan memperlambat INSERT/UPDATE/DELETE.
- ❌ **Index kolom boolean atau low cardinality** — selectivity terlalu rendah.
- ❌ **Duplicate index** — misal: `@@unique` + `@@index` on same column.
- ❌ **Index pada kolom yang jarang di-query** — storage waste.
- ❌ **Composite index dengan urutan kolom salah** (low cardinality di depan).

---

## 5. Query Performance

### 5.1 EXPLAIN ANALYZE

```sql
-- Analisis query plan
EXPLAIN ANALYZE
SELECT u.id, u.email, COUNT(p.id) as post_count
FROM "users" u
LEFT JOIN "posts" p ON p.author_id = u.id
WHERE u.status = 'ACTIVE'
GROUP BY u.id, u.email
ORDER BY post_count DESC
LIMIT 20;
```

**Apa yang harus diperhatikan dari output EXPLAIN ANALYZE:**

| Indicator | Arti | Tindakan |
|-----------|------|----------|
| `Seq Scan` | Sequential scan pada large table | Tambah index |
| `Est. rows` vs `Actual rows` | Estimasi cardinality salah | Update `ANALYZE` atau adjust stats |
| `Sort Method: external merge` | Sort overflow ke disk | Tambah index sorting |
| `Nested Loop` dengan banyak row | Join strategi salah | Tambah index atau ubah join |
| `Rows Removed by Filter` tinggi | Filter tidak efisien | Index partial atau composite |
| `Shared Hit Blocks` rendah | Data tidak di cache | Tingkatkan `shared_buffers` |

### 5.2 Prisma Query Profiling

```typescript
// Profiling dengan middleware
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Duration:', e.duration, 'ms');
  console.log('Params:', e.params);
});

// Query timing
async function queryWithTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`[${label}] ${duration.toFixed(2)}ms`);
  return result;
}
```

### 5.3 Slow Query Detection

```sql
-- Cari slow queries dari pg_stat_statements
SELECT
  query,
  calls,
  total_exec_time / calls AS avg_time_ms,
  rows,
  shared_blks_hit,
  shared_blks_read
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
ORDER BY total_exec_time DESC
LIMIT 20;
```

**Aktifkan pg_stat_statements:**
```sql
-- Di postgresql.conf atau ALTER SYSTEM
shared_preload_libraries = 'pg_stat_statements';
pg_stat_statements.track = all;

-- Atau di session
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### 5.4 Connection Pooling dengan PgBouncer

```typescript
// Prisma + PgBouncer configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      // Gunakan PgBouncer transaction mode port (6432)
      url: process.env.DATABASE_URL, // postgresql://user:pass@host:6432/db?pgbouncer=true
    },
  },
});
```

**PgBouncer URL:**
```
# Transaction mode (recommended untuk Prisma)
postgresql://user:pass@pgbouncer-host:6432/dbname?pgbouncer=true
```

**PgBouncer Key Config:**
```ini
[databases]
dbname = host=postgres-host port=5432 dbname=dbname

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 500
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 5.0
server_idle_timeout = 600
query_timeout = 30
```

**Prisma Connection Pool Best Practice:**
| Environment | Pool Size | Connection Limit |
|-------------|-----------|------------------|
| Development | 5-10 | 10 |
| Staging | 10-20 | 20 |
| Production (low traffic) | 20-50 | 50 |
| Production (high traffic) | 50-100+ | 100+ |

```typescript
// Prisma connection management
const prisma = new PrismaClient({
  // connection_limit via datasource URL
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '&connection_limit=20',
    },
  },
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});
```

### 5.5 Query Performance Checklist

- [ ] Gunakan `EXPLAIN ANALYZE` untuk memverifikasi index usage.
- [ ] Hindari N+1 dengan `include` atau `select`.
- [ ] Batasi result dengan `take` + pagination.
- [ ] Gunakan `select` untuk hanya mengambil field yang diperlukan.
- [ ] Index foreign key untuk JOIN performance.
- [ ] Monitor slow query dengan `pg_stat_statements`.
- [ ] Gunakan connection pooling di production.
- [ ] Set `connection_limit` sesuai dengan kapasitas database.
- [ ] Gunakan `@db.Uuid` untuk UUID fields (binary storage, lebih cepat dari text UUID).

---

## 6. Data Modeling Patterns

### 6.1 Soft Delete

```prisma
model User {
  id        String    @id @default(uuid()) @db.Uuid
  email     String    @unique
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(3)

  @@index([deletedAt], name: "idx_user_deleted_at")
  @@map("users")
}
```

**Query pattern:**
```typescript
// Semua query harus include filter deleted_at IS NULL
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null },
});

// Soft delete
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() },
});

// Hard delete (permanent)
await prisma.user.delete({ where: { id: userId } });
```

**Partial index untuk performance:**
```sql
-- Buat partial index yang mencakup hanya non-deleted records
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_active"
ON "users" ("email")
WHERE deleted_at IS NULL;
```

### 6.2 Auditing

```prisma
model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  entityId   String   @map("entity_id") @db.Uuid
  entityType String   @map("entity_type")
  action     String                     // CREATE, UPDATE, DELETE
  oldValue   Json?    @map("old_value") @db.JsonB
  newValue   Json?    @map("new_value") @db.JsonB
  changes    Json?    @db.JsonB         // Only changed fields
  actorId    String?  @map("actor_id") @db.Uuid
  actorEmail String?  @map("actor_email")
  ipAddress  String?  @map("ip_address")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  @@index([entityType, entityId], name: "idx_audit_entity")
  @@index([actorId], name: "idx_audit_actor")
  @@index([createdAt], name: "idx_audit_created_at")
  @@map("audit_logs")
}
```

**Implementasi di Prisma middleware:**
```typescript
prisma.$use(async (params, next) => {
  const result = await next(params);

  if (['create', 'update', 'delete'].includes(params.action)) {
    await prisma.auditLog.create({
      data: {
        entityId: result?.id,
        entityType: params.model!,
        action: params.action.toUpperCase(),
        actorId: currentUserId,
        changes: params.args.data,
      },
    });
  }

  return result;
});
```

### 6.3 Versioning (Optimistic Locking)

```prisma
model Document {
  id        String   @id @default(uuid()) @db.Uuid
  title     String
  content   String?
  version   Int      @default(1)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@map("documents")
}
```

**Optimistic locking pattern:**
```typescript
// Update with version check
async function updateDocument(id: string, data: Partial<Document>, expectedVersion: number) {
  const result = await prisma.document.updateMany({
    where: {
      id,
      version: expectedVersion, // Only update if version matches
    },
    data: {
      ...data,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    throw new Error('Document was modified by another user. Please refresh and try again.');
  }

  return prisma.document.findUnique({ where: { id } });
}
```

### 6.4 Polymorphic Relations

Prisma tidak mendukung polymorphic relation secara native. Gunakan pattern berikut:

**Option 1: Junction per entity type**
```prisma
model Comment {
  id        String   @id @default(uuid()) @db.Uuid
  content   String
  authorId  String   @map("author_id") @db.Uuid
  author    User     @relation(fields: [authorId], references: [id])

  // Polymorphic: commentable
  postId        String?  @map("post_id") @db.Uuid
  documentId    String?  @map("document_id") @db.Uuid
  post          Post?    @relation(fields: [postId], references: [id])
  document      Document? @relation(fields: [documentId], references: [id])

  @@index([postId], name: "idx_comment_post")
  @@index([documentId], name: "idx_comment_document")
  @@map("comments")
}
```

**Option 2: Entity type + Entity ID (manual union)**
```prisma
model Comment {
  id            String   @id @default(uuid()) @db.Uuid
  content       String
  entityType    String   @map("entity_type")  // 'POST', 'DOCUMENT', 'IMAGE'
  entityId      String   @map("entity_id")    // UUID of the parent entity
  authorId      String   @map("author_id") @db.Uuid
  author        User     @relation(fields: [authorId], references: [id])

  @@index([entityType, entityId], name: "idx_comment_entity")
  @@map("comments")
}
```

**Option 3: Template table with JSONB**
```prisma
model Activity {
  id          String   @id @default(uuid()) @db.Uuid
  action      String
  targetType  String   @map("target_type")
  targetId    String   @map("target_id") @db.Uuid
  metadata    Json?    @db.JsonB   // Flexible, store any target-specific data

  @@index([targetType, targetId], name: "idx_activity_target")
  @@index([metadata], name: "idx_activity_metadata", type: Gin)
  @@map("activities")
}
```

### 6.5 Data Modeling Checklist

- [ ] Normalization sampai 3NF kecuali justified denormalization.
- [ ] Soft delete pattern untuk data yang perlu retention.
- [ ] Audit trail untuk data critical (financial, user data, settings).
- [ ] Versioning untuk concurrent update protection.
- [ ] Polymorphic pattern untuk entity yang memiliki relasi ke multiple types.
- [ ] JSONB untuk data semi-structured (metadata, settings, config).
- [ ] Index pada foreign key dan query pattern utama.
- [ ] `@updatedAt` untuk tracking modification time.
- [ ] Default timestamps (`@default(now())`) untuk created_at.

---

## 7. Migration Safety

### 7.1 Safe Migration Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Additive first** | Tambah kolom/tabel baru sebelum drop yang lama | `ADD COLUMN` sebelum `DROP COLUMN` |
| **Expand-Contract** | Phase 1: add new column & backfill → Phase 2: deploy code → Phase 3: drop old column | 3-step migration |
| **Backward compatible** | Schema baru tidak boleh break query yang sudah ada | Default value, nullable new column |
| **Data integrity** | Setiap data transformation harus preserve integrity | Test rollback |
| **Performance aware** | Migration tidak boleh menyebabkan downtime | `CREATE INDEX CONCURRENTLY` |

### 7.2 Expand-Contract Pattern

```sql
-- Phase 1: Add new column (additive)
ALTER TABLE "users" ADD COLUMN "display_name" TEXT;
UPDATE "users" SET "display_name" = "username";  -- Backfill
-- Deploy code that writes to both username and display_name

-- Phase 2 (later migration): Drop old column
ALTER TABLE "users" DROP COLUMN "username";
-- Deploy code that uses only display_name
```

### 7.3 Data Migration

```sql
-- Batch data migration dengan chunking
DO $$
DECLARE
  batch_size CONSTANT INT := 1000;
  offset_val INT := 0;
  affected_rows INT;
BEGIN
  LOOP
    UPDATE "posts"
    SET "search_vector" = to_tsvector('english', "title" || ' ' || COALESCE("content", ''))
    WHERE "id" IN (
      SELECT "id" FROM "posts"
      WHERE "search_vector" IS NULL
      ORDER BY "id"
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    COMMIT;  -- Commit setiap batch

    EXIT WHEN affected_rows = 0;
    offset_val := offset_val + batch_size;
    RAISE NOTICE 'Processed % rows', offset_val;
  END LOOP;
END;
$$;
```

**Prisma + raw untuk data migration:**
```typescript
async function migrateData(batchSize = 1000) {
  let processed = 0;
  while (true) {
    const result = await prisma.$executeRaw`
      UPDATE "posts"
      SET "search_vector" = to_tsvector('english', "title" || ' ' || COALESCE("content", ''))
      WHERE "id" IN (
        SELECT "id" FROM "posts"
        WHERE "search_vector" IS NULL
        ORDER BY "id"
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
    `;
    if (result === 0) break;
    processed += result;
    console.log(`Processed ${processed} rows`);
  }
}
```

### 7.4 Reversible Migrations

Setiap migration harus memiliki rollback script:

```sql
-- Forward migration (migration.sql)
ALTER TABLE "users" ADD COLUMN "display_name" TEXT;
UPDATE "users" SET "display_name" = "username" WHERE "display_name" IS NULL;

-- Rollback script (rollback.sql — simpan di folder migration)
ALTER TABLE "users" DROP COLUMN "display_name";
```

**Rollback template:**
```markdown
## Migration: add_display_name
### Forward
- ADD COLUMN display_name TEXT
- Backfill display_name from username
### Rollback
- DROP COLUMN display_name
### Data Loss
- Ya: Semua data display_name akan hilang
### Downtime
- Tidak (additive)
```

### 7.5 CREATE INDEX CONCURRENTLY

```sql
-- Selalu gunakan CONCURRENTLY untuk production
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_user_id"
ON "orders" ("user_id");

-- Jangan lakukan ini di production (lock table):
-- CREATE INDEX "idx_orders_user_id" ON "orders" ("user_id");
```

**Catatan:**
- `CONCURRENTLY` tidak bisa dijalankan dalam transaction block.
- Pisahkan `CREATE INDEX CONCURRENTLY` di statement terpisah (di luar transaction).
- Gagal menjalankan CONCURRENTLY akan meninggalkan "invalid" index — monitor dan drop jika perlu.

### 7.6 Migration Safety Checklist

- [ ] Migration additive? (ADD COLUMN, CREATE TABLE, CREATE INDEX)
- [ ] Backward compatible? (Old query masih bekerja)
- [ ] Rollback script sudah disiapkan?
- [ ] Data transformation sudah di-test?
- [ ] Data loss implications sudah di-dokumentasi?
- [ ] Production large table? Gunakan CONCURRENTLY.
- [ ] Migration bisa di-run dalam waktu singkat? (batch jika perlu)
- [ ] Sudah di-test di staging environment?
- [ ] Monitor rencana (alerting, metric) sudah siap?
- [ ] Backup database sudah dilakukan?

---

## 8. Prisma Transaction Patterns

### 8.1 Interactive Transaction

```typescript
// ✅ Interactive transaction — multi-step atomic operation
const result = await prisma.$transaction(async (tx) => {
  // Step 1: Create order
  const order = await tx.order.create({
    data: {
      userId: userId,
      totalAmount: total,
      status: 'PENDING',
    },
  });

  // Step 2: Update inventory (reduce stock)
  for (const item of items) {
    const inventory = await tx.inventory.update({
      where: { productId: item.productId },
      data: { stock: { decrement: item.quantity } },
    });

    if (inventory.stock < 0) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }
  }

  // Step 3: Create order items
  await tx.orderItem.createMany({
    data: items.map(item => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
  });

  return order;
}, {
  timeout: 10000,       // Max 10 detik
  maxWait: 5000,        // Max 5 detik untuk mendapatkan connection
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Serializable isolation
});
```

**Isolation levels:**
```typescript
enum TransactionIsolationLevel {
  ReadUncommitted  = 'ReadUncommitted',
  ReadCommitted    = 'ReadCommitted',   // Default PostgreSQL
  RepeatableRead   = 'RepeatableRead',
  Serializable     = 'Serializable',    // Strictest, use for financial transactions
}
```

### 8.2 Nested Write (Batch Write)

```typescript
// ✅ Nested write — create related records in 1 query
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    profile: {
      create: {
        fullName: 'John Doe',
        bio: 'Software Engineer',
      },
    },
    posts: {
      create: [
        { title: 'Post 1', content: 'Content 1' },
        { title: 'Post 2', content: 'Content 2' },
      ],
    },
  },
  include: {
    profile: true,
    posts: true,
  },
});
```

### 8.3 Batch Operations

```typescript
// ✅ Bulk create (atomic, 1 query)
await prisma.post.createMany({
  data: [
    { title: 'Post A', authorId: userId },
    { title: 'Post B', authorId: userId },
  ],
  skipDuplicates: true, // Skip if unique constraint violation
});

// ✅ Bulk update
await prisma.post.updateMany({
  where: { authorId: userId },
  data: { status: 'PUBLISHED' },
});

// ✅ Bulk delete
await prisma.post.deleteMany({
  where: { authorId: userId, status: 'ARCHIVED' },
});
```

### 8.4 Retry Logic (Deadlock / Serialization)

```typescript
// ✅ Retry transaction on serialization failure
async function withRetry<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = 3,
  isolationLevel = Prisma.TransactionIsolationLevel.Serializable,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel,
        timeout: 10000,
      });
    } catch (error) {
      // P2034: Transaction failed due to write conflict
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        if (attempt === maxRetries) throw error;
        console.warn(`Transaction conflict, retrying (${attempt}/${maxRetries})...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 8.5 Transaction Best Practices

| Pattern | Use Case | Notes |
|---------|----------|-------|
| `$transaction([...])` | Multiple independent queries | Batch of reads, batch of writes independent |
| `$transaction(async (tx) => {})` | Related multi-step operation | Interactive, reads depend on writes |
| `createMany` | Bulk insert | 1 query, faster than loop |
| `updateMany` | Bulk update | 1 query, atomic |
| Retry logic | Serializable isolation | Handle P2034 error |
| Connection pool | Production | Set `maxWait` realistic |

### 8.6 Pitfalls to Avoid

```typescript
// ❌ BURUK — Sequential create inside transaction (N+1 writes)
await prisma.$transaction(async (tx) => {
  for (const item of items) {
    await tx.orderItem.create({ data: item }); // N queries!
  }
});

// ✅ BAIK — Batch create
await prisma.$transaction(async (tx) => {
  await tx.orderItem.createMany({ data: items }); // 1 query!
});

// ❌ BURUK — No timeout
await prisma.$transaction(async (tx) => {
  // Long operation — bisa hold connection forever
});

// ✅ BAIK — With timeout
await prisma.$transaction(async (tx) => {
  // Safe operation with timeout
}, { timeout: 5000 });
```

---

## 9. Error Reference (Prisma Known Error Codes)

| Code | Error | Cause | Fix |
|------|-------|-------|-----|
| P2002 | Unique constraint violation | Duplicate value | Handle with try-catch, return 409 |
| P2025 | Record not found | `update`/`delete` on non-existent record | Check `result === null` or use `updateMany` |
| P2014 | Relation violation | Foreign key constraint failed | Ensure referenced record exists |
| P2003 | Foreign key constraint | Invalid reference ID | Validate ID before write |
| P2034 | Transaction conflict | Write conflict on serializable isolation | Implement retry logic |
| P1001 | Connection refused | Database not accessible | Check DB host/port/credentials |
| P1000 | Authentication failed | Wrong credentials | Verify DATABASE_URL |
| P1017 | Server closed connection | Pool exhaustion or idle timeout | Increase pool size, set idle timeout |

---

## 10. Quick Reference — Command Cheatsheet

```bash
# Prisma CLI
npx prisma migrate dev --name <description>     # Dev migration
npx prisma migrate deploy                        # Prod migration
npx prisma migrate status                        # Check status
npx prisma migrate resolve                       # Resolve conflict
npx prisma generate                              # Generate client
npx prisma db push                               # Push schema directly (dev only)
npx prisma db pull                               # Introspect DB to schema
npx prisma studio                                # GUI data browser

# Database
psql -U user -d dbname -c "EXPLAIN ANALYZE <query>"
CREATE INDEX CONCURRENTLY IF NOT EXISTS ...
pgbouncer -d /etc/pgbouncer/pgbouncer.ini

# Monitoring
SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC;
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_locks WHERE NOT granted;
```
