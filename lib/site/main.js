ig.module('site.main')
  .requires('impact.base.impact', 'site.site', 'site.elements', 'site.loader')
  .defines(() => {
    function setupScreen() {
      let width = 0,
        height = 0;
      let originalWidth = 568,
        originalHeight = 360;
      let windowWidth = $(window).width(),
        windowHeight = $(window).height();

      if (windowWidth / windowHeight > originalWidth / originalHeight) {
        height = windowHeight;
        width = (originalWidth * windowHeight) / originalHeight;
      } else {
        width = windowWidth;
        height = (originalHeight * windowWidth) / originalWidth;
      }

      for (let scale = 1; scale < 4; ++scale) {
        if (Math.abs(width - originalWidth * scale) < 4) {
          width = originalWidth * scale;
          height = originalHeight * scale;
        }
      }

      ig.system.setCanvasSize(width, height, true);
    }

    window.IG_DEBUG = true;
    ig.one = new ig.JsonLoadable('/resources/test.json');
    ig.two = new ig.Image('/lib/test.png');

    let ICON_MAPPING = {
      lb: [0, 0],
      rb: [0, 1],
      warn: [0, 2],
    };
    ig.three = new ig.MultiFont('/resources/font.png', 8);
    ig.four = new ig.Font('/resources/icons.png', 8, ig.MultiFont.ICON_START);
    ig.three.pushIconSet(ig.four);
    ig.three.setMapping(ICON_MAPPING);

    ig.main('#canvas', '#canvas-container', ig.Site, 60, 568, 360, 2, ig.StartLoader);
    // TODO: Maybe move to a more convenient place.
    //  Eventually everything low level has to be in the System anyways.
    if (false) {
      setupScreen();
      $(window).on('resize', setupScreen);
    }
  });
