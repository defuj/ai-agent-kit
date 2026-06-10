---
name: react-nextjs-patterns
description: >-
  Complete React 19 + Next.js 15 App Router patterns and conventions: file-based routing (page.tsx, layout.tsx, loading.tsx, error.tsx, route.ts),
  Server Components vs Client Components, Server Actions for mutations, TanStack Query for data fetching & caching, Zustand for client state,
  React Hook Form + Zod for form validation, shadcn/ui component integration, generateMetadata for SEO, middleware (auth/redirect),
  error boundaries, and loading/suspense patterns. Designed for the frontend-react agent building production React/Next.js applications.
license: MIT
metadata:
  author: opencode-agent-kit
  version: "1.0.0"
  target_agent: frontend-react
  stack:
    - React 19
    - Next.js 15 (App Router)
    - TypeScript
    - Tailwind CSS
    - shadcn/ui
    - TanStack Query
    - Zustand
    - React Hook Form
    - Zod
---

# React + Next.js Patterns

**Target Agent:** @frontend-react  
**Stack:** React 19 · Next.js 15 App Router · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · Zustand · React Hook Form · Zod  

Comprehensive reference for building production-grade React/Next.js applications with the App Router. Covers every file convention, rendering strategy, data flow pattern, and common integration point in the modern Next.js ecosystem.

---

## Table of Contents

