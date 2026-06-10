---
name: nuxt4-vue3-patterns
description: "Nuxt 4 + Vue 3 Composition API patterns: app/ directory structure, server routes, data fetching (useFetch/useAsyncData), Nuxt UI components, Pinia state management, middleware (auth/redirect), SEO (useHead/useSeoMeta), error handling, and error pages."
---

# Nuxt 4 + Vue 3 Patterns

Comprehensive reference for building Nuxt 4 applications with Vue 3 Composition API, TypeScript, Nuxt UI, Pinia, and Tailwind CSS.

## 1. Nuxt 4 `app/` Directory Structure

Nuxt 4 introduces the `app/` directory as the primary location for application code, separating it from server-side code in `server/`.

```
my-nuxt-app/
├── app/
│   ├── app.vue                  # Root component (replaces nuxt.config layout)
│   ├── app.config.ts            # Runtime app config
│   ├── layouts/                 # Layout components
│   │   ├── default.vue
│   │   └── auth.vue
│   ├── pages/                   # File-based routing
│   │   ├── index.vue
│   │   ├── login.vue
│   │   ├── dashboard.vue
│   │   ├── about.vue
│   │   └── posts/
│   │       ├── index.vue        # /posts
│   │       └── [id].vue         # /posts/:id
│   ├── components/              # Auto-imported Vue components
│   │   ├── AppHeader.vue
│   │   ├── AppFooter.vue
│   │   ├── ui/                  # Reusable UI primitives
│   │   │   ├── BaseButton.vue
│   │   │   └── BaseCard.vue
│   │   └── form/                # Form-specific components
│   │       ├── FormInput.vue
│   │       └── FormSelect.vue
│   ├── composables/             # Auto-imported composables
│   │   ├── useAuth.ts
│   │   ├── useCustomFetch.ts
│   │   └── useToast.ts
│   ├── middleware/              # Route middleware (only route middleware here)
│   │   ├── auth.ts
│   │   └── guest.ts
│   ├── plugins/                 # Vue plugins
│   │   ├── pinia.ts
│   │   └── toast.ts
│   ├── stores/                  # Pinia stores (auto-imported)
│   │   ├── auth.store.ts
│   │   └── user.store.ts
│   ├── utils/                   # Utility functions (auto-imported)
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── errors/                  # Error pages
│   │   ├── error.vue            # General error page (~404/500)
│   │   └── forbidden.vue        # Custom 403 error page
│   └── types/                   # TypeScript types/interfaces
│       ├── user.ts
│       └── api.ts
├── server/                      # Server engine (Nitropack-based)
│   ├── api/                     # API routes
│   │   ├── hello.get.ts
│   │   ├── posts.get.ts
│   │   ├── posts.post.ts
│   │   └── auth/
│   │       ├── login.post.ts
│   │       └── me.get.ts
│   ├── routes/                  # Custom server routes
│   │   └── sitemap.xml.ts
│   ├── middleware/               # Server middleware
│   │   ├── auth.ts
│   │   └── cors.ts
│   └── utils/                   # Server-only utilities
│       ├── db.ts
│       └── jwt.ts
├── public/                      # Static assets (served at root)
│   ├── favicon.ico
│   └── robots.txt
├── nuxt.config.ts               # Nuxt configuration
├── tailwind.config.ts           # Tailwind CSS configuration (if not in nuxt.config)
├── tsconfig.json
└── package.json
```

### Key Nuxt 4 Migration Notes

- `app/` directory replaces the root-level `pages/`, `layouts/`, `middleware/`, `plugins/`, `composables/`, and `components/` directories. Files can still live at the root for backward compatibility, but `app/` is the canonical location.
- `server/` directory remains at root level and contains API endpoints, server middleware, and server utilities.
- Auto-imports work for `components/`, `composables/`, `stores/`, and `utils/` inside `app/`.
- The `app/router.options.ts` file can be used for custom Vue Router configuration.

## 2. Server Routes & API Endpoints

### API Route Convention (Nitro)

Server routes follow Nitro's file-based routing with HTTP method suffixes:

