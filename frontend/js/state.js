// ==========================================================================
// Reactive State Store - TestGenAI
// ==========================================================================

class StateStore {
  constructor() {
    this.state = {
      user: null,
      projects: [],
      activeProjectId: null,
      activeProject: null,
      requirements: [],
      activeRequirementId: null,
      activeRequirement: null,
      testCases: [],
      metrics: null,
      traceability: null,
      currentView: 'dashboard',
      isLoading: false,
    };
    this.listeners = new Map();
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this._emit(key, value);
    this._emit('*', this.state);
  }

  update(partialState) {
    Object.assign(this.state, partialState);
    for (const key of Object.keys(partialState)) {
      this._emit(key, partialState[key]);
    }
    this._emit('*', this.state);
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key).delete(callback);
  }

  _emit(key, value) {
    if (this.listeners.has(key)) {
      for (const cb of this.listeners.get(key)) {
        try {
          cb(value);
        } catch (e) {
          console.error(`Error in state listener for ${key}:`, e);
        }
      }
    }
  }
}

export const store = new StateStore();
