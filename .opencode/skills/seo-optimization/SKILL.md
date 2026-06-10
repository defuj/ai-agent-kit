---
name: seo-optimization
description: >-
  Complete SEO optimization skill for the SEO Specialist agent. Covers meta tags
  (useHead/useSeoMeta for Nuxt 4, generateMetadata for Next.js 15), Open Graph &
  Twitter Cards, JSON-LD structured data (Article, Product, FAQ, BreadcrumbList,
  Organization), sitemap.xml & robots.txt, Core Web Vitals optimization (LCP, FID,
  CLS), SSR/SSG for SEO, canonical URLs, hreflang tags, Google Search Console
  verification, and a full SEO audit checklist. Designed for the seo-specialist agent
  working with Nuxt 4 and Next.js 15 frontends.
license: MIT
metadata:
  author: opencode-agent-kit
  version: "1.0.0"
  target_agent: seo-specialist
  stack:
    - Nuxt 4
    - Next.js 15 (App Router)
    - JSON-LD (Schema.org)
    - SSR/SSG
    - Core Web Vitals
    - Google Search Console
    - Sitemap XML
    - robots.txt
---

# SEO Optimization

**Target Agent:** @seo (SEO Specialist)
**Stack:** Nuxt 4 · Next.js 15 App Router · JSON-LD Structured Data · SSR/SSG · Core Web Vitals · Google Search Console

Comprehensive reference for search engine optimization across Nuxt 4 and Next.js 15 projects. Covers every aspect of on-page SEO, structured data, technical optimization, and verification.

---

## Table of Contents