| File | HTTP Method | Route |
|---|---|---|
| `server/api/hello.get.ts` | GET | `/api/hello` |
| `server/api/posts.get.ts` | GET | `/api/posts` |
| `server/api/posts.post.ts` | POST | `/api/posts` |
| `server/api/posts/[id].get.ts` | GET | `/api/posts/:id` |
| `server/api/posts/[id].put.ts` | PUT | `/api/posts/:id` |
| `server/api/posts/[id].delete.ts` | DELETE | `/api/posts/:id` |
| `server/api/auth/login.post.ts` | POST | `/api/auth/login` |

### API Handler Pattern (TypeScript)

```ts
// server/api/posts/[id].get.ts
import { Post } from '~/types/post'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  // Validate params
  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid post ID',
    })
  }

  // Fetch data (example with Drizzle/Kysely)
  const post = await db.select().from(posts).where(eq(posts.id, Number(id))).get()

  if (!post) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Post not found',
    })
  }

  return { data: post }
})
```

### POST / Login Handler

```ts
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate input
  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  // Authenticate (example)
  const user = await authenticateUser(body.email, body.password)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  // Set session
  await setUserSession(event, { user: { id: user.id, email: user.email, role: user.role } })

  return { data: { user: { id: user.id, email: user.email, name: user.name } } }
})
```

### Protected API Endpoint with Auth Check

```ts
// server/api/posts.post.ts
export default defineEventHandler(async (event) => {
  // Require authentication
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)

  // Validate
  if (!body.title || !body.content) {
    throw createError({ statusCode: 400, statusMessage: 'Title and content required' })
  }

  // Create post
  const post = await db.insert(posts).values({
    title: body.title,
    content: body.content,
    authorId: session.user.id,
  }).returning().get()

  return { data: post }
})
```

### Server Middleware (CORS, Auth)

```ts
// server/middleware/cors.ts
export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })

  if (getMethod(event) === 'OPTIONS') {
    event.respondWith(new Response(null, { status: 204 }))
  }
})
```

### Server Utility / Database

```ts
// server/utils/db.ts
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./data.db',
})

export const db = drizzle(client)
```

## 3. useFetch / useAsyncData Data Fetching

### Basic useFetch

```ts
// app/pages/posts/index.vue
<script setup lang="ts">
interface Post {
  id: number
  title: string
  content: string
  createdAt: string
}

// Basic usage — automatically awaits on server, sends data to client
const { data: posts, pending, error, refresh } = await useFetch<{ data: Post[] }>('/api/posts')

// With reactive params (auto-refetches when params change)
const page = ref(1)
const { data: paginatedPosts } = await useFetch<{ data: Post[] }>('/api/posts', {
  query: { page, limit: 10 },
})
</script>

<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">{{ error.message }}</div>
    <div v-else>
      <div v-for="post in posts?.data" :key="post.id">
        <h2>{{ post.title }}</h2>
        <p>{{ post.content }}</p>
      </div>
    </div>
  </div>
</template>
```

### useAsyncData for Custom Fetching

```ts
// app/pages/posts/[id].vue
<script setup lang="ts">
const route = useRoute()
const id = computed(() => route.params.id as string)

const { data, pending, error } = await useAsyncData<{ data: Post }>(
  `post-${id.value}`,
  async () => {
    const response = await $fetch(`/api/posts/${id.value}`)
    return response
  },
  {
    watch: [id],            // Refetch when id changes
    default: () => ({ data: null }),
    lazy: true,             // Don't block navigation
    server: true,           // Fetch on server (default: true)
    // Dedupe across components
    dedupe: 'cancel',
  }
)

// Mutate to update cached data without refetch
const updateTitle = (newTitle: string) => {
  if (data.value) {
    data.value.data.title = newTitle
  }
}
</script>
```

### Custom Composable for Consistent Fetching

