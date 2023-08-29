ig.module('site.deps').defines(async () => {
  const ca = await import('https://unpkg.com/crossani@1.3.3/dist/esm/index.js');
  ig.EASE = ca.EASE;
  ig.JUMP = ca.JUMP;

  const logto = await import("https://cdn.jsdelivr.net/npm/@logto/browser@2.1.1/+esm");
  window.logto = logto;

  const logtoClient = new logto.default({
    endpoint: "https://auth.fyralabs.com",
    appId: "eewbfi2u6pziz9cu46bat"
  })
  window.logtoClient = logtoClient;

  if (window.location.pathname === "/callback.html") {
    await logtoClient.handleSignInCallback(window.location.href);
    window.location.href = "/cms.html";
  }

  if (window.location.pathname === "/cms.html") {
    const info = await logtoClient.fetchUserInfo();
    console.log(info);
  }
});
