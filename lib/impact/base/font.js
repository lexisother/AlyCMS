ig.module('impact.base.font')
  .requires('impact.base.image')
  .defines(() => {
    ig.Font = ig.Image.extend({
      widthMap: [],
      indicesX: [],
      indicesY: [],
      firstChar: 32,
      charHeight: 0,

      init(path, charHeight, firstChar) {
        this.firstChar = firstChar === undefined ? 32 : firstChar;
        this.charHeight = charHeight;
        this.parent(path);
      },

      onload(event) {
        this._loadMetrics(this.data);
        this.parent(event);
      },

      draw(text, x, y, align) {
        if (typeof text != 'string') {
          text = text.toString();
        }

        if (align === ig.Font.ALIGN.RIGHT || align === ig.Font.ALIGN.CENTER) {
          let width = 0;
          for (let i = 0; i < text.length; i++) {
            let c = text.charCodeAt(i);
            width += this.widthMap[c - this.firstChar] + 1;
          }
          x -= align === ig.Font.ALIGN.CENTER ? width / 2 : width;
        }

        for (let i = 0; i < text.length; i++) {
          let c = text.charCodeAt(i);
          x += this._drawChar(c - this.firstChar, x, y);
        }
        ig.Image.drawCount += text.length;
      },

      _drawChar: function (c, targetX, targetY, overrideData) {
        if (!this.loaded || c < 0 || c >= this.indicesX.length) {
          return 0;
        }

        let scale = ig.system.scale;

        let charX = this.indicesX[c] * scale;
        let charY = this.indicesY[c] * scale;
        let charWidth = (this.widthMap[c] + 1) * scale;
        let charHeight = this.charHeight * scale;

        ig.system.context.drawImage(
          overrideData !== undefined ? overrideData : this.data,
          charX,
          charY,
          charWidth,
          charHeight,
          ig.system.getDrawPos(targetX),
          ig.system.getDrawPos(targetY),
          charWidth,
          charHeight,
        );

        return this.widthMap[c] + 1;
      },

      _loadMetrics: function (image) {
        // Draw the bottommost line of this font image into an offscreen canvas
        // and analyze it pixel by pixel.
        // A run of non-transparent pixels represents a character and its width
        if (!this.charHeight) this.charHeight = image.height - 1;
        this.widthMap = [];
        this.indicesX = [];
        this.indicesY = [];

        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        let line_base = 0;
        let currentChar = 0;
        while (line_base + this.charHeight < image.height) {
          let currentWidth = 0;
          let px = ctx.getImageData(0, line_base + this.charHeight, image.width, 1);
          for (let x = 0; x < image.width; x++) {
            let index = x * 4 + 3; // alpha component of this pixel
            if (px.data[index] !== 0) {
              currentWidth++;
            } else if (px.data[index] === 0 && currentWidth) {
              this.widthMap.push(currentWidth);
              this.indicesX.push(x - currentWidth);
              this.indicesY.push(line_base);
              currentChar++;
              currentWidth = 0;
            }
          }
          if (currentWidth) {
            this.widthMap.push(currentWidth);
            this.indicesX.push(image.width - currentWidth);
            this.indicesY.push(line_base);
          }
          line_base += this.charHeight + 1;
        }
      },
    });

    ig.Font.ALIGN = {
      LEFT: 0,
      RIGHT: 1,
      CENTER: 2,
    };
  });
