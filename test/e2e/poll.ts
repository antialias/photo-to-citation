export async function poll<T>(
  fn: () => Promise<T>,
  done: (result: T) => boolean | Promise<boolean>,
  attempts = 20,
  delay = 500,
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    const res = await fn();
    if (await done(res)) return res;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return fn();
}