1. [Meta Tags — useHead / useSeoMeta (Nuxt 4)](#1-meta-tags--usehead--useseometa-nuxt-4)
2. [Meta Tags — generateMetadata (Next.js 15)](#2-meta-tags--generatemetadata-nextjs-15)
3. [Open Graph & Twitter Cards](#3-open-graph--twitter-cards)
4. [JSON-LD Structured Data](#4-json-ld-structured-data)
5. [Canonical URLs](#5-canonical-urls)
6. [Hreflang Tags](#6-hreflang-tags)
7. [Sitemap.xml](#7-sitemapxml)
8. [Robots.txt](#8-robotstxt)
9. [Core Web Vitals Optimization](#9-core-web-vitals-optimization)
10. [SSR/SSG for SEO](#10-ssrssg-for-seo)
11. [Google Search Console Verification](#11-google-search-console-verification)
12. [SEO Audit Checklist](#12-seo-audit-checklist)

---

## 1. Meta Tags — useHead / useSeoMeta (Nuxt 4)

### useSeoMeta (Recommended — reactive)

Simplified composable that sets common SEO meta tags with full reactivity:

```typescript
// Standard page setup
useSeoMeta({
  title: 'Page Title - Site Name',
  titleTemplate: '%s | Site Name',
  description: 'Compelling page description targeting primary keywords, 150–160 characters.',
  ogTitle: 'Page Title',
  ogDescription: 'Compelling description for social sharing (max ~300 chars).',
  ogImage: 'https://example.com/og-image.jpg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogUrl: 'https://example.com/page',
  ogType: 'website',
  ogSiteName: 'Site Name',
  ogLocale: 'id_ID',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Page Title',
  twitterDescription: 'Compelling description for Twitter.',
  twitterImage: 'https://example.com/twitter-image.jpg',
  twitterSite: '@sitehandle',
  robots: 'index, follow',
})
```

### useHead (Advanced — full control)

For setting link tags, script tags, and arbitrary `<head>` elements:

```typescript
useHead({
  title: 'Page Title - Site Name',
  titleTemplate: '%s | Site Name',
  link: [
    { rel: 'canonical', href: 'https://example.com/page' },
    { rel: 'alternate', hreflang: 'en', href: 'https://example.com/en/page' },
    { rel: 'alternate', hreflang: 'id', href: 'https://example.com/id/page' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://example.com/page' },
  ],
  meta: [
    { name: 'robots', content: 'index, follow' },
    { name: 'google-site-verification', content: 'VERIFICATION_CODE' },
    { name: 'msvalidate.01', content: 'BING_VERIFICATION_CODE' },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'theme-color', content: '#ffffff' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({ /* structured data */ }),
    },
  ],
})
```

### Nuxt Config Defaults

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      titleTemplate: '%s | Site Name',
    },
  },
})
```

### Composable for Reusable SEO

```typescript
// composables/useSeo.ts
export function usePageSeo(options: {
  title: string
  description: string
  ogImage?: string
  canonical?: string
  type?: string
  robots?: string
  jsonld?: Record<string, unknown>
}) {
  const config = useRuntimeConfig()
  const route = useRoute()
  const baseUrl = config.public.siteUrl || 'https://example.com'
  const defaultOgImage = `${baseUrl}/images/og-default.jpg`

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogImage: options.ogImage || defaultOgImage,
    ogUrl: options.canonical || `${baseUrl}${route.path}`,
    ogType: options.type || 'website',
    twitterCard: 'summary_large_image',
  })

  useHead({
    link: [
      { rel: 'canonical', href: options.canonical || `${baseUrl}${route.path}` },
    ],
    meta: [
      { name: 'robots', content: options.robots || 'index, follow' },
    ],
  })

  if (options.jsonld) {
    useHead({
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(options.jsonld),
        },
      ],
    })
  }
}
```

### Per-Page Usage

```typescript
// pages/blog/[slug].vue
const { data: article } = await useAsyncData('article', () =>
  fetchArticle(route.params.slug)
)

usePageSeo({
  title: `${article.value.title} - Blog`,
  description: article.value.excerpt,
  ogImage: article.value.ogImage,
  canonical: `${baseUrl}/blog/${article.value.slug}`,
  type: 'article',
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.value.title,
    description: article.value.excerpt,
    image: article.value.ogImage,
    author: { '@type': 'Person', name: article.value.author },
    datePublished: article.value.publishedAt,
    dateModified: article.value.updatedAt,
  },
})
```

---

## 2. Meta Tags — generateMetadata (Next.js 15)

### Static Metadata (Pages without dynamic data)

```typescript
// app/about/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - Site Name',
  description: 'Learn more about our company, mission, and team.',
  openGraph: {
    title: 'About Us - Site Name',
    description: 'Learn more about our company, mission, and team.',
    url: 'https://example.com/about',
    siteName: 'Site Name',
    images: [{ url: 'https://example.com/og-about.jpg', width: 1200, height: 630 }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us - Site Name',
    description: 'Learn more about our company, mission, and team.',
    images: ['https://example.com/twitter-about.jpg'],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://example.com/about',
    languages: {
      'en': 'https://example.com/en/about',
      'id': 'https://example.com/id/about',
    },
  },
}
```

### Dynamic Metadata (Data-driven pages)

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await fetchArticle(slug)

  return {
    title: `${article.title} - Blog`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://example.com/blog/${slug}`,
      images: [{ url: article.ogImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.ogImage],
    },
    alternates: {
      canonical: `https://example.com/blog/${slug}`,
    },
    robots: { index: true, follow: true },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const article = await fetchArticle(slug)
  return <ArticlePage article={article} />
}
```

### Metadata Root Layout

```typescript
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Site Name',
    default: 'Site Name — Tagline',
  },
  description: 'Default site description for search engines.',
  metadataBase: new URL('https://example.com'),
  openGraph: {
    siteName: 'Site Name',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@sitehandle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: {
    google: 'GOOGLE_VERIFICATION_CODE',
    yandex: 'YANDEX_VERIFICATION_CODE',
    yahoo: 'YAHOO_VERIFICATION_CODE',
  },
}
```

### JSON-LD via Script Tag in Next.js

```typescript
// app/blog/[slug]/page.tsx — continued
export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const article = await fetchArticle(slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.ogImage,
    author: { '@type': 'Person', name: article.author },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Company Name',
      logo: { '@type': 'ImageObject', url: 'https://example.com/logo.png' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticlePage article={article} />
    </>
  )
}
```

---

## 3. Open Graph & Twitter Cards

### Standard Open Graph Tags

| Property | Required | Description | Recommended Value |
|----------|----------|-------------|-------------------|
| `og:title` | Yes | Page title for social shares | 40–60 chars |
| `og:description` | Yes | Description for social shares | 150–200 chars |
| `og:image` | Yes | Social share image (1200×630px, <5MB) | JPG/PNG/WebP |
| `og:url` | Yes | Canonical URL | Full absolute URL |
| `og:type` | No | Content type | `website`, `article`, `product` |
| `og:site_name` | No | Site name | Brand name |
| `og:locale` | No | Language & region | `id_ID`, `en_US` |
| `og:image:width` | No | Image width in px | 1200 |
| `og:image:height` | No | Image height in px | 630 |
| `og:video` | No | Video URL for video content | Full URL |
| `og:audio` | No | Audio URL for podcast content | Full URL |
| `fb:app_id` | No | Facebook app ID for insights | Numeric ID |

### Standard Twitter Card Tags

| Property | Required | Description | Recommended Value |
|----------|----------|-------------|-------------------|
| `twitter:card` | Yes | Card type | `summary_large_image` or `summary` |
| `twitter:site` | Yes | Twitter handle | `@username` |
| `twitter:title` | Yes | Page title | 40–70 chars |
| `twitter:description` | Yes | Page description | 150–200 chars |
| `twitter:image` | Yes | Share image | 1200×675px (2:1 ratio) |
| `twitter:creator` | No | Content author handle | `@username` |
| `twitter:domain` | No | Site domain | `example.com` |
| `twitter:player` | No | Video player URL | Full URL |
| `twitter:app:name:iphone` | No | iOS app name | Name |

### Nuxt 4 Default OG Image Composable

```typescript
// composables/useOgImage.ts
export function usePageOgImage(options: {
  title: string
  description?: string
  path?: string
}) {
  const route = useRoute()
  const path = options.path || route.path

  // Use Nuxt OG Image module for dynamic generation
  defineOgImage({
    component: 'OgTemplate',
    props: {
      title: options.title,
      description: options.description || '',
    },
    url: `https://example.com${path}`,
  })
}
```

---

## 4. JSON-LD Structured Data

### General Rules

- Use `@context: "https://schema.org"`
- Validate all schemas via Google Rich Results Test
- Add schemas via `<script type="application/ld+json">` tag
- Never duplicate identical schemas on the same page
- Keep schemas concise — only include available properties

### Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "description": "Company description for search engines.",
  "foundingDate": "2020-01-01",
  "foundingLocation": "Jakarta, Indonesia",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jl. Contoh No. 123",
    "addressLocality": "Jakarta Selatan",
    "addressRegion": "DKI Jakarta",
    "postalCode": "12345",
    "addressCountry": "ID"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+62-21-12345678",
    "contactType": "customer service",
    "availableLanguage": ["Indonesian", "English"]
  },
  "sameAs": [
    "https://facebook.com/company",
    "https://twitter.com/company",
    "https://instagram.com/company",
    "https://linkedin.com/company/company",
    "https://youtube.com/@company"
  ]
}
```

**Placement:** Homepage and About page (via layout or global component).
**Nuxt:** In `app.vue` or layout using `useHead` with `script`.
**Next.js:** In root layout via `<script type="application/ld+json">`.

### Article Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "The Complete Guide to SEO in 2025",
  "description": "A comprehensive guide covering on-page SEO, technical SEO, and content strategy for 2025.",
  "image": "https://example.com/images/seo-guide-2025.jpg",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://example.com/authors/author-name",
    "sameAs": ["https://twitter.com/author"]
  },
  "datePublished": "2025-01-15T08:00:00+07:00",
  "dateModified": "2025-03-20T14:30:00+07:00",
  "publisher": {
    "@type": "Organization",
    "name": "Company Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/blog/seo-guide-2025"
  },
  "wordCount": 2500,
  "timeRequired": "PT15M",
  "articleSection": "SEO",
  "inLanguage": "id",
  "isAccessibleForFree": true
}
```

**Variants:**

| Schema Type | Use Case | Properties to Include |
|-------------|----------|----------------------|
| `Article` | General blog/news | headline, author, datePublished, publisher, image |
| `NewsArticle` | Time-sensitive news | Same as Article + dateline, printColumn |
| `BlogPosting` | Blog entries | Same as Article |
| `TechArticle` | Technical documentation | Same as Article + proficiencyLevel, dependencies |
| `ScholarlyArticle` | Academic/educational | Same as Article + 

### Product Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Premium Widget Pro",
  "image": [
    "https://example.com/images/widget-pro-1.jpg",
    "https://example.com/images/widget-pro-2.jpg"
  ],
  "description": "High-quality premium widget with advanced features for professional use.",
  "sku": "WGT-PRO-001",
  "mpn": "WGT-PRO-001",
  "brand": {
    "@type": "Brand",
    "name": "WidgetCo"
  },
  "manufacturer": {
    "@type": "Organization",
    "name": "Widget Manufacturing Inc."
  },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/widget-pro",
    "priceCurrency": "IDR",
    "price": "299000",
    "priceValidUntil": "2025-12-31",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Company Name"
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 30,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "ID"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 2,
          "unitCode": "DAY"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 2,
          "maxValue": 5,
          "unitCode": "DAY"
        }
      },
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": 25000,
        "currency": "IDR"
      }
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "342",
    "reviewCount": "298"
  },
  "review": [
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Customer Name"
      },
      "reviewBody": "Excellent product. Highly recommended!",
      "datePublished": "2025-02-10"
    }
  ],
  "category": "Widgets > Premium"
}
```

