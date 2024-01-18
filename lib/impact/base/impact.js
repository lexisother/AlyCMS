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
      // TODO: DO SOMETHING BETTER THAN THIS!!! (and move it to the System)
      ig.input = {
        mouse: {
          x: 0,
          y: 0,
          clicked: true,
        },
        getMouseCoords(mouse, event, canvas) {
          let el = canvas;
          let pos = {left: 0, top: 0};
          while (el != null) {
            pos.left += el.offsetLeft;
            pos.top += el.offsetTop;
            el = el.offsetParent;
          }

          let tx = event.pageX;
          let ty = event.pageY;
          if (event.touches) {
            tx = event.touches[0].clientX;
            ty = event.touches[0].clientY;
          }

          mouse.x = tx - pos.left;
          mouse.y = ty - pos.top;
        }
      };
      ig.system.canvas.addEventListener('mousemove', (e) => {
        ig.input.getMouseCoords(ig.input.mouse, e, ig.system.canvas)
        ig.input.mouse.x = ig.input.mouse.x * (ig.system.width / ig.system.screenWidth);
        ig.input.mouse.y = ig.input.mouse.y * (ig.system.height / ig.system.screenHeight)
      });
      ig.system.canvas.addEventListener('mouseup', (e) => {
        ig.input.mouse.clicked = true;
      });

      let loader = new (loaderClass || ig.Loader)(siteClass);
      loader.load();
      ig.mainLoader = loader;
    };
  });
