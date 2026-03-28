export function normalizeError(message: string): string {
  return message.replace(/\d+/g, '[num]').slice(0, 200);
}
