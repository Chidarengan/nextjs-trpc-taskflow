'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { PaginatedTasks } from '@/server/db/tasks';
import { trpc } from '@/trpc/client';

const PAGE_SIZE = 8;

interface TaskListProps {
  initialPage: PaginatedTasks;
  initialNotice?: string;
}

interface FeedbackBanner {
  type: 'success' | 'error';
  message: string;
}

function formatTimestamp(isoString: string): string {
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(isoString));

  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(isoString));

  return `${date} · ${time} UTC`;
}

function resolveInitialBanner(notice?: string): FeedbackBanner | null {
  if (notice === 'created') {
    return { type: 'success', message: 'Task created and added to the top of your list.' };
  }
  if (notice === 'updated') {
    return { type: 'success', message: 'Task changes saved.' };
  }
  return null;
}

export function TaskList({ initialPage, initialNotice }: TaskListProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [feedback, setFeedback] = useState<FeedbackBanner | null>(() =>
    resolveInitialBanner(initialNotice)
  );
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const resolved = resolveInitialBanner(initialNotice);
    if (resolved) {
      setFeedback(resolved);
    }
  }, [initialNotice]);

  // Keep React Query cache aligned whenever fresh SSR initialPage arrives
  useEffect(() => {
    utils.task.list.setInfiniteData({ limit: PAGE_SIZE }, (existing) => {
      if (!existing || existing.pages.length <= 1) {
        return {
          pages: [initialPage],
          pageParams: [null],
        };
      }
      return {
        ...existing,
        pages: [initialPage, ...existing.pages.slice(1)],
      };
    });
  }, [initialPage, utils.task.list]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
    refetch,
  } = trpc.task.list.useInfiniteQuery(
    { limit: PAGE_SIZE },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: {
        pages: [initialPage],
        pageParams: [null],
      },
    }
  );

  const deleteMutation = trpc.task.delete.useMutation({
    onMutate: ({ id }) => {
      setDeletingId(id);
      setFeedback(null);
    },
    onSuccess: async () => {
      setConfirmingId(null);
      setFeedback({ type: 'success', message: 'Task deleted.' });
      await utils.task.list.reset();
      router.refresh();
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to delete task. Please try again.',
      });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '160px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const tasks = data?.pages.flatMap((page) => page.items) ?? initialPage.items;
  const totalCount = data?.pages[0]?.totalCount ?? initialPage.totalCount;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Tasks</h1>
            {totalCount > 0 && (
              <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {tasks.length < totalCount ? `${tasks.length} of ${totalCount}` : totalCount}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Ordered by most recent activity
          </p>
        </div>

        <Link
          href="/tasks/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-indigo-700"
        >
          <span aria-hidden="true" className="text-base leading-none">+</span>
          <span>New Task</span>
        </Link>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-lg border-l-4 bg-white px-4 py-3.5 text-sm shadow-xs ring-1 ring-slate-900/5 ${
            feedback.type === 'success'
              ? 'border-l-emerald-500 text-slate-700'
              : 'border-l-rose-500 text-rose-700'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-4 text-xs font-medium text-slate-400 transition hover:text-slate-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border-l-4 border-l-rose-500 bg-white px-4 py-3.5 text-sm text-rose-700 shadow-xs ring-1 ring-slate-900/5"
        >
          <span>Failed to load tasks: {error.message}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="ml-4 rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-xs ring-1 ring-slate-900/5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">No tasks yet</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
            Your workspace is clear. Create your first task to start tracking engineering work.
          </p>
          <div className="mt-6">
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-indigo-700"
            >
              Create your first task
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => {
            const isDeleting = deletingId === task.id;
            const isConfirming = confirmingId === task.id;

            return (
              <li
                key={task.id}
                className={`rounded-xl bg-white p-6 shadow-xs ring-1 ring-slate-900/5 transition ${
                  isDeleting ? 'opacity-50' : 'hover:ring-slate-900/15'
                }`}
              >
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-semibold leading-snug text-slate-900 break-words">
                      {task.titulo}
                    </h2>

                    {task.descricao && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 break-words">
                        {task.descricao}
                      </p>
                    )}

                    <p className="mt-4 text-xs font-medium text-slate-400">
                      {formatTimestamp(task.dataCriacao)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      href={`/tasks/${task.id}/edit`}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      Edit
                    </Link>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => deleteMutation.mutate({ id: task.id })}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm delete'}
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setConfirmingId(null)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setConfirmingId(task.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {tasks.length > 0 && (
        <div ref={sentinelRef} className="pt-2 pb-6 text-center">
          {isFetchingNextPage ? (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span>Loading older tasks...</span>
            </div>
          ) : hasNextPage ? (
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-xs ring-1 ring-slate-900/10 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Load more
            </button>
          ) : (
            <p className="text-xs text-slate-400">
              End of list · {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}