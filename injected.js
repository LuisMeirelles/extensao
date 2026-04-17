(() => {
  const { fetch: originalFetch } = window;
  const TARGET_PATTERN = /^https:\/\/admin-api\.kiwify\.com\.br\/v2\/courses\/[^/]+\/students\//;
  const idByEmail = new Map();

  const extractStudents = (data) => {
    return data.users;
  };

  const ingest = (data) => {
    const students = extractStudents(data);
    if (!Array.isArray(students)) return;
    for (const s of students) {
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

  const redirectIfNumericSearch = (rawUrl) => {
    try {
      const u = new URL(rawUrl, window.location.origin);
      const search = u.searchParams.get('search');
      if (!search || !/^\d+$/.test(search)) return null;
      const m = u.pathname.match(/^(\/v2\/courses\/[^/]+\/students)\/?$/);
      if (!m) return null;
      u.pathname = `${m[1]}/${search}`;
      u.search = '';
      return u.toString();
    } catch {
      return null;
    }
  };

  const jsonResponse = (payload) =>
    new Response(JSON.stringify(payload), {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
    });

  const buildListingPayload = (student) => {
    const users = student ? [student.student] : [];
    const count = users.length;
    return {
      users,
      count,
      total: count,
      page: 1,
      per_page: 100,
      total_pages: count > 0 ? 1 : 0,
      pagination: {
        count,
        total: count,
        page: 1,
        per_page: 100,
        total_pages: count > 0 ? 1 : 0,
      },
    };
  };

  window.fetch = async (resource, config) => {
    let url = typeof resource === 'string' ? resource : resource instanceof URL ? resource.href : resource?.url ?? '';

    if (TARGET_PATTERN.test(url)) {
      const byIdUrl = redirectIfNumericSearch(url);
      if (byIdUrl) {
        const res = await originalFetch(
          resource instanceof Request ? new Request(byIdUrl, resource) : byIdUrl,
          config
        );
        const body = res.ok ? await res.clone().json().catch(() => null) : null;
        const wrapped = buildListingPayload(body);
        console.log('[fetch redirect] body:', body, 'wrapped:', wrapped);
        ingest(wrapped);
        return jsonResponse(wrapped);
      }
    }

    const response = await originalFetch(resource, config);

    if (TARGET_PATTERN.test(url)) {
      response.clone().json().then(ingest).catch(() => {});
    }

    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    const rawUrl = typeof url === 'string' ? url : url?.href ?? '';
    this.__method = method;
    this.__headers = {};
    this.__redirectUrl = null;

    if (TARGET_PATTERN.test(rawUrl)) {
      const byIdUrl = redirectIfNumericSearch(rawUrl);
      if (byIdUrl) {
        this.__redirectUrl = byIdUrl;
      }
    }
    this.__interceptUrl = rawUrl;
    return originalOpen.call(this, method, rawUrl, ...rest);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this.__headers) this.__headers[name] = value;
    return originalSetRequestHeader.call(this, name, value);
  };

  const fakeXhrResponse = (xhr, wrapped) => {
    const text = JSON.stringify(wrapped);
    Object.defineProperty(xhr, 'readyState', { configurable: true, get: () => 4 });
    Object.defineProperty(xhr, 'status', { configurable: true, get: () => 200 });
    Object.defineProperty(xhr, 'statusText', { configurable: true, get: () => 'OK' });
    Object.defineProperty(xhr, 'responseText', { configurable: true, get: () => text });
    Object.defineProperty(xhr, 'response', {
      configurable: true,
      get: () => (xhr.responseType === 'json' ? wrapped : text),
    });
    Object.defineProperty(xhr, 'responseURL', { configurable: true, get: () => xhr.__redirectUrl });
    xhr.dispatchEvent(new Event('readystatechange'));
    xhr.dispatchEvent(new ProgressEvent('load'));
    xhr.dispatchEvent(new ProgressEvent('loadend'));
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (this.__redirectUrl) {
      const xhr = this;
      originalFetch(xhr.__redirectUrl, {
        method: xhr.__method || 'GET',
        headers: xhr.__headers || {},
        credentials: xhr.withCredentials ? 'include' : 'same-origin',
      })
        .then((res) => (res.ok ? res.clone().json().catch(() => null) : null))
        .then((body) => {
          const wrapped = buildListingPayload(body);
          console.log('[xhr redirect] body:', body, 'wrapped:', wrapped);
          ingest(wrapped);
          fakeXhrResponse(xhr, wrapped);
        })
        .catch(() => {
          fakeXhrResponse(xhr, buildListingPayload(null));
        });
      return;
    }

    this.addEventListener('load', () => {
      if (!TARGET_PATTERN.test(this.__interceptUrl ?? '')) return;
      try {
        ingest(JSON.parse(this.responseText));
      } catch {}
    });
    return originalSend.apply(this, args);
  };
})();
