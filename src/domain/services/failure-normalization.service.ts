export function normalizeError(message: string | undefined): string {
  if (!message) return 'unknown error';

  const oneLineMessage = message.split('\n').map(line => line.trim()).filter(Boolean)[0] || message;

  return oneLineMessage
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/0x[0-9a-f]+/gi, '[hex]')
    .replace(/\d+/g, '[num]')
    .slice(0, 240);
}
