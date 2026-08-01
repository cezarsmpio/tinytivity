export function waitFor(
  executor: (resolve: () => void) => void,
  timeoutMs = 100,
): Promise<void> {
  const called = new Promise<void>(executor);

  return Promise.race([
    called,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("callback was not called")), timeoutMs);
    }),
  ]);
}
