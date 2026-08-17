export function sattoloCycle<T>(arr: T[]): T[] {
  const result = [...arr];
  let i = result.length;

  while (i > 1) {
    i--;
    const j = Math.floor(Math.random() * i);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
