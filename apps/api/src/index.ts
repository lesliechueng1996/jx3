import { createApp } from './app';
import { auth } from './lib/auth';

const app = createApp({ auth }).listen(Number(process.env.API_PORT ?? 3001));

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
