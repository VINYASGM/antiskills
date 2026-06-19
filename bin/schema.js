const { z } = require('zod');

const beadIdRegex = /^bd-(?:\d{4}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

const beadSchema = z.object({
  id: z.string().regex(beadIdRegex),
  type: z.string().min(1),
  status: z.enum(['open', 'claimed', 'in_progress', 'resolved', 'failed']),
  title: z.string().min(1),
  description: z.string().default(''),
  author: z.string().min(1),
  timestamp: z.string().datetime(),
  tags: z.array(z.string()).default([]),
  dependencies: z.array(z.string().regex(beadIdRegex)).default([]),
  claimed_by: z.string().nullable().default(null),
  claimed_at: z.string().datetime().nullable().default(null),
  evidence: z.string().nullable().default(null)
}).strict();

module.exports = { beadSchema };
