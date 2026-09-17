/**
 * GameBoxd Application Bootstrapper
 * SPA router, N5 floating pill nav coordination, toast notifications.
 */

import { store } from './store.js';
import { CatalogController } from './catalog.js';
import { RankingController } from './ranking.js';
import { ProfileController } from './profile.js';
import { ModalController } from './modal.js';

class GameBoxdApp {
  constructor() {
    this.currentView = 'catalog';
    this.catalog = null;
    this.ranking = null;
    this.profile = null;
    this.modal = null;
  }

  async init() {
    // 1. Initialize modal controller
    const modalOverlay = document.getElementById('modal-overlay');
    this.modal = new ModalController(modalOverlay);

    // 2. Initialize Views
    const catalogContainer = document.getElementById('catalog-grid');
    this.catalog = new CatalogController(catalogContainer, (type, id) => this.modal.open(type, id));

    const rankingContainer = document.getElementById('ranking-view-content');
    this.ranking = new RankingController(rankingContainer, (type, id) => this.modal.open(type, id));

    const profileContainer = document.getElementById('profile-view-content');
    this.profile = new ProfileController(profileContainer, (type, id) => this.modal.open(type, id));

    // 3. Setup Navigation & Routing
    this.setupNavigation();
    this.setupSearchAndFilters();
    this.setupToastNotifications();
    this.setupKeyboardShortcuts();

    // 4. Initialize Data Store
    await store.init();

    // 5. Initial Render based on current Hash
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetView = link.getAttribute('data-view');
        if (targetView) {
          window.location.hash = `#${targetView}`;
        }
      });
    });

    const addGameBtn = document.getElementById('nav-btn-add-game');
    if (addGameBtn) {
      addGameBtn.addEventListener('click', () => {
        this.modal.open('add-game');
      });
    }
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const [viewName, queryStr] = hash.split('?');

    let activeView = 'home';
    if (viewName === 'browse' || viewName === 'catalog') activeView = 'catalog';
    if (viewName === 'rankings') activeView = 'ranking';
    if (viewName === 'profile') activeView = 'profile';

    this.switchView(activeView);

    // If query params specify a custom list in ranking
    if (activeView === 'ranking' && queryStr) {
      const params = new URLSearchParams(queryStr);
      const listId = params.get('list');
      if (listId && this.ranking) {
        this.ranking.switchList(listId);
      }
    }
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Toggle view containers
    document.querySelectorAll('.app-view').forEach(viewEl => {
      viewEl.classList.remove('is-active');
    });

    const targetEl = document.getElementById(`view-${viewName}`);
    if (targetEl) {
      targetEl.classList.add('is-active');
    }

    // Update active state in N5 floating pill nav
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkView = link.getAttribute('data-view');
      const isMatch = (viewName === 'home' && linkView === 'home') ||
                      (viewName === 'catalog' && linkView === 'browse') ||
                      (viewName === 'ranking' && linkView === 'rankings') ||
                      (viewName === 'profile' && linkView === 'profile');
      link.classList.toggle('is-active', isMatch);
    });

    // Re-render the active view
    if (viewName === 'home') this.renderLandingHome();
    if (viewName === 'catalog' && this.catalog) this.catalog.render();
    if (viewName === 'ranking' && this.ranking) this.ranking.render();
    if (viewName === 'profile' && this.profile) this.profile.render();

    // Scroll top smoothly
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  renderLandingHome() {
    const spotlightContainer = document.getElementById('landing-spotlight-grid');
    if (spotlightContainer) {
      const featuredIds = [
        'elden-ring',
        'baldurs-gate-3',
        'the-witcher-3',
        'zelda-botw',
        'red-dead-redemption-2',
        'bloodborne',
        'hollow-knight',
        'persona-5-royal',
        'cyberpunk-2077',
        'disco-elysium'
      ];
      const featuredGames = featuredIds.map(id => store.getGameById(id)).filter(Boolean);

      spotlightContainer.innerHTML = featuredGames.map(game => {
        const log = store.getUserLog(game.id);
        const hasRating = typeof log.rating === 'number' && log.rating > 0;
        const ratingDisplay = hasRating ? `★ ${log.rating.toFixed(1)}` : `★ ${game.avgRating.toFixed(1)}`;
        const ratingClass = hasRating ? 'card-rating is-user' : 'card-rating is-community';

        return `
          <div class="game-card" data-game-id="${game.id}" tabindex="0" role="button" aria-label="${game.title}">
            <div class="poster-container">
              <img 
                src="${game.coverUrl}" 
                alt="${game.title}" 
                class="poster-image" 
                loading="lazy" 
                onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'450\\' viewBox=\\'0 0 300 450\\'%3E%3Crect fill=\\'%231b2028\\' width=\\'300\\' height=\\'450\\'/%3E%3C/svg%3E';" 
              />
            </div>
            <div class="card-info">
              <div class="card-meta-top">
                <span class="card-year">${game.releaseYear}</span>
                <span class="${ratingClass}">${ratingDisplay}</span>
              </div>
              <h3 class="card-title" title="${game.title}">${game.title}</h3>
              <p class="card-developer">${game.developer}</p>
            </div>
          </div>
        `;
      }).join('');

      spotlightContainer.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
          const gameId = card.getAttribute('data-game-id');
          this.modal.open('game-detail', gameId);
        });
      });
    }

    // Hero Mosaic cards
    document.querySelectorAll('.mosaic-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.getAttribute('data-game-id');
        this.modal.open('game-detail', gameId);
      });
    });

    // Genre Banner Cards -> Navigate to Browse with filter pre-selected
    document.querySelectorAll('.genre-banner-card').forEach((card, idx) => {
      card.addEventListener('click', () => {
        window.location.hash = '#browse';
        setTimeout(() => {
          const genreSelect = document.getElementById('filter-genre');
          const sortSelect = document.getElementById('filter-sort');
          if (idx === 0 && genreSelect) {
            genreSelect.value = 'Action RPG';
            this.catalog.setFilters({ genre: 'Action RPG' });
          } else if (idx === 1 && genreSelect) {
            genreSelect.value = 'CRPG';
            this.catalog.setFilters({ genre: 'CRPG' });
          } else if (idx === 2 && genreSelect) {
            genreSelect.value = 'Indie';
            this.catalog.setFilters({ genre: 'Indie' });
          } else if (idx === 3 && sortSelect) {
            sortSelect.value = 'year-asc';
            this.catalog.setFilters({ sort: 'year-asc' });
          }
        }, 80);
      });
    });

    // Add game button in feature card
    const addCustomBtn = document.getElementById('landing-btn-add-game');
    if (addCustomBtn) {
      addCustomBtn.addEventListener('click', () => {
        this.modal.open('add-game');
      });
    }
  }

  setupSearchAndFilters() {
    const searchInput = document.getElementById('catalog-search-input');
    const genreSelect = document.getElementById('filter-genre');
    const platformSelect = document.getElementById('filter-platform');
    const statusSelect = document.getElementById('filter-status');
    const sortSelect = document.getElementById('filter-sort');
    const clearSearchBtn = document.getElementById('btn-clear-catalog-search');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (clearSearchBtn) clearSearchBtn.style.display = val ? 'block' : 'none';
        this.catalog.setFilters({ query: val });
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        this.catalog.setFilters({ query: '' });
      });
    }

    if (genreSelect) {
      genreSelect.addEventListener('change', (e) => {
        this.catalog.setFilters({ genre: e.target.value });
      });
    }

    if (platformSelect) {
      platformSelect.addEventListener('change', (e) => {
        this.catalog.setFilters({ platform: e.target.value });
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.catalog.setFilters({ status: e.target.value });
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.catalog.setFilters({ sort: e.target.value });
      });
    }

    // Listen for reset request
    window.addEventListener('reset-catalog-filters', () => {
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      if (genreSelect) genreSelect.value = 'all';
      if (platformSelect) platformSelect.value = 'all';
      if (statusSelect) statusSelect.value = 'all';
      if (sortSelect) sortSelect.value = 'rating-desc';
      this.catalog.setFilters({ query: '', genre: 'all', platform: 'all', status: 'all', sort: 'rating-desc' });
    });
  }

  setupToastNotifications() {
    const toastContainer = document.getElementById('toast-container');
    window.addEventListener('toast-notify', (e) => {
      const text = e.detail?.text || 'Updated';
      const toast = document.createElement('div');
      toast.className = 'toast-pill';
      toast.innerHTML = `<span class="toast-indicator"></span><span>${text}</span>`;
      toastContainer.appendChild(toast);

      // Auto remove after 3.2s
      setTimeout(() => {
        toast.classList.add('is-hiding');
        setTimeout(() => toast.remove(), 250);
      }, 3200);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore when typing inside an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('catalog-search-input');
        if (this.currentView !== 'catalog') {
          window.location.hash = '#browse';
        }
        setTimeout(() => searchInput?.focus(), 50);
      }
    });
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const app = new GameBoxdApp();
  app.init();
});

