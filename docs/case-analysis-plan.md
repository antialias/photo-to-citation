# Case Analysis Refactoring Plan

This document proposes improvements to the current case image analysis pipeline.
The goal is to keep all existing features while making the system easier to debug
and inspect, with progressive feedback and better concurrency control.

## Current Pipeline Overview
- The `analyzeCase` function reads case images, runs them through `analyzeViolation`,
  optionally performs OCR, then updates the case record. Progress is stored in the
  case via `analysisProgress`.
- `analyzeCaseInBackground` spawns a worker thread for each case using
  `runJob` and tracks active workers.
- SSE events from `caseEvents` notify clients when case data changes.

## Pain Points
- Worker management is manual and difficult to monitor.
- Progress updates are tied to raw case mutations, which makes debugging tricky.
- Adding or removing photos can race with ongoing analysis jobs.
- Reanalyzing a single image requires canceling the entire case worker.

## Proposed Architecture
1. **Dedicated Job Queue**
   - Introduce a lightweight job queue where each analysis or OCR task is a job.
   - Jobs run in worker threads but are scheduled and logged centrally.
   - Queueing avoids multiple workers per case and makes job order explicit.

2. **State Machine per Case**
   - Track case state (pending, analyzing, complete, failed, canceled) with a
     deterministic state machine. Transitions happen only through the job queue.
   - Each image gets its own state so reanalysis or deletion affects only that
     item.

3. **Structured Progress Events**
   - Emit structured events such as `{caseId, photo, step, total, message}`.
   - SSE clients consume these events for coherent progressive feedback.
   - Logging the same events makes debugging and replaying issues easier.

4. **Atomic Photo Operations**
   - Adding or removing a photo enqueues an analysis job for just that image
     and updates the case state. Existing jobs continue without conflict.
   - Deleting an image aborts its queued job if it has not started yet.

5. **Reusable Analysis Steps**
   - Wrap `analyzeViolation` and `ocrPaperwork` into standalone steps that share
     a common interface. Steps can be composed for full case analysis or for a
     single photo.
   - This allows reanalysis of individual photos without restarting the entire
     workflow.

6. **Improved Logging and Inspection**
   - Persist job start/end times and outcomes in the database.
   - Provide an API to list active and recent jobs for inspection.

## State Machine Implementation

The queue introduced in `src/lib/analysisQueue.ts` manages jobs with explicit
states:

- **queued** – waiting for a worker
- **running** – actively processed in a worker thread
- **complete** – finished successfully
- **failed** – encountered an error
- **canceled** – aborted before completion

API routes expose job status via `/api/cases/[id]/jobs` and the SSE stream at
`/api/cases/[id]/jobs/stream`. Client hooks such as
`useCaseAnalysisActive` subscribe to these endpoints to display progress bars
and disable actions while jobs are running.

System status pages aggregate both running and queued jobs so administrators can
monitor activity.

## Benefits
- Users can create cases, add or remove photos, and reanalyze single images
  without blocking other work.
- Progressive events keep the UI informed of each step of processing.
- Centralized job management prevents race conditions and makes failures easier
  to debug.
- The system retains all existing functionality while being faster and more
  maintainable.

