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

    ig.MultiFont = ig.Font.extend({
      mapping: {},
      indexMapping: [],

      init(path, charHeight) {
        this.parent(path, charHeight);
      },

      _getActualIndex(index) {
        return this.mapping[this.indexMapping[index]];
      },

      getTextDimensions(str, linePadding = 1) {
        let maxWidth = 0;
        let width = 0;
        let height = this.charHeight + linePadding;
        let lines = [];
        let lineIdx = [0];
        for (let i in str) {
          i = parseInt(i);
          if (str.charAt(i) === '\n') {
            maxWidth = Math.max(maxWidth, width);
            lines.push(width);
            lineIdx.push(i + 1);
            width = 0;
            height += this.charHeight + linePadding;
          } else {
            width += this.getCharWidth(str.charCodeAt(i));
          }
        }
        lineIdx.push(str.length);
        lines.push(width);
        maxWidth = Math.max(maxWidth, width);
        return {
          x: maxWidth,
          y: height,
          lines,
          lineIdx,
        };
      },

      wrapText(text, maxWidth, linePadding, bestRatio) {
        let bestResult = null,
          bestError = -1,
          maxAttempts = bestRatio ? 8 : 1;
        let stepSize = (maxWidth * 0.75) / (maxAttempts - 1);

        while (--maxAttempts) {
          let s = text;
          let lines = [],
            lineWidth = [];
          let width = 0,
            maxLineWidth = 0;
          let lastSplitPos = -1;
          for (let i = 0; i < s.length; i++) {
            width += this.getCharWidth(s.charCodeAt(i));

            if (s.charAt(i).match(/\s/g)) {
              lastSplitPos = i;
            }
            let isLineBreak = s.charAt(i) === '\n';
            if (isLineBreak || (width > maxWidth && lastSplitPos !== -1)) {
              let split = isLineBreak ? i : lastSplitPos;
              lines.push(s.substring(0, split));
              maxLineWidth = Math.max(maxLineWidth, width);
              lineWidth.push(width);
              s = s.substring(split + 1);
              i = -1;
              width = 0;
              lastSplitPos = -1;
            }
          }
          lines.push(s);
          lineWidth.push(width);
          maxLineWidth = Math.max(maxLineWidth, width);
          if (bestRatio) {
            let height = lines.length * this.charHeight + (lines.length - 1) * linePadding;
            let ratioError = 0,
              lineError = 0;
            let idealWidth = bestRatio * height;
            ratioError = (Math.abs(idealWidth - maxLineWidth) / idealWidth) * 50;
            if (idealWidth * 0.5 > maxLineWidth)
              ratioError += 1000 + (idealWidth / maxLineWidth) * 200;
            else if (idealWidth * 1.5 < maxLineWidth)
              ratioError += 1000 + (maxLineWidth / idealWidth) * 200;
            let i = lines.length;
            while (i--) {
              let lineDiff = lineWidth[i] / maxLineWidth;
              if (lineDiff < 0.7) lineError += 100 * (1 - lineDiff * lineDiff);
            }
            let error = lineError + ratioError;
            maxWidth -= stepSize;
            if (bestError === -1 || bestError > error) {
              bestError = error;
              bestResult = lines.join('\n');
            }
          } else {
            bestResult = lines.join('\n');
          }
        }
        return bestResult;
      },

      drawLines(text, x, y, align, commands, padding) {
        let currentFont = this;
        let data = currentFont.data;
        padding = padding !== undefined ? padding : 1;
        if (typeof text != 'string') {
          text = text.toString();
        }

        let dimensions = null;
        if (align === ig.Font.ALIGN.RIGHT || align === ig.Font.ALIGN.CENTER) {
          dimensions = this.getTextDimensions(text);
        }
        let line = 0;
        let cX =
          align === ig.Font.ALIGN.LEFT
            ? x
            : x -
              (align === ig.Font.ALIGN.CENTER
                ? Math.floor(dimensions.lines[line] / 2)
                : dimensions.lines[line]);

        for (let i = 0; i < text.length; i++) {
          let c = text.charCodeAt(i);
          if (c === 10) {
            // line break
            line++;
            cX =
              align === ig.Font.ALIGN.LEFT
                ? x
                : x -
                  (align === ig.Font.ALIGN.CENTER
                    ? Math.floor(dimensions.lines[line] / 2)
                    : dimensions.lines[line]);
            y += this.charHeight + padding;
          }
          cX += currentFont._drawChar(c - this.firstChar, cX, y, data);
        }
        ig.Image.drawCount += text.length;
      },

      getCharWidth(code) {
        return this.widthMap[code - this.firstChar] + 1 || 0;
      },
    });
  });
