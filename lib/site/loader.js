ig.module('site.loader')
  .requires('impact.base.timer', 'impact.base.loader', 'impact.base.image')
  .defines(() => {
    ig.StartLoader = ig.Loader.extend({
      timer: new ig.Timer(),
      endTimer: 0,

      draw() {
        this._drawStatus += (this.status - this._drawStatus) / 5;
        let s = ig.system.scale;
        let w = ig.system.width * 0.6;
        let h = 8;
        let x = ig.system.width * 0.5 - w / 2;
        let y = ig.system.height * 0.5 - h / 2;

        ig.system.context.fillStyle = '#000';
        ig.system.context.fillRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);

        ig.system.context.fillStyle = '#56607b';
        ig.system.context.fillRect(x * s, y * s, w * s, h * s);

        ig.system.context.fillStyle = '#000';
        ig.system.context.fillRect(x * s + s, y * s + s, w * s - s - s, h * s - s - s);

        ig.system.context.fillStyle = '#fff';
        ig.system.context.fillRect(
          (x + 2) * s,
          (y + 2) * s,
          (w - 4) * s * this._drawStatus,
          (h - 4) * s,
        );

        if (window.IG_DEBUG) {
          ig.system.context.fillText(
            this.lastPath,
            ig.system.width / 2 - ig.system.context.measureText(this.lastPath).width / 2,
            y + 20,
          );
        }

        ig.Timer.step();
        let delta = this.timer.tick();
        if (this.endTimer > 0) {
          this.endTimer -= delta;
          ig.system.context.fillStyle = '#000';
          ig.system.context.globalAlpha = Math.min(1, 1 - this.endTimer / 0.3);
          ig.system.context.fillRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
          ig.system.context.globalAlpha = 1;
          if (this.endTimer <= 0) {
            this.finalize();
          }
        }
      },

      finalize() {
        this.parent();

        ig.three.draw('Welcome to my funny website :)', 20, 20, ig.Font.ALIGN.LEFT);
        ig.three.draw('Silly things happen here', 20, 30, ig.Font.ALIGN.LEFT);
        ig.two.draw(20, 40, 0, 0, 200, 200, 0, 0);
      },

      onEnd() {
        this.endTimer = 0.3;
      },
    });
  });
