ig.module('impact.base.impact')
  .requires(
    'dom.ready',
    'impact.base.image',
    'impact.base.font',
    'impact.base.loader',
    'impact.base.system',
    'impact.base.vars',
  )
  .defines(() => {
    ig.mainLoader = null;
    ig.main = (canvasId, inputDomId, siteClass, fps, width, height, scale, loaderClass) => {
      ig.system = new ig.System(canvasId, inputDomId, fps, width, height, scale || 1);
      ig.ready = true;

      let loader = new (loaderClass || ig.Loader)(siteClass);
      loader.load();
      ig.mainLoader = loader;
    };
  });
