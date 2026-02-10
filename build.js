import { readdir, readFile, writeFile, mkdir, cp, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';

const POSTS_DIR = 'posts';
const PHOTOS_DIR = 'photos';
const OUTPUT_DIR = 'docs';
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const SITE_URL = 'https://log.j38.uk';

// Categories shown as filter buttons (each post must have exactly one)
const CATEGORIES = ['main', 'photos', 'tech', 'dailies', 'about'];
const DEFAULT_CATEGORY = 'dailies';

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };

  const frontmatter = match[1];
  const body = match[2];
  const metadata = {};

  for (const line of frontmatter.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Parse arrays like [tag1, tag2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim());
    }
    metadata[key] = value;
  }

  return { metadata, body };
}

function generateSlug(filename) {
  return filename.replace(/\.md$/, '');
}

function extractHashtags(body) {
  // Remove code blocks and inline code before extracting hashtags
  const withoutCode = body
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

function stripHashtags(body) {
  // Strip hashtags but preserve code blocks
  const codeBlocks = [];
  let preserved = body.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  // Strip hashtags (and surrounding whitespace if alone on line)
  preserved = preserved.replace(/(?<=\s|^)#[a-z][a-z0-9-]*/gi, '');
  // Clean up empty lines left by stripped hashtags
  preserved = preserved.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Restore code blocks
  preserved = preserved.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[i]);

  return preserved.trim();
}

async function buildPost(filename, template) {
  let content = await readFile(`${POSTS_DIR}/${filename}`, 'utf-8');
  const { metadata, body } = parseFrontmatter(content);
  const slug = generateSlug(filename);

  // Extract hashtags and separate into category and tags
  const allHashtags = extractHashtags(body);
  const categories = allHashtags.filter(t => CATEGORIES.includes(t));
  const tags = allHashtags.filter(t => !CATEGORIES.includes(t));

  // Validate: exactly one category required
  if (categories.length > 1) {
    throw new Error(`${filename}: Multiple categories found (${categories.join(', ')}). Posts must have exactly one category.`);
  }

  let category = categories[0];

  // If no category, add default to the source file
  if (!category) {
    content = content.trimEnd() + `\n\n#${DEFAULT_CATEGORY}\n`;
    await writeFile(`${POSTS_DIR}/${filename}`, content);
    category = DEFAULT_CATEGORY;
  }

  // Strip hashtags from content before rendering
  const cleanBody = stripHashtags(body);
  const html = new Marked().use(markedFootnote({ description: "", footnoteDivider: true })).parse(cleanBody);

  // Generate description from plain text (first 160 chars)
  const plainText = cleanBody.replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim();
  const description = plainText.slice(0, 160) + (plainText.length > 160 ? '...' : '');

  const tagsHtml = [category, ...tags].map(t => `<span class="tag">${t}</span>`).join('');

  const postHtml = template
    .replaceAll('{{title}}', metadata.title || slug)
    .replaceAll('{{date}}', metadata.date || '')
    .replaceAll('{{tags}}', tagsHtml)
    .replaceAll('{{content}}', html)
    .replaceAll('{{slug}}', slug)
    .replaceAll('{{description}}', escapeXml(description));

  await writeFile(`${OUTPUT_DIR}/${slug}.html`, postHtml);

  return {
    slug,
    title: metadata.title || slug,
    category,
    tags,
    html,
  };
}

async function buildPhoto(filename, template) {
  const slug = 'photo-' + filename.replace(/\.[^.]+$/, '');
  const category = 'photos';
  const tags = [];
  const description = 'Photo from log.j38.uk';
  const html = `<a href="${filename}" target="_blank"><img src="${filename}" alt="" loading="lazy" /></a>`;
  const tagsHtml = `<span class="tag">${category}</span>`;

  const postHtml = template
    .replaceAll('{{title}}', slug)
    .replaceAll('{{date}}', '')
    .replaceAll('{{tags}}', tagsHtml)
    .replaceAll('{{content}}', html)
    .replaceAll('{{slug}}', slug)
    .replaceAll('{{description}}', description);

  await writeFile(`${OUTPUT_DIR}/${slug}.html`, postHtml);

  return {
    slug,
    title: slug,
    category,
    tags,
    html,
  };
}

async function buildIndex(posts, template) {
  const postsHtml = posts
    .map(post => {
      const allTags = [post.category, ...post.tags];
      const tagsHtml = allTags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join('');
      return `
        <article class="post-preview" data-category="${post.category}" data-tags="${post.tags.join(',')}" data-slug="${post.slug}">
          <!-- <div class="tags">${tagsHtml}</div> -->
          <div class="content">${post.html}</div>
        </article>
      `;
    })
    .join('');

  const usedCategories = [...new Set(posts.map(p => p.category))];
  const filterHtml = CATEGORIES
    .filter(c => usedCategories.includes(c))
    .map(c => `<button class="category-filter" data-category="${c}">${c}</button>`)
    .join('');

  const indexHtml = template
    .replace('{{posts}}', postsHtml)
    .replace('{{filters}}', filterHtml);

  await writeFile(`${OUTPUT_DIR}/index.html`, indexHtml);
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function buildRss(posts) {
  const buildDate = new Date().toUTCString();
  const mainPosts = posts.filter(p => p.category === 'main');
  const recentPosts = mainPosts.slice(0, 20); // Last 20 main posts

  const items = recentPosts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/${post.slug}.html</link>
      <guid>${SITE_URL}/${post.slug}.html</guid>
      <description><![CDATA[${post.html}]]></description>
    </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>log.j38.uk</title>
    <link>${SITE_URL}</link>
    <description>A minimalist blog</description>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  await writeFile(`${OUTPUT_DIR}/feed.xml`, rss);
}

async function buildSitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>`,
    ...posts.map(post =>
      `  <url>\n    <loc>${SITE_URL}/${post.slug}.html</loc>\n  </url>`
    )
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  await writeFile(`${OUTPUT_DIR}/sitemap.xml`, sitemap);
}

async function build() {
  // Clean and create output directory
  if (existsSync(OUTPUT_DIR)) {
    await rm(OUTPUT_DIR, { recursive: true });
  }
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Cache-busting version
  const version = Date.now().toString(36);

  // Read templates and inject version
  const postTemplate = (await readFile('templates/post.html', 'utf-8')).replaceAll('{{v}}', version);
  const indexTemplate = (await readFile('templates/index.html', 'utf-8')).replaceAll('{{v}}', version);

  // Build all markdown posts
  const files = await readdir(POSTS_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  const markdownPosts = await Promise.all(mdFiles.map(f => buildPost(f, postTemplate)));

  // Build photo posts
  let photoPosts = [];
  if (existsSync(PHOTOS_DIR)) {
    const photoFiles = await readdir(PHOTOS_DIR);
    const photos = photoFiles.filter(f => PHOTO_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext)));

    // Strip metadata from photos
    if (photos.length > 0) {
      execSync(`exiftool -all= -overwrite_original ${PHOTOS_DIR}/*`, { stdio: 'ignore' });
    }

    photoPosts = await Promise.all(photos.map(f => buildPhoto(f, postTemplate)));
    // Copy photos to output
    await cp(PHOTOS_DIR, OUTPUT_DIR, { recursive: true });
  }

  // Combine and sort: date-based posts first (newest first), then others
  const isDateBased = (slug) => /^(photo-)?\d{4}-\d{2}-\d{2}/.test(slug);
  const posts = [...markdownPosts, ...photoPosts].sort((a, b) => {
    const aDate = isDateBased(a.slug);
    const bDate = isDateBased(b.slug);
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    return b.slug.localeCompare(a.slug);
  });

  // Build index, sitemap, and RSS feed
  await buildIndex(posts, indexTemplate);
  await buildSitemap(posts);
  await buildRss(posts);

  // Copy static assets
  if (existsSync('static')) {
    await cp('static', OUTPUT_DIR, { recursive: true });
  }

  console.log(`Built ${markdownPosts.length} posts and ${photoPosts.length} photos`);
}

build().catch(console.error);
