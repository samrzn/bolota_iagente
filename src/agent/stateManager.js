class StateManager {
  constructor() {
    this.sessions = new Map();
  }

  get(sessionId) {
    return this.sessions.get(sessionId) || { lastMedication: null, step: null };
  }

  set(sessionId, payload) {
    const prev = this.get(sessionId);
    const next = { ...prev, ...payload };
    this.sessions.set(sessionId, next);
    return next;
  }

  clear(sessionId) {
    this.sessions.delete(sessionId);
  }
}

export default new StateManager();
