'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Task } from '@/server/db/tasks';
import { trpc } from '@/trpc/client';

interface TaskFormProps {
  mode: 'create' | 'edit';
  initialTask?: Task;
}

export function TaskForm({ mode, initialTask }: TaskFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [titulo, setTitulo] = useState(initialTask?.titulo ?? '');
  const [descricao, setDescricao] = useState(initialTask?.descricao ?? '');
  const [clientError, setClientError] = useState<string | null>(null);

  const createMutation = trpc.task.create.useMutation({
    onSuccess: async () => {
      await utils.task.list.reset();
      router.push('/?notice=created');
      router.refresh();
    },
  });

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: async () => {
      await utils.task.list.reset();
      if (initialTask) {
        await utils.task.getById.invalidate({ id: initialTask.id });
      }
      router.push('/?notice=updated');
      router.refresh();
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const serverError = createMutation.error?.message ?? updateMutation.error?.message ?? null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);
    createMutation.reset();
    updateMutation.reset();

    const trimmedTitle = titulo.trim();
    if (!trimmedTitle) {
      setClientError('Task title is required and cannot consist only of whitespace.');
      return;
    }

    if (trimmedTitle.length > 120) {
      setClientError('Task title must be 120 characters or fewer.');
      return;
    }

    if (descricao.trim().length > 1000) {
      setClientError('Description must be 1,000 characters or fewer.');
      return;
    }

    if (mode === 'create') {
      createMutation.mutate({
        titulo: trimmedTitle,
        descricao,
      });
      return;
    }

    if (mode === 'edit' && initialTask) {
      updateMutation.mutate({
        id: initialTask.id,
        titulo: trimmedTitle,
        descricao,
      });
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Back to Tasks</span>
        </Link>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
          {mode === 'create' ? 'New Task' : 'Edit Task'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'create'
            ? 'Define a clear, actionable title and optional technical context.'
            : 'Refine the task title or update implementation details.'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-2xl border-t-2 border-t-indigo-600 bg-white p-7 shadow-xs ring-1 ring-slate-900/5 sm:p-8"
      >
        {(clientError || serverError) && (
          <div
            role="alert"
            className="rounded-lg border-l-4 border-l-rose-500 bg-rose-50/70 px-4 py-3 text-sm text-rose-800"
          >
            {clientError ?? serverError}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="titulo" className="block text-sm font-medium text-slate-800">
              Title <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs tabular-nums text-slate-400">
              {titulo.trim().length}/120
            </span>
          </div>
          <input
            id="titulo"
            name="titulo"
            type="text"
            value={titulo}
            disabled={isSubmitting}
            onChange={(e) => {
              setTitulo(e.target.value);
              if (clientError) setClientError(null);
            }}
            placeholder="e.g., Add cursor pagination to task feed"
            className="block w-full rounded-lg border-0 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 ring-1 ring-inset ring-slate-300 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="descricao" className="block text-sm font-medium text-slate-800">
              Description
            </label>
            <span className="text-xs tabular-nums text-slate-400">
              {descricao.length}/1000
            </span>
          </div>
          <textarea
            id="descricao"
            name="descricao"
            rows={4}
            value={descricao}
            disabled={isSubmitting}
            onChange={(e) => {
              setDescricao(e.target.value);
              if (clientError) setClientError(null);
            }}
            placeholder="Optional notes, acceptance criteria, or links..."
            className="block w-full rounded-lg border-0 bg-slate-50/70 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder-slate-400 ring-1 ring-inset ring-slate-300 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {isSubmitting
              ? mode === 'create'
                ? 'Creating...'
                : 'Saving...'
              : mode === 'create'
                ? 'Create Task'
                : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}