### FAQ Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SEO (Search Engine Optimization) is the practice of optimizing websites to rank higher in search engine results pages (SERPs)."
      }
    },
    {
      "@type": "Question",
      "name": "How long does SEO take to show results?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Typically 3–6 months for noticeable improvements, depending on competition, content quality, and technical factors."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need multiple FAQ schemas on one page?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Use one FAQPage schema with all questions as a single mainEntity array."
      }
    }
  ]
}
```

**Rules:**
- One FAQPage per page only
- Each Question must have exactly one AcceptedAnswer
- Answer text should be concise (under 500 chars recommended)
- Do not hide answers behind accordion toggles (Google may see that as hidden content)
- Minimum 2 questions, recommended 3–10

### BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://example.com/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "SEO Best Practices",
      "item": "https://example.com/blog/seo-best-practices"
    }
  ]
}
```

**Nuxt 4 Breadcrumb Composable:**

```typescript
// composables/useBreadcrumbJsonLd.ts
export function useBreadcrumbJsonLd(items: Array<{
  position: number
  name: string
  item: string
}>) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }

  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(schema),
      },
    ],
  })
}
```

### LocalBusiness Schema

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://example.com",
  "name": "Business Name",
  "image": "https://example.com/storefront.jpg",
  "url": "https://example.com",
  "telephone": "+62-21-12345678",
  "email": "info@example.com",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jl. Contoh No. 123",
    "addressLocality": "Jakarta Selatan",
    "addressRegion": "DKI Jakarta",
    "postalCode": "12345",
    "addressCountry": "ID"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -6.2088,
    "longitude": 106.8456
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "09:00",
      "closes": "14:00"
    }
  ],
  "sameAs": [
    "https://facebook.com/business",
    "https://instagram.com/business"
  ]
}
```

### Schema Placement Strategy

| Page Type | Required Schema | Optional Schema |
|-----------|----------------|-----------------|
| Homepage | Organization | LocalBusiness, WebSite (SearchAction) |
| About | Organization, BreadcrumbList | — |
| Blog Post | Article, BreadcrumbList | FAQ (if applicable), Person (author) |
| Product | Product, BreadcrumbList | FAQ (if Q&A exists) |
| FAQ | FAQPage, BreadcrumbList | — |
| Contact | Organization | LocalBusiness |
| Category/Listing | BreadcrumbList | ItemList, CollectionPage |
| Search Results | — | SearchResultsPage, WebSite (SearchAction) |

### WebSite with SearchAction Schema

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Site Name",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://example.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### VideoObject Schema

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Video Title",
  "description": "Video description with keywords.",
  "thumbnailUrl": "https://example.com/video-thumbnail.jpg",
  "uploadDate": "2025-01-15T08:00:00+07:00",
  "duration": "PT15M30S",
  "contentUrl": "https://example.com/videos/video.mp4",
  "embedUrl": "https://example.com/embed/video-id",
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": "https://schema.org/WatchAction",
    "userInteractionCount": 12345
  }
}
```

---

## 5. Canonical URLs

### Best Practices

- Every page MUST have a self-referencing canonical URL (except pagination)
- Use absolute URLs (including `https://` and domain)
- Trailing slash consistency: pick one and stick with it
- www vs non-www: pick one and stick with it via canonical + redirect
- Never use canonical for "preferred domain" redirects — use 301 redirects
- Pagination: use `rel=next` and `rel=prev` OR point to page 1 (Google's guidance shifted)

### Nuxt 4

```typescript
// In composable or per-page
const baseUrl = 'https://example.com'
const path = useRoute().path

useHead({
  link: [
    { rel: 'canonical', href: `${baseUrl}${path}` },
  ],
})
```

### Next.js 15

```typescript
// Per-page
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://example.com/blog/post-slug',
  },
}

// Or dynamic
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    alternates: {
      canonical: `https://example.com/blog/${slug}`,
    },
  }
}
```

### Canonical URL Rules Matrix

| Scenario | Canonical URL | Notes |
|----------|---------------|-------|
| Single page version | Self-referencing | `https://example.com/page` |
| www vs non-www | Active domain | Redirect old → new, canon to new |
| HTTP vs HTTPS | HTTPS | Force HTTPS redirect + HTTPS canon |
| Trailing slash | Consistent choice | Either all with or all without |
| URL params (sort, filter) | Clean URL | `?sort=asc&page=2` → clean URL or first page |
| Paginated content | Self-referencing OR page 1 | Per Google's evolving guidance |
| Print/PDF version | Original page | rel=canonical to HTML version |
| AMP pages | Original page | AMP → canonical to original |
| Syndicated content | Original source | Point to original publisher's URL |
| UTM parameters | Clean URL | Strip tracking params from canonical |

---

## 6. Hreflang Tags

### Rules

- Must be bidirectional: page A links to page B AND page B links to page A
- Include `x-default` fallback (the default language/region URL)
- Use ISO 639-1 language codes + ISO 3166-1 Alpha 2 region codes where needed
- Hreflang values: `en`, `id`, `en-US`, `id-ID`, `x-default`
- Implement via `<link>` tags in `<head>` OR HTTP headers OR sitemap
- Self-referencing hreflang is required (the current page must have its own hreflang entry)

### Example — Three-Language Setup

