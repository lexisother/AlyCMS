window.cms = {};

ig.module('cms.main')
  .requires('cms.select-file-dropdown', 'cms.modal-dialogs')
  .defines(() => {
    cms.AlyCMS = ig.Class.extend({
      // State
      modified: false,

      // Dialogs
      loadPostDialog: null,
      loadFileDialog: null,
      loseChangesDialog: null,

      init: function () {
        this.loadPostDialog = new cms.ModalDialogPostSelect('Load Post');
        this.loadPostDialog.onOk = this.loadPost.bind(this);
        $('#postLoad').on('click', this.showLoadDialog.bind(this));

        // this.loadFileDialog = new cms.ModalDialogPathSelect('Load Asset', 'Load', 'images');
        // this.loadFileDialog.onOk = this.load.bind(this);
        // this.loadFileDialog.setPath('resources/posts/');
        // $('#postLoad').on('click', this.showLoadDialog.bind(this));

        this.loseChangesDialog = new cms.ModalDialog('Lose all changes?');
      },

      loadPost(dialog, postId) {
        console.log(postId);
      },

      showLoadDialog() {
        if (this.modified) {
          this.loseChangesDialog.onOk = this.loadPostDialog.open.bind(this.loadPostDialog);
          this.loseChangesDialog.open();
        } else {
          this.loadPostDialog.open();
        }
      },
      //
      // load(dialog, path) {
      //   console.log(dialog);
      //   console.log(path);
      // },
    });

    ig.editor = new cms.AlyCMS();
  });
