import { describe, it, expect } from 'vitest';
import { redactUrl, redactText } from '../src/redact';

describe('redact', () => {
  it('keeps host only', () => {
    expect(redactUrl('https://rpc.mainnet.chain.robinhood.com/v1/KEY123?foo=bar')).toBe('rpc.mainnet.chain.robinhood.com');
  });
  it('redacts embedded credentials', () => {
    expect(redactUrl('https://user:pass@example.com/secret')).toBe('example.com');
  });
  it('redacts text', () => {
    expect(redactText('url=https://a.com/x?key=1')).toBe('url=a.com');
  });
});
