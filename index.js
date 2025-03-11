class VersionChecker {
  #htmlUrl;
  #reg;
  #lastStr;
  #callback;


  constructor(htmlUrl, reg,callback) {
    if (!htmlUrl) {
      throw new Error('htmlUrl is required');
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    this.#htmlUrl = htmlUrl;
    this.#reg = reg;
    this.#callback = callback;
    this.#init();
    document.addEventListener('visibilitychange', this.#handleVisibilityChange.bind(this));
  }

  async #init(){
    this.#lastStr = await this.#fetchHtmlStr();
  }

  async #handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      const newStr = await this.#fetchHtmlStr();
      if (newStr && newStr !== this.#lastStr) {
        this.#callback();
        this.#lastStr = newStr;
      }
    }
  }

  async #fetchHtmlStr(){
    let string = null;
    try{
      const res = await fetch(`${this.#htmlUrl}?time=${Date.now()}`,{ cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to fetch version URL');
      }
      const html = await res.text();
      if(this.#reg){
        string = html.match(this.#reg)?.[1] || '';
      }else{
        string = html;
      }
    }catch(err){
      console.log(err);
    }
    return string;
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.#handleVisibilityChange.bind(this));
  }
}