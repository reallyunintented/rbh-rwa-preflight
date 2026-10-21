import { z } from 'zod';

export const AddressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
export const HexSchema = z.string().regex(/^0x[0-9a-fA-F]*$/);

export const PolicySchema = z.object({
  maxSlippageBps: z.number().int(),
  maxOracleDeviationBps: z.number().int(),
  maxPoolFeeBps: z.number().int(),
  offSessionPolicy: z.enum(['defer', 'warn', 'allow_wider']),
  requireIssuerSignals: z.boolean(),
  maxIssuerSignalAgeSec: z.number().int(),
  corporateActionLookaheadSec: z.number().int(),
  corporateActionLookbackSec: z.number().int(),
  maxDeadlineSec: z.number().int(),
  allowedRecipients: z.union([z.array(AddressSchema), z.literal('self')]),
  maxAssessmentAgeSec: z.number().int(),
  pinBlockTag: z.enum(['latest', 'safe', 'finalized']),
});
