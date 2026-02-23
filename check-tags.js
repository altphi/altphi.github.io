import { readdir, readFile } from 'fs/promises';

const POSTS_DIR = 'posts';
const CATEGORIES = ['main', 'photos', 'tech', 'dailies', 'links', 'about'];

function extractHashtags(content) {
  const withoutCode = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');

  const hashtags = [];
  const regex = /(?<=\s|^)#([a-z][a-z0-9-]*)/gi;
  let match;
  while ((match = regex.exec(withoutCode)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }
  return [...new Set(hashtags)];
}

async function checkTags() {
  const files = await readdir(POSTS_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  const noCategory = [];
  const multipleCategories = [];

  for (const file of mdFiles) {
    const content = await readFile(`${POSTS_DIR}/${file}`, 'utf-8');
    const hashtags = extractHashtags(content);
    const categories = hashtags.filter(t => CATEGORIES.includes(t));

    if (categories.length === 0) {
      noCategory.push(file);
    } else if (categories.length > 1) {
      multipleCategories.push({ file, categories });
    }
  }

  if (noCategory.length === 0 && multipleCategories.length === 0) {
    console.log('All posts have exactly one category!');
  } else {
    if (noCategory.length > 0) {
      console.log(`\nFound ${noCategory.length} post(s) without a category:\n`);
      noCategory.forEach(f => console.log(`  ${f}`));
    }
    if (multipleCategories.length > 0) {
      console.log(`\nFound ${multipleCategories.length} post(s) with multiple categories:\n`);
      multipleCategories.forEach(({ file, categories }) =>
        console.log(`  ${file}: ${categories.join(', ')}`));
    }
  }
}

checkTags().catch(console.error);
