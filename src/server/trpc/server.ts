import 'server-only';

import { cache } from 'react';
import { createCaller, createTRPCContext } from './routers/task';

export const getServerTrpc = cache(async () => {
  const context = await createTRPCContext();
  return createCaller(context);
});