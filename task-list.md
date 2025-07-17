# Task List

1. Scaffold an in-process job-queue module under `src/lib/queue.ts`.
   Provide FIFO + priority behavior using an in-memory array. Expose
   `enqueue()`, `registerWorker()` and `on(event, cb)` functions. Add a
   Jest unit test proving enqueue/consume order.
2. Add a persistent jobs table and startup recovery. Create a Drizzle
   migration for jobs with columns id, caseId, photoId, type, status,
   payload, attempts, error and timestamps. On server boot, reload jobs
   where status is `queued` or `running` and re-enqueue them.
3. Refactor analysis into per-photo jobs. Introduce an `analyzePhoto`
   job type. `analyzeCase` should enqueue each photo job plus a
   `summarizeCase` job that runs after all photos complete. Remove the
   old monolithic logic and keep existing tests passing.
4. Implement an explicit case and photo state machine. Add a status
   column to cases and case_photos with enum values pending → analysing
   → complete/failed/canceled. Guard API mutations with checks and add
   unit tests for transitions.
5. Emit progress events and an SSE endpoint. The queue should emit
   job:start/progress/done/fail events. Add `/api/cases/[id]/events` to
   stream SSE. Create a React hook to listen and update a progress bar.
   Provide a manual demo script.
6. Build a resilient OpenAI wrapper with Zod retry. `lib/openai.ts`
   exposes `call(model, prompt, schema)` and handles exponential
   back-off (max three attempts) and schema parse retries. Write unit
   tests simulating malformed JSON then success.
7. Add photo add/remove flow using the new queue. POST
   `/api/cases/[id]/photos` enqueues a job. DELETE `/photos/[photoId]`
   cancels any pending job and updates status. Show per-photo status in
   the UI.
8. Create an admin dashboard for queue and usage. `/admin/queue` lists
   active, pending and failed jobs with attempts and age. Add retry and
   cancel buttons plus a sidebar showing today's OpenAI cost (mock or
   env based).
9. Add rate limit and cost guardrails. Middleware checks the daily job
   count per user (env DAILY_JOB_LIMIT, default 20). Exceeding the limit
   returns 429 and shows a toast. Provide an `/admin/usage` JSON endpoint
   for auditing.
10. Expand the test suite. Integration test: create a case with three
    photos, assert queue length, simulate success/failure, verify SSE
    events and final DB statuses. Coverage must be at least 85% for the
    new queue code.
11. Update Docker entrypoint and graceful shutdown. Modify
    `Dockerfile/start.sh` to run the Next.js server and on SIGTERM flush
    the in-memory queue back to the DB, setting jobs to queued. Verify
    with a docker stop script.
12. Improve documentation and contributor guidelines. Update README.md,
    Architecture.md and AGENTS.md with a queue design diagram, job
    lifecycle table, env vars (DAILY_JOB_LIMIT, etc.) and coding
    standards. Include a "First PR checklist" for agents.
