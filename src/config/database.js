import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless'
import {drizzle} from 'drizzle-orm/neon-http';

const neonLocalFetchEndpoint = process.env.NEON_LOCAL_FETCH_ENDPOINT;

if (neonLocalFetchEndpoint) {
    neonConfig.fetchEndpoint = neonLocalFetchEndpoint;
    neonConfig.poolQueryViaFetch = true;
    neonConfig.useSecureWebSocket = false;
}

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql);

export {db,sql};