// Filtering state
const filters = document.querySelectorAll('.category-filter');
const posts = document.querySelectorAll('.post-preview');
const searchInput = document.querySelector('.search');
let activeTab = 'main';
let searchQuery = '';
let lastKey = '';
let lastKeyTime = 0;

// Post count indicator
const countEl = document.createElement('span');
countEl.className = 'post-count';
const filtersEl = document.querySelector('.filters');
if (filtersEl) filtersEl.appendChild(countEl);

function filterPosts() {
  posts.forEach(post => {
    const category = post.dataset.category;
    const text = post.textContent.toLowerCase();
    const matchesCategory = activeTab === 'all' || category === activeTab;
    const matchesSearch = !searchQuery || text.includes(searchQuery.toLowerCase());
    post.classList.toggle('hidden', !matchesCategory || !matchesSearch);
  });
  const visible = [...posts].filter(p => !p.classList.contains('hidden'));
  countEl.textContent = visible.length + ' of ' + posts.length;
}

function setActiveTab(category) {
  activeTab = category;
  filters.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
}

function updateUrl() {
  const params = new URLSearchParams();
  if (activeTab !== 'main') {
    params.set('c', activeTab);
  }
  if (searchQuery) {
    params.set('q', searchQuery);
  }
  const newUrl = params.toString() ? `?${params}` : window.location.pathname;
  history.replaceState(null, '', newUrl);
}

// Initialize filters from URL or defaults
function init() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('c');
  const q = params.get('q');

  if (cat) {
    setActiveTab(cat);
  }
  if (q && searchInput) {
    searchQuery = q;
    searchInput.value = q;
  }
  filterPosts();
}

// Category filtering: tab selection
filters.forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.category;
    setActiveTab(cat);
    const wasHidden = new Set([...posts].filter(p => p.classList.contains('hidden')));
    filterPosts();
    updateUrl();

    // Pulse newly-revealed posts and badge
    const revealed = [...posts].filter(p => wasHidden.has(p) && !p.classList.contains('hidden'));
    revealed.forEach(p => p.classList.remove('post-reveal'));
    countEl.classList.remove('post-reveal');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        revealed.forEach(p => p.classList.add('post-reveal'));
        countEl.classList.add('post-reveal');
      });
    });
  });
});

// Search filtering
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    filterPosts();
    updateUrl();
  });
}

// Initialize
init();
const postsContainer = document.querySelector('.posts');
if (postsContainer) postsContainer.classList.add('ready');

// Help modal
const modal = document.createElement('div');
modal.className = 'modal';
modal.innerHTML = `
  <div class="modal-content">
    <h3>Keyboard Shortcuts</h3>
    <dl>
      <dt><kbd>j</kbd> / <kbd>↓</kbd></dt><dd>Next post</dd>
      <dt><kbd>k</kbd> / <kbd>↑</kbd></dt><dd>Previous post</dd>
      <dt><kbd>gg</kbd></dt><dd>First post</dd>
      <dt><kbd>G</kbd></dt><dd>Last post</dd>
      <dt><kbd>Enter</kbd></dt><dd>Open post</dd>
      <dt><kbd>H</kbd></dt><dd>History back</dd>
      <dt><kbd>L</kbd></dt><dd>History forward</dd>
      <dt><kbd>/</kbd></dt><dd>Focus search</dd>
      <dt><kbd>Escape</kbd></dt><dd>Clear / Close</dd>
      <dt><kbd>1</kbd>–<kbd>${filters.length}</kbd></dt><dd>Switch tab</dd>
      <dt><kbd>?</kbd></dt><dd>Show this help</dd>
      <dt>Click</dt><dd>Open post</dd>
      <dt><kbd>⌥</kbd> Click</dt><dd>Select post</dd>
    </dl>
  </div>
`;
document.body.appendChild(modal);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const inSearch = document.activeElement === searchInput;

  // Toggle help modal (not while typing in search)
  if (e.key === '?' && !inSearch) {
    modal.classList.toggle('open');
    return;
  }

  // Close modal on escape
  if (e.key === 'Escape' && modal.classList.contains('open')) {
    modal.classList.remove('open');
    return;
  }

  // Number keys switch tabs
  const num = parseInt(e.key);
  if (!inSearch && num >= 1 && num <= filters.length) {
    filters[num - 1].click();
    return;
  }

  // Focus search with /
  if (e.key === '/' && !inSearch && searchInput) {
    e.preventDefault();
    searchInput.focus();
    return;
  }

  // Blur search and clear on Escape
  if (e.key === 'Escape' && inSearch) {
    searchInput.value = '';
    searchQuery = '';
    searchInput.blur();
    filterPosts();
    return;
  }

  // H - history back (works on all pages)
  if (e.key === 'H' && !inSearch) {
    e.preventDefault();
    window.history.back();
    return;
  }

  // L - history forward (works on all pages)
  if (e.key === 'L' && !inSearch) {
    e.preventDefault();
    window.history.forward();
    return;
  }

  // Only on index page with posts, and not while typing
  if (posts.length === 0 || inSearch) return;

  const visible = [...posts].filter(p => !p.classList.contains('hidden'));
  const current = document.querySelector('.post-preview.focused');
  let index = current ? visible.indexOf(current) : -1;

  const now = Date.now();

  // gg - go to first post
  if (e.key === 'g' && lastKey === 'g' && now - lastKeyTime < 300) {
    e.preventDefault();
    focusPost(visible, 0);
    lastKey = '';
    return;
  }

  // Track g key for gg detection
  if (e.key === 'g') {
    lastKey = 'g';
    lastKeyTime = now;
    return;
  }

  // G - go to last post
  if (e.key === 'G') {
    e.preventDefault();
    focusPost(visible, visible.length - 1);
    return;
  }

  lastKey = '';

  if (e.key === 'j' || e.key === 'ArrowDown') {
    e.preventDefault();
    index = Math.min(index + 1, visible.length - 1);
    focusPost(visible, index);
  } else if (e.key === 'k' || e.key === 'ArrowUp') {
    e.preventDefault();
    index = Math.max(index - 1, 0);
    focusPost(visible, index);
  } else if (e.key === 'Enter' && current) {
    const slug = current.dataset.slug;
    if (slug) window.location.href = slug + '.html';
  } else if (e.key === 'Escape') {
    setActiveTab('main');
    filterPosts();
    updateUrl();
    posts.forEach(p => p.classList.remove('focused'));
  }
});

// Close modal on backdrop click
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('open');
});

function focusPost(visible, index) {
  posts.forEach(p => p.classList.remove('focused'));
  if (visible[index]) {
    visible[index].classList.add('focused');
    const rect = visible[index].getBoundingClientRect();
    const targetY = window.scrollY + rect.top - window.innerHeight * 0.25;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }
}

// Post click handlers: click to open, alt-click to select
posts.forEach(post => {
  post.style.cursor = 'pointer';
  post.addEventListener('click', (e) => {
    if (e.altKey) {
      // Alt-click: select without opening
      e.preventDefault();
      posts.forEach(p => p.classList.remove('focused'));
      post.classList.add('focused');
    } else {
      // Normal click: open post
      const slug = post.dataset.slug;
      if (slug) window.location.href = slug + '.html';
    }
  });
});

// Add focus styles
const style = document.createElement('style');
style.textContent = `.post-preview.focused { background: var(--focus-bg); margin-left: -1rem; margin-right: -1rem; padding: 1.5rem 1rem; margin-top: -1.5rem; border-radius: 4px; }`;
document.head.appendChild(style);
