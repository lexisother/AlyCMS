ig.module('impact.base.image')
  .requires('impact.base.loader')
  .defines(() => {
    function scaleImage(origPixels, scaledPixels, scale) {
      let width = origPixels.width;
      let widthScaled = scaledPixels.width;
      let heightScaled = scaledPixels.height;

      for (let y = 0; y < heightScaled; y++) {
        for (let x = 0; x < widthScaled; x++) {
          let index = (Math.floor(y / scale) * width + Math.floor(x / scale)) * 4;
          let indexScaled = (y * widthScaled + x) * 4;
          scaledPixels.data[indexScaled] = origPixels.data[index];
          scaledPixels.data[indexScaled + 1] = origPixels.data[index + 1];
          scaledPixels.data[indexScaled + 2] = origPixels.data[index + 2];
          scaledPixels.data[indexScaled + 3] = origPixels.data[index + 3];
        }
      }
      return scaledPixels;
    }

    ig.Image = ig.Loadable.extend({
      cacheType: 'Image',
      data: null,
      width: 0,
      height: 0,
      additionalCallbacks: [],

      init(path) {
        this.parent(path);
      },

      loadInternal() {
        this.data = new Image();
        this.data.onload = this.onload.bind(this);
        this.data.onerror = this.onerror.bind(this);
        this.data.src = this.path + '?' + Date.now();
      },

      addCallback(cb) {
        this.additionalCallbacks.push(cb);
      },

      reload() {
        this.loaded = false;
        this.data = new Image();
        this.data.onload = this.onload.bind(this);
        this.data.src = this.path + '?' + Date.now();
      },

      onload() {
        this.width = this.data.width;
        this.height = this.data.height;
        if (ig.system.scale !== 1) this.resize(ig.system.scale);
        else this.loadingFinished(true);
      },

      onerror() {
        this.loadingFinished(false);
      },

      resize(scale) {
        // Nearest-Neighbor scaling

        // The original image is drawn into an offscreen canvas of the same size
        // and copied into another offscreen canvas with the new size.
        // The scaled offscreen canvas becomes the image (data) of this object.

        let widthScaled = this.width * scale;
        let heightScaled = this.height * scale;

        let orig = document.createElement('canvas');
        orig.width = this.width;
        orig.height = this.height;
        let origCtx = ig.system.getBufferContext(orig);
        origCtx.drawImage(this.data, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
        let origPixels = origCtx.getImageData(0, 0, this.width, this.height);

        let scaled = document.createElement('canvas');
        scaled.width = widthScaled;
        scaled.height = heightScaled;
        let scaledCtx = scaled.getContext('2d');
        let scaledPixels = scaledCtx.getImageData(0, 0, widthScaled, heightScaled);

        this.data = scaled;

        let scaledImg = scaleImage(origPixels, scaledPixels, scale);
        this.data.getContext('2d').putImageData(scaledImg, 0, 0);
      },

      draw(
        targetX,
        targetY,
        sourceX,
        sourceY,
        width = this.width,
        height = this.height,
        flipX,
        flipY,
        fragment,
        fragmentAlpha = 0,
      ) {
        if (!this.loaded || width > this.width || height > this.height) return;

        let scale = ig.system.scale;
        sourceX = sourceX ? sourceX * scale : 0;
        sourceY = sourceY ? sourceY * scale : 0;

        let widthScaled = width * scale;
        let heightScaled = height * scale;

        if (widthScaled <= 0 || heightScaled <= 0) return;

        let scaleX = flipX ? -1 : 1;
        let scaleY = flipY ? -1 : 1;

        let data = this.data;

        if (flipX || flipY) {
          ig.system.context.save();
          ig.system.context.scale(scaleX, scaleY);
        }

        targetX = ig.system.getDrawPos(targetX) * scaleX - (flipX ? widthScaled : 0);
        targetY = ig.system.getDrawPos(targetY) * scaleY - (flipY ? heightScaled : 0);

        if (fragmentAlpha < 1.0) {
          ig.system.context.drawImage(
            data,
            sourceX,
            sourceY,
            widthScaled,
            heightScaled,
            targetX,
            targetY,
            widthScaled,
            heightScaled,
          );
          ig.Image.drawCount++;
        }

        if (fragment) {
          ig.system.context.globalAlpha *= fragmentAlpha;
          fragment.draw(targetX, targetY, heightScaled);
          ig.system.context.globalAlpha /= fragmentAlpha;
        }

        if (flipX || flipY) {
          ig.system.context.restore();
        }
      },
    });

    ig.Image.drawCount = 0;
  });
