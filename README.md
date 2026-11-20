# TaskFlow — Full-Stack Type-Safe Task Manager

A modern, end-to-end type-safe task management application built with **Next.js 15 (App Router)**, **tRPC v11**, **TanStack React Query**, **Zod**, and **Tailwind CSS**.

## Features

- **End-to-End Type Safety:** Shared Zod validation schemas and tRPC routers guarantee strict contract enforcement from server procedures to React client hooks without code generation.
- **Hybrid SSR + Client Cache Hydration:** Initial task list is rendered on the server for instant First Contentful Paint and seamlessly hydrated into React Query's infinite cache.
- **Deterministic Cursor-Based Pagination:** Infinite scroll powered by `IntersectionObserver` with a manual fallback button, preventing skipped or duplicated items when new tasks are inserted.
- **Full CRUD Lifecycle:**
  - Create tasks with title and optional description (instant cache invalidation and top-of-list placement).
  - Edit existing tasks via dedicated dynamic routes (`/tasks/[id]/edit`).
  - Two-step inline delete confirmation to prevent accidental removals.
- **Input Validation & Error Resilience:** Client-side and server-side Zod validation, graceful empty states, and actionable feedback banners.

## Tech Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript strict mode)
- **API Layer:** tRPC v11 (`@trpc/server`, `@trpc/client`, `@trpc/react-query`)
- **State & Caching:** TanStack React Query v5
- **Validation:** Zod
- **Styling:** Tailwind CSS v4

## Project Structure

    src/
    ├── app/
    │   ├── api/trpc/[trpc]/route.ts   # tRPC HTTP fetch adapter (GET & POST)
    │   ├── tasks/
    │   │   ├── [id]/edit/page.tsx      # Server-rendered task edit route
    │   │   └── new/page.tsx            # Task creation route
    │   ├── globals.css                 # Tailwind CSS entry point
    │   ├── layout.tsx                  # Root layout & tRPC/React Query provider
    │   └── page.tsx                    # SSR initial task feed
    ├── components/
    │   ├── TaskForm.tsx                # Shared create/edit form with validation
    │   └── TaskList.tsx                # Infinite-scroll feed & inline delete flow
    ├── server/
    │   ├── db/tasks.ts                 # In-memory repository & seed dataset
    │   └── trpc/
    │       ├── init.ts                 # tRPC initialization & context
    │       └── routers/task.ts         # Task CRUD & cursor pagination procedures
    └── trpc/
        └── client.tsx                  # Client-side tRPC & QueryClient setup

## Getting Started

### Prerequisites

- Node.js 18.18+ (or 20+ recommended)
- npm

### Installation & Development

    npm install
    npm run dev

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build Verification

    npm run build
    npm run start

## Architectural Notes

- **Persistence:** Uses an in-memory store (`globalThis`-backed in development to survive Hot Module Replacement) pre-populated with 24 engineering tasks so pagination and CRUD flows can be tested immediately with zero external database setup.
- **Timestamp Ordering:** Newly created tasks are assigned monotonically increasing UTC timestamps so they always appear deterministically at the top of the feed.