```html
<link rel="alternate" hreflang="en" href="https://example.com/en/page" />
<link rel="alternate" hreflang="id" href="https://example.com/id/page" />
<link rel="alternate" hreflang="ja" href="https://example.com/ja/page" />
<link rel="alternate" hreflang="x-default" href="https://example.com/en/page" />
```

### Nuxt 4 — useHead

```typescript
const langs = [
  { code: 'en', url: 'https://example.com/en' },
  { code: 'id', url: 'https://example.com/id' },
  { code: 'x-default', url: 'https://example.com/en' },
]

const route = useRoute()
const currentPath = route.path.replace(/^\/(en|id)\//, '/')

useHead({
  link: langs.map(lang => ({
    rel: 'alternate',
    hreflang: lang.code,
    href: `${lang.url}${currentPath}`,
  })),
  // Also set canonical
  link: [
    { rel: 'canonical', href: `https://example.com${route.path}` },
    ...langs.map(lang => ({
      rel: 'alternate',
      hreflang: lang.code,
      href: `${lang.url}${currentPath}`,
    })),
  ],
})
```

### Next.js 15 — generateMetadata

```typescript
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://example.com/en/page',
    languages: {
      'en': 'https://example.com/en/page',
      'id': 'https://example.com/id/page',
      'x-default': 'https://example.com/en/page',
    },
  },
}
```

### Sitemap-Based Hreflang

```xml
<url>
  <loc>https://example.com/en/page</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/en/page" />
  <xhtml:link rel="alternate" hreflang="id" href="https://example.com/id/page" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/en/page" />
</url>
```

---

## 7. Sitemap.xml

### Structure Guidelines

- Maximum 50,000 URLs per sitemap file
- Maximum 50MB uncompressed per sitemap file
- Use sitemap index for sites exceeding limits
- Compress with gzip (*.xml.gz) to reduce load on crawlers
- Include `lastmod` (last modification date in W3C datetime format)
- Set `changefreq` and `priority` thoughtfully — don't set everything to `daily`/`1.0`
- Submit sitemap URL in robots.txt AND Google Search Console AND Bing Webmaster Tools

### Change Frequency Reference

| Value | When to Use |
|-------|-------------|
| `always` | Live scores, stock tickers, real-time data (rarely appropriate) |
| `hourly` | News sites, frequently updated content |
| `daily` | Blog, articles, product pages with frequent changes |
| `weekly` | Static product pages, category pages, general content |
| `monthly` | About, contact, evergreen content |
| `yearly` | Legal pages, privacy policy, terms of service |
| `never` | Archived content that will never change (use sparingly) |

### Priority Reference

| Value | When to Use |
|-------|-------------|
| `1.0` | Homepage only |
| `0.8` | Key landing pages, major categories |
| `0.6` | Blog posts, product pages, standard content |
| `0.4` | Tag pages, archive pages |
| `0.2` | Utility pages, paginated pages |
| `0.0` | (Avoid — effectively tells search engines to ignore) |

### Nuxt 4 Sitemap Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap'],
  sitemap: {
    hostname: 'https://example.com',
    gzip: true,
    defaults: {
      changefreq: 'weekly',
      priority: 0.5,
      lastmod: new Date().toISOString(),
    },
    exclude: [
      '/admin/**',
      '/auth/**',
      '/api/**',
      '/_nuxt/**',
      '/404',
      '/500',
    ],
    // Dynamic URLs from API
    sources: [
      '/api/__sitemap__/articles',
    ],
  },
})
```

### Next.js 15 Sitemap

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://example.com'

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
  ]

  // Dynamic pages from API
  const articles = await fetch(`${baseUrl}/api/articles`).then(res => res.json())
  const articlePages = articles.map((article: any) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...articlePages]
}
```

### Sitemap Index (Next.js)

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com/sitemap-pages.xml',
      lastModified: new Date(),
    },
    {
      url: 'https://example.com/sitemap-articles.xml',
      lastModified: new Date(),
    },
    {
      url: 'https://example.com/sitemap-products.xml',
      lastModified: new Date(),
    },
  ]
}
```

### Sitemap Index (XML format)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-pages.xml</loc>
    <lastmod>2025-06-01T10:00:00+07:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-articles.xml</loc>
    <lastmod>2025-06-10T14:30:00+07:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-products.xml</loc>
    <lastmod>2025-06-08T09:15:00+07:00</lastmod>
  </sitemap>
</sitemapindex>
```

### Nuxt 4 Dynamic Sitemap Source

```typescript
// server/api/__sitemap__/articles.ts
export default defineSitemapEventHandler(async () => {
  const articles = await fetchArticles()
  return articles.map(article => ({
    loc: `/blog/${article.slug}`,
    lastmod: article.updatedAt,
    changefreq: 'weekly',
    priority: 0.6,
  }))
})
```

---

## 8. Robots.txt

### Best Practices

- Must be at the root: `https://example.com/robots.txt`
- Disallow admin, auth, API, internal, staging, and other non-public paths
- Allow all public content: `Allow: /`
- Point to sitemap(s): `Sitemap: https://example.com/sitemap.xml`
- Use `Disallow: /` only for non-production domains
- Respect crawl budget: don't over-block or under-block
- Use `Crawl-delay` for rate limiting (only supported by some crawlers)
- Use `noindex` meta tag as supplement, not replacement for robots.txt

### Standard robots.txt

```txt
User-agent: *
Allow: /

# Disallow admin, auth, and system paths
Disallow: /admin/
Disallow: /auth/
Disallow: /api/
Disallow: /_nuxt/
Disallow: /_next/static/chunks/
Disallow: /_next/static/development/
Disallow: /_next/static/webpack/
Disallow: /server/
Disallow: /temp/

# Disallow duplicate content patterns
Disallow: /*?sort=
Disallow: /*?page=
Disallow: /*?filter=
Disallow: /*/amp/

# Allow specific crawlable resources
Allow: /_next/static/css/
Allow: /_next/static/media/
Allow: /_nuxt/static/

# Crawl delay for polite crawlers
Crawl-delay: 5

# Sitemaps
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-articles.xml
Sitemap: https://example.com/sitemap-products.xml
```

### Nuxt 4 — Static robots.txt

```txt
// public/robots.txt
User-agent: *
Disallow: /admin/
Disallow: /auth/
Disallow: /api/
Disallow: /_nuxt/

Sitemap: https://example.com/sitemap.xml
```