```ts
// app/composables/useApi.ts
import type { UseFetchOptions } from 'nuxt/app'

export function useApi<T>(url: string | (() => string), options?: UseFetchOptions<T>) {
  // Default options with error handling
  const defaults: UseFetchOptions<T> = {
    key: typeof url === 'string' ? url : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
    onResponseError({ response }) {
      // Centralized error handling
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: response._data?.statusMessage || 'An unexpected error occurred',
        color: 'red',
      })
    },
  }

  const mergedOptions = { ...defaults, ...options }
  return useFetch<T>(url, mergedOptions)
}

// Usage:
// const { data, pending } = await useApi<{ data: Post[] }>('/api/posts')
```

### Mutations with useFetch

```ts
// app/pages/posts/create.vue
<script setup lang="ts">
const router = useRouter()

// POST request
const { execute, pending } = useFetch('/api/posts', {
  method: 'POST',
  body: { title: '', content: '' },
  immediate: false,          // Don't execute immediately
  watch: false,              // Don't watch reactive body changes
  onResponse({ response }) {
    if (response.ok) {
      navigateTo('/posts')
    }
  }
})

const submit = async (formData: { title: string; content: string }) => {
  // Override body before executing
  await execute(null, { body: formData } as any)
}
</script>
```

### Key Options Reference

| Option | Type | Description |
|---|---|---|
| `key` | string | Unique key for deduplication/caching |
| `lazy` | boolean | Don't block navigation (default: false) |
| `server` | boolean | Fetch on server side (default: true) |
| `default` | () => T | Default value while loading |
| `watch` | WatchSource[] | Reactive sources that trigger refetch |
| `immediate` | boolean | Execute immediately (default: true) |
| `dedupe` | 'cancel' \| 'defer' | Deduplicate concurrent requests |
| `transform` | (data) => T | Transform response data |
| `pick` | string[] | Pick specific fields from response |
| `onResponse` | function | Callback on successful response |
| `onResponseError` | function | Callback on error response |

## 4. Nuxt UI Component Usage

### Import & Setup

Nuxt UI v3 components are auto-imported when the module is registered in `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  ui: {
    // Optional: disable auto-import of specific components
    // prefixes: ['U'],
  },
  colorMode: {
    preference: 'system',   // 'system' | 'light' | 'dark'
  },
})
```

### Common Components

```vue
<!-- Button variants -->
<UButton label="Submit" size="sm" color="primary" variant="solid" />
<UButton label="Cancel" color="neutral" variant="outline" />
<UButton loading :disabled="isPending">Saving...</UButton>
<UButton icon="i-heroicons-trash" color="error" variant="ghost" />

<!-- Input -->
<UInput v-model="email" placeholder="Email" size="lg" />
<UInput v-model="password" type="password" placeholder="Password" />
<UInput v-model="search" :trailing="true">
  <template #trailing>
    <UButton icon="i-heroicons-magnifying-glass" size="2xs" color="neutral" variant="ghost" />
  </template>
</UInput>

<!-- Select -->
<USelect v-model="role" :items="['admin', 'user', 'moderator']" placeholder="Select role" />

<!-- Textarea -->
<UTextarea v-model="content" placeholder="Write something..." :rows="5" />

<!-- Form Group with Validation -->
<UFormGroup label="Email" name="email" :error="errors.email">
  <UInput v-model="form.email" />
</UFormGroup>

<!-- Card -->
<UCard>
  <template #header>
    <h3 class="font-semibold">Card Title</h3>
  </template>
  <p>Card content goes here.</p>
  <template #footer>
    <UButton label="Action" />
  </template>
</UCard>

<!-- Modal -->
<UModal v-model:open="isModalOpen">
  <template #content>
    <UCard>
      <template #header>
        <h3>Modal Title</h3>
      </template>
      <p>Modal content</p>
    </UCard>
  </template>
</UModal>

<!-- Toast Notifications -->
<script setup lang="ts">
const toast = useToast()

const showSuccess = () => {
  toast.add({
    title: 'Success!',
    description: 'Your changes have been saved.',
    color: 'success',
    icon: 'i-heroicons-check-circle',
  })
}

const showError = () => {
  toast.add({
    title: 'Error',
    description: 'Something went wrong.',
    color: 'error',
    duration: 5000,  // 5 seconds
  })
}
</script>

<!-- Badge / Tag -->
<UBadge label="Active" color="success" variant="solid" size="sm" />
<UBadge label="Pending" color="warning" variant="outline" />

<!-- Table -->
<UTable :columns="columns" :rows="rows" :loading="isLoading" sortable>
  <template #status-data="{ row }">
    <UBadge :label="row.status" :color="row.status === 'active' ? 'success' : 'neutral'" />
  </template>
</UTable>
```

