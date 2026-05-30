import { createAuth } from '@jx3/auth';
import { db } from '@jx3/db';

export const auth = createAuth(db);
