import { logger } from '@jx3/logger';
import { createApp } from './app';

const app = createApp().listen(Number(process.env.API_PORT ?? 3001));

logger.info(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
