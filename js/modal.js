/**
 * GameBoxd Modals Module
 * Handles Game Detail view with 10-step half-star ratings, review logging,
 * custom game addition, custom list creation, and Top 4 favorite picker.
 */

import { store } from './store.js';

export class ModalController {
  constructor(overlayEl) {
    this.overlay = overlayEl;
    this.currentModal = null;
    this.activeGameId = null;
    this.tempRating = 0;

    this.initGlobalListeners();
  }

  initGlobalListeners() {
    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('is-open')) {
        this.close();
      }
    });

    // Close when clicking overlay backdrop
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  open(type, payload = null) {
    this.currentModal = type;
    this.activeGameId = payload;
    this.render();
    this.overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Auto-focus first input or close button
    const focusable = this.overlay.querySelector('input, textarea, button');
    if (focusable) focusable.focus();
  }

  close() {
    this.overlay.classList.remove('is-open');
    this.overlay.innerHTML = '';
    document.body.style.overflow = '';
    this.currentModal = null;
    this.activeGameId = null;
  }

  render() {
    switch (this.currentModal) {
      case 'game-detail':
        this.renderGameDetail();
        break;
      case 'add-game':
        this.renderAddGame();
        break;
      case 'create-list':
        this.renderCreateList();
        break;
      case 'pick-favorites':
        this.renderPickFavorites();
        break;
      default:
        this.close();
    }
  }

  renderGameDetail() {
    const game = store.getGameById(this.activeGameId);
    if (!game) {
      this.close();
      return;
    }

    const log = store.getUserLog(game.id);
    this.tempRating = log.rating || 0;

    const isPlayed = log.status === 'played';
    const isPlaying = log.status === 'playing';
    const isBacklog = log.status === 'backlog';
    const isLiked = !!log.liked;
    const defaultDate = log.logDate || new Date().toISOString().split('T')[0];

    this.overlay.innerHTML = `
      <div class="modal-card modal-game-detail" role="dialog" aria-modal="true" aria-labelledby="modal-game-title">
        <button type="button" class="modal-close-btn" id="modal-close" aria-label="Close dialog">&times;</button>
        
        ${game.backdropUrl ? `
          <div class="modal-backdrop-header">
            <img src="${game.backdropUrl}" alt="" class="modal-backdrop-img" />
            <div class="modal-backdrop-fade"></div>
          </div>
        ` : ''}

        <div class="modal-content-grid">
          <div class="modal-left-col">
            <img src="${game.coverUrl}" alt="${game.title}" class="modal-cover-img" />
            <div class="modal-quick-stats">
              <span class="modal-stat-line"><strong>Developer:</strong> ${game.developer}</span>
              <span class="modal-stat-line"><strong>Publisher:</strong> ${game.publisher}</span>
              <span class="modal-stat-line"><strong>Released:</strong> ${game.releaseYear}</span>
              <span class="modal-stat-line"><strong>Community:</strong> ★ ${game.avgRating.toFixed(1)} (${game.communityRatingCount.toLocaleString()} ratings)</span>
            </div>
          </div>

          <div class="modal-right-col">
            <div class="modal-header-text">
              <div class="modal-genre-pills">
                ${(game.genres || []).map(g => `<span class="genre-pill">${g}</span>`).join('')}
              </div>
              <h2 id="modal-game-title" class="modal-title">${game.title}</h2>
              <p class="modal-platforms">${(game.platforms || []).join(' · ')}</p>
            </div>

            <p class="modal-synopsis">${game.synopsis}</p>

            <hr class="modal-divider" />

            <!-- User Interactive Logging Panel -->
            <div class="modal-logging-section">
              <h3 class="logging-heading">Your Log & Review</h3>

              <!-- Status Toggle Buttons -->
              <div class="status-toggle-row">
                <button 
                  type="button" 
                  class="status-btn ${isPlayed ? 'is-active played' : ''}" 
                  data-set-status="played"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Played
                </button>
                <button 
                  type="button" 
                  class="status-btn ${isPlaying ? 'is-active playing' : ''}" 
                  data-set-status="playing"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  Playing
                </button>
                <button 
                  type="button" 
                  class="status-btn ${isBacklog ? 'is-active backlog' : ''}" 
                  data-set-status="backlog"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Backlog
                </button>
                <button 
                  type="button" 
                  class="status-btn ${isLiked ? 'is-active liked' : ''}" 
                  id="modal-toggle-like"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  Like
                </button>
              </div>

              <!-- 10-Step Half-Star Interactive Widget -->
              <div class="star-rating-box">
                <div class="star-rating-label">
                  <span>Rating:</span>
                  <span id="star-preview-text" class="star-score-text">${this.tempRating ? `★ ${this.tempRating.toFixed(1)}` : 'Rate this game'}</span>
                </div>
                <div class="star-strip" id="star-strip" aria-label="Rate 0.5 to 5.0 stars">
                  ${[1, 2, 3, 4, 5].map(starNum => `
                    <div class="star-item" data-star="${starNum}">
                      <div class="star-half left" data-value="${starNum - 0.5}"></div>
                      <div class="star-half right" data-value="${starNum}"></div>
                      <svg class="star-svg" viewBox="0 0 24 24">
                        <defs>
                          <linearGradient id="half-fill-${starNum}" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="50%" stop-color="var(--color-star-gold)"/>
                            <stop offset="50%" stop-color="var(--color-rule)"/>
                          </linearGradient>
                        </defs>
                        <path class="star-path" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                  `).join('')}
                  ${this.tempRating ? `<button type="button" class="btn-clear-stars" id="btn-clear-rating" title="Clear rating">&times;</button>` : ''}
                </div>
              </div>

              <!-- Review & Log Details Form -->
              <div class="modal-form-fields">
                <div class="form-row-split">
                  <div class="form-group">
                    <label for="input-log-date" class="form-label">Date Logged</label>
                    <input type="date" id="input-log-date" class="form-input" value="${defaultDate}" />
                  </div>
                  <div class="form-group">
                    <label for="input-log-platform" class="form-label">Platform Played</label>
                    <input type="text" id="input-log-platform" class="form-input" placeholder="e.g. PC, PS5..." value="${log.platform || ''}" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="textarea-review" class="form-label">Review / Diary Entry</label>
                  <textarea id="textarea-review" class="form-textarea" rows="3" placeholder="Add notes, memories, or your review for this game...">${log.review || ''}</textarea>
                </div>
              </div>

              <!-- Modal Action Buttons -->
              <div class="modal-footer-actions">
                <button type="button" class="btn btn-secondary" id="btn-add-to-master-rank">
                  + Add to Master Ranking
                </button>
                <button type="button" class="btn btn-accent" id="btn-save-log">
                  Save Log
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachDetailEvents(game, log);
    this.updateStarsVisual(this.tempRating);
  }

  attachDetailEvents(game, log) {
    const modalEl = this.overlay.querySelector('.modal-card');
    const closeBtn = modalEl.querySelector('#modal-close');
    closeBtn.addEventListener('click', () => this.close());

    // Status buttons
    modalEl.querySelectorAll('[data-set-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStatus = btn.getAttribute('data-set-status');
        const currentStatus = store.getUserLog(game.id).status;
        const newStatus = currentStatus === targetStatus ? 'none' : targetStatus;
        store.setStatus(game.id, newStatus);
        this.renderGameDetail();
      });
    });

    // Like toggle
    const likeBtn = modalEl.querySelector('#modal-toggle-like');
    if (likeBtn) {
      likeBtn.addEventListener('click', () => {
        store.toggleLiked(game.id);
        this.renderGameDetail();
      });
    }

    // Half-star interactions
    const starStrip = modalEl.querySelector('#star-strip');
    const previewText = modalEl.querySelector('#star-preview-text');

    starStrip.querySelectorAll('.star-half').forEach(half => {
      const val = parseFloat(half.getAttribute('data-value'));

      // Hover preview
      half.addEventListener('mouseenter', () => {
        this.updateStarsVisual(val);
        previewText.textContent = `★ ${val.toFixed(1)} / 5.0`;
      });

      // Click to set
      half.addEventListener('click', () => {
        this.tempRating = val;
        store.setRating(game.id, val);
        this.updateStarsVisual(this.tempRating);
        previewText.textContent = `★ ${val.toFixed(1)}`;
        window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `Rated "${game.title}" ★ ${val.toFixed(1)}` } }));
        this.renderGameDetail();
      });
    });

    starStrip.addEventListener('mouseleave', () => {
      this.updateStarsVisual(this.tempRating);
      previewText.textContent = this.tempRating ? `★ ${this.tempRating.toFixed(1)}` : 'Rate this game';
    });

    const clearRatingBtn = modalEl.querySelector('#btn-clear-rating');
    if (clearRatingBtn) {
      clearRatingBtn.addEventListener('click', () => {
        this.tempRating = null;
        store.setRating(game.id, null);
        this.renderGameDetail();
      });
    }

    // Add to Master Ranking
    const addRankBtn = modalEl.querySelector('#btn-add-to-master-rank');
    if (addRankBtn) {
      addRankBtn.addEventListener('click', () => {
        store.addGameToMasterRanking(game.id);
        window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `Added "${game.title}" to Master Ranking` } }));
      });
    }

    // Save Log
    const saveBtn = modalEl.querySelector('#btn-save-log');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const reviewText = modalEl.querySelector('#textarea-review').value;
        const logDate = modalEl.querySelector('#input-log-date').value;
        const platform = modalEl.querySelector('#input-log-platform').value.trim();

        store.setUserLog(game.id, {
          review: reviewText,
          logDate: logDate || null,
          platform: platform || null,
          status: store.getUserLog(game.id).status === 'none' && (reviewText || this.tempRating) ? 'played' : store.getUserLog(game.id).status
        });

        window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `Log saved for "${game.title}"` } }));
        this.close();
      });
    }
  }

  updateStarsVisual(score) {
    const starStrip = this.overlay.querySelector('#star-strip');
    if (!starStrip) return;

    starStrip.querySelectorAll('.star-item').forEach(starItem => {
      const starNum = parseInt(starItem.getAttribute('data-star'), 10);
      const path = starItem.querySelector('.star-path');

      if (score >= starNum) {
        path.style.fill = 'var(--color-star-gold)';
        path.style.stroke = 'var(--color-star-gold)';
      } else if (score >= starNum - 0.5) {
        path.style.fill = `url(#half-fill-${starNum})`;
        path.style.stroke = 'var(--color-star-gold)';
      } else {
        path.style.fill = 'var(--color-paper-subtle)';
        path.style.stroke = 'var(--color-rule)';
      }
    });
  }

  renderAddGame() {
    this.overlay.innerHTML = `
      <div class="modal-card modal-form-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-add-title">
        <button type="button" class="modal-close-btn" id="modal-close" aria-label="Close dialog">&times;</button>
        <h2 id="modal-add-title" class="modal-title">Add Video Game to Database</h2>
        <p class="modal-sub">Add any title to your personal GameBoxd catalog. It will persist locally and appear instantly.</p>

        <form id="form-add-game" class="modal-form-vertical">
          <div class="form-row-split">
            <div class="form-group flex-2">
              <label for="new-title" class="form-label">Game Title *</label>
              <input type="text" id="new-title" class="form-input" placeholder="e.g. Hollow Knight: Silksong" required />
            </div>
            <div class="form-group flex-1">
              <label for="new-year" class="form-label">Release Year</label>
              <input type="number" id="new-year" class="form-input" value="${new Date().getFullYear()}" />
            </div>
          </div>

          <div class="form-row-split">
            <div class="form-group">
              <label for="new-developer" class="form-label">Developer Studio</label>
              <input type="text" id="new-developer" class="form-input" placeholder="e.g. Team Cherry" />
            </div>
            <div class="form-group">
              <label for="new-publisher" class="form-label">Publisher</label>
              <input type="text" id="new-publisher" class="form-input" placeholder="e.g. Team Cherry" />
            </div>
          </div>

          <div class="form-row-split">
            <div class="form-group">
              <label for="new-genres" class="form-label">Genres (comma separated)</label>
              <input type="text" id="new-genres" class="form-input" placeholder="e.g. Metroidvania, Action, Indie" />
            </div>
            <div class="form-group">
              <label for="new-platforms" class="form-label">Platforms (comma separated)</label>
              <input type="text" id="new-platforms" class="form-input" placeholder="e.g. PC, Switch, PS5, Xbox Series X/S" />
            </div>
          </div>

          <div class="form-group">
            <label for="new-cover" class="form-label">Cover Poster Web Image URL</label>
            <input type="url" id="new-cover" class="form-input" placeholder="https://..." />
            <span class="form-hint">Paste a portrait cover image URL (IGDB, Steam, or direct link).</span>
          </div>

          <div class="form-group">
            <label for="new-synopsis" class="form-label">Synopsis / Description</label>
            <textarea id="new-synopsis" class="form-textarea" rows="2" placeholder="Brief premise of the game..."></textarea>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-add">Cancel</button>
            <button type="submit" class="btn btn-accent">Add Game to Catalog</button>
          </div>
        </form>
      </div>
    `;

    const modalEl = this.overlay.querySelector('.modal-card');
    modalEl.querySelector('#modal-close').addEventListener('click', () => this.close());
    modalEl.querySelector('#btn-cancel-add').addEventListener('click', () => this.close());

    const form = modalEl.querySelector('#form-add-game');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = modalEl.querySelector('#new-title').value.trim();
      if (!title) return;

      const saved = store.saveCustomGame({
        title,
        releaseYear: modalEl.querySelector('#new-year').value,
        developer: modalEl.querySelector('#new-developer').value,
        publisher: modalEl.querySelector('#new-publisher').value,
        genres: modalEl.querySelector('#new-genres').value,
        platforms: modalEl.querySelector('#new-platforms').value,
        coverUrl: modalEl.querySelector('#new-cover').value,
        synopsis: modalEl.querySelector('#new-synopsis').value
      });

      window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `"${saved.title}" added to your catalog!` } }));
      this.close();
    });
  }

  renderCreateList() {
    this.overlay.innerHTML = `
      <div class="modal-card modal-form-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-list-title">
        <button type="button" class="modal-close-btn" id="modal-close" aria-label="Close dialog">&times;</button>
        <h2 id="modal-list-title" class="modal-title">Create Custom Ranking List</h2>
        <p class="modal-sub">Create a themed leaderboard (e.g. "Best Soulslikes", "GOTY 2024", "Sci-Fi Masterpieces").</p>

        <form id="form-create-list" class="modal-form-vertical">
          <div class="form-group">
            <label for="list-name" class="form-label">List Title *</label>
            <input type="text" id="list-name" class="form-input" placeholder="e.g. Greatest RPGs of All Time" required />
          </div>

          <div class="form-group">
            <label for="list-desc" class="form-label">Description (optional)</label>
            <textarea id="list-desc" class="form-textarea" rows="2" placeholder="What is the criteria or theme for this ranking?"></textarea>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-list">Cancel</button>
            <button type="submit" class="btn btn-accent">Create List</button>
          </div>
        </form>
      </div>
    `;

    const modalEl = this.overlay.querySelector('.modal-card');
    modalEl.querySelector('#modal-close').addEventListener('click', () => this.close());
    modalEl.querySelector('#btn-cancel-list').addEventListener('click', () => this.close());

    const form = modalEl.querySelector('#form-create-list');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = modalEl.querySelector('#list-name').value.trim();
      const desc = modalEl.querySelector('#list-desc').value.trim();
      if (!name) return;

      const newList = store.createCustomList(name, desc);
      window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `List "${newList.name}" created!` } }));
      this.close();
      window.location.hash = `#rankings?list=${newList.id}`;
    });
  }

  renderPickFavorites() {
    const currentFavs = new Set(store.getProfile().topFour || []);
    const allGames = store.getAllGames();

    this.overlay.innerHTML = `
      <div class="modal-card modal-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-favs-title">
        <button type="button" class="modal-close-btn" id="modal-close" aria-label="Close dialog">&times;</button>
        <h2 id="modal-favs-title" class="modal-title">Select Your Top 4 Favorite Games</h2>
        <p class="modal-sub">Click games below to add or remove them from your profile showcase.</p>

        <div class="picker-current-selection">
          <span class="selection-count">Selected: <strong id="fav-count">${currentFavs.size}</strong> of 4</span>
        </div>

        <input type="text" id="fav-search-input" class="form-input" placeholder="Search games to select..." />

        <div class="picker-games-grid" id="picker-grid">
          ${allGames.map(game => {
            const isSelected = currentFavs.has(game.id);
            return `
              <div class="picker-card ${isSelected ? 'is-selected' : ''}" data-game-id="${game.id}">
                <img src="${game.coverUrl}" alt="${game.title}" />
                <span class="picker-card-title">${game.title}</span>
                <span class="picker-check">${isSelected ? '✓' : '+'}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div class="modal-footer-actions">
          <button type="button" class="btn btn-secondary" id="btn-cancel-favs">Done</button>
        </div>
      </div>
    `;

    const modalEl = this.overlay.querySelector('.modal-card');
    modalEl.querySelector('#modal-close').addEventListener('click', () => this.close());
    modalEl.querySelector('#btn-cancel-favs').addEventListener('click', () => this.close());

    // Search filter in picker
    const searchInput = modalEl.querySelector('#fav-search-input');
    const cards = modalEl.querySelectorAll('.picker-card');
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      cards.forEach(card => {
        const title = card.querySelector('.picker-card-title').textContent.toLowerCase();
        card.style.display = title.includes(q) ? '' : 'none';
      });
    });

    // Card selection toggle
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.getAttribute('data-game-id');
        if (currentFavs.has(gameId)) {
          currentFavs.delete(gameId);
          card.classList.remove('is-selected');
          card.querySelector('.picker-check').textContent = '+';
        } else {
          if (currentFavs.size >= 4) {
            alert('You can only pin up to 4 favorite games. Unselect one first.');
            return;
          }
          currentFavs.add(gameId);
          card.classList.add('is-selected');
          card.querySelector('.picker-check').textContent = '✓';
        }
        store.setTopFour(Array.from(currentFavs));
        modalEl.querySelector('#fav-count').textContent = currentFavs.size;
      });
    });
  }
}

