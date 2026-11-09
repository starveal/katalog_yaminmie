import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDir = path.resolve(
    process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads')
);

fs.mkdirSync(uploadsDir, { recursive: true });
