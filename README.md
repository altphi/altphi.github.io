# log.j38.uk

A minimalist static blog generator with keyboard navigation and category filtering.

## Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [exiftool](https://exiftool.org/) - for stripping photo metadata

## Setup

```bash
npm install
```

## Commands

```bash
npm run new              # Create new post with #dailies category
npm run new -- tech      # Create new post with #tech category
npm run new -- <category> # Create new post with specified category

npm run build            # Build the site to build/
npm run serve            # Serve the build/ folder locally
npm run check-tags       # Check posts for category issues
```

## Posts

Posts are markdown files in the `posts/` directory.

### Filenames

Date-based filenames (e.g., `2026-02-09_143052.md`) are sorted first, newest to oldest. Other filenames appear after, sorted alphabetically descending.

### Categories

Each post must have exactly one category. Categories are specified using hashtags:

```markdown
This is my post content.

#dailies
```

Available categories: `main`, `photos`, `tech`, `dailies`, `about`

If a post has no category, the build process automatically adds `#dailies`.

If a post has multiple categories, the build will throw an error.

### Tags

Additional hashtags that aren't categories become tags. Tags are shown on posts and are searchable, but don't appear as filter buttons.

```markdown
This is a post about vim configuration.

#tech #vim #dotfiles
```

Here `#tech` is the category, `#vim` and `#dotfiles` are tags.

## Filtering

The index page shows category filter buttons at the top:

- **Active (highlighted)**: Shows posts in this category
- **Off (strikethrough)**: Hides posts in this category

Default state: `tech`, `dailies`, and `about` are off by default.

Clicking the header "log.j38.uk" resets to the default view.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `↓` | Next post |
| `k` / `↑` | Previous post |
| `gg` | First post |
| `G` | Last post |
| `Enter` | Open post |
| `H` | History back |
| `L` | History forward |
| `/` | Focus search |
| `Escape` | Clear filters / Close modal |
| `?` | Show help |

### Mouse

- **Click**: Open post
- **Alt + Click**: Select post (for keyboard navigation)

## Photos

Photos placed in the `photos/` directory are automatically built as posts with the `photos` category. All metadata (EXIF, GPS, camera info, etc.) is automatically stripped during build for privacy.

## Output

The site is built to the `build/` directory and deployed via GitHub Actions.

## RSS Feed

An RSS feed is generated at `/feed.xml` with the 20 most recent posts from the `main` category. Autodiscovery links are included in the HTML so feed readers can find it automatically.

## Cache Busting

Each build automatically adds a unique version query string to CSS and JS files (e.g., `style.css?v=mlfqept5`), ensuring browsers load the latest assets after updates.

## Configuration

Edit these files to customize:

- `build.js`: `CATEGORIES` array and `DEFAULT_CATEGORY`
- `static/main.js`: `DEFAULT_OFF` array for which categories are hidden by default
- `static/style.css`: Styling and theming (supports light/dark mode)
- `templates/`: HTML templates for index and post pages
