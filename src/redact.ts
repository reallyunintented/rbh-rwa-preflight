export function redactUrl(input: string): string {
  try {
    const u = new URL(input);
    return u.host;
  } catch {
    // Fallback: strip anything after host-like token
    return input.replace(/:\/\/[^/\s?#]+[^/\s?#]*[^\s]*/g, (m) => {
      const hostMatch = m.match(/:\/\/([^/\s?#:]+)/);
      return hostMatch ? `://${hostMatch[1]}` : '://[redacted]';
    });
  }
}

export function redactText(input: string): string {
  return input.replace(/https?:\/\/[^\s"']+/g, (m) => redactUrl(m));
}
