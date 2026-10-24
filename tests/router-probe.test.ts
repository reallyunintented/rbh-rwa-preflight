import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { UNIVERSAL_ROUTER_ADDRESS, UNIVERSAL_ROUTER_CODEHASH } from '../src/decoders/universal-router-v4';
import { SWAP_ROUTER02_ADDRESS, SWAP_ROUTER02_CODEHASH } from '../src/decoders/swap-router02';

// Guard against hand-typed constants drifting from their named probe sources
// (AGENTS.md hard rule: never hand-type addresses; store the source next to it).
describe('router constants match their recorded probes', () => {
  it('Universal Router address+codehash match docs/probes/router-codehash-probe.json', () => {
    const probe = JSON.parse(readFileSync('docs/probes/router-codehash-probe.json', 'utf8'));
    expect(probe.address.toLowerCase()).toBe(UNIVERSAL_ROUTER_ADDRESS.toLowerCase());
    expect(probe.codehash.toLowerCase()).toBe(UNIVERSAL_ROUTER_CODEHASH.toLowerCase());
  });
  it('SwapRouter02 address+codehash match docs/probes/swap-router02-codehash.json', () => {
    const probe = JSON.parse(readFileSync('docs/probes/swap-router02-codehash.json', 'utf8'));
    expect(probe.address.toLowerCase()).toBe(SWAP_ROUTER02_ADDRESS.toLowerCase());
    expect(probe.codehash.toLowerCase()).toBe(SWAP_ROUTER02_CODEHASH.toLowerCase());
  });
});
