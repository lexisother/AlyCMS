ig.module('site.element.step-button').defines(() => {
  class EventStepButton extends HTMLButtonElement {
    constructor() {
      super();
      this.onclick = this.onClick;
    }

    onClick() {
      const rawSteps = this.getAttribute('steps').replace(/\n/g, '').trim();
      const steps = JSON.parse(rawSteps);
      ig.site.events.callEvent(new ig.Event({ steps }), ig.EventRunType.INTERRUPTABLE);
    }
  }

  customElements.define('step-button', EventStepButton, { extends: 'button' });
});
