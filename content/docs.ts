export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'code'; lang: string; title?: string; code: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'callout'; tone: 'note' | 'warning' | 'tip'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] };

export type Doc = {
  slug: string[];
  section: 'Guides' | 'Reference';
  title: string;
  description: string;
  updated: string;
  body: Block[];
};

export const docs: Doc[] = [
  {
    slug: ['guides', 'quickstart'],
    section: 'Guides',
    title: 'Quickstart',
    description: 'Install Relay, enqueue your first job, and run a worker in under five minutes.',
    updated: 'Oct 9, 2026',
    body: [
      { type: 'p', text: 'Relay is a small, typed background-job library for Node.js backed by Postgres. You define jobs as plain functions, enqueue them from anywhere in your app, and run one or more workers to process them.' },
      { type: 'h2', text: 'Prerequisites' },
      { type: 'list', items: ['Node.js 20 or later', 'A Postgres 14+ database you can connect to', 'A `DATABASE_URL` environment variable'] },
      { type: 'h2', text: 'Install the package' },
      { type: 'code', lang: 'bash', code: 'npm install @relay/core' },
      { type: 'h2', text: 'Create the schema' },
      { type: 'p', text: 'Relay stores jobs in a single table. Run the migration once per database:' },
      { type: 'code', lang: 'bash', code: 'npx relay migrate' },
      { type: 'h2', text: 'Define and enqueue a job' },
      { type: 'code', lang: 'ts', title: 'src/jobs.ts', code: `import { createRelay } from '@relay/core';

export const relay = createRelay({ url: process.env.DATABASE_URL! });

export const sendWelcome = relay.job('send-welcome', async (input: { userId: string }) => {
  const user = await db.users.find(input.userId);
  await mailer.send(user.email, 'Welcome aboard!');
});` },
      { type: 'code', lang: 'ts', title: 'src/signup.ts', code: `import { sendWelcome } from './jobs';

await sendWelcome.enqueue({ userId: user.id });` },
      { type: 'h2', text: 'Start a worker' },
      { type: 'code', lang: 'bash', code: 'npx relay work --jobs ./src/jobs.ts' },
      { type: 'callout', tone: 'tip', text: 'Workers are stateless. Run as many as you like — Relay uses `SKIP LOCKED` so each job is claimed exactly once.' },
      { type: 'h2', text: 'Next steps' },
      { type: 'list', items: ['Learn how to shape inputs in Defining jobs', 'Make failures safe with Retries & backoff', 'Ship to production with Deploying workers'] },
    ],
  },
  {
    slug: ['guides', 'defining-jobs'],
    section: 'Guides',
    title: 'Defining jobs',
    description: 'Name jobs, type their inputs, and control concurrency and priority.',
    updated: 'Oct 4, 2026',
    body: [
      { type: 'p', text: 'A job is a name plus an async handler. The name is stored in the database, so treat it like a public API: rename carefully.' },
      { type: 'h2', text: 'Typed inputs' },
      { type: 'p', text: 'The handler’s first parameter becomes the input type of `enqueue`. Inputs are serialised as JSON, so stick to plain data — no class instances, `Date` objects become strings.' },
      { type: 'code', lang: 'ts', code: `const resizeImage = relay.job(
  'resize-image',
  async ({ key, width }: { key: string; width: number }, ctx) => {
    ctx.log.info('resizing', { key, width });
    await images.resize(key, width);
  },
);` },
      { type: 'h2', text: 'Job options' },
      { type: 'table', head: ['Option', 'Type', 'Default', 'Description'], rows: [
        ['concurrency', 'number', '10', 'Max copies of this job running per worker.'],
        ['priority', 'number', '0', 'Higher numbers are claimed first.'],
        ['timeout', 'string', '"5m"', 'Handler is aborted after this duration.'],
        ['retries', 'RetryPolicy', 'see Retries', 'How failed runs are retried.'],
      ] },
      { type: 'code', lang: 'ts', code: `relay.job('nightly-report', handler, { concurrency: 1, priority: -5, timeout: '30m' });` },
      { type: 'h2', text: 'Scheduling for later' },
      { type: 'p', text: 'Pass `runAt` or `delay` to defer a job:' },
      { type: 'code', lang: 'ts', code: `await sendReminder.enqueue({ userId }, { delay: '24h' });` },
      { type: 'h3', text: 'Deduplication' },
      { type: 'p', text: 'Provide a `key` to make enqueues idempotent. A second enqueue with the same key is ignored while the first is still pending.' },
      { type: 'code', lang: 'ts', code: `await syncAccount.enqueue({ accountId }, { key: \`sync:\${accountId}\` });` },
    ],
  },
  {
    slug: ['guides', 'retries'],
    section: 'Guides',
    title: 'Retries & backoff',
    description: 'Configure how failed jobs are retried and what happens when they run out of attempts.',
    updated: 'Sep 28, 2026',
    body: [
      { type: 'p', text: 'When a handler throws, Relay records the error and schedules another attempt according to the job’s retry policy.' },
      { type: 'h2', text: 'Default policy' },
      { type: 'p', text: 'Every job retries up to 5 times with exponential backoff starting at 10 seconds and capped at 1 hour, with full jitter.' },
      { type: 'h2', text: 'Custom policy' },
      { type: 'code', lang: 'ts', code: `relay.job('charge-card', handler, {
  retries: { max: 8, backoff: 'exponential', base: '30s', cap: '6h' },
});` },
      { type: 'h2', text: 'Failing permanently' },
      { type: 'p', text: 'Throw a `PermanentError` for failures that will never succeed (bad input, deleted record). The job moves straight to `failed` without further attempts.' },
      { type: 'code', lang: 'ts', code: `import { PermanentError } from '@relay/core';

if (!user) throw new PermanentError(\`user \${userId} not found\`);` },
      { type: 'callout', tone: 'warning', text: 'Handlers may run more than once — after a crash, a timeout, or a retry. Make side effects idempotent.' },
      { type: 'h2', text: 'Dead jobs' },
      { type: 'p', text: 'Jobs that exhaust their retries stay in the table with status `failed`. Inspect and requeue them with the CLI:' },
      { type: 'code', lang: 'bash', code: `npx relay jobs list --status failed
npx relay jobs retry 01JA9Z3K8Q` },
    ],
  },
  {
    slug: ['guides', 'deploying'],
    section: 'Guides',
    title: 'Deploying workers',
    description: 'Run Relay workers reliably in containers, on Kubernetes, or alongside your web server.',
    updated: 'Sep 20, 2026',
    body: [
      { type: 'p', text: 'A worker is a long-running Node.js process. Anything that can keep a process alive and restart it on failure can host one.' },
      { type: 'h2', text: 'Docker' },
      { type: 'code', lang: 'dockerfile', title: 'Dockerfile', code: `FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["npx", "relay", "work", "--jobs", "./dist/jobs.js"]` },
      { type: 'h2', text: 'Graceful shutdown' },
      { type: 'p', text: 'On `SIGTERM`, workers stop claiming new jobs and wait for running ones to finish, up to `--shutdown-timeout` (default 30s). Set your orchestrator’s grace period a little higher.' },
      { type: 'h2', text: 'Scaling' },
      { type: 'list', items: ['Scale horizontally by adding processes — no coordination needed.', 'Use `--queues` to dedicate workers to slow or high-priority jobs.', 'Watch the `relay_jobs_pending` metric and autoscale on it.'] },
      { type: 'callout', tone: 'note', text: 'Each worker holds one Postgres connection for polling plus one per concurrent job. Size your pool accordingly.' },
    ],
  },
  {
    slug: ['reference', 'client'],
    section: 'Reference',
    title: 'Client API',
    description: 'Every function and type exported by @relay/core.',
    updated: 'Oct 9, 2026',
    body: [
      { type: 'h2', text: 'createRelay(options)' },
      { type: 'p', text: 'Creates a Relay client. Call once per process and share the instance.' },
      { type: 'code', lang: 'ts', code: `function createRelay(options: RelayOptions): Relay` },
      { type: 'table', head: ['Option', 'Type', 'Description'], rows: [
        ['url', 'string', 'Postgres connection string. Required.'],
        ['schema', 'string', 'Schema for the jobs table. Default `relay`.'],
        ['pool', 'pg.Pool', 'Bring your own pool instead of `url`.'],
        ['logger', 'Logger', 'Any object with `info`, `warn`, `error`.'],
      ] },
      { type: 'h2', text: 'relay.job(name, handler, options?)' },
      { type: 'p', text: 'Registers a job and returns a `JobDefinition`.' },
      { type: 'code', lang: 'ts', code: `relay.job<I>(
  name: string,
  handler: (input: I, ctx: JobContext) => Promise<void>,
  options?: JobOptions,
): JobDefinition<I>` },
      { type: 'h2', text: 'job.enqueue(input, options?)' },
      { type: 'p', text: 'Inserts a job row and returns its id. Accepts an optional transaction to enqueue atomically with your own writes.' },
      { type: 'table', head: ['Option', 'Type', 'Description'], rows: [
        ['delay', 'string', 'Duration before the job is runnable, e.g. `"10m"`.'],
        ['runAt', 'Date', 'Absolute time the job becomes runnable.'],
        ['key', 'string', 'Deduplication key.'],
        ['tx', 'pg.PoolClient', 'Enqueue inside an existing transaction.'],
      ] },
      { type: 'h2', text: 'JobContext' },
      { type: 'table', head: ['Property', 'Type', 'Description'], rows: [
        ['id', 'string', 'The job id.'],
        ['attempt', 'number', 'Current attempt, starting at 1.'],
        ['signal', 'AbortSignal', 'Aborted on timeout or shutdown.'],
        ['log', 'Logger', 'Logger scoped to this job run.'],
      ] },
    ],
  },
  {
    slug: ['reference', 'cli'],
    section: 'Reference',
    title: 'CLI',
    description: 'Commands and flags for the relay command-line tool.',
    updated: 'Oct 2, 2026',
    body: [
      { type: 'p', text: 'The CLI ships with `@relay/core` and reads `DATABASE_URL` unless `--url` is passed.' },
      { type: 'h2', text: 'relay migrate' },
      { type: 'p', text: 'Creates or upgrades the jobs table. Safe to run on every deploy.' },
      { type: 'h2', text: 'relay work' },
      { type: 'p', text: 'Starts a worker process.' },
      { type: 'table', head: ['Flag', 'Default', 'Description'], rows: [
        ['--jobs <path>', '—', 'Module that registers your jobs. Required.'],
        ['--queues <list>', 'all', 'Comma-separated job names to process.'],
        ['--poll <ms>', '1000', 'Polling interval when idle.'],
        ['--shutdown-timeout <s>', '30', 'Seconds to wait for running jobs on SIGTERM.'],
      ] },
      { type: 'h2', text: 'relay jobs' },
      { type: 'code', lang: 'bash', code: `relay jobs list   [--status pending|running|failed|done] [--name <job>]
relay jobs show   <id>
relay jobs retry  <id...>
relay jobs cancel <id...>` },
      { type: 'h2', text: 'Exit codes' },
      { type: 'table', head: ['Code', 'Meaning'], rows: [['0', 'Success'], ['1', 'Unexpected error'], ['2', 'Invalid arguments'], ['3', 'Could not connect to the database']] },
    ],
  },
];

export const getDoc = (slug: string[]) => docs.find((d) => d.slug.join('/') === slug.join('/'));
export const href = (d: Doc) => `/docs/${d.slug.join('/')}/`;
export const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
