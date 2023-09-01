window.cms = {};

ig.module('cms.main')
  .requires('cms.select-file-dropdown', 'cms.modal-dialogs')
  .defines(() => {
    cms.AlyCMS = ig.Class.extend({
      // State
      modified: false,

      // Dialogs
      loadDialog: null,
      loseChangesDialog: null,

      init: function () {
        this.loadDialog = new cms.ModalDialogPathSelect('Load Post', 'Load', 'markdown');
        this.loadDialog.onOk = this.load.bind(this);
        this.loadDialog.setPath('/resources/posts/');
        $('#postLoad').on('click', this.showLoadDialog.bind(this));

        this.loseChangesDialog = new cms.ModalDialog('Lose all changes?');
      },

      showLoadDialog() {
        if (this.modified) {
          this.loseChangesDialog.onOk = this.loadDialog.open.bind(this.loadDialog);
          this.loseChangesDialog.open();
        } else {
          this.loadDialog.open();
        }
      },

      load(dialog, path) {
        console.log(dialog);
        console.log(path);
      },
    });

    ig.editor = new cms.AlyCMS();
  });
