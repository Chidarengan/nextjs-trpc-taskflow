import 'server-only';

export interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: string;
}

export interface PaginatedTasks {
  items: Task[];
  nextCursor?: string;
  totalCount: number;
}

const SEED_ITEMS: Array<{ titulo: string; descricao?: string }> = [
  {
    titulo: 'Configure CI/CD pipeline for staging deployments',
    descricao: 'Set up GitHub Actions workflow to run type-checking, linting, and unit tests on every pull request.',
  },
  {
    titulo: 'Optimize PostgreSQL composite indexes on event logs',
    descricao: 'Analyze slow query execution plans and add covering indexes for time-range analytics queries.',
  },
  {
    titulo: 'Implement cursor-based pagination on activity feed',
    descricao: 'Replace offset pagination with deterministic cursor pagination to prevent skipped records during inserts.',
  },
  {
    titulo: 'Audit OAuth2 token refresh rotation policy',
    descricao: 'Ensure short-lived access tokens and single-use refresh tokens are properly invalidated on logout.',
  },
  {
    titulo: 'Build automated dbt data quality assertions',
    descricao: 'Add schema tests for non-null primary keys, referential integrity, and freshness thresholds.',
  },
  {
    titulo: 'Refactor webhook retry queue with exponential backoff',
    descricao: 'Introduce jittered retry intervals and dead-letter queue alerting after five consecutive failures.',
  },
  {
    titulo: 'Migrate legacy REST endpoints to end-to-end typed RPC',
    descricao: 'Consolidate validation schemas with Zod so client and server share a single contract.',
  },
  {
    titulo: 'Add OpenTelemetry distributed tracing spans',
    descricao: 'Instrument API route handlers and background workers to correlate latency bottlenecks.',
  },
  {
    titulo: 'Design daily warehouse ingestion health dashboard',
    descricao: 'Track row counts, schema drift warnings, and SLA completion times across core pipelines.',
  },
  {
    titulo: 'Standardize structured JSON logging format',
    descricao: 'Include correlation IDs, severity levels, and sanitized request metadata across services.',
  },
  {
    titulo: 'Implement rate limiting on public authentication routes',
    descricao: 'Protect login and password reset endpoints using sliding-window token buckets.',
  },
  {
    titulo: 'Review container image multi-stage build size',
    descricao: 'Trim production Docker image footprint by pruning dev dependencies and using distroless runtime.',
  },
  {
    titulo: 'Write integration tests for batch CSV export worker',
    descricao: 'Verify UTF-8 BOM encoding, streaming memory usage, and empty dataset edge cases.',
  },
  {
    titulo: 'Document incident response runbook for API latency spikes',
    descricao: 'Define triage steps, cache bypass flags, and rollback procedures for on-call engineers.',
  },
  {
    titulo: 'Upgrade Next.js App Router dynamic route handlers',
    descricao: 'Await asynchronous route params and searchParams according to Next.js 15 conventions.',
  },
  {
    titulo: 'Validate GDPR data retention cleanup job',
    descricao: 'Verify soft-deleted records older than 30 days are permanently purged on schedule.',
  },
  {
    titulo: 'Benchmark Redis caching layer for feature flags',
    descricao: 'Measure p99 read latency under concurrent load and configure fallback defaults.',
  },
  {
    titulo: 'Create onboarding guide for local development environment',
    descricao: 'Document Node.js version requirements, environment setup, and architecture overview.',
  },
  {
    titulo: 'Enforce strict TypeScript compiler flags across monorepo',
    descricao: 'Enable noUncheckedIndexedAccess and exactOptionalPropertyTypes in tsconfig.json.',
  },
  {
    titulo: 'Profile React component re-renders in task board view',
    descricao: 'Memoize expensive list selectors and isolate mutation loading states per item.',
  },
  {
    titulo: 'Automate nightly synthetic smoke checks',
    descricao: 'Run headless health probes against critical user journeys after scheduled maintenance.',
  },
  {
    titulo: 'Verify TLS certificate auto-renewal hooks',
    descricao: 'Confirm zero-downtime certificate reload across edge reverse proxies.',
  },
  {
    titulo: 'Clean up deprecated feature toggle branches',
    descricao: 'Remove dead code paths from completed A/B experiments in Q3.',
  },
  {
    titulo: 'Initialize project architecture and baseline domain models',
    descricao: 'Define core Task entity schema, in-memory repository, and initial seed dataset.',
  },
];

function buildInitialTasks(): Task[] {
  const baseTimestamp = Date.UTC(2026, 10, 19, 18, 0, 0);

  return SEED_ITEMS.map((item, index) => ({
    id: crypto.randomUUID(),
    titulo: item.titulo,
    descricao: item.descricao,
    dataCriacao: new Date(baseTimestamp - index * 30 * 60 * 1000).toISOString(),
  }));
}

const globalForTasks = globalThis as unknown as {
  __tasksStore?: Task[];
};

const tasksStore: Task[] = globalForTasks.__tasksStore ?? buildInitialTasks();

if (process.env.NODE_ENV !== 'production') {
  globalForTasks.__tasksStore = tasksStore;
}

function getSortedTasks(): Task[] {
  return [...tasksStore].sort(
    (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
  );
}

export function listTasks({
  limit = 8,
  cursor,
}: {
  limit?: number;
  cursor?: string;
}): PaginatedTasks {
  const sorted = getSortedTasks();

  let startIndex = 0;
  if (cursor) {
    const cursorIndex = sorted.findIndex((task) => task.id === cursor);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const items = sorted.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < sorted.length;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]?.id : undefined;

  return {
    items,
    nextCursor,
    totalCount: sorted.length,
  };
}

export function getTaskById(id: string): Task | undefined {
  return tasksStore.find((task) => task.id === id);
}

export function createTask(data: { titulo: string; descricao?: string }): Task {
  // Guarantee newly created tasks always sort strictly above existing items
  const latestTimestamp = tasksStore.reduce(
    (max, task) => Math.max(max, new Date(task.dataCriacao).getTime()),
    0
  );
  const nextTimestamp = Math.max(Date.now(), latestTimestamp + 1000);

  const newTask: Task = {
    id: crypto.randomUUID(),
    titulo: data.titulo.trim(),
    descricao: data.descricao?.trim() ? data.descricao.trim() : undefined,
    dataCriacao: new Date(nextTimestamp).toISOString(),
  };

  tasksStore.unshift(newTask);
  return newTask;
}

export function updateTask(
  id: string,
  data: { titulo: string; descricao?: string }
): Task | null {
  const index = tasksStore.findIndex((task) => task.id === id);
  const existing = index !== -1 ? tasksStore[index] : undefined;
  if (!existing) {
    return null;
  }

  const updated: Task = {
    ...existing,
    titulo: data.titulo.trim(),
    descricao: data.descricao?.trim() ? data.descricao.trim() : undefined,
  };

  tasksStore[index] = updated;
  return updated;
}

export function deleteTask(id: string): boolean {
  const index = tasksStore.findIndex((task) => task.id === id);
  if (index === -1) {
    return false;
  }

  tasksStore.splice(index, 1);
  return true;
}