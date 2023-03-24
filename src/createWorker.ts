export function createWorker(url: string) {
  return new Worker(url);
}