### Layout with Nuxt UI

```vue
<!-- app/layouts/default.vue -->
<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Navigation Bar -->
    <UContainer>
      <header class="flex items-center justify-between py-4">
        <NuxtLink to="/" class="text-xl font-bold">My App</NuxtLink>
        <nav class="flex items-center gap-4">
          <NuxtLink to="/posts">Posts</NuxtLink>
          <NuxtLink to="/about">About</NuxtLink>
          <UButton
            :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
            variant="ghost"
            color="neutral"
            @click="colorMode.preference = isDark ? 'light' : 'dark'"
          />
        </nav>
      </header>
    </UContainer>

    <!-- Page Content -->
    <UContainer>
      <main class="py-8">
        <slot />
      </main>
    </UContainer>

    <!-- Footer -->
    <UContainer>
      <footer class="py-6 text-center text-sm text-gray-500">
        &copy; {{ new Date().getFullYear() }} My App
      </footer>
    </UContainer>
  </div>
</template>
```

## 5. Pinia State Management

### Store Definition (Composition API style)

```ts
// app/stores/auth.store.ts
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role ?? null)

  // Actions
  async function login(email: string, password: string) {
    const { data, error } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      immediate: true,
    })

    if (error.value) throw new Error(error.value.statusMessage)
    user.value = data.value.data.user
    token.value = data.value.data.token
  }

  async function fetchProfile() {
    const { data } = await useFetch('/api/auth/me')
    if (data.value) {
      user.value = data.value.data
    }
  }

  function logout() {
    user.value = null
    token.value = null
    navigateTo('/login')
  }

  // Persist to localStorage (optional)
  // Use pinia-plugin-persistedstate for automatic persistence

  return { user, token, isAuthenticated, userRole, login, fetchProfile, logout }
})
```

### Store with Data Fetching (Posts)

```ts
// app/stores/posts.store.ts
export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPosts() {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ data: Post[] }>('/api/posts')
      posts.value = data.value?.data ?? []
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPostById(id: string | number) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ data: Post }>(`/api/posts/${id}`)
      currentPost.value = data.value?.data ?? null
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function createPost(input: { title: string; content: string }) {
    const { data } = await useFetch('/api/posts', {
      method: 'POST',
      body: input,
    })
    if (data.value) {
      posts.value.push(data.value.data)
    }
  }

  return { posts, currentPost, isLoading, error, fetchPosts, fetchPostById, createPost }
})
```

### Using Pinia in Components

```vue
<!-- app/pages/posts/index.vue -->
<script setup lang="ts">
const store = usePostsStore()
// Or import { usePostsStore } from '~/stores/posts.store'

// Fetch on mount
onMounted(() => {
  store.fetchPosts()
})

// Direct access
const { posts, isLoading } = storeToRefs(store)
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Posts</h1>
    <div v-if="isLoading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6" />
    </div>
    <div v-else-if="store.error" class="text-red-500">{{ store.error }}</div>
    <div v-else class="grid gap-4">
      <UCard v-for="post in posts" :key="post.id">
        <NuxtLink :to="`/posts/${post.id}`">
          <h2 class="font-semibold">{{ post.title }}</h2>
        </NuxtLink>
      </UCard>
    </div>
    <div v-if="posts.length === 0 && !isLoading" class="text-gray-500 text-center py-8">
      No posts found.
    </div>
  </div>
</template>
```

### State Reset

```ts
// Reset entire store (e.g., on logout)
const authStore = useAuthStore()
authStore.$reset()

// Or patch specific state
authStore.$patch({
  user: null,
  token: null,
})

// Subscribe to state changes
authStore.$subscribe((mutation, state) => {
  console.log('Auth state changed:', state)
})
```

