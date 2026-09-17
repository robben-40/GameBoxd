# GameBoxd — Letterboxd for Video Games

A modern, responsive, zero-build web application for discovering, logging, reviewing, and ranking video games. Built with modern vanilla web technologies (HTML5, modular CSS with OKLCH tokens, ES6+ modules) and crafted under **Hallmark's** `modern-minimal` design discipline.

---

## Key Features

1. **Modern-Minimal Landing Page**:
   - Two-column hero introducing the platform (*"Track, review, and rank your gaming life"*).
   - Interactive live spotlight row featuring standout titles from the database.
   - Core feature pillar cards detailing Drag-and-Drop Rankings, Half-Star Ratings & Diary, Pinned Favorite Four, and the 150+ Expandable Database.
   - 3-Step "How It Works" workflow guide with direct action CTAs.

2. **Curated 150 Popular Games Database**:
   - Spans diverse eras (SNES classics to modern blockbusters) and genres (Action RPG, CRPG, Metroidvania, FPS, Survival Horror, Platformers, Indie, Roguelikes).
   - High-resolution poster art, developers, release years, platforms, and synopses.
   - Expandable anytime through the in-app **"+ Add Game"** form or directly in `data/games.json`.

3. **Drag-and-Drop Rankings Workspace**:
   - **Personal Master Ranking**: Drag and drop any game up and down to reorder your definitive All-Time Top leaderboard.
   - **Custom Themed Lists**: Create and manage custom ranked lists (e.g. *"Best Soulslikes"*, *"Peak Narrative & Worldbuilding"*).
   - **Inline Search & Quick Add**: Search any game from the 150+ database and drop it directly into rank.
   - **Touch & Step Controls**: Move Up/Down buttons and keyboard support for effortless mobile and accessibility support.
   - **Export to Markdown / Text**: One-click copy formatted ranking list to clipboard for sharing.

4. **Letterboxd-Style Tracking & Reviews**:
   - **10-Step Half-Star Ratings**: Rate games from 0.5 to 5.0 stars with live hover preview.
   - **Play Status**: Toggle between *Played*, *Currently Playing*, and *Backlog / Want to Play*.
   - **Favorites & Likes**: Heart like button for standout titles.
   - **Review Diary**: Log completion dates, platform played on, and written review notes.

5. **Player Profile & Top 4 Showcase**:
   - **Top 4 Pinned Favorites**: Pick your 4 defining games to showcase on your profile header.
   - **Stats Bar**: Live counter of Total Played, Currently Playing, Backlog, Total Reviews, Likes, and Average Rating.
   - **Activity & Diary Feed**: Chronological log of reviews and playthroughs.

6. **Hallmark Anti-AI-Slop Design System**:
   - **Genre**: `modern-minimal` (Linear/Steam-inspired dark UI)
   - **Macrostructure**: `11 · Catalogue` (Clean, high-density inventory grid)
   - **Palette**: `Cobalt Dark Utilitarian` (OKLCH slate paper, high-contrast ink, electric cobalt accents, no pure `#000` or `#fff`)
   - **Typography**: Space Grotesk (display & rankings), Geist (body & UI), Geist Mono (outlier numerals & badges)
   - **Nav Archetype**: `N5 Floating pill` (detached content-sized pill with backdrop blur)
   - **Footer Archetype**: `Ft2 Inline rule single line`
   - **Responsive**: Flawlessly tested at 320px, 375px, 414px, 768px, 1024px, and 1440px with `overflow-x: clip`.

7. **Local Persistence & Portability**:
   - State persists automatically to browser `localStorage`.
   - Complete JSON Export & Import backup for your library and rankings.

---

## How to Run

### Option A: Open Directly in Any Browser (Zero Setup)
Double-click `index.html` or open it in your favorite browser (Chrome, Firefox, Edge, Safari). It includes an embedded dataset fallback so all 150 games load instantly without needing a local web server.

### Option B: Run via Local Dev Server
If you prefer running through a local web server:

```bash
# Python
python -m http.server 8000

# Node / npx
npx serve .
```

Then open `http://localhost:8000` in your browser.

---

## Expanding the Database

- **Via In-App UI**: Click **"+ Add Game"** in the top navigation bar. Fill in the title, year, developer, genres, platforms, and cover URL. The game is instantly saved to your browser storage and catalog.
- **Via Code**: Open `data/games.json` in your editor and append any new game object matching the existing schema.

---

## Keyboard Shortcuts
- `/` — Focus the catalog search bar
- `Esc` — Close any open modal dialog

