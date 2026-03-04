import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
const DATABASE_URL =
  'postgresql://neondb_owner:npg_iGESuXq3N4YO@ep-lively-leaf-a1xou22r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
console.log(process.env.DATABASE_URL, 'process.env.DATABASE_URL');
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL!,
  },
});
