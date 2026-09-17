/**
 * GameBoxd State Store
 * Manages game database, user ratings, reviews, rankings, and local persistence.
 */

const STORAGE_KEYS = {
  CUSTOM_GAMES: 'gameboxd_custom_games_v1',
  USER_LOGS: 'gameboxd_user_logs_v1',
  RANKINGS: 'gameboxd_rankings_v1',
  PROFILE: 'gameboxd_profile_v1'
};

class GameBoxdStore {
  constructor() {
    this.baseGames = [];
    this.customGames = [];
    this.userLogs = {};
    this.rankings = {
      master: [],
      customLists: []
    };
    this.profile = {
      username: 'Robben Ethan Athlee',
      bio: 'Curator, critic, and completionist.',
      avatarUrl: '',
      topFour: []
    };
    this.subscribers = new Set();
    this.isLoaded = false;
  }

  /**
   * Initialize store with base games and localStorage records
   */
  async init() {
    // Check if initial games dataset is already in global scope (for file:// protocol compatibility)
    if (typeof window !== 'undefined' && Array.isArray(window.INITIAL_GAMES) && window.INITIAL_GAMES.length > 0) {
      this.baseGames = window.INITIAL_GAMES;
    }

    try {
      const response = await fetch('data/games.json');
      if (response.ok) {
        this.baseGames = await response.json();
      }
    } catch (err) {
      // If fetch fails (e.g. CORS on file:// protocol), verify fallback
      if (!this.baseGames || this.baseGames.length === 0) {
        if (typeof window !== 'undefined' && Array.isArray(window.INITIAL_GAMES)) {
          this.baseGames = window.INITIAL_GAMES;
        }
      }
    }

    // Load custom games
    const savedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_GAMES);
    if (savedCustom) {
      try {
        this.customGames = JSON.parse(savedCustom);
      } catch (e) {
        console.error('Error parsing custom games', e);
      }
    }

    // Load user logs
    const savedLogs = localStorage.getItem(STORAGE_KEYS.USER_LOGS);
    if (savedLogs) {
      try {
        this.userLogs = JSON.parse(savedLogs);
      } catch (e) {
        console.error('Error parsing user logs', e);
      }
    }

    // Load rankings
    const savedRankings = localStorage.getItem(STORAGE_KEYS.RANKINGS);
    if (savedRankings) {
      try {
        this.rankings = JSON.parse(savedRankings);
      } catch (e) {
        console.error('Error parsing rankings', e);
      }
    }

    // Default master ranking if empty: seed with top 10 base games
    if (!this.rankings.master || this.rankings.master.length === 0) {
      const seedIds = [
        'elden-ring',
        'baldurs-gate-3',
        'the-witcher-3',
        'zelda-botw',
        'red-dead-redemption-2',
        'bloodborne',
        'half-life-2',
        'portal-2',
        'hollow-knight',
        'persona-5-royal'
      ];
      this.rankings.master = seedIds.filter(id => this.getGameById(id));
      this.saveRankings();
    }

    // Default custom lists if empty
    if (!this.rankings.customLists || this.rankings.customLists.length === 0) {
      this.rankings.customLists = [
        {
          id: 'best-soulsborne',
          name: 'The Dark Souls & Soulslike Pantheon',
          description: 'Ranked purely by atmosphere, boss design, and combat mastery.',
          gameIds: ['elden-ring', 'bloodborne', 'sekiro', 'dark-souls', 'hollow-knight']
        },
        {
          id: 'narrative-masterpieces',
          name: 'Peak Narrative & Worldbuilding',
          description: 'Games that redefined video game storytelling.',
          gameIds: ['disco-elysium', 'the-witcher-3', 'baldurs-gate-3', 'red-dead-redemption-2', 'outer-wilds', 'mass-effect-2']
        }
      ];
      this.saveRankings();
    }

