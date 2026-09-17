/**
 * GameBoxd Catalog Module
 * Manages grid rendering, live searching, faceted filtering, and sorting.
 */

import { store } from './store.js';

export class CatalogController {
  constructor(containerEl, openModalFn) {
    this.container = containerEl;
    this.openModal = openModalFn;
    this.searchQuery = '';
    this.selectedGenre = 'all';
    this.selectedPlatform = 'all';
    this.selectedStatus = 'all';
    this.sortBy = 'rating-desc';

    this.initListeners();
  }

  initListeners() {
    store.subscribe((event) => {
      if (['log_updated', 'game_saved', 'data_imported', 'init'].includes(event)) {
        this.render();
      }
    });
  }

  setFilters({ query, genre, platform, status, sort }) {
    if (query !== undefined) this.searchQuery = query.toLowerCase().trim();
    if (genre !== undefined) this.selectedGenre = genre;
    if (platform !== undefined) this.selectedPlatform = platform;
    if (status !== undefined) this.selectedStatus = status;
    if (sort !== undefined) this.sortBy = sort;
    this.render();
  }

  getFilteredGames() {
    const allGames = store.getAllGames();

    return allGames.filter(game => {
      // Search query filter (title, developer, publisher)
      if (this.searchQuery) {
        const matchTitle = game.title.toLowerCase().includes(this.searchQuery);
        const matchDev = (game.developer || '').toLowerCase().includes(this.searchQuery);
        const matchPub = (game.publisher || '').toLowerCase().includes(this.searchQuery);
        if (!matchTitle && !matchDev && !matchPub) return false;
      }

      // Genre filter
      if (this.selectedGenre !== 'all') {
        const hasGenre = (game.genres || []).some(g => g.toLowerCase() === this.selectedGenre.toLowerCase());
        if (!hasGenre) return false;
      }

      // Platform filter
      if (this.selectedPlatform !== 'all') {
        const hasPlatform = (game.platforms || []).some(p => {
          if (this.selectedPlatform === 'PC') return p.includes('PC') || p.includes('Mac') || p.includes('Linux') || p.includes('DOS');
          if (this.selectedPlatform === 'PlayStation') return p.includes('PS') || p.includes('PlayStation');
          if (this.selectedPlatform === 'Nintendo') return p.includes('Switch') || p.includes('Nintendo') || p.includes('SNES') || p.includes('Wii') || p.includes('GameCube') || p.includes('64') || p.includes('GBA') || p.includes('3DS') || p.includes('DS');
          if (this.selectedPlatform === 'Xbox') return p.includes('Xbox');
          return p.toLowerCase() === this.selectedPlatform.toLowerCase();
        });
        if (!hasPlatform) return false;
      }

      // Status filter
      if (this.selectedStatus !== 'all') {
        const log = store.getUserLog(game.id);
        if (this.selectedStatus === 'played' && log.status !== 'played') return false;
        if (this.selectedStatus === 'playing' && log.status !== 'playing') return false;
        if (this.selectedStatus === 'backlog' && log.status !== 'backlog') return false;
        if (this.selectedStatus === 'liked' && !log.liked) return false;
        if (this.selectedStatus === 'unlogged' && log.status !== 'none') return false;
      }

      return true;
    }).sort((a, b) => {
      switch (this.sortBy) {
        case 'rating-desc':
          return (b.avgRating || 0) - (a.avgRating || 0);
        case 'rating-asc':
          return (a.avgRating || 0) - (b.avgRating || 0);
        case 'year-desc':
          return b.releaseYear - a.releaseYear;
        case 'year-asc':
          return a.releaseYear - b.releaseYear;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'user-rating': {
          const ratingA = store.getUserLog(a.id).rating || 0;
          const ratingB = store.getUserLog(b.id).rating || 0;
          return ratingB - ratingA;
        }
        default:
          return 0;
      }
    });
  }