1. [Next.js 15 App Router — File Conventions](#1-nextjs-15-app-router--file-conventions)
2. [Server Components vs Client Components](#2-server-components-vs-client-components)
3. [Server Actions for Mutations](#3-server-actions-for-mutations)
4. [TanStack Query for Data Fetching & Caching](#4-tanstack-query-for-data-fetching--caching)
5. [Zustand for Client State](#5-zustand-for-client-state)
6. [React Hook Form + Zod for Form Validation](#6-react-hook-form--zod-for-form-validation)
7. [shadcn/ui Components](#7-shadcnui-components)
8. [generateMetadata for SEO](#8-generatemetadata-for-seo)
9. [Middleware (Auth & Redirect)](#9-middleware-auth--redirect)
10. [Error Boundaries](#10-error-boundaries)
11. [Loading & Suspense Patterns](#11-loading--suspense-patterns)

---

## 1. Next.js 15 App Router — File Conventions

The App Router uses a file-system based routing hierarchy inside `app/`. Each route segment folder can contain special files that define the UI at that level.

### page.tsx — Route UI

The unique UI for a route. Must export a default component (Server Component by default).

```tsx
// app/products/page.tsx
import { ProductList } from "@/components/product-list";

export default async function ProductsPage() {
  const products = await fetch("https://api.example.com/products", {
    next: { revalidate: 60 },
  });
  const data = await products.json();

  return <ProductList products={data} />;
}
```

### layout.tsx — Shared Shell

Wraps all pages and nested segments beneath it. Persists across navigations (does not re-render). Can be nested.

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

**Key rules:**
- `layout.tsx` receives `children` (the page or nested layout)
- Accepts an optional `params` prop for dynamic segments
- Cannot be a Client Component (`'use client'`) — layouts are Server Components by design
- A `layout.tsx` and a `page.tsx` can coexist in the same folder

### loading.tsx — Suspense Fallback

Automatically wraps the page (and its children in nested layouts) in a `<Suspense>` boundary. Shown while the page's async data is loading.

```tsx
// app/products/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

### error.tsx — Error Boundary

Automatically wraps the page and its children in a React Error Boundary. Must be a Client Component (`'use client'`).

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
```

### route.ts — API Route Handlers

Server-side API endpoints. Export named HTTP method functions (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).

```tsx
// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  const products = await prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const product = await prisma.product.create({ data: body });
  return NextResponse.json(product, { status: 201 });
}
```

### Dynamic Routes

- `[id]` — single dynamic segment (`app/products/[id]/page.tsx`)
- `[...slug]` — catch-all segment (`app/blog/[...slug]/page.tsx`)
- `[[...slug]]` — optional catch-all segment

```tsx
// app/products/[id]/page.tsx
interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetch(`https://api.example.com/products/${id}`).then(
    (r) => r.json()
  );

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

---

## 2. Server Components vs Client Components

### Golden Rule

**All components are Server Components by default** in the App Router. Only add `'use client'` when you absolutely need browser-only APIs or interactivity.

### When to use `'use client'`

| Need | Example | Server? | Client? |
|------|---------|---------|---------|
| Fetch data from DB/API | `await fetch()` | ✅ Default | ❌ |
| Access backend resources | env vars, filesystem | ✅ | ❌ |
| Event handlers | `onClick`, `onSubmit` | ❌ | ✅ |
| Hooks | `useState`, `useEffect`, `useContext` | ❌ | ✅ |
| Browser APIs | `localStorage`, `window` | ❌ | ✅ |
| Custom hooks with state | `useForm`, `useMediaQuery` | ❌ | ✅ |
| Pure presentational | Rendering JSX only | ✅ | ✅ (but prefer Server) |

### Server Component

```tsx
// This is a Server Component — NO 'use client' directive
// Can be async, can directly access DB/filesystem/env
async function ProductCard({ id }: { id: string }) {
  const product = await fetchProduct(id); // runs on server

  return (
    <div>
      <h2>{product.name}</h2>
      <p>{product.price}</p>
    </div>
  );
}
```

### Client Component

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AddToCart({ productId }: { productId: string }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    await fetch("/api/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
    setIsAdding(false);
  };

  return (
    <Button onClick={handleAdd} disabled={isAdding}>
      {isAdding ? "Adding..." : "Add to Cart"}
    </Button>
  );
}
```

### Composition Pattern (Best Practice)

Keep business logic on the server, push interactivity down to small client leaves:

```tsx
// ✅ Parent: Server Component (handles data fetching)
import { AddToCart } from "./add-to-cart";

async function ProductPage({ id }: { id: string }) {
  const product = await fetchProduct(id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* Only the button is a Client Component */}
      <AddToCart productId={product.id} />
    </div>
  );
}
```

### What NOT to do

```tsx
// ❌ WRONG: unnecessary 'use client' on a component that doesn't need it
"use client";

import { ProductCard } from "./product-card";

// Just rendering — should be a Server Component
export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

---

## 3. Server Actions for Mutations

Server Actions are async functions executed on the server but callable from the client/forms. Use `"use server"` directive at the top of a file or inline in a Server Component.

### Inline Server Action (in a Server Component)

```tsx
// app/products/create/page.tsx
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default function CreateProductPage() {
  async function createProduct(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));

    await prisma.product.create({
      data: { name, price },
    });

    revalidatePath("/products");
    redirect("/products");
  }

  return (
    <form action={createProduct}>
      <input name="name" placeholder="Product name" required />
      <input name="price" type="number" placeholder="Price" required />
      <Button type="submit">Create Product</Button>
    </form>
  );
}
```

### Server Action in a Separate File (reusable)

```tsx
// lib/actions/products.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
});

export async function createProduct(prevState: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createProductSchema.safeParse({
    name: raw.name,
    price: Number(raw.price),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.product.create({ data: parsed.data });
  } catch (e) {
    return { error: { _form: ["Failed to create product"] } };
  }

  revalidatePath("/products");
  redirect("/products");
}
```

### Using Server Actions from Client Components (via bind)

```tsx
"use client";

import { experimental_useFormState as useFormState } from "react-dom";
// In React 19: import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProduct } from "@/lib/actions/products";

export function ProductForm() {
  // React 19 API
  const [state, formAction, isPending] = useActionState(createProduct, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Input name="name" placeholder="Product name" />
        {state?.error?.name && (
          <p className="text-sm text-destructive mt-1">{state.error.name}</p>
        )}
      </div>
      <div>
        <Input name="price" type="number" placeholder="Price" />
        {state?.error?.price && (
          <p className="text-sm text-destructive mt-1">{state.error.price}</p>
        )}
      </div>
      {state?.error?._form && (
        <p className="text-sm text-destructive">{state.error._form}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Product"}
      </Button>
    </form>
  );
}
```

### Key Rules for Server Actions

| Rule | Detail |
|------|--------|
| **Always validate** | Never trust `formData` — always validate with Zod or similar |
| **Auth check first** | Verify user permissions at the top of every action |
| **Call `revalidatePath` / `revalidateTag`** | After successful mutations to refresh cached data |
| **Use `redirect` after success** | Only works in a Server Action, not in a Client Component |
| **Use `useActionState` (React 19)** | For pending states and form-level errors |
| **Security** | Server Actions are POST endpoints — protect them like API routes |

---

## 4. TanStack Query for Data Fetching & Caching

TanStack Query (React Query v5) is the standard for client-side data fetching, caching, and mutation management.

### Setup

```tsx
// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### useQuery — Fetching Data

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export function ProductsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    select: (data) => data.sort((a, b) => a.name.localeCompare(b.name)),
  });

  if (isLoading) return <ProductsSkeleton />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Paginated Queries

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function PaginatedProducts() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData } = useQuery({
    queryKey: ["products", page],
    queryFn: () => fetch(`/api/products?page=${page}`).then((r) => r.json()),
    placeholderData: (prev) => prev, // keep previous data while loading
  });

  return (
    <div>
      {/* render products */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isPlaceholderData || !data?.hasMore}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### useMutation — Mutations

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

async function deleteProduct(id: string) {
  const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}

export function DeleteProductButton({ productId }: { productId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Button
      variant="destructive"
      onClick={() => mutation.mutate(productId)}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
```

### Optimistic Updates

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Todo {
  id: string;
  completed: boolean;
  title: string;
}

export function ToggleTodo({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newTodo: Todo) => {
      const res = await fetch(`/api/todos/${newTodo.id}`, {
        method: "PATCH",
        body: JSON.stringify(newTodo),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onMutate: async (newTodo) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      // Snapshot previous
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);

      // Optimistically update
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((t) => (t.id === newTodo.id ? newTodo : t))
      );

      return { previous };
    },
    onError: (_err, _newTodo, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return (
    <input
      type="checkbox"
      checked={todo.completed}
      onChange={() =>
        mutation.mutate({ ...todo, completed: !todo.completed })
      }
    />
  );
}
```

### Infinite Queries

```tsx
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function InfiniteProducts() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["products-infinite"],
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/products?page=${pageParam}`).then((r) => r.json()),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    initialPageParam: 1,
  });

  return (
    <div>
      {data?.pages.map((page) =>
        page.products.map((product) => (
          <div key={product.id}>{product.name}</div>
        ))
      )}
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading more..." : "Load More"}
        </Button>
      )}
    </div>
  );
}
```

### Prefetching (Waterfall Avoidance)

```tsx
// Server Component prefetches data for client components
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { ProductsList } from "./products-list";

export default async function ProductsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["products"],
    queryFn: () => fetch("https://api.example.com/products").then((r) => r.json()),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsList />
    </HydrationBoundary>
  );
}
```

---

## 5. Zustand for Client State

Zustand is a lightweight state management library for client-side (UI) state. Use it for: modals state, sidebar toggle, filters, user preferences — NOT for server data (use TanStack Query for that).

### Basic Store

```tsx
// lib/stores/ui-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "system",
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "ui-preferences" }
  )
);
```

### Store with Computed Values (using `derive` or external selectors)

```tsx
// lib/stores/cart-store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "cart-store" }
  )
);
```

### Using Selectors Efficiently (Prevent Unnecessary Re-renders)

```tsx
"use client";

import { useCartStore } from "@/lib/stores/cart-store";

// ❌ Bad: component re-renders on ANY state change
function BadCartBadge() {
  const items = useCartStore((s) => s.items);
  return <span>{items.length}</span>;
}

// ✅ Good: only re-renders when count changes
function CartBadge() {
  const count = useCartStore((s) =>
    s.items.reduce((acc, i) => acc + i.quantity, 0)
  );
  return <span>{count}</span>;
}

// ✅ Best: extract selector for reuse
const selectCartCount = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.quantity, 0);

function CartBadgeOptimized() {
  const count = useCartStore(selectCartCount);
  return <span>{count}</span>;
}
```

### Zustand + Server Components (Pattern)

Zustand stores run on the client. To initialize from server data, use a provider:

```tsx
"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore, type StoreApi } from "zustand";
import { createCartStore, type CartState } from "@/lib/stores/cart-store";

const CartStoreContext = createContext<StoreApi<CartState> | null>(null);

export function CartStoreProvider({
  children,
  initialItems,
}: {
  children: ReactNode;
  initialItems: CartItem[];
}) {
  const storeRef = useRef<StoreApi<CartState>>();
  if (!storeRef.current) {
    storeRef.current = createCartStore({ items: initialItems });
  }
  return (
    <CartStoreContext.Provider value={storeRef.current}>
      {children}
    </CartStoreContext.Provider>
  );
}

export function useCartStoreContext<T>(selector: (state: CartState) => T): T {
  const store = useContext(CartStoreContext);
  if (!store) throw new Error("Missing CartStoreProvider");
  return useStore(store, selector);
}
```

---

## 6. React Hook Form + Zod for Form Validation

### Setup

```bash
npm install react-hook-form @hookform/resolvers zod
```

### Schema Definition

```tsx
// lib/schemas/product-schema.ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false),
});

export type ProductFormValues = z.infer<typeof productSchema>;
```

### Form Component

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "@/lib/schemas/product-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

export function ProductForm({ defaultValues, onSubmit }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      tags: [],
      published: false,
      ...defaultValues,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      await onSubmit(values);
      toast.success("Product saved successfully");
      form.reset();
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your product"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Published</FormLabel>
              <FormDescription>
                Make this product visible to customers
              </FormDescription>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Product"}
        </Button>
      </form>
    </Form>
  );
}
```

### Using with Server Actions

```tsx
// app/products/create/page.tsx
import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/product-form";

export default function CreateProductPage() {
  async function handleCreate(values: ProductFormValues) {
    "use server";
    // values is already validated by Zod on the client
    // but re-validate on server for security
    await createProduct(values);
  }

  return <ProductForm onSubmit={handleCreate} />;
}
```

### Array Fields (Dynamic Fields)

```tsx
"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

const variantSchema = z.object({
  variants: z.array(
    z.object({
      name: z.string().min(1, "Variant name is required"),
      price: z.coerce.number().positive(),
      stock: z.coerce.number().int().nonnegative(),
    })
  ),
});

export function VariantForm() {
  const form = useForm({
    resolver: zodResolver(variantSchema),
    defaultValues: { variants: [{ name: "", price: 0, stock: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  return (
    <form onSubmit={form.handleSubmit((d) => console.log(d))}>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-end">
          <Input {...form.register(`variants.${index}.name`)} placeholder="Name" />
          <Input
            type="number"
            {...form.register(`variants.${index}.price`)}
            placeholder="Price"
          />
          <Input
            type="number"
            {...form.register(`variants.${index}.stock`)}
            placeholder="Stock"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ name: "", price: 0, stock: 0 })}
      >
        Add Variant
      </Button>
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

## 7. shadcn/ui Components

### Installation

Initialize shadcn/ui in a Next.js project:

```bash
npx shadcn@latest init
```

Add individual components:

```bash
npx shadcn@latest add button card form input select dialog toast
```

### Available Components (Common)

| Component | Usage |
|-----------|-------|
| `Button` | `variant="default\|destructive\|outline\|secondary\|ghost\|link"`, `size="default\|sm\|lg\|icon"` |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | Layout containers with consistent padding/shadow |
| `Input` | Form text inputs (use in FormField) |
| `Textarea` | Multi-line text input |
| `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` | Dropdown select (use in FormField with onValueChange) |
| `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` | Modal dialogs |
| `Sheet` | Slide-out panels (mobile menus, filters) |
| `Toast` / `Sonner` | Toast notifications (`toast.success()`, `toast.error()`) |
| `Skeleton` | Loading placeholders |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Tabbed interface |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead` | Data tables |
| `Badge` | Status/tag badges, `variant="default\|secondary\|destructive\|outline"` |
| `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` | Context menus / action menus |
| `Avatar`, `AvatarImage`, `AvatarFallback` | User avatars with fallback initials |
| `Switch` | Toggle switches (boolean form fields) |
| `Label` | Form labels (use in FormItem) |
| `Separator` | Horizontal/vertical dividers |

### Customization Pattern

shadcn/ui components live in `@/components/ui/`. Customize them directly:

```tsx
// components/ui/button.tsx (after shadcn add)
// Edit variants, sizes, or styling right in this file
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Add custom variants here
        success: "bg-green-600 text-white hover:bg-green-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Dialog Example (CRUD Pattern)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function CreateProductDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
          <DialogDescription>
            Fill in the details for your new product.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input id="price" type="number" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 8. generateMetadata for SEO

Next.js provides `generateMetadata` (and the older `metadata` export) for dynamic and static SEO metadata in the App Router.

### Static Metadata

```tsx
// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | My App",
  description: "Learn more about our company and mission.",
  openGraph: {
    title: "About Us",
    description: "Learn more about our company and mission.",
    type: "website",
  },
};

export default function AboutPage() {
  return <div>About page content</div>;
}
```

### Dynamic Metadata (generateMetadata)

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const product = await fetch(`https://api.example.com/products/${id}`).then(
    (r) => r.json()
  );

  if (!product) return {};

  return {
    title: `${product.name} | My Store`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  // ... render
}
```

### Metadata Template (from Root Layout)

```tsx
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "My Store",        // fallback if no child sets title
    template: "%s | My Store",  // %s is replaced by child's title
  },
  description: "The best store on the web",
  openGraph: {
    siteName: "My Store",
    type: "website",
    locale: "en_US",
  },
};
```

### Full SEO Example (Product Page)

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const product = await fetch(`https://api.example.com/products/${id}`, {
    next: { revalidate: 3600 },
  }).then((r) => (r.ok ? r.json() : null));

  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    keywords: [product.category, product.brand].filter(Boolean),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      url: `/products/${product.id}`,
      images: [
        {
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description.slice(0, 200),
      images: [product.image],
    },
    alternates: {
      canonical: `/products/${product.id}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  // render product page...
}
```

---

## 9. Middleware (Auth & Redirect)

Middleware runs **before** every request. Use it for: authentication checks, redirects, URL rewrites, headers, geolocation, bot detection.

### Basic Auth Middleware

```tsx
// middleware.ts (at project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");

  // Allow auth routes and API auth routes
  if (isAuthPage || isApiAuthRoute) {
    // If already authenticated, redirect away from login
    if (token && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard and admin routes
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, _next, and API auth
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
```

### Middleware with Auth.js (NextAuth v5)

```tsx
// middleware.ts
import { auth } from "@/lib/auth"; // your auth config
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  // Protect API routes
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Protect dashboard and admin
  const protectedPaths = ["/dashboard", "/admin", "/settings"];
  const isProtected = protectedPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !isLoggedIn) {
    const redirectUrl = new URL("/login", nextUrl);
    redirectUrl.searchParams.set("redirect", nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Multi-Role Middleware

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLES = {
  admin: ["/admin", "/dashboard"],
  user: ["/dashboard", "/profile"],
} as const;

async function getUserRole(token: string): Promise<string | null> {
  // Verify JWT or fetch from DB
  const res = await fetch(`${process.env.AUTH_URL}/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.role;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = await getUserRole(token);

  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const path = request.nextUrl.pathname;
  const allowedPaths = ROLES[role as keyof typeof ROLES];

  if (!allowedPaths?.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/profile/:path*"],
};
```

### Middleware Best Practices

| Rule | Detail |
|------|--------|
| **Use `matcher`** | Always define `config.matcher` — do not let middleware run on every request |
| **Keep it fast** | Middleware runs on every matched request (Edge). Avoid heavy computation |
| **JWT verification** | Use a lightweight JWT library (jose) — no Prisma/DB calls in middleware if possible |
| **Redirect carefully** | Use `NextResponse.redirect(new URL(...))` — not `redirect()` from `next/navigation` |
| **Headers & Cookies** | Set security headers and cookies in middleware |
| **Edge runtime** | Middleware runs on Edge by default — no Node.js APIs (fs, crypto) |

---

## 10. Error Boundaries

### App Router Error Handling (error.tsx)

Next.js automatically wraps route segments in Error Boundaries. Each `error.tsx` catches errors from its segment and all children.

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md text-center">
        An unexpected error occurred. Please try again, or contact support if the
        problem persists.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
```

### Global Error Boundary (app/global-error.tsx)

Use `global-error.tsx` for errors in the root layout itself (replaces the entire layout):

```tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <h1 className="text-4xl font-bold">Critical Error</h1>
          <p className="text-muted-foreground">
            A critical error occurred. Please refresh the page.
          </p>
          <Button onClick={() => reset()}>Refresh</Button>
        </div>
      </body>
    </html>
  );
}
```

### Custom Error Boundaries (for Client Components)

For fine-grained error boundaries inside client components:

```tsx
"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    // Send to error monitoring (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 gap-3 border rounded-lg bg-destructive/5">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <h3 className="font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Usage:

```tsx
"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { ProductChart } from "./product-chart";

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <ErrorBoundary fallback={<div>Chart failed to load</div>}>
        <ProductChart />
      </ErrorBoundary>
    </div>
  );
}
```

### Error Handling Hierarchy

```
global-error.tsx          ← Catches root layout errors (replaces everything)
  └── layout.tsx (root)
        └── error.tsx     ← Catches errors in this segment + children
              └── page.tsx
                    └── <ErrorBoundary>  ← Fine-grained client-side boundaries
                          └── Component
```

### notFound() and not-found.tsx

```tsx
// app/products/[id]/page.tsx
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);

  if (!product) {
    notFound(); // renders app/products/[id]/not-found.tsx or closest not-found.tsx
  }

  return <div>{/* render */}</div>;
}
```

```tsx
// app/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Page Not Found</h2>
      <p className="text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
```

---

## 11. Loading & Suspense Patterns

### Automatic loading.tsx

The simplest loading pattern — Next.js automatically wraps the page in Suspense:

```tsx
// app/products/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}
```

### Granular Suspense Boundaries

Place Suspense boundaries around individual sections for **streaming**:

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "./revenue-chart";
import { RecentSales } from "./recent-sales";
import { MetricsGrid } from "./metrics-grid";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsGrid />
      </Suspense>

      <div className="grid grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>

        <Suspense fallback={<SalesSkeleton />}>
          <RecentSales />
        </Suspense>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  );
}

function SalesSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

### Streaming with Server Components

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react";

// Each async component below streams in independently
async function MetricsGrid() {
  const metrics = await fetchMetrics(); // takes 2s
  return <div>{/* render */}</div>;
}

async function RevenueChart() {
  const data = await fetchRevenue(); // takes 3s
  return <div>{/* render */}</div>;
}

async function RecentSales() {
  const sales = await fetchSales(); // takes 1s
  return <div>{/* render */}</div>;
}

export default function DashboardPage() {
  return (
    <div>
      {/* Sales shows first (1s), then Metrics (2s), then Chart (3s) */}
      <Suspense fallback={<Skeleton />}>
        <MetricsGrid />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <RevenueChart />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <RecentSales />
      </Suspense>
    </div>
  );
}
```

### Loading States with TanStack Query (Client Side)

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetch(`/api/users/${userId}`).then((r) => r.json()),
  });

  // Initial load
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load profile</span>
        <button onClick={() => refetch()} className="underline text-sm">
          Retry
        </button>
      </div>
    );
  }

  // Background refetch indicator
  return (
    <div className="relative">
      {isFetching && (
        <div className="absolute top-0 right-0">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        </div>
      )}
      <div>{/* render user profile */}</div>
    </div>
  );
}
```

### Optimistic UI with Loading Indicators

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function FollowButton({ userId, isFollowing }: { userId: string; isFollowing: boolean }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/api/users/${userId}/follow`, { method: isFollowing ? "DELETE" : "POST" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user", userId] });
      const previous = queryClient.getQueryData(["user", userId]);
      // Optimistically toggle follow state
      queryClient.setQueryData(["user", userId], (old: any) => ({
        ...old,
        isFollowedByMe: !isFollowing,
        followersCount: old.followersCount + (isFollowing ? -1 : 1),
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["user", userId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isFollowing ? "Unfollowing..." : "Following..."}
        </>
      ) : isFollowing ? (
        "Following"
      ) : (
        "Follow"
      )}
    </Button>
  );
}
```

### Progressive Loading Pattern

```tsx
// app/blog/page.tsx
import { Suspense } from "react";
import { BlogList } from "./blog-list";
import { FeaturedPost } from "./featured-post";
import { Sidebar } from "./sidebar";

export default function BlogPage() {
  return (
    <div className="grid grid-cols-[1fr_300px] gap-8">
      <div className="space-y-8">
        {/* Featured post loads first — critical content */}
        <Suspense fallback={<FeaturedSkeleton />}>
          <FeaturedPost />
        </Suspense>

        {/* Blog list loads next — secondary content */}
        <Suspense fallback={<ListSkeleton />}>
          <BlogList />
        </Suspense>
      </div>

      {/* Sidebar loads last — non-critical */}
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </div>
  );
}
```

### Loading Pattern Decision Tree

```
Is the data fetched on the server?
  ├── Yes → Use async Server Component + Suspense
  │         └── Individual sections? → Granular <Suspense> boundaries
  │         └── Whole page? → loading.tsx at route segment level
  └── No → Use TanStack Query on the client
            └── Initial load → `isLoading` → show skeleton
            └── Background refetch → `isFetching` → subtle indicator
            └── Mutation → `isPending` → disabled button + spinner
```

---

## Quick Reference: File-by-File Cheatsheet

| File | Purpose | Server/Client | Exports |
|------|---------|---------------|---------|
| `page.tsx` | Route UI | Server (default) | `default function`, `metadata/generateMetadata` |
| `layout.tsx` | Shared shell (persists nav) | Server only | `default function` with `children: ReactNode` |
| `loading.tsx` | Suspense fallback | Server | `default function` |
| `error.tsx` | Error boundary | **Client** (`"use client"`) | `default function` with `{ error, reset }` |
| `global-error.tsx` | Root error boundary | **Client** (`"use client"`) | `default function` with `{ error, reset }` (includes `<html>`) |
| `not-found.tsx` | 404 page | Server | `default function` |
| `route.ts` | API endpoint | Server | Named exports: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| `middleware.ts` | Edge request handling | Edge runtime | `default` or named `middleware` function |
| `template.tsx` | Re-mounting layout (like layout but re-renders) | Server | `default function` with `children: ReactNode` |
| `default.tsx` | Parallel route fallback | Server | `default function` |

---

## Quick Reference: Data Flow Decision

```
What kind of data/state?
├── Server data (from DB/external API)
│   ├── Page-level, public → async Server Component + fetch()
│   └── Interactive, client-needs-refetch → TanStack Query (useQuery/useMutation)
│
├── Client UI state
│   ├── Local to one component → useState
│   ├── Passed down a few levels → Props + lifting state
│   └── Global (sidebar, theme, modals) → Zustand
│
├── Form state
│   └── Complex forms with validation → React Hook Form + Zod
│
├── URL state
│   ├── Search params → useSearchParams() + useRouter().push()
│   └── Path params → page.tsx `params` prop
│
└── Cache
    ├── Server response cache → fetch() `next.revalidate` / `cache: "force-cache"`
    └── Client query cache → TanStack Query staleness/gcTime
```
