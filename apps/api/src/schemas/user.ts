import { z } from 'zod';

export const meResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  createdAt: z.string(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export interface UserLike {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  createdAt: Date;
}

export const toMeResponse = (user: UserLike): MeResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  image: user.image ?? null,
  role: user.role ?? null,
  createdAt: user.createdAt.toISOString(),
});
