import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { TRPCReactProvider } from '@/trpc/client';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskFlow — Next.js 15 & tRPC Task Manager',
  description: 'End-to-end type-safe task management application built with Next.js 15, tRPC, and React Query.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <TRPCReactProvider>
          <header className="sticky top-0 z-10 bg-white/90 backdrop-blur ring-1 ring-slate-900/5">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold tracking-wider text-white shadow-xs transition group-hover:bg-indigo-700">
                  TF
                </span>
                <span className="text-sm font-semibold tracking-tight text-slate-900">
                  TaskFlow
                </span>
              </Link>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                Next.js 15 · tRPC
              </span>
            </div>
          </header>

          <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}