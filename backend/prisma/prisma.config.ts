@"
import "dotenv/config";
import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL
  }
});
"@ | Out-File -FilePath prisma.config.ts -Encoding UTF8