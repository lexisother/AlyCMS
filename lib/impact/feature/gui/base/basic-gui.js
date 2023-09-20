ig.module('impact.feature.gui.base.basic-gui')
  .requires('impact.feature.gui.gui')
  .defines(() => {
    ig.ColorGui = ig.GuiElementBase.extend({
      color: null,

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
