import { TRPCError } from '@trpc/server';
import Link from 'next/link';
import { TaskForm } from '@/components/TaskForm';
import { getServerTrpc } from '@/server/trpc/server';

export const dynamic = 'force-dynamic';

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const caller = await getServerTrpc();

  try {
    const task = await caller.task.getById({ id });
    return <TaskForm mode="edit" initialTask={task} />;
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') {
      return (
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Task Not Found</h1>
          <p className="mt-2 text-sm text-slate-600">
            The requested task does not exist or may have already been deleted from memory.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Return to Task List
            </Link>
          </div>
        </div>
      );
    }

    throw error;
  }
}