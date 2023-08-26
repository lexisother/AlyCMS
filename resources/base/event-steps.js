ig.module('base.event-steps')
  .requires('base.event')
  .defines(() => {
    ig.EVENT_STEP.CONSOLE_LOG = ig.EventStepBase.extend({
      text: null,
      init(data) {
        this.text = data.text;
      },
      start() {
        console.log(this.text);
      },
    });

    ig.EVENT_STEP.LABEL = ig.EventStepBase.extend({
        name: null,
        init(data) {
            this.name = data.name;
        }
    });
    ig.EVENT_STEP.GOTO_LABEL = ig.EventStepBase.extend({
        name: null,
        init(data) {
            this.name = data.name;
        },
        getJumpLabelName() {
            return this.name;
        }
    });
  });
