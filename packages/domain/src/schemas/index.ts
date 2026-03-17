import { z } from 'zod';
import { UserRole } from '../enums/index.js';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.nativeEnum(UserRole),
  locale: z.string().default('en'),
  timezone: z.string().default('UTC'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
