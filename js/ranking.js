/**
 * GameBoxd Ranking Module
 * Full Drag-and-Drop ranking interface with real-time reordering,
 * master leaderboard + custom themed lists, and markdown export.
 */

import { store } from './store.js';

export class RankingController {
  constructor(containerEl, openModalFn) {
    this.container = containerEl;
    this.openModal = openModalFn;
    this.currentListId = 'master'; // 'master' or custom list ID
    this.draggedIndex = null;
    this.searchQuery = '';

    this.initListeners();
  }

  initListeners() {
    store.subscribe((event) => {
      if (['ranking_updated', 'custom_list_created', 'custom_list_deleted', 'game_saved', 'data_imported', 'init'].includes(event)) {
        this.render();
      }
    });
  }

  switchList(listId) {
    this.currentListId = listId;
    this.searchQuery = '';
    this.render();
  }

  getCurrentList() {
    if (this.currentListId === 'master') {
      return {
        id: 'master',
        name: 'All-Time Top Games',
        description: 'Your definitive master ranking of the greatest video games of all time.',
        gameIds: store.getRankings().master || []
      };
    }
    const found = (store.getRankings().customLists || []).find(l => l.id === this.currentListId);
    if (!found) {
      this.currentListId = 'master';
      return this.getCurrentList();
    }
    return found;
  }

