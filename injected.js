(() => {
  const { fetch: originalFetch } = window;
  const TARGET_PATTERN = /^https:\/\/admin-api\.kiwify\.com\.br\/v2\/courses\/[^/]+\/students\//;
  const idByEmail = new Map();

  const extractStudents = (data) => {
    return data.users;
  };

  const ingest = (data) => {
    for (const s of extractStudents(data)) {
      const email = s?.email?.toLowerCase?.();
      const id = s?.id ?? s?._id ?? s?.user_id ?? s?.userId ?? s?.student_id;
      if (email && id) idByEmail.set(email, String(id));
    }
    applyIds();
  };

  const applyIds = () => {
    document.querySelectorAll('table.kiwi-table tbody tr').forEach((tr) => {
      if (tr.dataset.idInjected) return;
      const nameDiv = tr.querySelector('td .text-gray-900.text-sm.font-medium.leading-5');
      const emailDiv = nameDiv?.nextElementSibling;
      if (!nameDiv || !emailDiv) return;
      const email = emailDiv.textContent.trim().toLowerCase();
      const id = idByEmail.get(email);
      if (!id) return;
      const badge = document.createElement('div');
      badge.textContent = `ID: ${id}`;
      badge.style.color = '#f97316';
      badge.style.fontSize = '0.875rem';
      badge.style.lineHeight = '1.25rem';
      emailDiv.insertAdjacentElement('afterend', badge);
      tr.dataset.idInjected = '1';
    });
  };

  const observer = new MutationObserver(() => applyIds());
  const startObserving = () => observer.observe(document.body, { childList: true, subtree: true });
  if (document.body) startObserving();
  else document.addEventListener('DOMContentLoaded', startObserving, { once: true });

  const withPerPage = (rawUrl) => {
    try {
      const u = new URL(rawUrl, window.location.origin);
      u.searchParams.set('per_page', '100');
      return u.toString();
    } catch {
      return rawUrl;
    }
  };

  window.fetch = async (resource, config) => {
    let url = typeof resource === 'string' ? resource : resource instanceof URL ? resource.href : resource?.url ?? '';

    if (TARGET_PATTERN.test(url)) {
      const newUrl = withPerPage(url);
      if (resource instanceof Request) {
        resource = new Request(newUrl, resource);
      } else {
        resource = newUrl;
      }
      url = newUrl;
    }

    const response = await originalFetch(resource, config);

    if (TARGET_PATTERN.test(url)) {
      response.clone().json().then(ingest).catch(() => {});
    }

    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    let finalUrl = typeof url === 'string' ? url : url?.href ?? '';
    if (TARGET_PATTERN.test(finalUrl)) {
      finalUrl = withPerPage(finalUrl);
    }
    this.__interceptUrl = finalUrl;
    return originalOpen.call(this, method, finalUrl, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', () => {
      if (!TARGET_PATTERN.test(this.__interceptUrl ?? '')) return;
      try {
        ingest(JSON.parse(this.responseText));
      } catch {}
    });
    return originalSend.apply(this, args);
  };
})();
