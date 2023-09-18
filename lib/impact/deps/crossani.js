ig.module('site.deps.crossani').defines(async () => {
  const ca = await import('https://unpkg.com/crossani@1.3.3/dist/esm/index.js');
  window.KEY_SPLINES = {
    EASE: ca.EASE,
    JUMP: ca.JUMP,
  };
});
