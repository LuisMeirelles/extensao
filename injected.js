(() => {
  const { fetch: originalFetch } = window;
  const TARGET_PATTERN = /^https:\/\/admin-api\.kiwify\.com\.br\/v2\/courses\/[^/]+\/students\//;

  window.fetch = async (resource, config) => {
    const url = typeof resource === 'string' ? resource : resource instanceof URL ? resource.href : resource?.url ?? '';

    const response = await originalFetch(resource, config);

    if (TARGET_PATTERN.test(url)) {
      response.clone().json().then((data) => console.log(data)).catch(() => {});
    }

    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__interceptUrl = typeof url === 'string' ? url : url?.href ?? '';
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', () => {
      if (!TARGET_PATTERN.test(this.__interceptUrl ?? '')) return;
      try {
        console.log(JSON.parse(this.responseText));
      } catch {}
    });
    return originalSend.apply(this, args);
  };
})();