### Nuxt 4 — Dynamic robots.txt with @nuxtjs/robots

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/robots'],
  robots: {
    // Production: allow indexing
    allowNonIndexablePaths: false,
    // For staging/preview
    // disallowAll: true,
  },
})
```

### Next.js 15 — Static robots.txt

```txt
// public/robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth/
Disallow: /api/

Sitemap: https://example.com/sitemap.xml
```

### Next.js 15 — Dynamic robots.ts

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://example.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-articles.xml`,
      `${baseUrl}/sitemap-products.xml`,
    ],
  }
}
```

### Crawler-Specific Rules

| User-Agent | Crawler | Typical Behavior |
|------------|---------|-----------------|
| `Googlebot` | Google Search | Indexes content, follows links |
| `Googlebot-Image` | Google Images | Indexes images |
| `Googlebot-News` | Google News | Indexes news articles |
| `Googlebot-Video` | Google Videos | Indexes videos |
| `Bingbot` | Bing Search | Indexes content |
| `Slurp` | Yahoo Search | Indexes content (outdated, Yahoo uses Bing) |
| `DuckDuckBot` | DuckDuckGo | Indexes content |
| `YandexBot` | Yandex Search | Indexes content |
| `Baiduspider` | Baidu Search | Indexes content |
| `GPTBot` | OpenAI | Scrapes for training data (often blocked) |
| `CCBot` | Common Crawl | Scrapes for dataset |
| `Applebot` | Apple | Indexes for Siri/Spotlight |

---

## 9. Core Web Vitals Optimization

### Overview

| Metric | Full Name | Measures | Good | Needs Work | Poor |
|--------|-----------|----------|------|------------|------|
| **LCP** | Largest Contentful Paint | Loading performance (perceived load speed) | ≤2.5s | 2.5s–4.0s | >4.0s |
| **INP** (replaced FID March 2024) | Interaction to Next Paint | Interactivity / responsiveness | ≤200ms | 200ms–500ms | >500ms |
| **CLS** | Cumulative Layout Shift | Visual stability / unexpected layout shifts | ≤0.1 | 0.1–0.25 | >0.25 |

### 9.1 LCP — Largest Contentful Paint (<2.5s)

#### Common LCP Elements

| Element Type | Typical Cause | Solution |
|--------------|---------------|----------|
| Hero image | Large unoptimized image | WebP/AVIF, responsive srcset, preload |
| Heading text | Web font loading | `font-display: swap`, preload fonts or fallback |
| Large image gallery | Multiple large images | Lazy load below-fold images, compress hero |
| Video poster | Large poster image | Optimize poster, preload |
| Background image | Heavy CSS background | Switch to `<img>` with preload |

#### LCP Optimization Checklist

- [ ] Preload LCP image with `fetchpriority="high"`
- [ ] Serve LCP image in WebP or AVIF format
- [ ] Use responsive images with `srcset` and `sizes`
- [ ] Optimize image dimensions (no larger than display size × 2 for retina)
- [ ] Compress images to <100KB for hero (or as small as visually acceptable)
- [ ] Inline critical CSS (above-the-fold styles)
- [ ] Defer non-critical CSS and JavaScript
- [ ] Preload critical fonts
- [ ] Use `font-display: swap` for web fonts
- [ ] Minimize CDN latency (use edge caching)
- [ ] Enable HTTP/2 or HTTP/3
- [ ] Server-side render above-the-fold content
- [ ] Remove render-blocking resources

#### Preload LCP Image — Nuxt 4

```typescript
useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: 'https://cdn.example.com/images/hero.webp',
      fetchpriority: 'high',
    },
  ],
})
```

#### Preload LCP Image — Next.js

```tsx
import Image from 'next/image'

// Image component with priority (Next.js auto-preloads)
<Image
  src="/hero.webp"
  alt="Hero"
  width={1200}
  height={630}
  priority
  fetchPriority="high"
/>

// Or preload in layout
export const metadata: Metadata = {
  other: {
    'link': '<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">',
  },
}
```

#### Critical CSS Strategy

**Nuxt 4** — Use `@nuxtjs/critical` or inline critical CSS manually:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/critical'],
  critical: {
    enabled: true,
    extract: true,
  },
})
```

**Next.js 15** — Use `critters` via Next.js config:

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: {
      cssProcessor: 'critters',
    },
  },
}

export default nextConfig
```

### 9.2 INP — Interaction to Next Paint (<200ms)

#### Common INP Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Long tasks (>50ms) | Heavy JS execution on main thread | Code splitting, web workers, idle callbacks |
| Slow event handlers | Complex DOM manipulation in handlers | Debounce/throttle, simplify handlers |
| Layout thrashing | Read/write DOM cycles causing forced reflow | Batch DOM reads before writes |
| Third-party script blocking | Analytics, chat, social widgets | Defer, lazy load, or self-host |
| Large DOM size | Complex component trees | Virtual scrolling, reduce components |

#### INP Optimization Checklist

- [ ] Break up long JavaScript tasks (<50ms each)
- [ ] Use `requestAnimationFrame` and `requestIdleCallback`
- [ ] Debounce scroll/resize event handlers
- [ ] Throttle input event handlers
- [ ] Move heavy computation to Web Workers
- [ ] Lazy load below-the-fold components
- [ ] Defer non-critical third-party scripts
- [ ] Self-host analytics scripts
- [ ] Minimize DOM depth and node count
- [ ] Use `content-visibility: auto` for off-screen content
- [ ] Preconnect to third-party origins
- [ ] Avoid `document.write` (blocking)

#### Web Worker Example

```typescript
// workers/search.worker.ts
self.onmessage = (e: MessageEvent) => {
  const { data, query } = e.data
  const results = heavySearch(data, query)
  self.postMessage(results)
}

