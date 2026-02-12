# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static site blog generator for [log.j38.uk](https://log.j38.uk), deployed via GitHub Actions to GitHub Pages. Built with Node.js (ES modules), using `marked` for markdown rendering. No frameworks — vanilla JS frontend.

## Commands

- `npm run build` — Generate site into `build/`
- `npm run watch` — Watch `posts/`, `photos/`, `static/`, `templates/` and rebuild on changes (2s debounce)
- `npm run serve` — Serve `build/` locally via `npx serve`
- `npm run new [category]` — Create a new timestamped post (defaults to `dailies`)
- `npm run check-tags` — Validate all posts have exactly one category

## Architecture

**Build pipeline** (`build.js`): Reads markdown from `posts/`, photos from `photos/`, applies HTML templates, and writes everything to `build/`. The build:
1. Parses frontmatter and extracts inline `#hashtags` as categories/tags
2. Strips hashtags from rendered content
3. Protects LaTeX math blocks (`$...$` and `$$...$$`) during markdown conversion
4. Strips EXIF metadata from photos via `exiftool`
5. Generates RSS feed (`feed.xml`, last 20 `main` posts) and sitemap
6. Applies cache-busting `{{v}}` version strings to static asset URLs

**Templates** (`templates/`): `index.html` for the homepage, `post.html` for individual posts. Use `{{placeholder}}` syntax.

**Frontend** (`static/main.js`, `static/style.css`): Client-side category filtering, search, and vim-style keyboard navigation (j/k, gg/G, `/` for search, `1-5` for category filters, `?` for help).

## Content Model

- **Posts** live in `posts/` as markdown files. Date-based filenames (`YYYY-MM-DD_HHMMSS.md`) sort newest-first; others sort alphabetically after them.
- **Photos** live in `photos/` and are auto-wrapped as `photos`-category posts with `photo-` slug prefix.
- **Categories** (exactly one per post, set via inline hashtag): `main`, `photos`, `tech`, `dailies`, `about`. Posts without a category get `#dailies` appended automatically by the build.
- Additional hashtags become searchable tags (not categories).
- The build will **error** if a post has multiple categories.
- Frontmatter (optional `---` block) supports `title` and `date` fields.

## Key Constraints

- `build/` is the build output — never edit files there directly; they get deleted on each build.
- `exiftool` must be installed for photo builds to succeed.
- The project uses ES modules (`"type": "module"` in package.json).
