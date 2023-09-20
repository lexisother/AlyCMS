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

      // Reluctantly polyfilling the input system
      // TODO: FIND SOMETHING BETTER THAN THIS!!! (and move it to the System)
      ig.input = {
        mouse: {
          x: 0,
          y: 0,
          clicked: true,
        },
      };
      ig.system.canvas.addEventListener('mousemove', (e) => {
        ig.input.mouse.x = e.offsetX;
        ig.input.mouse.y = e.offsetY;
      });
      ig.system.canvas.addEventListener('mouseup', (e) => {
        ig.input.mouse.clicked = true;
      });

      let loader = new (loaderClass || ig.Loader)(siteClass);
      loader.load();
      ig.mainLoader = loader;
    };
  });
