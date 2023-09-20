ig.module('impact.feature.gui.base.basic-gui')
  .requires('impact.feature.gui.gui')
  .defines(() => {
    ig.ColorGui = ig.GuiElementBase.extend({
      color: null,
      transitions: {
        DEFAULT: {
          state: {
            offsetX: 0,
            offsetY: 0,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
          },
          time: 1,
          timeFunction: KEY_SPLINES.LINEAR,
        },
        LARGE: {
          state: {
            offsetX: 30,
            offsetY: 30,
            scaleX: 3,
            scaleY: 3,
            angle: 3,
          },
          time: 1,
          timeFunction: KEY_SPLINES.LINEAR,
        },
        HIDDEN: {
          state: {
            alpha: 0,
          },
          time: 1,
          timeFunction: KEY_SPLINES.LINEAR,
        },
      },

      init(color, width, height) {
        this.parent();

        this.color = color;
        this.hook.size.x = width;
        this.hook.size.y = height;
        this.hook.pivot.x = this.hook.size.x / 2;
        this.hook.pivot.y = this.hook.size.y / 2;
      },

      updateDrawables(renderer) {
        if (this.hook.size.x !== 0 && this.hook.size.y !== 0) {
          renderer
            .addColor(this.color, 0, 0, this.hook.size.x, this.hook.size.y)
            .setCompositionMode('source-over');
        }
      },
    });
  });