// Page usage
const worker = new Worker(new URL('../workers/search.worker.ts', import.meta.url))
worker.postMessage({ data: articleList, query: 'seo' })
worker.onmessage = (e) => {
  results.value = e.data
}
```

### 9.3 CLS — Cumulative Layout Shift (<0.1)

#### Common CLS Causes

| Cause | Example | Solution |
|-------|---------|----------|
| Images without dimensions | `<img>` with no width/height | Set explicit `width` & `height` + `aspect-ratio` |
| Ad injects | Dynamic ad insertion | Reserve ad slot space, set min-height |
| Web font swap | FOIT (Flash of Invisible Text) → visible | `font-display: swap` |
| Dynamic content | Cookie banners, popups inserted above flow | Reserve space or position fixed |
| Third-party embeds | YouTube, Twitter, maps loading late | Set min-height container |
| Lazy-loaded images | Images load and push content down | Use `aspect-ratio` CSS property |

#### CLS Optimization Checklist

- [ ] Always set `width` and `height` attributes on `<img>` and `<video>`
- [ ] Use CSS `aspect-ratio` property for responsive media containers
- [ ] Set `font-display: swap` for all `@font-face` declarations
- [ ] Reserve space for ads and embeds (min-height containers)
- [ ] Avoid inserting content above existing visible content
- [ ] Use `position: fixed` or `position: absolute` for overlays (cookie banners, popups)
- [ ] Pre-specify dimensions for `object-fit: cover` images
- [ ] Transform animations: prefer `transform` and `opacity` over layout-triggering properties
- [ ] Use `size-adjust` for `@font-face` fallback to reduce layout shift

#### CSS aspect-ratio for Images

```css
/* Modern approach */
img, video {
  max-width: 100%;
  height: auto;
  aspect-ratio: attr(width) / attr(height);
}

/* Or explicit */
.hero-image {
  aspect-ratio: 16 / 9;
}

/* Nuxt/Next component approach */
.image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1200 / 630;
}
```

#### Nuxt 4 <img> with aspect-ratio

```vue
<template>
  <img
    :src="image.src"
    :width="image.width"
    :height="image.height"
    :alt="image.alt"
    loading="lazy"
    decoding="async"
    style="max-width: 100%; height: auto; aspect-ratio: auto;"
    :style="{ aspectRatio: `${image.width} / ${image.height}` }"
  />
</template>
```

#### Next.js Image Component (Built-in CLS Prevention)

```tsx
import Image from 'next/image'

// Next.js Image automatically sets width/height + prevents CLS
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
  priority
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

### Nuxt 4 Specific CWV Optimizations

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // SSR for indexable content
  ssr: true,

  // Reduce JS bundle
  nitro: {
    minify: true,
    compressPublicAssets: true,
  },

  // Route-based code splitting (default)

  // Critical CSS
  experimental: {
    inlineSSRStyles: true,
  },

  // Image optimization
  image: {
    format: ['webp', 'avif'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  // Preload links
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://cdn.example.com', crossorigin: '' },
      ],
    },
  },
})
```

### Next.js 15 Specific CWV Optimizations

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeCss: true,
    webpackBuildWorker: true,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },

  // Compression
  compress: true,

  // Enable React Server Components (default)
  // Partial Prerendering (experimental)
  experimental: {
    ppr: true,
  },
}

export default nextConfig
```

### Monitoring CWV

| Tool | Purpose | URL |
|------|---------|-----|
| Google PageSpeed Insights | Lab + field data for any URL | `https://pagespeed.web.dev/` |
| Lighthouse (Chrome DevTools) | Lab data, actionable recommendations | Chrome DevTools → Lighthouse |
| Chrome User Experience Report (CrUX) | Real-user field data (anonymous) | BigQuery / CrUX API |
| Search Console — Core Web Vitals | Field data aggregated by URL group | Google Search Console |
| web-vitals JavaScript library | Real-user monitoring (RUM) | `npm install web-vitals` |
| Sentry / Datadog / New Relic | Integrated RUM with error tracking | Respective dashboards |

### RUM with web-vitals Library

```typescript
// Nuxt 4 plugin
// plugins/web-vitals.client.ts
export default defineNuxtPlugin(() => {
  import('web-vitals').then(({ onLCP, onINP, onCLS }) => {
    const sendToAnalytics = (metric: any) => {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
      // Send to analytics endpoint
      navigator.sendBeacon('/api/vitals', body)
    }

    onLCP(sendToAnalytics)
    onINP(sendToAnalytics)
    onCLS(sendToAnalytics)
  })
})
```

---

## 10. SSR/SSG for SEO

### Rendering Strategy Overview

| Strategy | SEO | Performance | Use Case |
|----------|-----|-------------|----------|
| **SSR** (Server-Side Rendering) | ✅ Excellent — full HTML to crawlers | Higher TTFB, lower FCP/LCP | Indexed content, dynamic pages |
| **SSG** (Static Site Generation) | ✅ Excellent — pre-rendered HTML | Fastest possible | Blog, docs, landing pages |
| **ISR** (Incremental Static Regeneration) | ✅ Excellent — like SSG with updates | Near SSG speed | Large sites with periodic updates |
| **SPA** (Client-Side Rendering) | ❌ Poor — crawlers may not execute JS | Fast after JS loads | Apps behind login |
| **RSC** (React Server Components) | ✅ Good — hybrid approach | Depends on composition | Modern Next.js apps |

### When to Use Each Strategy

| Content Type | Recommended Strategy | Rationale |
|--------------|---------------------|-----------|
| Blog posts | SSG (Nuxt generate / Next.js static export) | Content changes infrequently, fastest delivery |
| Product pages | ISR (revalidate every hour/day) | Dynamic pricing/stock, but needs indexing |
| Category/Listing | SSR or ISR | Changes often, but must be indexable |
| Homepage | SSG or ISR (revalidate 5–15 min) | Key page, needs fast delivery + freshness |
| Admin/Dashboard | SPA-only (noindex) | Behind auth, no SEO needed |
| Landing pages | SSG | Static, campaign-specific |
| News articles | SSR (with CDN caching) | Needs immediate indexing + frequent updates |
| User profiles | SSR (with CDN) | Dynamic but needs indexing (if public) |
| Search results | SSR (noindex) | Need for user, but avoid duplicate content |

### Nuxt 4 — Hybrid Rendering

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Default: SSR for all routes
  ssr: true,

  // Or hybrid: per-route configuration
  routeRules: {
    // Homepage — static generation
    '/': { prerender: true },
    // Blog posts — static generation
    '/blog/**': { prerender: true },
    // Product pages — ISR, revalidate hourly
    '/products/**': { swr: 3600 },
    // Admin — client-side only
    '/admin/**': { ssr: false },
    // Dynamic pages — SSR with CDN caching
    '/news/**': { swr: 300 },
  },
})
```

### Next.js 15 — Dynamic/Static Configuration

```typescript
// Static page
// app/about/page.tsx
export const dynamic = 'force-static'

// Revalidating page (ISR)
// app/products/[id]/page.tsx
export const revalidate = 3600 // seconds

