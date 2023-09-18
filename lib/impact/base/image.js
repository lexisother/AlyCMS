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

    ig.ImageAtlas = ig.Class.extend({
      buffers: [],
      debugActive: false,
      lines: [],

      init() {},

      getFragment(width, height, fillCallback) {
        width = width * ig.system.scale;
        height = height * ig.system.scale;
        return this._getFragment(width, height, fillCallback);
      },

      fillFragments() {
        for (let i = 0; i < this.lines.length; ++i) {
          let entries = this.lines[i].entries;
          for (let j = 0; j < entries.length; ++j) {
            if (entries[j].fragment && !entries[j].fragment.filled) {
              entries[j].fragment._fill();
            }
          }
        }
      },

      defragment(clearBuffers) {
        let offY = 0,
          bufferIdx = 0;

        clearBuffers = clearBuffers || window.IG_DEBUG;

        if (clearBuffers) {
          for (let i = 0; i < this.buffers.length; ++i) {
            this.buffers[i]
              .getContext('2d')
              .clearRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
          }
        }

        for (let i = 0; i < this.lines.length; ) {
          let line = this.lines[i];
          if (offY + line.height > this.buffers[bufferIdx].height) {
            offY = 0;
            bufferIdx += 1;
          }
          line.offY = offY;
          line.buffer = this.buffers[bufferIdx];
          let entries = line.entries;
          let offX = 0;
          let fragment;
          for (let j = 0; j < entries.length; ) {
            if ((fragment = entries[j].fragment)) {
              entries[j].offX = offX;
              if (
                clearBuffers ||
                fragment.offX !== offX ||
                fragment.offY !== offY ||
                fragment.buffer !== line.buffer
              ) {
                fragment.offX = offX;
                fragment.offY = offY;
                fragment.buffer = line.buffer;
                fragment.lineIdx = i;
                entries[j].fragment.filled = false;
              }
              offX += entries[j].width;
              ++j;
            } else {
              if (j !== entries.length - 1) entries.splice(j, 1);
              else {
                entries[j].offX = offX;
                offX += entries[j].width;
                ++j;
              }
            }
          }
          if (offX < line.buffer.width) {
            if (entries[entries.length - 1].fragment)
              entries.push({ offX: offX, width: line.buffer.width - offX, fragment: null });
            else entries[entries.length - 1].width += line.buffer.width - offX;
          }
          if (line.entries.length === 1 && !line.entries[0].fragment) {
            this.lines.splice(i, 1);
          } else {
            offY += line.height;
            ++i;
          }
        }
        while (bufferIdx + 1 < this.buffers.length) {
          let canvas = this.buffers.pop();
          if (this.debugActive) document.body.removeChild(canvas);
        }
      },

      release(fragment) {
        let entries = this.lines[fragment.lineIdx].entries;
        for (let j = 0; j < entries.length; ++j) {
          if (entries[j].fragment === fragment) {
            entries[j].fragment = null;
            if (j + 1 < entries.length && !entries[j + 1].fragment) {
              entries[j].width += entries[j + 1].width;
              entries.splice(j + 1, 1);
            }
            if (j > 0 && !entries[j - 1].fragment) {
              entries[j].width += entries[j - 1].width;
              entries[j].offX = entries[j - 1].offX;
              entries.splice(j - 1, 1);
            }
            return;
          }
        }
        let lastLine;
        while (
          this.lines.length > 0 &&
          (lastLine = this.lines[this.lines - 1]) &&
          lastLine.entries.length === 1 &&
          lastLine.entries[0].fragment
        ) {
          this.lines.pop();
        }
      },

      // internal

      _getFragment(width, height, callback) {
        let lineIdx, line, entry;
        for (let i = 0; !entry && i < this.lines.length; ++i) {
          if (this.lines[i].height >= height && height / this.lines[i].height > 0.5) {
            let entries = this.lines[i].entries;
            for (let j = 0; !entry && j < entries.length; ++j) {
              if (!entries[j].fragment && entries[j].width >= width) {
                entry = this._splitEntry(entries, j, width);
                line = this.lines[i];
                lineIdx = i;
              }
            }
          }
        }
        if (!entry) {
          line = this._createLine(height);
          lineIdx = this.lines.length - 1;
          entry = this._splitEntry(line.entries, 0, width);
        }
        entry.fragment = new ig.ImageAtlasFragment(
          line.buffer,
          entry.offX,
          line.offY,
          width,
          height,
          lineIdx,
          callback,
        );
        return entry.fragment;
      },

      _createLine(height) {
        let buffer,
          offY = 0;
        if (this.lines.length > 0) {
          let lastLine = this.lines[this.lines.length - 1];
          if (lastLine.buffer.height - lastLine.offY - lastLine.height < height)
            buffer = this._createBuffer();
          else {
            buffer = lastLine.buffer;
            offY = lastLine.offY + lastLine.height;
          }
        } else if (this.buffers.length > 0) {
          buffer = this.buffers[0];
        } else {
          buffer = this._createBuffer();
        }
        let line = {
          offY: offY,
          height: height,
          buffer: buffer,
          entries: [
            {
              offX: 0,
              width: buffer.width,
              fragment: null,
            },
          ],
        };
        this.lines.push(line);
        return line;
      },

      _createBuffer() {
        let canvas = document.createElement('canvas');
        canvas.width = ig.system.contextWidth;
        canvas.height = ig.system.contextHeight;
        this.buffers.push(canvas);
        if (this.debugActive) document.body.appendChild(canvas);
        return canvas;
      },

      _splitEntry(entries, idx, width) {
        let entry = entries[idx];
        if (width === entry.width) return entry;

        let newEntry = {
          offX: entry.offX + width,
          width: entry.width - width,
          fragment: null,
        };
        entry.width = width;
        entries.splice(idx + 1, 0, newEntry);
        return entry;
      },
    });
    ig.imageAtlas = new ig.ImageAtlas();

    ig.ImageAtlasFragment = ig.Class.extend({
      buffer: null,
      offX: 0,
      offY: 0,
      width: 0,
      height: 0,
      fillCallback: null,
      filled: false,
      lineIdx: 0,

      init(buffer, offX, offY, width, height, lineIdx, callback) {
        this.buffer = buffer;
        this.offX = offX;
        this.offY = offY;
        this.width = width / ig.system.scale;
        this.height = height / ig.system.scale;
        this.lineIdx = lineIdx;
        this.fillCallback = callback;
      },

      invalidate() {
        this.filled = false;
      },

      release() {
        ig.imageAtlas.release(this);
      },

      draw(targetX, targetY, srcX, srcY, width, height, flipX, flipY) {
        let scale = ig.system.scale;
        let widthScaled = (width || this.width) * scale;
        let heightScaled = (height || this.height) * scale;
        srcY = srcY * scale;
        let scaleX = flipX ? -1 : 1;
        let scaleY = flipY ? -1 : 1;

        if (flipX || flipY) {
          ig.system.context.save();
          ig.system.context.scale(scaleX, scaleY);
        }

        targetX = ig.system.getDrawPos(targetX) * scaleX - (flipX ? widthScaled : 0);
        targetY = ig.system.getDrawPos(targetY) * scaleY - (flipY ? heightScaled : 0);

        ig.system.context.drawImage(
          this.buffer,
          this.offX + srcX,
          this.offY + srcY,
          widthScaled,
          heightScaled,
          targetX,
          targetY,
          widthScaled,
          heightScaled,
        );
        ig.Image.drawCount++;

        if (flipX || flipY) {
          ig.system.context.restore();
        }
      },

      _fill() {
        this.filled = true;
        let oldContext = ig.system.context;
        let scale = ig.system.scale;
        ig.system.context = ig.system.getBufferContext(this.buffer);
        ig.system.context.clearRect(this.offX, this.offY, this.width * scale, this.height * scale);
        ig.system.context.translate(this.offX, this.offY);
        this.fillCallback();
        ig.system.context.translate(-this.offX, -this.offY);
        ig.system.context = oldContext;
      },
    });
  });
