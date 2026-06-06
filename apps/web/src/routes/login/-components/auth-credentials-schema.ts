import { z } from 'zod';

export const authCredentialsSchema = z.object({
  email: z.string().email('邮箱格式无效'),
  password: z.string().min(8, '密码至少需要 8 个字符'),
});

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;
