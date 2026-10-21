export function g8Simulation(input: { available: boolean; reverted: boolean; unexpectedBalance: boolean; unexpectedAllowance: boolean; prerequisiteMissing: boolean; }) {
  if (!input.available) return { gate: 'G8_SIMULATION', status: 'UNKNOWN', reasons: ['SIM_UNAVAILABLE'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.reverted) return { gate: 'G8_SIMULATION', status: 'FAIL_HARD', reasons: ['SIM_REVERT'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.prerequisiteMissing) return { gate: 'G8_SIMULATION', status: 'FAIL_HARD', reasons: ['PREREQUISITE_MISSING'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.unexpectedBalance) return { gate: 'G8_SIMULATION', status: 'FAIL_HARD', reasons: ['SIM_UNEXPECTED_BALANCE_CHANGE'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  if (input.unexpectedAllowance) return { gate: 'G8_SIMULATION', status: 'FAIL_HARD', reasons: ['SIM_UNEXPECTED_ALLOWANCE_CHANGE'], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
  return { gate: 'G8_SIMULATION', status: 'PASS', reasons: [], enforcement: 'tx-enforced', details: {}, evidenceRefs: [] } as any;
}
