export async function waitForTask(
  api: (path: string, opts?: RequestInit) => Promise<Response>,
  job: string,
  caseId: string,
): Promise<void> {
  const res = await api(
    `/api/test/wait-task?job=${encodeURIComponent(job)}&caseId=${encodeURIComponent(caseId)}`,
  );
  if (res.status !== 200) {
    throw new Error(`waitForTask failed: ${res.status}`);
  }
}