## 6. Middleware (Auth, Redirect)

### Route Middleware Basics

Route middleware in Nuxt 4 lives in `app/middleware/`. Files are auto-imported by filename.

### Authentication Middleware

```ts
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware for public routes
  const publicRoutes = ['/login', '/register', '/forgot-password']
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Check authentication state
  const authStore = useAuthStore()

  // If user not loaded yet, try to fetch profile
  if (!authStore.isAuthenticated && authStore.token) {
    try {
      await authStore.fetchProfile()
    } catch {
      // Token invalid, redirect to login
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }
  }

  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})
```

### Role-Based Middleware (Admin)

```ts
// app/middleware/admin.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  // Ensure user is authenticated first
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  // Check role
  if (authStore.userRole !== 'admin') {
    return navigateTo('/')  // Redirect to homepage
    // Or use abortNavigation for 403
    // return abortNavigation(createError({
    //   statusCode: 403,
    //   statusMessage: 'Forbidden',
    // }))
  }
})
```

### Guest Middleware (Redirect if already logged in)

```ts
// app/middleware/guest.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    // Redirect authenticated users away from login/register
    return navigateTo(to.query.redirect as string || '/dashboard')
  }
})
```

### Applying Middleware

```ts
// In a page component (inline middleware)
definePageMeta({
  middleware: ['auth'],
  // or multiple:
  // middleware: ['auth', 'admin'],
})

// Global middleware — add ".global" suffix
// app/middleware/analytics.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // Track page view (runs on every route change)
  trackPageView(to.path)
})
```

### Middleware with Navigation Guards

```ts
// app/middleware/form-guard.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const formStore = useFormStore()

  if (formStore.isDirty) {
    // Use abortNavigation to prevent navigation and show a dialog
    const { proceed } = await showUnsavedChangesDialog()
    if (!proceed) {
      return abortNavigation()
    }
  }
})
```

## 7. SEO dengan useHead / useSeoMeta

### useHead — Full Head Control

```ts
// app/pages/index.vue
<script setup lang="ts">
useHead({
  title: 'Home - My App',
  meta: [
    { name: 'description', content: 'Welcome to My App — a modern Nuxt 4 application.' },
    { name: 'keywords', content: 'nuxt, vue, app' },
    { property: 'og:title', content: 'My App' },
    { property: 'og:description', content: 'A modern Nuxt 4 application built with Vue 3 and TypeScript.' },
    { property: 'og:image', content: '/og-image.png' },
  ],
  link: [
    { rel: 'canonical', href: 'https://myapp.com' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'My App',
        url: 'https://myapp.com',
      }),
    },
  ],
  htmlAttrs: {
    lang: 'en',
  },
  bodyAttrs: {
    class: 'home-page',
  },
})
</script>
```

### useSeoMeta — Simplified SEO

```ts
// app/pages/about.vue
<script setup lang="ts">
useSeoMeta({
  title: 'About Us - My App',
  ogTitle: 'About My App',
  description: 'Learn more about our team and mission.',
  ogDescription: 'Learn more about our team and mission.',
  ogImage: '/images/about-og.png',
  ogUrl: 'https://myapp.com/about',
  twitterCard: 'summary_large_image',
  twitterTitle: 'About My App',
  twitterDescription: 'Learn more about our team and mission.',
})
</script>
```

### Dynamic SEO with Route Params

