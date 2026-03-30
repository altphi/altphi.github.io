export const POSTS_DIR = 'posts';

// Declarative nav config: controls tab order, type, and visibility
// type: 'category' = filter button showing posts with that category
// type: 'page' = tab showing inline page content matched by filename slug
// "all" tab is always appended last automatically
export const NAV = [
  { name: 'main', type: 'category' },
  { name: 'photos', type: 'category' },
  { name: 'tech', type: 'category' },
  { name: 'math', type: 'category' },
  { name: 'dailies', type: 'category' },
  { name: 'links', type: 'page' },
  { name: 'projects', type: 'page' },
  { name: 'cv', type: 'page' },
  { name: 'about', type: 'page' },
];
export const DEFAULT_CATEGORY = 'dailies';
