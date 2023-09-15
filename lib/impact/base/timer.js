ig.module('impact.base.timer')
    .defines(() => {
        ig.Timer = ig.Class.extend({
            target: 0,
            base: 0,
            last: 0,
            stopped: false,

            init(seconds = 0) {
                this.base = ig.Timer.time;
                this.last = ig.Timer.time;
                this.target = seconds;
            },

            set(seconds = 0, keepRelativeDelta) {
                if (keepRelativeDelta && this.target > 0) {
                    let relativeDelta = 1 + Math.min(0, this.delta() / this.target);
                    let timeMinus = seconds * relativeDelta;
                    this.base = ig.Timer.time - timeMinus;
                } else {
                    this.base = ig.Timer.time;
                }
                this.target = seconds;
            },

            reverseRelativeDelta() {
                let reverseDelta = Math.min(1, -this.delta() / this.target);
                let timeMinus = this.target * reverseDelta;
                this.base = ig.Timer.time - timeMinus;
            },

            stop() {
                if (this.stopped) return;
                this.stopped = true;
                this.last = ig.Timer.time;
            },

            resume() {
                if (!this.stopped) return;
                this.stopped = false;
                let interval = this.last - this.base;
                this.base = ig.Timer.time - interval;
                this.last = ig.Timer.time;
            },

            reset() {
                this.base = ig.Timer.time;
                this.stopped = false;
            },

            tick() {
                if (this.stopped) return 0;
                let delta = ig.Timer.time - this.last;
                this.last = ig.Timer.time;
                return delta;
            },

            weight() {
                return Math.max(0, (this.target - ((this.stopped ? this.last : ig.Timer.time) - this.base) / this.target));
            },

            delta() {
                return (this.stopped ? this.last : ig.Timer.time) - this.base - this.target;
            }
        });

        ig.Timer._last = 0;
        ig.Timer.time = 0;
        ig.Timer.timeScale = 1;
        ig.Timer.maxStep = 1 / 30;

        ig.Timer.step = () => {
            let current = Date.now();
            let delta = (current - ig.Timer._last) / 1000;
            ig.Timer.time += Math.min(delta, ig.Timer.maxStep) * ig.Timer.timeScale;
            ig.Timer._last = current;
        };
    })
