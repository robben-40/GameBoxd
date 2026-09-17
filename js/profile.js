/**
 * GameBoxd Profile Module
 * Letterboxd-style gamer profile with Top 4 Pinned Favorites,
 * stats metrics, logged activity diary, backlog, and JSON backup.
 */

import { store } from './store.js';

export class ProfileController {
  constructor(containerEl, openModalFn) {
    this.container = containerEl;
    this.openModal = openModalFn;
    this.activeTab = 'diary'; // 'diary', 'played', 'backlog', 'lists'

    this.initListeners();
  }

  initListeners() {
    store.subscribe((event) => {
      if (['log_updated', 'profile_updated', 'ranking_updated', 'data_imported', 'init'].includes(event)) {
        this.render();
      }
    });
  }

  render() {
    if (!this.container) return;
    const profile = store.getProfile();
    const stats = store.getProfileStats();
    const topFourGames = (profile.topFour || []).map(id => store.getGameById(id)).filter(Boolean);

    this.container.innerHTML = `
      <div class="profile-header">
        <div class="profile-user-row">
          <div class="profile-avatar">
            <span class="avatar-initials">${profile.username.slice(0, 2).toUpperCase()}</span>
          </div>
          <div class="profile-identity">
            <h2 class="profile-username">${profile.username}</h2>
            <p class="profile-bio">${profile.bio}</p>
          </div>
          <div class="profile-header-actions">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-export-backup" title="Download backup of all ratings & logs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export JSON
            </button>
            <label class="btn btn-secondary btn-sm" id="label-import-backup" title="Import backup JSON file" style="cursor: pointer;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import JSON
              <input type="file" id="input-import-backup" accept=".json" style="display: none;" />
            </label>
          </div>
        </div>

        <!-- Letterboxd Stats Bar -->
        <div class="profile-stats-grid">
          <div class="stat-card">
            <span class="stat-value">${stats.played}</span>
            <span class="stat-label">Played</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.playing}</span>
            <span class="stat-label">Playing</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.backlog}</span>
            <span class="stat-label">Backlog</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.reviews}</span>
            <span class="stat-label">Reviews</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.likes}</span>
            <span class="stat-label">Liked</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.avgRating}</span>
            <span class="stat-label">Avg Rating</span>
          </div>
        </div>
      </div>

      <!-- Letterboxd Iconic Favorite Four Showcase -->
      <section class="favorite-four-section">
        <div class="section-heading-row">
          <div>
            <h3 class="section-heading-title">Favorite Games</h3>
            <span class="section-heading-sub">Your pinned Top 4 games</span>
          </div>
          <button type="button" class="btn btn-sm btn-link" id="btn-edit-favorites">Change Favorites</button>
        </div>

        <div class="favorite-four-grid">
          ${[0, 1, 2, 3].map(slotIdx => {
            const game = topFourGames[slotIdx];
            if (game) {
              const log = store.getUserLog(game.id);
              return `
                <div class="fav-slot filled" data-game-id="${game.id}" title="${game.title} (${game.releaseYear})">
                  <img src="${game.coverUrl}" alt="${game.title}" class="fav-cover" />
                  <div class="fav-overlay">
                    <span class="fav-title">${game.title}</span>
                    <span class="fav-year">${game.releaseYear}</span>
                    ${log.rating ? `<span class="fav-rating">★ ${log.rating.toFixed(1)}</span>` : ''}
                  </div>
                </div>
              `;
            } else {
              return `
                <div class="fav-slot empty" data-slot="${slotIdx}" title="Click to pick a favorite game">
                  <div class="empty-fav-icon">+</div>
                  <span class="empty-fav-label">Slot ${slotIdx + 1}</span>
                </div>
              `;
            }
          }).join('')}
        </div>
      </section>

      <!-- Profile Section Tabs -->
      <div class="profile-tabs-nav" role="tablist">
        <button type="button" class="profile-tab ${this.activeTab === 'diary' ? 'active' : ''}" data-tab="diary">
          Reviews & Diary (${stats.reviews})
        </button>
        <button type="button" class="profile-tab ${this.activeTab === 'played' ? 'active' : ''}" data-tab="played">
          All Played (${stats.played})
        </button>
        <button type="button" class="profile-tab ${this.activeTab === 'backlog' ? 'active' : ''}" data-tab="backlog">
          Backlog (${stats.backlog})
        </button>
        <button type="button" class="profile-tab ${this.activeTab === 'lists' ? 'active' : ''}" data-tab="lists">
          Custom Lists (${(store.getRankings().customLists || []).length})
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="profile-tab-content">
        ${this.renderTabContent()}
      </div>
    `;

    this.attachEvents();
  }

