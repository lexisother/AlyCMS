ig.module('impact.base.font')
  .requires('impact.base.image')
  .defines(() => {
    let TEXT_COMMANDS = {};
    let SPEED_MAP = [
      'IMMEDIATE',
      'FASTEST',
      'FASTER',
      'FAST',
      'NORMAL',
      'SLOW',
      'SLOWER',
      'SLOWEST',
    ];

    ig.TextCommands = {
      register(key, takesArgument, callback) {
        if (TEXT_COMMANDS[key]) {
          throw new Error(`Text command for key '${key}' already assigned`);
        }

        TEXT_COMMANDS[key] = {
          argument: takesArgument,
          apply: callback,
        };
      },
    };

    ig.TextCommands.register('.', false, function (textIndex, commands) {
      commands.push({ index: textIndex, command: { brake: 0.2 } });
    });
    ig.TextCommands.register('!', false, function (textIndex, commands) {
      commands.push({ index: textIndex, command: { brake: 0.4 } });
    });
    ig.TextCommands.register('c', true, (argument, textIndex, commands) => {
      commands.push({ index: textIndex, command: { color: argument } });
    });
    ig.TextCommands.register('s', true, function (argument, textIndex, commands) {
      if (!SPEED_MAP[argument])
        throw new Error(
          "Unsupported \\s argument: '" + argument + "'. Only support values from 0-7",
        );
      commands.push({ index: textIndex, command: { speed: SPEED_MAP[argument] } });
    });
    ig.TextCommands.register('i', true, function (argument, textIndex, command, font) {
      let index = font.indexMapping.indexOf(argument);
      if (index !== -1) return String.fromCharCode(ig.MultiFont.ICON_START + index);
    });

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
      iconSets: [],
      mapping: {},
      indexMapping: [],
      colorSets: [],

      init(path, charHeight) {
        this.parent(path, charHeight);
      },

      // Icons
      pushIconSet(iconSet) {
        this.iconSets.push(iconSet);
      },
      setIconSet(iconSet, index) {
        this.iconSets[index] = iconSet;
      },
      setMapping(mapping) {
        for (let i in mapping) {
          this.mapping[i] = mapping[i];
          if (this.indexMapping.indexOf(i) === -1) {
            this.indexMapping.push(i);
          }
        }
      },

      // Colors
      pushColorSet(image, index) {
        if (!image || (index && index < 0)) return;
        this.colorSets[index] = image;
      },

      _getActualIndex(index) {
        return this.mapping[this.indexMapping[index]];
      },

      getLineWidth: function (s, dimensions, index) {
        let width = 0;
        let line = 0;
        while (line + 1 < dimensions.lineIdx.length && dimensions.lineIdx[line + 1] <= index)
          line++;
        let start = dimensions.lineIdx[line];

        for (let i = start; i < index; i++) {
          width += this.getCharWidth(s.charCodeAt(i));
        }
        return width;
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
        let currentCommand = 0;

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

          for (
            ;
            currentCommand < commands.length && commands[currentCommand].index === i;
            ++currentCommand
          ) {
            if (commands[currentCommand].command.color !== undefined) {
              let index = commands[currentCommand].command.color;
              if (index >= 0) {
                if (index === 0) {
                  // 0 is the default color
                  data = currentFont.data;
                } else {
                  if (!this.colorSets[index])
                    throw new Error(`Color index does not exist: ${index}`);
                  data = this.colorSets[index] ? this.colorSets[index].data : this;
                }
              }
            }
          }

          if (
            c >= ig.MultiFont.ICON_START &&
            c < ig.MultiFont.ICON_END &&
            this.iconSets.length > 0
          ) {
            let icon = this._getActualIndex(c - ig.MultiFont.ICON_START);
            cX += this.iconSets[icon[0]]._drawChar(icon[1], cX, y);
          } else {
            cX += currentFont._drawChar(c - this.firstChar, cX, y, data);
          }
        }
        ig.Image.drawCount += text.length;
      },

      getCharWidth(code) {
        if (
          code >= ig.MultiFont.ICON_START &&
          code < ig.MultiFont.ICON_END &&
          this.iconSets.length > 0
        ) {
          let icon = this._getActualIndex(code - ig.MultiFont.ICON_START);
          return this.iconSets[icon[0]].widthMap[icon[1]] + 1 || 0;
        } else {
          return this.widthMap[code - this.firstChar] + 1 || 0;
        }
      },
    });
    ig.MultiFont.ICON_START = 2000;
    ig.MultiFont.ICON_END = 3000;

    ig.TextBlock = ig.Class.extend({
      font: null,
      maxWidth: 0,
      parsedText: '',
      commands: [],
      speed: 0,
      linePadding: 0,
      align: ig.Font.ALIGN.LEFT,
      size: { x: 0, y: 0, lines: [] },

      currentLine: 0,
      currentIndex: 0,
      currentCmd: 0,
      currentSpeed: 0,
      timer: 0,

      onFinish: null, // called when the textbox is fully displayed

      prerendered: false,

      init(multiFont, text, settings) {
        this.font = multiFont;
        this.speed = settings.speed || 0;
        this.align = settings.textAlign || ig.Font.ALIGN.LEFT;
        this.maxWidth = settings.maxWidth;
        this.bestRatio = settings.bestRatio;

        this.linePadding = settings.linePadding ?? 1;

        this.setText(text);
        this.reset();
      },

      setText(text = '') {
        text = text.trim();

        this.parsedText = '';
        this.commands.length = 0;
        this.r_parse(text);

        if (this.maxWidth)
          this.parsedText = this.font.wrapText(
            this.parsedText,
            this.maxWidth,
            this.linePadding,
            this.bestRatio,
          );

        this.size = this.font.getTextDimensions(this.parsedText, this.linePadding);
        this.reset();
      },

      prerender() {
        if (!this.prerendered) {
          this.prerendered = true;
          this.buffer = ig.imageAtlas.getFragment(
            this.size.x,
            this.size.y,
            function () {
              let x =
                this.align === ig.Font.ALIGN.LEFT
                  ? 0
                  : this.align === ig.Font.ALIGN.CENTER
                  ? Math.floor(this.size.x / 2)
                  : this.size.x;
              this.font.drawLines(
                this.parsedText,
                x,
                0,
                this.align,
                this.commands,
                this.linePadding,
              );
            }.bind(this),
          );
        }
      },

      clearPrerendered() {
        if (this.prerendered) {
          this.buffer.release();
          this.buffer = null;
          this.prerendered = false;
        }
      },

      reset() {
        if (!this.speed) {
          this.currentLine = this.size.lines.length;
          this.currentIndex = this.parsedText.length;
          this.timer = 1;
        } else {
          this.currentLine = this.currentIndex = this.currentCmd = this.timer = 0;
          this.currentSpeed = this.speed;
          this._updateCommands();
        }
      },

      getState() {
        return [this.currentLine, this.currentIndex, this.currentCmd, this.currentSpeed];
      },
      setState(state) {
        this.currentLine = state[0];
        this.currentIndex = state[1];
        this.currentCmd = state[2];
        this.currentSpeed = state[3];
      },

      setSpeed(speed) {
        this.speed = this.currentSpeed = speed;
      },

      finish() {
        this.currentIndex = this.parsedText.length;
        this.timer = this.currentSpeed + 0.001;
        this.currentLine = this.size.lines.length;
        if (this.onFinish) this.onFinish();
      },

      isFinished() {
        return this.currentIndex === this.parsedText.length && this.timer > this.currentSpeed;
      },

      _updateCommands() {
        for (
          ;
          this.currentCmd < this.commands.length &&
          this.commands[this.currentCmd].index === this.currentIndex;
          ++this.currentCmd
        ) {
          let cmd = this.commands[this.currentCmd].command;
          if (cmd.brake) {
            this.timer -= cmd.brake;
          }
          if (cmd.speed) {
            this.currentSpeed = ig.TextBlock.SPEED[cmd.speed];
          }
        }
      },

      update() {
        if (this.isFinished()) return;

        this.timer += ig.system.actualTick;
        while (this.timer > this.currentSpeed && this.currentIndex < this.parsedText.length) {
          this.currentIndex++;
          if (this.size.lineIdx[this.currentLine + 1] === this.currentIndex) this.currentLine++;
          this._updateCommands();
          this.timer -= this.currentSpeed;
        }

        if (this.onFinish && this.isFinished()) this.onFinish();
      },

      draw(x, y) {
        x = x || 0;
        y = y || 0;
        if (!this.size.x) return;

        if (this.prerendered) {
          let height = this.currentLine * (this.font.charHeight + this.linePadding);
          if (this.currentLine) {
            this.buffer.draw(x, y, 0, 0, this.size.x, height);
          }
          if (this.currentLine < this.size.lines.length) {
            let width = this.font.getLineWidth(this.parsedText, this.size, this.currentIndex);
            // Adjust width for alignment
            if (this.align === ig.Font.ALIGN.CENTER)
              width += (this.size.x - this.size.lines[this.currentLine]) / 2;
            else if (this.align === ig.Font.ALIGN.RIGHT)
              width += this.size.x - this.size.lines[this.currentLine];

            if (!width) return;
            let lineHeight = this.font.charHeight + this.linePadding;
            this.buffer.draw(x, y + height, 0, height, width, lineHeight);
          }
        } else {
          x =
            this.align === ig.Font.ALIGN.LEFT
              ? x
              : this.align === ig.Font.ALIGN.CENTER
              ? x + this.size.x / 2
              : x + this.size.x;

          this.font.drawLines(
            this.parsedText.substring(0, this.currentIndex),
            x,
            y,
            this.align,
            this.commands,
            this.linePadding,
          );
        }
      },

      r_parse(text) {
        let parsed = 0;
        let index = -1;
        while ((index = text.indexOf('{', parsed)) !== -1) {
          this.parsedText += text.substring(parsed, index);
          parsed = index + 1;
          let openBracketIndex = text.indexOf('{', index),
            closeBracketIndex = text.indexOf('}', index);
          let commandString = text.substring(openBracketIndex + 1, closeBracketIndex).split(':'),
            token = null,
            command = null;
          if (openBracketIndex !== -1) {
            token = commandString[0]; // name
            command = TEXT_COMMANDS[token];
          }
          if (!command) {
            token = text.charAt(index + 1);
            command = TEXT_COMMANDS[token];
          }
          if (!command) {
            this.parsedText += text.charAt(index);
          } else if (command.character) {
            this.parsedText += command.character;
            parsed += token[1];
          } else {
            let insertText;
            if (command.argument) {
              if (openBracketIndex !== index || closeBracketIndex === -1) {
                this.parsedText += text.charAt(index);
                console.warn(`Invalid Text command argument format for command '${token}'`);
                continue;
              }
              let argument = commandString[1];
              parsed = closeBracketIndex + 1;
              insertText = command.apply(
                argument,
                this.parsedText.length,
                this.commands,
                this.font,
              );
            } else {
              parsed += token.length;
              insertText = command.apply(this.parsedText.length, this.commands, this.font);
            }
            if (insertText !== undefined && insertText !== null) this.r_parse('' + insertText);
          }
        }
        this.parsedText += text.substring(parsed);
      },
    });

    ig.TextBlock.SPEED = {
      SLOWEST: 0.1,
      SLOWER: 0.05,
      SLOW: 0.03,
      NORMAL: 0.02,
      FAST: 0.015,
      FASTER: 0.01,
      FASTEST: 0.0075,
      IMMEDIATE: 0,
    };
  });
