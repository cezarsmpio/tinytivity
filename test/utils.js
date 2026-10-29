export function waitFor(executor, timeoutMs = 1_000) {
  return new Promise((resolve, reject) => {
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
