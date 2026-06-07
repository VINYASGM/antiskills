const { z } = require('zod');

const beadSchema = z.object({
  id: z.string().regex(/^bd-\d{4}$/),
  type: z.string().min(1),
  status: z.enum(['open', 'claimed', 'in_progress', 'resolved', 'failed']),
  title: z.string().min(1),
  description: z.string().default(''),
  author: z.string().min(1),
  timestamp: z.string().datetime(),
  tags: z.array(z.string()).default([]),
  dependencies: z.array(z.string().regex(/^bd-\d{4}$/)).default([]),
  claimed_by: z.string().nullable().default(null),
  claimed_at: z.string().datetime().nullable().default(null),
  evidence: z.string().nullable().default(null)
}).strict();

module.exports = { beadSchema };
