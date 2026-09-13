self.addEventListener("push", (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = {
        body: event.data.text(),
      };
    }
  }

  const title = payload.title || "Mouher";
  const options = {
    body: payload.body || "You have a Mouher update.",
    data: {
      url: payload.url || "/",
      ...(payload.data || {}),
    },
    tag: payload.tag || "mouher-loyalty",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => client.url.endsWith(url));
      if (matchingClient) {
        return matchingClient.focus();
      }

      return self.clients.openWindow(url);
    })
  );
});
