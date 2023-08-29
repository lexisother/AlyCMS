ig.module('site.deps').defines(async () => {
  const ca = await import('https://unpkg.com/crossani@1.3.3/dist/esm/index.js');
  ig.EASE = ca.EASE;
  ig.JUMP = ca.JUMP;
});
