import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VersionChecker from '../index.js';

function mockFetch(response) {
  return vi.fn().mockImplementation(async () => {
    if (typeof response === 'function') return response();
    return response;
  });
}

function setVisible(state) {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  });
}

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
}

describe('VersionChecker', () => {
  beforeEach(() => {
    setVisible('visible');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('throws when htmlUrl is missing', () => {
    expect(() => new VersionChecker('', null, () => {})).toThrow('htmlUrl is required');
  });

  it('throws when callback is not a function', () => {
    expect(() => new VersionChecker('https://x.com/v.html', null, 'nope')).toThrow(
      'callback must be a function'
    );
  });

  it('throws when regex has no capture group', () => {
    expect(() => new VersionChecker('https://x.com/v.html', /\d+\.\d+\.\d+/, () => {})).toThrow(
      'capture group'
    );
  });

  it('accepts a regex with a capture group', () => {
    const fetchMock = mockFetch({ ok: true, text: async () => 'version: 1.0.0' });
    vi.stubGlobal('fetch', fetchMock);
    expect(() => new VersionChecker('https://x.com/v.html', /version:\s*([\d.]+)/, () => {})).not.toThrow();
  });

  it('fires callback when content changes after tab becomes visible', async () => {
    let content = 'version: 1.0.0';
    vi.stubGlobal(
      'fetch',
      mockFetch({ ok: true, text: async () => content })
    );
    const callback = vi.fn();
    new VersionChecker('https://x.com/v.html', /version:\s*([\d.]+)/, callback);
    await flush();
    expect(callback).not.toHaveBeenCalled(); // baseline only

    content = 'version: 2.0.0';
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('2.0.0');
  });

  it('does not fire callback when content is unchanged', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ ok: true, text: async () => 'version: 1.0.0' })
    );
    const callback = vi.fn();
    new VersionChecker('https://x.com/v.html', /version:\s*([\d.]+)/, callback);
    await flush();

    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(callback).not.toHaveBeenCalled();
  });

  it('never fires a false alert when the first fetch fails', async () => {
    let fail = true;
    vi.stubGlobal(
      'fetch',
      mockFetch(() => (fail ? Promise.reject(new Error('network')) : { ok: true, text: async () => 'v:1' }))
    );
    const callback = vi.fn();
    new VersionChecker('https://x.com/v.html', /v:(.+)/, callback);
    await flush();
    expect(callback).not.toHaveBeenCalled(); // baseline failed

    // later fetch succeeds — should silently set baseline, NOT alert
    fail = false;
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(callback).not.toHaveBeenCalled();

    // content changes after a valid baseline exists — now alert
    vi.stubGlobal('fetch', mockFetch({ ok: true, text: async () => 'v:2' }));
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does nothing when tab becomes hidden', async () => {
    const fetchMock = mockFetch({ ok: true, text: async () => 'v:1' });
    vi.stubGlobal('fetch', fetchMock);
    const callback = vi.fn();
    new VersionChecker('https://x.com/v.html', /(v):(.+)/, callback);
    await flush();

    setVisible('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(callback).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1); // no extra fetch
  });

  it('destroy() removes the visibilitychange listener', async () => {
    const fetchMock = mockFetch({ ok: true, text: async () => 'v:1' });
    vi.stubGlobal('fetch', fetchMock);
    const callback = vi.fn();
    const checker = new VersionChecker('https://x.com/v.html', /(v):(.+)/, callback);
    await flush();

    vi.stubGlobal('fetch', mockFetch({ ok: true, text: async () => 'v:2' }));
    checker.destroy();
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(callback).not.toHaveBeenCalled();
  });

  it('compares the whole body when no regex is given', async () => {
    let body = '<html>hello</html>';
    vi.stubGlobal('fetch', mockFetch({ ok: true, text: async () => body }));
    const callback = vi.fn();
    new VersionChecker('https://x.com/v.html', null, callback);
    await flush();

    body = '<html>world</html>';
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('<html>world</html>');
  });
});
