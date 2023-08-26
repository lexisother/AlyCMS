ig.module('base.event-steps')
  .requires('base.event', 'base.vars')
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
      },
    });
    ig.EVENT_STEP.GOTO_LABEL = ig.EventStepBase.extend({
      name: null,
      init(data) {
        this.name = data.name;
      },
      getJumpLabelName() {
        return this.name;
      },
    });
    ig.EVENT_STEP.IF = ig.EventStepBase.extend({
      condition: null,
      withElse: false,
      branches: {},
      init(data) {
        this.condition = new ig.VarCondition(data.condition);
        this.withElse = data.withElse;
      },
      getBranchNames() {
        return this.withElse ? ['thenStep', 'elseStep'] : ['thenStep'];
      },
      getNext() {
        return this.condition.evaluate()
          ? this.branches.thenStep
            ? this.branches.thenStep
            : this._nextStep
          : this.branches.elseStep
          ? this.branches.elseStep
          : this._nextStep;
      },
    });
  });
