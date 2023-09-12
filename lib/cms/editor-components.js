// NOTE: there is a dependency on modal-dialogs in this module. it is not
// explicitly declared because this would cause a circular dependency. it is an
// implicit dependency, however.
// if I were to declare the dependency explicitly, the dependency tree will
// look like this:
// modal-dialogs => settings-editor => editor-components => modal-dialogs
// NOT explicitly declaring it will obviously still have modal-dialogs being
// loaded first.
ig.module('cms.editor-components').defines(() => {
  cms.EditorComponents = {};

  cms.EditorComponents.StringEditor = ig.Class.extend({
    init(defaultValue) {
      this.component = $(`<input type="text" value="${defaultValue}" />`);
      this.component.on('input', ig.editor.editorUI.markEdited);
    },
  });

  // Maybe CodeMirror this later?
  cms.EditorComponents.BigStringEditor = ig.Class.extend({
    init(defaultValue) {
      this.component = $(`<textarea rows="12" cols="75">${defaultValue}</textarea>`);
      this.component.on('input', ig.editor.editorUI.markEdited);
    },
  });

  cms.EditorComponents.AssetEditor = ig.Class.extend({
    // Components
    component: null,
    openButton: null,
    label: null,

    // Dialogs
    loadAssetDialog: null,

    init(defaultValue) {
      this.loadAssetDialog = new cms.ModalDialogAssetSelect('Load Asset', 'Load');
      this.loadAssetDialog.onOk = this.selectAsset.bind(this);
      this.loadAssetDialog.setPath('resources/images/');

      this.component = $(
        `<div style="display:flex;gap:1rem;"><button>Select</button><span>${defaultValue}</span></div>`,
      );
      let subs = this.component.children();
      this.openButton = $(subs[0]);
      this.label = $(subs[1]);

      this.openButton.on('click', this.loadAssetDialog.open.bind(this.loadAssetDialog));
    },

    selectAsset(dialog, path) {
      let span = this.component.children('span')
      span.text(path);
      this.component.val = () => path;
      ig.editor.markEdited();
    },
  });
});
