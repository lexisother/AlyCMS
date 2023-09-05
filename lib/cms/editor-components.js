ig.module('cms.editor-components').defines(() => {
  cms.EditorComponents = {};

  cms.EditorComponents.StringEditor = ig.Class.extend({
    init(defaultValue) {
      this.component = $(`<input type="text" value="${defaultValue}" />`);
      this.component.on('input', ig.editor.editorUI.markEdited);
    },
  });

  cms.EditorComponents.BigStringEditor = ig.Class.extend({
    init(defaultValue) {
      this.component = $(`<textarea rows="12" cols="75">${defaultValue}</textarea>`)
      this.component.on('input', ig.editor.editorUI.markEdited);
    }
  });
});
