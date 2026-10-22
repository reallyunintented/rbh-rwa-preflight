import { describe, it, expect } from 'vitest';
import { MCP_TOOLS } from '../src/mcp';

describe('mcp', () => {
  it('lists tools', () => {
    expect(MCP_TOOLS).toContain('preflight_assess');
    expect(MCP_TOOLS.length).toBe(5);
  });
});
