chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== 'KIWIFY_TOKEN' || typeof message.token !== 'string' || !message.deviceToken) return;
    const API_BASE_URL = 'https://presuppurative-uncoordinately-jacquelyne.ngrok-free.dev';
    const INTEGRATION_USER = `kiwi`;
    const INTEGRATION_PASSWORD = `token`;

    const basicToken = btoa(`${INTEGRATION_USER}:${INTEGRATION_PASSWORD}`);

    fetch(`${API_BASE_URL}/kiwify/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${basicToken}`,
        },
        body: JSON.stringify({token: message.token, deviceToken: message.deviceToken, store: message.store}),
    }).catch((e) => {
        console.error('Error sending token:', e);
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.disable();

    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: {hostEquals: "dashboard.kiwify.com", schemes: ["https"]},
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: {hostEquals: "dashboard.kiwify.com.br", schemes: ["https"]},
                    }),
                ],
                actions: [new chrome.declarativeContent.ShowAction()],
            },
        ]);
    });
});
