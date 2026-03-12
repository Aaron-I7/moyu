import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionPath = path.resolve(__dirname, '../public/version.json');

const versionInfo = {
  version: new Date().getTime(),
  date: new Date().toISOString(),
};

fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));

console.log('✅ version.json generated:', versionInfo);
