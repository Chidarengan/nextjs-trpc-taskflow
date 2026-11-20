import { TaskList } from '@/components/TaskList';
import { getServerTrpc } from '@/server/trpc/server';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ notice?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [caller, resolvedSearchParams] = await Promise.all([
    getServerTrpc(),
    searchParams,
  ]);

  const initialPage = await caller.task.list({ limit: 8 });

  return (
    <TaskList
      initialPage={initialPage}
      initialNotice={resolvedSearchParams.notice}
    />
  );
}