window.cms = {};

ig.module('cms.main')
  .requires('cms.select-file-dropdown', 'cms.modal-dialogs', 'cms.editor-ui')
  .defines(() => {
    cms.AlyCMS = ig.Class.extend({
      // State
      modified: false,
      postCache: null,
      postToEdit: null,
      settings: {},

      // UI
      editorUI: null,

      // Dialogs
      loadPostDialog: null,
      loadFileDialog: null,
      loseChangesDialog: null,
      settingsDialog: null,

      init: function () {
        // Handier to put it here than at the bottom of the module, because this way any classes attached to this one
        // can modify its state.
        ig.editor = this;

        this.loadPostDialog = new cms.ModalDialogPostSelect('Load Post');
        this.loadPostDialog.onOk = this.loadPost.bind(this);
        $('#postLoad').on('click', this.showLoadDialog.bind(this));

        this.settingsDialog = new cms.ModalDialogSettings('Settings');
        $('#settings').on('click', this.settingsDialog.open.bind(this.settingsDialog));

        this.editorUI = new cms.EditorUI();

        // this.loadFileDialog = new cms.ModalDialogPathSelect('Load Asset', 'Load', 'images');
        // this.loadFileDialog.onOk = this.load.bind(this);
        // this.loadFileDialog.setPath('resources/posts/');
        // $('#postLoad').on('click', this.showLoadDialog.bind(this));

        this.loseChangesDialog = new cms.ModalDialog('Lose all changes?');
      },

      setTitle(title) {
        $('.headerTitle').text(title);
      },

      markEdited() {
        $('.unsavedTitle').text('*');
      },

      save() {
        $('.unsavedTitle').text('');
      },

      loadPost(dialog, postId) {
        let post = this.postCache.find((p) => p.id === postId);
        this.setTitle(post.title);
        this.editorUI.setPost(post);
      },

      settingsChanged(newSettings) {
        this.settings = newSettings;
        $.ajax({
          url: '/api/settings',
          method: 'PATCH',
          data: newSettings,
          dataType: 'json'
        })
      },

      showLoadDialog() {
        if (this.modified) {
          this.loseChangesDialog.onOk = this.loadPostDialog.open.bind(this.loadPostDialog);
          this.loseChangesDialog.open();
        } else {
          this.loadPostDialog.open();
        }
      },
    });

    new cms.AlyCMS();
  });