// Dynamic page
// app/blog/[slug]/page.tsx
export const dynamic = 'force-dynamic'

// Static export configuration
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export', // Static HTML export
}
```

### SSR Best Practices for SEO

- [ ] Ensure crawlers receive fully rendered HTML (test with Google's URL Inspection Tool)
- [ ] Do NOT lazy-load critical above-the-fold content (headings, meta, main content)
- [ ] Use streaming SSR for faster TTFB (response head sent early)
- [ ] Configure CDN caching for SSR responses (Cache-Control: public, s-maxage=...)
- [ ] Avoid rendering JavaScript-only content that crawlers can't see
- [ ] Use `robots` meta tag to prevent indexing of non-public/non-SSR pages
- [ ] Implement proper 301 redirects on the server side (not client-side JavaScript redirects)
- [ ] Ensure status codes are correct (200 for content, 404 for missing, 301 for moved)

### Testing SSR Output

```bash
# Check if HTML content is rendered server-side (look for actual page content)
curl -H "User-Agent: Googlebot" https://example.com/page | head -100

# Or use the browser: View page source (Cmd+U on Mac) to see raw HTML from server
# Content should include title, meta tags, heading text, main body text
```

---

## 11. Google Search Console Verification

### Verification Methods

| Method | Difficulty | Persistence | Notes |
|--------|-----------|-------------|-------|
| DNS TXT record | Easy | Permanent (until removed) | Preferred — survives redeploy |
| HTML file upload | Easy | Survives until file removed | Works for static hosting |
| HTML <meta> tag | Easy | Survives in head | Must be in layout/head |
| Google Analytics | Easy | Via GA property | Requires GA tracking code |
| Google Tag Manager | Easy | Via GTM container | Requires GTM snippet |
| Domain name provider | Easy | DNS-level | Recommended for domain property |

### Meta Tag Verification (Recommended for Apps)

**Nuxt 4:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { name: 'google-site-verification', content: process.env.GOOGLE_VERIFICATION_CODE },
      ],
    },
  },
})

// Or per-environment
runtimeConfig: {
  public: {
    googleVerificationCode: process.env.GOOGLE_VERIFICATION_CODE,
  },
}
```

