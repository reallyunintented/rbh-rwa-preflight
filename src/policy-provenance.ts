export function policyProvenance(source: string, operatorPolicyHash: string, overrides: string[] = []) {
  return { source, operatorPolicyHash, overrides };
}