  renderTabContent() {
    const allGames = store.getAllGames();

    if (this.activeTab === 'diary') {
      const reviewed = allGames.filter(game => {
        const log = store.getUserLog(game.id);
        return (log.review && log.review.trim().length > 0) || (log.rating && log.status === 'played');
      });

      if (reviewed.length === 0) {
        return `
          <div class="empty-state">
            <div class="empty-icon">✎</div>
            <h3 class="empty-title">No diary logs yet</h3>
            <p class="empty-desc">Open any game card from Browse and log your playthrough or write a review.</p>
          </div>
        `;
      }

      return `
        <div class="diary-list">
          ${reviewed.map(game => {
            const log = store.getUserLog(game.id);
            const dateStr = log.logDate ? new Date(log.logDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Logged';
            return `
              <article class="diary-entry" data-game-id="${game.id}">
                <img src="${game.coverUrl}" alt="${game.title}" class="diary-thumb" />
                <div class="diary-main">
                  <div class="diary-meta-head">
                    <h4 class="diary-game-title">${game.title} <span class="diary-year">${game.releaseYear}</span></h4>
                    <span class="diary-date">${dateStr}</span>
                  </div>
                  <div class="diary-rating-row">
                    ${log.rating ? `<span class="star-pill">★ ${log.rating.toFixed(1)}</span>` : ''}
                    ${log.liked ? `<span class="liked-pill">♥ Liked</span>` : ''}
                    ${log.platform ? `<span class="platform-pill">${log.platform}</span>` : ''}
                  </div>
                  ${log.review ? `<p class="diary-review-text">${log.review}</p>` : ''}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;
    }

    if (this.activeTab === 'played') {
      const played = allGames.filter(g => store.getUserLog(g.id).status === 'played');
      if (played.length === 0) {
        return `<div class="empty-state"><p class="empty-desc">No games marked as Played yet.</p></div>`;
      }
      return `
        <div class="profile-games-grid">
          ${played.map(game => {
            const log = store.getUserLog(game.id);
            return `
              <div class="profile-mini-card" data-game-id="${game.id}">
                <img src="${game.coverUrl}" alt="${game.title}" />
                <span class="profile-mini-title">${game.title}</span>
                ${log.rating ? `<span class="profile-mini-rating">★ ${log.rating.toFixed(1)}</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (this.activeTab === 'backlog') {
      const backlog = allGames.filter(g => store.getUserLog(g.id).status === 'backlog');
      if (backlog.length === 0) {
        return `<div class="empty-state"><p class="empty-desc">Your backlog is empty. Add games you want to play next!</p></div>`;
      }
      return `
        <div class="profile-games-grid">
          ${backlog.map(game => `
            <div class="profile-mini-card" data-game-id="${game.id}">
              <img src="${game.coverUrl}" alt="${game.title}" />
              <span class="profile-mini-title">${game.title}</span>
              <span class="profile-mini-meta">${game.releaseYear}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.activeTab === 'lists') {
      const lists = store.getRankings().customLists || [];
      if (lists.length === 0) {
        return `<div class="empty-state"><p class="empty-desc">No custom lists created yet. Head to the Rankings tab to make one!</p></div>`;
      }
      return `
        <div class="profile-lists-grid">
          ${lists.map(list => {
            const listGames = (list.gameIds || []).map(id => store.getGameById(id)).filter(Boolean).slice(0, 4);
            return `
              <div class="profile-list-card" data-list-id="${list.id}">
                <div class="list-card-posters">
                  ${listGames.map(g => `<img src="${g.coverUrl}" alt="" />`).join('')}
                </div>
                <h4 class="list-card-title">${list.name}</h4>
                <p class="list-card-count">${(list.gameIds || []).length} games</p>
                <p class="list-card-desc">${list.description || ''}</p>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    return '';
  }

  attachEvents() {
    // Tab switching
    this.container.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.getAttribute('data-tab');
        this.render();
      });
    });

    // Favorite 4 clicks
    this.container.querySelectorAll('.fav-slot.filled').forEach(slot => {
      slot.addEventListener('click', () => {
        const gameId = slot.getAttribute('data-game-id');
        this.openModal('game-detail', gameId);
      });
    });

    const editFavsBtn = this.container.querySelector('#btn-edit-favorites');
    if (editFavsBtn) {
      editFavsBtn.addEventListener('click', () => {
        this.openModal('pick-favorites');
      });
    }

    this.container.querySelectorAll('.fav-slot.empty').forEach(slot => {
      slot.addEventListener('click', () => {
        this.openModal('pick-favorites');
      });
    });

    // Mini card / Diary clicks
    this.container.querySelectorAll('[data-game-id]').forEach(item => {
      item.addEventListener('click', () => {
        const gameId = item.getAttribute('data-game-id');
        this.openModal('game-detail', gameId);
      });
    });

    // Custom list card click -> navigate to ranking tab with that list
    this.container.querySelectorAll('.profile-list-card').forEach(card => {
      card.addEventListener('click', () => {
        const listId = card.getAttribute('data-list-id');
        window.location.hash = `#rankings?list=${listId}`;
      });
    });

    // Export Backup
    const exportBtn = this.container.querySelector('#btn-export-backup');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = store.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gameboxd-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: 'GameBoxd backup downloaded!' } }));
      });
    }

    // Import Backup
    const importInput = this.container.querySelector('#input-import-backup');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const parsed = JSON.parse(ev.target.result);
            store.importData(parsed);
            window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: 'Data imported successfully!' } }));
          } catch (err) {
            alert('Failed to parse backup JSON file.');
          }
        };
        reader.readAsText(file);
      });
    }
  }
}

