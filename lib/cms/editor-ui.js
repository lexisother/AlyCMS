ig.module('cms.editor-ui').defines(() => {
  cms.EditorUI = ig.Class.extend({
    post: null,
    div: null,

    init() {
      this.div = $('<div/>', { class: 'editorRoot' });
      $('#headerMenu').after(this.div);
    },

    setPost(post) {
      this.post = post;
      this.constructUi();
    },

    constructUi() {
      this.div.empty();
      let blacklistedKeys = ['id', 'created_at', 'updated_at'];
      let editableKeys = Object.keys(this.post).filter((k) => !blacklistedKeys.includes(k));

      // Construct our UI in this loop
      for (let key of editableKeys) {
        let val = this.post[key];

        let wrapper = $('<div/>', { class: 'editorWidget' });
        let title = $(`<div>${key}</div>`, { class: 'title' });
        let editor = this.getEditorElement(key, val);
        wrapper.append(title, editor);
        this.div.append(wrapper);
      }
    },

    getEditorElement(key, val) {
      let notImplemented = $(
        `<div style="background-color:red;">Not implemented!<br/>${key}: ${val} (${typeof this.post[
          key
        ]})</div>`,
      );

      switch (typeof this.post[key]) {
        case 'string':
          let el = $(`<input type="text" value="${val}" />`);
          el.on('input', this.markEdited.bind(this));
          return el;
        case 'number':
          return notImplemented;
        case 'object':
          return notImplemented;
      }
    },

    markEdited() {
      ig.editor.markEdited();
    },
  });
});