```ts
// app/pages/posts/[id].vue
<script setup lang="ts">
const route = useRoute()
const { data: post } = await useAsyncData<{ data: Post }>(
  `post-${route.params.id}`,
  () => $fetch(`/api/posts/${route.params.id}`)
)

const title = computed(() => post.value?.data?.title ?? 'Post - My App')
const description = computed(() =>
  post.value?.data?.content?.slice(0, 160).replace(/<[^>]*>/g, '') ?? ''
)

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  ogImage: post.value?.data?.image ?? '/default-og.png',
  ogUrl: computed(() => `https://myapp.com/posts/${route.params.id}`),
})
</script>
```

### useHead Tips for SEO

- Use `useHead` for fine-grained control (multiple meta tags, link tags, scripts, structured data).
- Use `useSeoMeta` for standard SEO meta tags with reactive computed properties.
- Both components are auto-imported.
- Set global defaults in `app/app.vue` using `useHead` with the `titleTemplate` option.
- Reactive values are automatically tracked — no need for `watch`.

```ts
// app/app.vue — global SEO defaults
useHead({
  titleTemplate: (title) => `${title ? `${title} | ` : ''}My App`,
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
})
```

## 8. Error Handling

### Client-Side Error Handling

```ts
// App-level error handler (app/error.vue is the error page — see section 9)

// In components — using try/catch with async operations
async function submitForm() {
  try {
    await store.createPost(formData)
    toast.add({ title: 'Post created!', color: 'success' })
  } catch (err: any) {
    toast.add({
      title: 'Failed to create post',
      description: err.message || 'Please try again.',
      color: 'error',
    })
  }
}

