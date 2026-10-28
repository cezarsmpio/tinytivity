export function waitFor(
  executor: (resolve: () => void) => void,
  timeoutMs = 1_000,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("callback was not called"));
    }, timeoutMs);

    try {
      executor(() => {
        clearTimeout(timer);
        resolve();
      });
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}
