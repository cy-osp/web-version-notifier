class VersionChecker {
  #htmlUrl;
  #reg;
  #lastStr = null;
  #baselineReady = false;
  #callback;
  #onVisibilityChange;

  constructor(htmlUrl, reg, callback) {
    if (!htmlUrl) {
      throw new Error('htmlUrl is required');
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    if (reg && !/\(/.test(reg.source)) {
      throw new Error('reg must contain at least one capture group, e.g. /version:\\s*([\\d.]+)/');
    }
    this.#htmlUrl = htmlUrl;
    this.#reg = reg;
    this.#callback = callback;
    // Keep a single bound reference so destroy() can actually remove the listener
    this.#onVisibilityChange = this.#handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.#onVisibilityChange);
    this.#init();
  }

  async #init() {
    const str = await this.#fetchVersionStr();
    this.#setBaseline(str);
  }

  /**
   * Set the baseline. The callback never fires until a valid baseline exists,
   * so a failed first fetch cannot cause a false "new version" alert.
   */
  #setBaseline(str) {
    if (str === null || this.#baselineReady) return;
    this.#lastStr = str;
    this.#baselineReady = true;
  }

  async #handleVisibilityChange() {
    if (document.visibilityState !== 'visible') return;
    const newStr = await this.#fetchVersionStr();
    if (newStr === null) return; // fetch failed — ignore, never alert on errors
    if (!this.#baselineReady) {
      this.#setBaseline(newStr);
      return;
    }
    if (newStr !== this.#lastStr) {
      this.#callback(newStr);
      this.#lastStr = newStr;
    }
  }

  async #fetchVersionStr() {
    try {
      const res = await fetch(`${this.#htmlUrl}?time=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch version URL (HTTP ${res.status})`);
      }
      const html = await res.text();
      if (this.#reg) {
        return html.match(this.#reg)?.[1] || '';
      }
      return html;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.#onVisibilityChange);
  }
}

export default VersionChecker;