// Using Vue's onErrorCaptured
onErrorCaptured((err, instance, info) => {
  console.error('Component error:', err, info)
  // Optionally send to error tracking
  captureException(err)
  // Return false to prevent error propagation
  return false
})
```

### API Error Handling with useFetch

```ts
// app/composables/useApi.ts — with centralized error handling
export function useApi<T>(url: string | Ref<string> | (() => string), opts: UseFetchOptions<T> = {}) {
  const options: UseFetchOptions<T> = {
    ...opts,
    onResponseError({ response }) {
      const toast = useToast()

      const status = response.status
      const message = response._data?.statusMessage || response.statusText

      if (status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        toast.add({ title: 'Session expired', color: 'warning' })
        navigateTo('/login')
      } else if (status === 403) {
        toast.add({ title: 'Access denied', color: 'error' })
      } else if (status === 422) {
        // Validation errors
        console.error('Validation errors:', response._data?.data)
      } else {
        toast.add({ title: 'Error', description: message, color: 'error' })
      }

      // Also call user-provided onResponseError if any
      opts.onResponseError?.({ response })
    },
  }

  return useFetch<T>(url, options)
}
```

### Global Error Handling with Vue Error Handler

```ts
// app/plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    console.error('Global Vue error:', err, info)
    // Send to error monitoring (Sentry, etc.)
    // captureException(err)
  }

  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      // captureException(event.reason)
    })
  }
})
```

### Server Error Handling

```ts
// server/api/posts/[id].get.ts
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const post = await db.select().from(posts).where(eq(posts.id, Number(id))).get()

    if (!post) {
      throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    return { data: post }
  } catch (error: any) {
    // Log server-side
    console.error('Error fetching post:', error)

    // Re-throw known errors
    if (error.statusCode) {
      throw error
    }

    // Handle unknown errors
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
```

### Using `createError` Utility

```ts
// Create a standardized error response
throw createError({
  statusCode: 400,
  statusMessage: 'Bad Request',
  message: 'Invalid email format',
  data: {
    field: 'email',
    constraints: ['Must be a valid email address'],
  },
})

// Catch on client side
try {
  await $fetch('/api/users', { method: 'POST', body })
} catch (err: any) {
  if (err.statusCode === 422) {
    // Handle validation errors
    console.log(err.data?.data?.issues)  // Zod validation issues
  }
}
```

## 9. Error Pages

### Default Error Page

```vue
<!-- app/errors/error.vue -->
<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const handleClearError = () => {
  clearError({ redirect: '/' })
}

const is404 = computed(() => props.error.statusCode === 404)
const is403 = computed(() => props.error.statusCode === 403)
const is500 = computed(() => props.error.statusCode === 500)

// Set SEO for error page
useSeoMeta({
  title: is404.value ? 'Page Not Found' : 'Error',
  description: is404.value
    ? 'The page you are looking for does not exist.'
    : 'An unexpected error occurred.',
})
</script>

<template>
  <UContainer class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center max-w-md">
      <!-- Error Icon -->
      <div class="mb-6">
        <UIcon
          v-if="is404"
          name="i-heroicons-document-magnifying-glass"
          class="h-20 w-20 mx-auto text-gray-400 dark:text-gray-600"
        />
        <UIcon
          v-else-if="is403"
          name="i-heroicons-lock-closed"
          class="h-20 w-20 mx-auto text-orange-400 dark:text-orange-600"
        />
        <UIcon
          v-else
          name="i-heroicons-exclamation-triangle"
          class="h-20 w-20 mx-auto text-red-400 dark:text-red-600"
        />
      </div>

      <!-- Error Code -->
      <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-2">
        {{ error.statusCode }}
      </h1>

      <!-- Error Message -->
      <p class="text-xl text-gray-600 dark:text-gray-400 mb-2">
        {{ is404 ? 'Page Not Found' : is403 ? 'Access Denied' : 'Something went wrong' }}
      </p>
      <p class="text-gray-500 dark:text-gray-500 mb-8">
        {{ is404
          ? 'The page you are looking for does not exist or has been moved.'
          : is403
            ? 'You do not have permission to access this page.'
            : error.statusMessage || 'An unexpected error occurred. Please try again later.'
        }}
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-center gap-3">
        <UButton
          label="Go Home"
          color="primary"
          variant="solid"
          size="lg"
          @click="handleClearError"
        />
        <UButton
          label="Try Again"
          color="neutral"
          variant="outline"
          size="lg"
          @click="clearError({ redirect: error.url || '/' })"
          v-if="!is404"
        />
      </div>

      <!-- Debug info (dev only) -->
      <p v-if="error.stack && process.dev" class="mt-8 text-xs text-left text-gray-400">
        <strong>Stack trace:</strong><br />
        <code class="block mt-1 whitespace-pre-wrap">{{ error.stack }}</code>
      </p>
    </div>
  </UContainer>
</template>
```

### Custom 403 Forbidden Page

```vue
<!-- app/errors/forbidden.vue -->
<script setup lang="ts">
const handleGoBack = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <UContainer class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center max-w-md">
      <UIcon name="i-heroicons-shield-exclamation" class="h-20 w-20 mx-auto text-red-400 mb-6" />
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        You don't have permission to access this resource. Contact your administrator if you believe this is a mistake.
      </p>
      <UButton label="Go Home" color="primary" variant="solid" size="lg" @click="handleGoBack" />
    </div>
  </UContainer>
</template>
```

### Using NuxtLink to error pages

When `clearError` is called with a redirect path, the error boundary is cleared and the app navigates to the specified route. For custom error handling in pages:

```vue
<!-- In a page, trigger a 404 manually -->
<script setup lang="ts">
const { data: post } = await useAsyncData('post', () => $fetch('/api/posts/999'))

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}
</script>
```

### Global Server Error Handler (optional)

```ts
// server/middleware/error-handler.ts
export default defineEventHandler(async (event) => {
  try {
    return await event.node.req.url
      ? await handleEvent(event)
      : undefined
  } catch (error: any) {
    // Log server errors
    console.error('Server error:', error)

    // Return consistent error shape
    return sendError(event, createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
    }))
  }
})
```

## Quick Reference Summary

| Topic | Key API / File | Notes |
|---|---|---|
| Directory structure | `app/` dir at project root | Nuxt 4 canonical structure |
| API routes | `server/api/*.get.ts`, `.post.ts` | Nitro file-based routing |
| Data fetching | `useFetch()`, `useAsyncData()` | Auto-dedupe, SSR-aware |
| UI components | Auto-imported `UButton`, `UCard`, etc. | Nuxt UI v3 auto-imports |
| State management | `defineStore('name', () => { ... })` | Pinia composition API |
| Route middleware | `app/middleware/auth.ts` | Named or `.global` |
| SEO | `useHead()`, `useSeoMeta()` | Reactive, auto-tracked |
| Error pages | `app/errors/error.vue` | Props: `error: NuxtError` |
| Error throwing | `createError({ statusCode, statusMessage })` | Works in server + client |