  render() {
    if (!this.container) return;
    const currentList = this.getCurrentList();
    const rankings = store.getRankings();
    const customLists = rankings.customLists || [];
    const games = currentList.gameIds.map(id => store.getGameById(id)).filter(Boolean);

    this.container.innerHTML = `
      <div class="ranking-header">
        <div class="ranking-header-main">
          <div class="ranking-title-group">
            <span class="ranking-badge">Rankings Workspace</span>
            <h2 class="ranking-title">${currentList.name}</h2>
            <p class="ranking-desc">${currentList.description || 'Drag items up and down to adjust order.'}</p>
          </div>

          <div class="ranking-actions-top">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-create-list">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New List
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-export-rankings" title="Export this ranked list">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Export
            </button>
            ${currentList.id !== 'master' ? `
              <button type="button" class="btn btn-danger-outline btn-sm" id="btn-delete-list" title="Delete this list">
                Delete List
              </button>
            ` : ''}
          </div>
        </div>

        <!-- List Selector Tabs -->
        <div class="ranking-tabs-nav" role="tablist">
          <button 
            type="button" 
            class="ranking-tab ${this.currentListId === 'master' ? 'active' : ''}" 
            data-list-id="master"
          >
            All-Time Top (${(rankings.master || []).length})
          </button>
          ${customLists.map(list => `
            <button 
              type="button" 
              class="ranking-tab ${this.currentListId === list.id ? 'active' : ''}" 
              data-list-id="${list.id}"
            >
              ${list.name} (${(list.gameIds || []).length})
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Add Game to Ranking Search Bar -->
      <div class="ranking-add-bar">
        <div class="ranking-search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            id="ranking-game-search" 
            class="ranking-input" 
            placeholder="Search game from database to add to this ranking..." 
            value="${this.searchQuery}"
            autocomplete="off"
          />
          ${this.searchQuery ? `<button type="button" class="clear-input-btn" id="btn-clear-ranking-search">&times;</button>` : ''}
        </div>
        <div id="ranking-search-results" class="ranking-search-dropdown ${this.searchQuery ? 'open' : ''}"></div>
      </div>

      <!-- Draggable Ranking List -->
      <div class="ranking-list-container">
        ${games.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">☰</div>
            <h3 class="empty-title">Ranking list is empty</h3>
            <p class="empty-desc">Use the search bar above or click "+ Add to Rank" from the Browse catalog to populate this list.</p>
          </div>
        ` : `
          <div class="ranking-drag-list" id="ranking-sortable-list" aria-label="Ranked games list">
            ${games.map((game, index) => this.createRankItemHTML(game, index, games.length)).join('')}
          </div>
        `}
      </div>
    `;

    this.attachEvents();
    if (this.searchQuery) {
      this.renderSearchResults();
    }
  }

  createRankItemHTML(game, index, total) {
    const rankNum = String(index + 1).padStart(2, '0');
    const log = store.getUserLog(game.id);
    const userRating = typeof log.rating === 'number' && log.rating > 0 ? `★ ${log.rating.toFixed(1)}` : null;

    return `
      <div 
        class="rank-item" 
        draggable="true" 
        data-index="${index}" 
        data-game-id="${game.id}"
        tabindex="0"
        role="listitem"
        aria-label="Rank ${index + 1}: ${game.title}"
      >
        <div class="rank-drag-handle" title="Drag to reorder" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/>
            <circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
            <circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
          </svg>
        </div>

        <div class="rank-num">${rankNum}</div>

        <div class="rank-cover">
          <img 
            src="${game.coverUrl}" 
            alt="${game.title}" 
            loading="lazy" 
            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'90\\' viewBox=\\'0 0 60 90\\'%3E%3Crect fill=\\'%231b2028\\' width=\\'60\\' height=\\'90\\'/%3E%3C/svg%3E';"
          />
        </div>

        <div class="rank-details">
          <div class="rank-title-row">
            <h4 class="rank-title">${game.title}</h4>
            <span class="rank-year">${game.releaseYear}</span>
          </div>
          <div class="rank-meta-row">
            <span class="rank-developer">${game.developer}</span>
            <span class="rank-genres">${(game.genres || []).slice(0, 2).join(' · ')}</span>
            ${userRating ? `<span class="rank-user-score">${userRating}</span>` : `<span class="rank-avg-score">Community: ★ ${game.avgRating.toFixed(1)}</span>`}
          </div>
        </div>

        <!-- Touch & Keyboard Friendly Step Controls -->
        <div class="rank-controls">
          <button 
            type="button" 
            class="rank-step-btn" 
            data-action="move-up" 
            data-index="${index}" 
            title="Move Up" 
            ${index === 0 ? 'disabled' : ''}
            aria-label="Move ${game.title} up"
          >
            ▲
          </button>
          <button 
            type="button" 
            class="rank-step-btn" 
            data-action="move-down" 
            data-index="${index}" 
            title="Move Down" 
            ${index === total - 1 ? 'disabled' : ''}
            aria-label="Move ${game.title} down"
          >
            ▼
          </button>
          <button 
            type="button" 
            class="rank-remove-btn" 
            data-action="remove-rank" 
            data-index="${index}" 
            data-game-id="${game.id}" 
            title="Remove from list"
            aria-label="Remove ${game.title} from ranking"
          >
            &times;
          </button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    // List tabs switching
    this.container.querySelectorAll('.ranking-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const listId = tab.getAttribute('data-list-id');
        this.switchList(listId);
      });
    });

    // Create custom list button
    const createBtn = this.container.querySelector('#btn-create-list');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.openModal('create-list');
      });
    }

    // Delete custom list button
    const deleteBtn = this.container.querySelector('#btn-delete-list');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete "${this.getCurrentList().name}"?`)) {
          store.deleteCustomList(this.currentListId);
          this.switchList('master');
          window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: 'Ranking list deleted' } }));
        }
      });
    }

    // Export button
    const exportBtn = this.container.querySelector('#btn-export-rankings');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportList());
    }

    // Search input
    const searchInput = this.container.querySelector('#ranking-game-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderSearchResults();
      });
    }

    const clearSearchBtn = this.container.querySelector('#btn-clear-ranking-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    // Rank step buttons (Move Up / Down / Remove)
    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const index = parseInt(btn.getAttribute('data-index'), 10);
        const gameId = btn.getAttribute('data-game-id');

        if (action === 'move-up') {
          this.swapItems(index, index - 1);
        } else if (action === 'move-down') {
          this.swapItems(index, index + 1);
        } else if (action === 'remove-rank') {
          this.removeItem(gameId);
        }
      });
    });

    // Native Drag and Drop Setup
    this.attachDragAndDrop();
  }

  attachDragAndDrop() {
    const listEl = this.container.querySelector('#ranking-sortable-list');
    if (!listEl) return;

    const items = listEl.querySelectorAll('.rank-item');

    items.forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        this.draggedIndex = parseInt(item.getAttribute('data-index'), 10);
        item.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(this.draggedIndex));
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
        items.forEach(el => el.classList.remove('drag-over-above', 'drag-over-below'));
        this.draggedIndex = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const currentIndex = parseInt(item.getAttribute('data-index'), 10);
        if (this.draggedIndex === null || this.draggedIndex === currentIndex) return;

        const rect = item.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
          item.classList.add('drag-over-above');
          item.classList.remove('drag-over-below');
        } else {
          item.classList.add('drag-over-below');
          item.classList.remove('drag-over-above');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over-above', 'drag-over-below');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIndex = parseInt(item.getAttribute('data-index'), 10);
        item.classList.remove('drag-over-above', 'drag-over-below');

        if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;

        const rect = item.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        let finalDropIndex = targetIndex;

        if (e.clientY > midpoint && this.draggedIndex < targetIndex) {
          finalDropIndex = targetIndex;
        } else if (e.clientY < midpoint && this.draggedIndex > targetIndex) {
          finalDropIndex = targetIndex;
        }

        this.moveItem(this.draggedIndex, finalDropIndex);
      });
    });
  }

  moveItem(fromIndex, toIndex) {
    const currentList = this.getCurrentList();
    const gameIds = [...currentList.gameIds];
    const [moved] = gameIds.splice(fromIndex, 1);
    gameIds.splice(toIndex, 0, moved);

    if (this.currentListId === 'master') {
      store.setMasterRankingOrder(gameIds);
    } else {
      store.setCustomListOrder(this.currentListId, gameIds);
    }
  }

  swapItems(indexA, indexB) {
    const currentList = this.getCurrentList();
    const gameIds = [...currentList.gameIds];
    if (indexA < 0 || indexB < 0 || indexA >= gameIds.length || indexB >= gameIds.length) return;

    const temp = gameIds[indexA];
    gameIds[indexA] = gameIds[indexB];
    gameIds[indexB] = temp;

    if (this.currentListId === 'master') {
      store.setMasterRankingOrder(gameIds);
    } else {
      store.setCustomListOrder(this.currentListId, gameIds);
    }
  }

  removeItem(gameId) {
    if (this.currentListId === 'master') {
      store.removeGameFromMasterRanking(gameId);
    } else {
      store.removeGameFromCustomList(this.currentListId, gameId);
    }
    window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `Removed from ${this.getCurrentList().name}` } }));
  }

  renderSearchResults() {
    const dropdown = this.container.querySelector('#ranking-search-results');
    if (!dropdown) return;

    if (!this.searchQuery) {
      dropdown.classList.remove('open');
      dropdown.innerHTML = '';
      return;
    }

    const currentList = this.getCurrentList();
    const currentIds = new Set(currentList.gameIds);
    const matches = store.getAllGames().filter(game => {
      const matchTitle = game.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchDev = (game.developer || '').toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchTitle || matchDev;
    }).slice(0, 8);

    if (matches.length === 0) {
      dropdown.innerHTML = `<div class="search-drop-empty">No games found matching "${this.searchQuery}"</div>`;
      dropdown.classList.add('open');
      return;
    }

    dropdown.innerHTML = matches.map(game => {
      const isAlreadyInList = currentIds.has(game.id);
      return `
        <div class="search-drop-item" data-game-id="${game.id}">
          <img src="${game.coverUrl}" alt="" class="search-drop-thumb" />
          <div class="search-drop-info">
            <span class="search-drop-title">${game.title} (${game.releaseYear})</span>
            <span class="search-drop-dev">${game.developer} · ★ ${game.avgRating.toFixed(1)}</span>
          </div>
          <button 
            type="button" 
            class="btn btn-sm ${isAlreadyInList ? 'btn-disabled' : 'btn-accent'}" 
            data-add-id="${game.id}" 
            ${isAlreadyInList ? 'disabled' : ''}
          >
            ${isAlreadyInList ? 'Added' : '+ Add'}
          </button>
        </div>
      `;
    }).join('');
    dropdown.classList.add('open');

    // Attach click events to add buttons
    dropdown.querySelectorAll('[data-add-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gameId = btn.getAttribute('data-add-id');
        if (this.currentListId === 'master') {
          store.addGameToMasterRanking(gameId);
        } else {
          store.addGameToCustomList(this.currentListId, gameId);
        }
        this.searchQuery = '';
        this.render();
        window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: `Added "${store.getGameById(gameId)?.title}" to rank list` } }));
      });
    });
  }

  exportList() {
    const currentList = this.getCurrentList();
    const games = currentList.gameIds.map(id => store.getGameById(id)).filter(Boolean);

    if (games.length === 0) {
      alert('Ranking list is currently empty.');
      return;
    }

    let markdown = `# ${currentList.name}\n${currentList.description ? `*${currentList.description}*\n\n` : '\n'}`;
    games.forEach((game, index) => {
      const log = store.getUserLog(game.id);
      const score = log.rating ? `(My Rating: ${log.rating.toFixed(1)}/5.0)` : `(Community: ${game.avgRating.toFixed(1)}/5.0)`;
      markdown += `${index + 1}. **${game.title}** (${game.releaseYear}) — ${game.developer} ${score}\n`;
    });
    markdown += `\n*Exported from GameBoxd on ${new Date().toLocaleDateString()}*`;

    navigator.clipboard.writeText(markdown).then(() => {
      window.dispatchEvent(new CustomEvent('toast-notify', { detail: { text: 'Ranking list copied to clipboard as Markdown!' } }));
    }).catch(() => {
      prompt('Copy your ranking list:', markdown);
    });
  }
}