  render() {
    if (!this.container) return;
    const filtered = this.getFilteredGames();
    const countEl = document.getElementById('catalog-count');
    if (countEl) {
      countEl.textContent = `${filtered.length} of ${store.getAllGames().length} games`;
    }

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⌕</div>
          <h3 class="empty-title">No games found</h3>
          <p class="empty-desc">No video games match your current search and filter combination.</p>
          <button type="button" class="btn btn-secondary" id="btn-reset-filters">Reset all filters</button>
        </div>
      `;
      const resetBtn = this.container.querySelector('#btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('reset-catalog-filters'));
        });
      }
      return;
    }

    this.container.innerHTML = filtered.map(game => this.createCardHTML(game)).join('');
    this.attachCardEvents();
  }

  createCardHTML(game) {
    const log = store.getUserLog(game.id);
    const hasRating = typeof log.rating === 'number' && log.rating > 0;
    const ratingDisplay = hasRating ? `★ ${log.rating.toFixed(1)}` : `★ ${game.avgRating.toFixed(1)}`;
    const ratingClass = hasRating ? 'card-rating is-user' : 'card-rating is-community';

    const isPlayed = log.status === 'played';
    const isBacklog = log.status === 'backlog';
    const isPlaying = log.status === 'playing';
    const isLiked = !!log.liked;

    return `
      <article class="game-card" data-game-id="${game.id}" tabindex="0" role="button" aria-label="${game.title} (${game.releaseYear})">
        <div class="poster-container">
          <img 
            src="${game.coverUrl}" 
            alt="${game.title} cover" 
            class="poster-image" 
            loading="lazy" 
            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'450\\' viewBox=\\'0 0 300 450\\'%3E%3Crect fill=\\'%231b2028\\' width=\\'300\\' height=\\'450\\'/%3E%3Ctext fill=\\'%238892b0\\' font-family=\\'sans-serif\\' font-size=\\'18\\' dy=\\'10.5\\' font-weight=\\'600\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\'%3E${encodeURIComponent(game.title)}%3C/text%3E%3C/svg%3E';" 
          />
          
          <div class="poster-overlay">
            <div class="card-quick-actions" onclick="event.stopPropagation()">
              <button 
                type="button" 
                class="quick-btn ${isPlayed ? 'active-played' : ''}" 
                data-action="toggle-played" 
                data-id="${game.id}" 
                title="${isPlayed ? 'Marked as Played' : 'Mark as Played'}"
                aria-label="Toggle played status"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>

              <button 
                type="button" 
                class="quick-btn ${isBacklog ? 'active-backlog' : ''}" 
                data-action="toggle-backlog" 
                data-id="${game.id}" 
                title="${isBacklog ? 'In Backlog' : 'Add to Backlog'}"
                aria-label="Toggle backlog status"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </button>

              <button 
                type="button" 
                class="quick-btn ${isLiked ? 'active-liked' : ''}" 
                data-action="toggle-liked" 
                data-id="${game.id}" 
                title="${isLiked ? 'Liked' : 'Like game'}"
                aria-label="Toggle like"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>

              <button 
                type="button" 
                class="quick-btn" 
                data-action="add-to-rank" 
                data-id="${game.id}" 
                title="Add to Ranking"
                aria-label="Add to ranking"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>

            <div class="card-badges">
              ${isPlaying ? '<span class="status-pill status-playing">Playing</span>' : ''}
              ${game.isCustom ? '<span class="status-pill status-custom">Custom</span>' : ''}
            </div>
          </div>
        </div>

        <div class="card-info">
          <div class="card-meta-top">
            <span class="card-year">${game.releaseYear}</span>
            <span class="${ratingClass}" title="${hasRating ? 'Your rating' : 'Community score'}">${ratingDisplay}</span>
          </div>
          <h3 class="card-title" title="${game.title}">${game.title}</h3>
          <p class="card-developer">${game.developer}</p>
        </div>
      </article>
    `;
  }

  attachCardEvents() {
    this.container.querySelectorAll('.game-card').forEach(card => {
      const gameId = card.getAttribute('data-game-id');

      // Click card to open detail modal
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-quick-actions')) return;
        this.openModal('game-detail', gameId);
      });

      // Keyboard accessibility
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openModal('game-detail', gameId);
        }
      });
    });

    // Quick action buttons
    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const gameId = btn.getAttribute('data-id');

        if (action === 'toggle-played') {
          store.setStatus(gameId, 'played');
          window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `Marked "${store.getGameById(gameId)?.title}" as Played` } }));
        } else if (action === 'toggle-backlog') {
          store.setStatus(gameId, 'backlog');
          window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `Updated Backlog status for "${store.getGameById(gameId)?.title}"` } }));
        } else if (action === 'toggle-liked') {
          store.toggleLiked(gameId);
          const isNowLiked = store.getUserLog(gameId).liked;
          window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: isNowLiked ? `Added to favorites` : `Removed from favorites` } }));
        } else if (action === 'add-to-rank') {
          store.addGameToMasterRanking(gameId);
          window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `Added "${store.getGameById(gameId)?.title}" to Master Ranking` } }));
        }
      });
    });
  }
}

