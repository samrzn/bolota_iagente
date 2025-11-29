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

  getLastMedication(sessionId) {
    return this.get(sessionId).lastMedication;
  }

  setLastMedication(sessionId, medicationName) {
    this.set(sessionId, { lastMedication: medicationName });
  }
}

export default new StateManager();
