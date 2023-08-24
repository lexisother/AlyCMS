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
  });
