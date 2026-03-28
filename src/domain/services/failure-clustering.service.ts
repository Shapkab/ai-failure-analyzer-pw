export function clusterFailures(failures: any[]) {
  const map = new Map<string, any[]>();

  for (const f of failures) {
    const key = f.normalizedError;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(f);
  }

  return Array.from(map.entries()).map(([signature, tests]) => ({
    signature,
    count: tests.length,
    tests
  }));
}
