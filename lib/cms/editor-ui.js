ig.module('cms.editor-ui').defines(() => {
  cms.EditorUI = ig.Class.extend({
    post: null,
    div: null,
    components: {},

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
      let editor = ig.editor.settings.typeMappings
        ? ig.editor.settings.typeMappings[key]
        : 'StringEditor';
      let componentClass = new cms.EditorComponents[editor](val);
      this.components[key] = componentClass;

      if (!componentClass.component) {
        return $(
          `<div style="background-color:red;">Not implemented!<br/>${key}: ${val} (${editor})</div>`,
        );
      }

      return componentClass.component;
    },

    markEdited() {
      ig.editor.markEdited();
    },
  });
});
