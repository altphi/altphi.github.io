import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const POSTS_DIR = 'posts';
const DEFAULT_CATEGORY = 'dailies';

const now = new Date();
const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
const time = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
const filename = `${date}_${time}.md`;
const filepath = `${POSTS_DIR}/${filename}`;

// Get category from command line arg, default to dailies
const category = process.argv[2] || DEFAULT_CATEGORY;

if (existsSync(filepath)) {
  console.error(`File already exists: ${filepath}`);
  process.exit(1);
}

const content = `

#${category}
`;

await writeFile(filepath, content);
console.log(`Created: ${filepath}`);
