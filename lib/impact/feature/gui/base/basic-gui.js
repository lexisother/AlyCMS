ig.module('impact.feature.gui.base.basic-gui')
  .requires('impact.feature.gui.gui')
  .defines(() => {
    ig.ImageGui = ig.GuiElementBase.extend({
      image: null,
      offsetX: 0,
      offsetY: 0,
      flipX: false,
      flipY: false,
      pivotOverride: false,
      frames: null,
      xCount: 0,
      frameTime: 0,
      timer: 0,
      loop: false,
      stopped: true,

      init(image, offsetX, offsetY, width, height) {
        this.parent();
        if (image) {
          this.setImage(image, offsetX, offsetY, width, height);
        }
      },
      setImage(image, offsetX = 0, offsetY = 0, width = 0, height = 0) {
        this.image = image;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.hook.size.x = width;
        this.hook.size.y = height;
        this.image.addLoadListener(this);
      },

      onLoadableComplete() {
        this.hook.size.x = this.hook.size.x || this.image.width;
        this.hook.size.y = this.hook.size.y || this.image.height;
        this.hook.size.x = Math.min(this.hook.size.x, this.image.width);
        this.hook.size.y = Math.min(this.hook.size.y, this.image.height);
        if (!this.pivotOverride) {
          this.hook.pivot.x = this.hook.size.x / 2;
          this.hook.pivot.y = this.hook.size.y / 2;
        }
      },

      updateDrawables(renderer) {
        renderer
          .addGfx(
            this.image,
            0,
            0,
            this.offsetX,
            this.offsetY,
            this.hook.size.x,
            this.hook.size.y,
            this.flipX,
            this.flipY,
          )
          .setCompositionMode('source-over');
      },
    });

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