**Next.js 15:**

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  verification: {
    google: 'GOOGLE_VERIFICATION_CODE',
    yandex: 'YANDEX_VERIFICATION_CODE',
    yahoo: 'YAHOO_VERIFICATION_CODE',
    bing: 'BING_VERIFICATION_CODE',
  },
}
```

### Recommended Reports to Monitor

| Report | What to Look For | Action Frequency |
|--------|------------------|------------------|
| Performance | Impressions, clicks, CTR, avg position | Weekly |
| URL Inspection | Indexing issues, canonical mismatches | Per new page / when fixing |
| Index Coverage | Pages indexed vs excluded, errors | Weekly |
| Sitemaps | Submitted vs indexed URLs | After sitemap updates |
| Core Web Vitals | LCP, INP, CLS field data | Monthly |
| Mobile Usability | Mobile-specific issues | Monthly |
| Manual Actions | Penalties from Google | Check after algorithm updates |
| Security Issues | Hacked content, malware | As notified |
| Links > Top Linked Pages | Authority flow, internal/external | Monthly |
| Removals | Temporarily remove pages | As needed |

### Search Console Integration — Owner Verification Flow

1. Add your site property in Google Search Console
2. Choose verification method (recommended: DNS TXT or meta tag)
3. Implement verification token in code
4. Click "Verify" in Search Console
5. Submit sitemap URL
6. Request indexing for key pages
7. Set preferred domain (www vs non-www)
8. Configure international targeting (if multilingual)

---

## 12. SEO Audit Checklist

### 12.1 Technical SEO Audit

#### Indexing & Crawlability

- [ ] Site is indexed by Google (site:example.com search shows results)
- [ ] No `noindex` on important pages (except intentionally excluded)
- [ ] robots.txt allows all necessary paths
- [ ] robots.txt is accessible at /robots.txt (returns 200)
- [ ] Sitemap.xml is accessible and valid (returns 200, XML format)
- [ ] Sitemap is submitted to Google Search Console and Bing Webmaster Tools
- [ ] Crawl errors are addressed (404, 500, soft 404)
- [ ] No orphan pages (all pages linked from at least one other page)
- [ ] Internal links use descriptive anchor text (no "click here")
- [ ] Pagination uses proper rel=next/prev or appropriate canonical

#### Meta Tags

- [ ] Every page has a unique `<title>` (under 60 chars, keyword near front)
- [ ] Every page has a unique `<meta name="description">` (150–160 chars)
- [ ] Canonical URL is set on every page (self-referencing for canonical version)
- [ ] `robots` meta tag is correct per page (index/follow or noindex/nofollow)
- [ ] Open Graph tags present on all shareable pages
- [ ] Twitter Card tags present on all shareable pages
- [ ] OG image is ≥1200×630px, valid, accessible
- [ ] No duplicate meta titles or descriptions across pages

#### Structured Data

- [ ] Organization schema on homepage
- [ ] BreadcrumbList schema on content pages
- [ ] Article/BlogPosting schema on blog content pages
- [ ] Product schema on product pages (with valid offer, price, availability)
- [ ] FAQ schema on FAQ pages (validated, one per page)
- [ ] All schemas pass Google Rich Results Test
- [ ] No invalid or missing required schema properties
- [ ] No duplicate same-type schemas on single page
- [ ] Schema @id references are consistent and resolvable

#### Core Web Vitals

- [ ] LCP ≤ 2.5 seconds (lab test with Lighthouse/throttled 4G)
- [ ] LCP ≤ 2.5 seconds (field data from CrUX)
- [ ] INP ≤ 200 milliseconds (field data)
- [ ] CLS ≤ 0.1 (lab and field)
- [ ] Images have explicit width/height or aspect-ratio set
- [ ] Critical CSS is inlined or loaded early
- [ ] Render-blocking resources minimized
- [ ] Web fonts use `font-display: swap`
- [ ] Third-party scripts are deferred or lazy-loaded
- [ ] Long tasks (<50ms) are broken up

#### URL Structure

- [ ] URLs are lowercase, hyphen-separated
- [ ] URLs are short, descriptive, include primary keyword
- [ ] Trailing slash usage is consistent (all with or all without)
- [ ] No dynamic parameters in canonical URLs
- [ ] No session IDs or tracking in URLs (use cookies instead)
- [ ] 301 redirects for all old/changed URLs
- [ ] WWW vs non-www resolved with 301 redirect
- [ ] HTTP → HTTPS redirect is in place (301, permanent)

#### Internationalization (hreflang)

- [ ] hreflang tags present on all multilingual pages
- [ ] hreflang is bidirectional (page A links to B and B links to A)
- [ ] `x-default` fallback is set
- [ ] hreflang tags in sitemap match head tags
- [ ] hreflang values use correct ISO codes

---

### 12.2 On-Page SEO Audit

#### Content Quality

- [ ] Each page has a single `<h1>` containing the primary keyword
- [ ] Heading hierarchy is logical (h1 → h2 → h3, no skipping)
- [ ] Content is original (no duplicate or thin content)
- [ ] Minimum 300 words on indexable content pages
- [ ] Primary keyword appears in title, h1, first paragraph
- [ ] Secondary keywords used naturally throughout content
- [ ] Internal links to related content (2–5 per page)
- [ ] External links to authoritative sources (where appropriate)
- [ ] Images have descriptive alt text
- [ ] No broken internal or external links
- [ ] Content is structured with short paragraphs (2–4 sentences)
- [ ] Lists, tables, and headings break up text

#### Images

- [ ] All images have descriptive `alt` attributes
- [ ] Images are compressed (WebP/AVIF preferred)
- [ ] Images have explicit dimensions (width + height or aspect-ratio)
- [ ] Lazy loading for below-the-fold images (`loading="lazy"`)
- [ ] LCP hero image uses `fetchpriority="high"`
- [ ] No oversized images (max 200KB per image ideally)
- [ ] Image filenames are descriptive (e.g., `seo-best-practices.jpg`)

---

### 12.3 Performance & Mobile Audit

- [ ] PageSpeed Insights score ≥ 90 on mobile and desktop
- [ ] Mobile-responsive design (test with Chrome DevTools mobile viewport)
- [ ] Touch elements are adequately spaced (≥48px tap targets)
- [ ] Content fits within viewport (no horizontal scrolling)
- [ ] Font size ≥ 16px on mobile to prevent zoom
- [ ] Viewport meta tag is set correctly
- [ ] First Contentful Paint (FCP) ≤ 1.8 seconds
- [ ] Time to Interactive (TTI) ≤ 3.8 seconds
- [ ] Total Blocking Time (TBT) ≤ 200ms
- [ ] Speed Index ≤ 3.4 seconds

---

### 12.4 Security Audit

- [ ] HTTPS enabled with valid SSL certificate
- [ ] No mixed content (HTTP resources on HTTPS pages)
- [ ] `X-Robots-Tag` headers correct for non-HTML files (PDFs, images)
- [ ] `X-Frame-Options` set (to prevent clickjacking)
- [ ] No security warnings in Search Console

---

### 12.5 Tools for SEO Audit

| Tool | Purpose | URL |
|------|---------|-----|
| Google Search Console | Indexing, performance, CWV, manual actions | https://search.google.com/search-console |
| Google PageSpeed Insights | CWV lab + field data | https://pagespeed.web.dev/ |
| Google Rich Results Test | Validate structured data | https://search.google.com/test/rich-results |
| Google URL Inspection Tool | Check individual URL indexing | https://search.google.com/search-console/inspect |
| Lighthouse (Chrome) | Full audit (performance, SEO, a11y) | Chrome DevTools → Lighthouse |
| Ahrefs Webmaster Tools | Backlinks, organic keywords, site audit | https://ahrefs.com/webmaster-tools |
| Screaming Frog SEO Spider | Crawl entire site for technical issues | https://www.screamingfrog.co.uk/seo-spider/ |
| W3C Validator | Validate HTML markup | https://validator.w3.org/ |
| Schema.org Validator | Validate structured data schemas | https://validator.schema.org/ |
| Bing Webmaster Tools | Bing/Yahoo indexing, sitemap submission | https://www.bing.com/webmasters/ |
| GTmetrix | Performance analysis with detailed waterfall | https://gtmetrix.com/ |
| WebPageTest | Advanced performance testing (multi-location) | https://www.webpagetest.org/ |
| SEO Site Checkup | Automated SEO audit | https://seositecheckup.com/ |
| SE Ranking | Competitive analysis, keyword tracking | https://seranking.com/ |

---

### 12.6 Audit Frequency Recommendation

| Audit Type | Frequency | Depth |
|------------|-----------|-------|
| Technical SEO | Monthly | Deep crawl, index coverage, sitemap |
| Core Web Vitals | Weekly (if actively optimizing) / Monthly | Field data + lab tests |
| On-Page SEO | Per new page / Quarterly | Content, meta tags, headings |
| Structured Data | Per new template / Quarterly | Validate all schemas |
| Backlink Profile | Monthly | Ahrefs/Google Search Console |
| Competitor Analysis | Quarterly | Keyword gaps, content strategy |
| Mobile Usability | Monthly | Mobile-specific issues |
| Security | Monthly | SSL, mixed content, headers |
| Full SEO Audit | Quarterly (for active sites) / Bi-annually | Complete checklist above |

---

## Appendix: Quick Reference Card

### Nuxt 4 SEO Quick Commands

```bash
# Install SEO modules
npm install @nuxtjs/sitemap @nuxtjs/robots @nuxt/image

# nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap', '@nuxtjs/robots', '@nuxt/image'],
  sitemap: { hostname: 'https://example.com' },
  robots: { allowNonIndexablePaths: false },
  image: { format: ['webp', 'avif'] },
})
```

### Next.js 15 SEO Quick Commands

```bash
# No extra installs needed (built-in)
# next.config.ts — basic SEO config
const nextConfig: NextConfig = {
  images: { formats: ['image/avif', 'image/webp'] },
  compress: true,
}
```

### Required Checks Before Launch

1. robots.txt and sitemap.xml accessible
2. Google Search Console verified
3. Canonical URLs on every page
4. No duplicate meta titles
5. PageSpeed Insights ≥ 90
6. Structured data validates in Rich Results Test
7. HTTPS enforced (301 redirect)
8. All 404s resolve to custom 404 page (not 200)
9. Hreflang tags correct (if multilingual)
10. Open Graph preview works (https://opengraph.dev/)