    // Load profile
    const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        // If the stored profile has the old default username 'GamerZero', migrate to user's name
        if (parsed.username === 'GamerZero') {
          parsed.username = 'Robben Ethan Athlee';
        }
        this.profile = { ...this.profile, ...parsed };
      } catch (e) {
        console.error('Error parsing profile', e);
      }
    }

    // Default Top 4 if empty
    if (!this.profile.topFour || this.profile.topFour.length === 0) {
      this.profile.topFour = ['elden-ring', 'baldurs-gate-3', 'zelda-botw', 'portal-2'];
      this.saveProfile();
    }

    // Seed a couple of default sample logs if first time so profile and cards have initial life
    if (Object.keys(this.userLogs).length === 0) {
      this.userLogs['elden-ring'] = {
        status: 'played',
        rating: 5.0,
        liked: true,
        review: 'An absolute benchmark in open-world art direction and freedom of exploration. Unmatched sense of discovery.',
        logDate: '2024-03-15',
        platform: 'PC'
      };
      this.userLogs['baldurs-gate-3'] = {
        status: 'played',
        rating: 5.0,
        liked: true,
        review: 'The pinnacle of CRPG reactivity. Incredible cast of companions and true tactical player freedom.',
        logDate: '2024-04-02',
        platform: 'PC'
      };
      this.userLogs['hollow-knight'] = {
        status: 'played',
        rating: 5.0,
        liked: true,
        review: 'Moody, melancholic, and mechanically sublime. Hallownest feels living and ancient.',
        logDate: '2024-05-20',
        platform: 'PC'
      };
      this.userLogs['alan-wake-2'] = {
        status: 'playing',
        rating: 4.5,
        liked: true,
        review: 'A bold, surreal survival horror trip that pushes live-action integration and atmosphere to new heights.',
        logDate: '2024-08-10',
        platform: 'PS5'
      };
      this.userLogs['silent-hill-2'] = {
        status: 'backlog',
        rating: null,
        liked: false,
        review: '',
        logDate: null,
        platform: 'PS2'
      };
      this.saveUserLogs();
    }

    this.isLoaded = true;
    this.notify('init');
  }

  /**
   * Subscribe to store mutations
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(event, payload) {
    for (const callback of this.subscribers) {
      try {
        callback(event, payload);
      } catch (err) {
        console.error('Subscriber notification error:', err);
      }
    }
  }

  /**
   * Return combined base and custom games
   */
  getAllGames() {
    return [...this.customGames, ...this.baseGames];
  }

  getGameById(id) {
    return this.getAllGames().find(g => g.id === id) || null;
  }

  /**
   * Add or update a custom game
   */
  saveCustomGame(gameData) {
    const slug = gameData.id || this.slugify(gameData.title);
    const existingIndex = this.customGames.findIndex(g => g.id === slug);

    const game = {
      id: slug,
      title: gameData.title.trim(),
      releaseYear: parseInt(gameData.releaseYear, 10) || new Date().getFullYear(),
      developer: gameData.developer.trim() || 'Independent',
      publisher: gameData.publisher.trim() || 'Self-published',
      genres: Array.isArray(gameData.genres) ? gameData.genres : (gameData.genres || '').split(',').map(s => s.trim()).filter(Boolean),
      platforms: Array.isArray(gameData.platforms) ? gameData.platforms : (gameData.platforms || '').split(',').map(s => s.trim()).filter(Boolean),
      coverUrl: gameData.coverUrl.trim() || 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x76.webp',
      backdropUrl: gameData.backdropUrl.trim() || gameData.coverUrl.trim() || '',
      synopsis: gameData.synopsis.trim() || 'No synopsis provided.',
      avgRating: parseFloat(gameData.avgRating) || 4.5,
      communityRatingCount: parseInt(gameData.communityRatingCount, 10) || 100,
      isCustom: true
    };

    if (existingIndex >= 0) {
      this.customGames[existingIndex] = game;
    } else {
      this.customGames.unshift(game);
    }

    localStorage.setItem(STORAGE_KEYS.CUSTOM_GAMES, JSON.stringify(this.customGames));
    this.notify('game_saved', game);
    return game;
  }

  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-');
  }

  /**
   * User Log Management
   */
  getUserLog(gameId) {
    return this.userLogs[gameId] || {
      status: 'none',
      rating: null,
      liked: false,
      review: '',
      logDate: null,
      platform: null
    };
  }

  setUserLog(gameId, updates) {
    const existing = this.getUserLog(gameId);
    const merged = { ...existing, ...updates };

    // If completely cleared
    if (merged.status === 'none' && !merged.rating && !merged.liked && !merged.review) {
      delete this.userLogs[gameId];
    } else {
      this.userLogs[gameId] = merged;
    }

    this.saveUserLogs();
    this.notify('log_updated', { gameId, log: merged });
  }

  saveUserLogs() {
    localStorage.setItem(STORAGE_KEYS.USER_LOGS, JSON.stringify(this.userLogs));
  }

  toggleLiked(gameId) {
    const current = this.getUserLog(gameId);
    this.setUserLog(gameId, { liked: !current.liked });
  }

  setStatus(gameId, status) {
    const current = this.getUserLog(gameId);
    const newStatus = current.status === status ? 'none' : status;
    const updates = { status: newStatus };
    if (newStatus === 'played' && !current.logDate) {
      updates.logDate = new Date().toISOString().split('T')[0];
    }
    this.setUserLog(gameId, updates);
  }

  setRating(gameId, rating) {
    const current = this.getUserLog(gameId);
    const newRating = current.rating === rating ? null : rating;
    const updates = { rating: newRating };
    if (newRating && current.status === 'none') {
      updates.status = 'played';
      if (!current.logDate) {
        updates.logDate = new Date().toISOString().split('T')[0];
      }
    }
    this.setUserLog(gameId, updates);
  }

  /**
   * Rankings Management
   */
  getRankings() {
    return this.rankings;
  }

  getMasterRankingGames() {
    return (this.rankings.master || [])
      .map(id => this.getGameById(id))
      .filter(Boolean);
  }

  setMasterRankingOrder(gameIds) {
    this.rankings.master = gameIds;
    this.saveRankings();
    this.notify('ranking_updated', { listId: 'master', gameIds });
  }

  addGameToMasterRanking(gameId) {
    if (!this.rankings.master.includes(gameId)) {
      this.rankings.master.push(gameId);
      this.saveRankings();
      this.notify('ranking_updated', { listId: 'master', gameIds: this.rankings.master });
    }
  }

  removeGameFromMasterRanking(gameId) {
    this.rankings.master = this.rankings.master.filter(id => id !== gameId);
    this.saveRankings();
    this.notify('ranking_updated', { listId: 'master', gameIds: this.rankings.master });
  }

  createCustomList(name, description = '') {
    const id = 'list-' + Date.now();
    const newList = {
      id,
      name: name.trim() || 'Untitled List',
      description: description.trim(),
      gameIds: []
    };
    this.rankings.customLists.push(newList);
    this.saveRankings();
    this.notify('custom_list_created', newList);
    return newList;
  }

  deleteCustomList(listId) {
    this.rankings.customLists = this.rankings.customLists.filter(l => l.id !== listId);
    this.saveRankings();
    this.notify('custom_list_deleted', listId);
  }

  setCustomListOrder(listId, gameIds) {
    const list = this.rankings.customLists.find(l => l.id === listId);
    if (list) {
      list.gameIds = gameIds;
      this.saveRankings();
      this.notify('ranking_updated', { listId, gameIds });
    }
  }

  addGameToCustomList(listId, gameId) {
    const list = this.rankings.customLists.find(l => l.id === listId);
    if (list && !list.gameIds.includes(gameId)) {
      list.gameIds.push(gameId);
      this.saveRankings();
      this.notify('ranking_updated', { listId, gameIds: list.gameIds });
    }
  }

  removeGameFromCustomList(listId, gameId) {
    const list = this.rankings.customLists.find(l => l.id === listId);
    if (list) {
      list.gameIds = list.gameIds.filter(id => id !== gameId);
      this.saveRankings();
      this.notify('ranking_updated', { listId, gameIds: list.gameIds });
    }
  }

  saveRankings() {
    localStorage.setItem(STORAGE_KEYS.RANKINGS, JSON.stringify(this.rankings));
  }

  /**
   * Profile & Top Four
   */
  getProfile() {
    return this.profile;
  }

  saveProfile(updates = {}) {
    this.profile = { ...this.profile, ...updates };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(this.profile));
    this.notify('profile_updated', this.profile);
  }

  /**
   * Update profile fields (username, bio, avatarUrl)
   */
  updateProfile(data = {}) {
    const updates = {};
    if (typeof data.username === 'string' && data.username.trim()) {
      updates.username = data.username.trim();
    }
    if (typeof data.bio === 'string') {
      updates.bio = data.bio.trim();
    }
    if (typeof data.avatarUrl === 'string') {
      updates.avatarUrl = data.avatarUrl.trim();
    }
    this.saveProfile(updates);
  }

  setTopFour(topFourIds) {
    this.profile.topFour = topFourIds.slice(0, 4);
    this.saveProfile();
  }

  /**
   * Aggregate Metrics for Profile
   */
  getProfileStats() {
    const logs = Object.values(this.userLogs);
    const played = logs.filter(l => l.status === 'played').length;
    const playing = logs.filter(l => l.status === 'playing').length;
    const backlog = logs.filter(l => l.status === 'backlog').length;
    const rated = logs.filter(l => typeof l.rating === 'number' && l.rating > 0);
    const reviews = logs.filter(l => l.review && l.review.trim().length > 0).length;
    const likes = logs.filter(l => l.liked).length;

    const avgRating = rated.length > 0
      ? (rated.reduce((acc, l) => acc + l.rating, 0) / rated.length).toFixed(1)
      : '—';

    return {
      played,
      playing,
      backlog,
      ratedCount: rated.length,
      reviews,
      likes,
      avgRating
    };
  }

  /**
   * Export all user data as JSON
   */
  exportAllData() {
    return {
      exportDate: new Date().toISOString(),
      customGames: this.customGames,
      userLogs: this.userLogs,
      rankings: this.rankings,
      profile: this.profile
    };
  }

  /**
   * Import data from JSON
   */
  importData(importedData) {
    if (importedData.customGames) {
      this.customGames = importedData.customGames;
      localStorage.setItem(STORAGE_KEYS.CUSTOM_GAMES, JSON.stringify(this.customGames));
    }
    if (importedData.userLogs) {
      this.userLogs = importedData.userLogs;
      this.saveUserLogs();
    }
    if (importedData.rankings) {
      this.rankings = importedData.rankings;
      this.saveRankings();
    }
    if (importedData.profile) {
      this.profile = importedData.profile;
      this.saveProfile();
    }
    this.notify('data_imported');
  }
}

export const store = new GameBoxdStore();
