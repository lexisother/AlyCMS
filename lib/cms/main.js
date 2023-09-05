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

        // Dialogs
        this.loadPostDialog = new cms.ModalDialogPostSelect('Load Post');
        this.loadPostDialog.onOk = this.loadPost.bind(this);
        $('#postLoad').on('click', this.showLoadDialog.bind(this));

        this.settingsDialog = new cms.ModalDialogSettings('Settings');
        $('#settings').on('click', this.settingsDialog.open.bind(this.settingsDialog));

        this.loseChangesDialog = new cms.ModalDialog('Lose all changes?');

        $('#postNew').on('click', this.new.bind(this));
        $('#postSave').on('click', this.save.bind(this));

        // this.loadFileDialog = new cms.ModalDialogPathSelect('Load Asset', 'Load', 'images');
        // this.loadFileDialog.onOk = this.load.bind(this);
        // this.loadFileDialog.setPath('resources/posts/');
        // $('#postLoad').on('click', this.showLoadDialog.bind(this));

        this.editorUI = new cms.EditorUI();
      },

      setTitle(title) {
        $('.headerTitle').text(title);
      },

      markEdited() {
        $('.unsavedTitle').text('*');
        this.modified = true;
      },

      resetEdited() {
        $('.unsavedTitle').text('');
        this.modified = false;
      },

      new() {
        // Just so we're sure that we're pushing a *new* post...
        let mostRecent = ig.editor.postCache.reduce((prev, current) => {
          return prev.id > current.id ? prev : current;
        }).id;

        // Post skeleton for the EditorUI
        let post = {
          id: mostRecent + 1,
          title: 'New Post',
          content: '',
        };
        ig.editor.postCache.push(post);

        this.postToEdit = post.id;
        this.setTitle(post.title);
        this.markEdited();
        this.editorUI.setPost(post);
      },

      save() {
        if (!this.postToEdit) return;

        let data = {};
        let components = this.editorUI.components;
        for (let key of Object.keys(components)) {
          data[key] = components[key].component.val();
        }

        $.ajax({
          url: `/api/posts/${this.postToEdit}`,
          method: 'PATCH',
          data,
          dataType: 'json',
          // Don't ask, for some reason `success` just wasn't running despite the status code being 200.
          statusCode: {
            200() {
              ig.editor.setTitle(data.title);
              ig.editor.resetEdited();
            },
          },
        });
      },

      loadPost(dialog, postId) {
        let post = this.postCache.find((p) => p.id === postId);
        this.setTitle(post.title);
        this.resetEdited();
        this.editorUI.setPost(post);
      },

      settingsChanged(newSettings) {
        this.settings = newSettings;
        $.ajax({
          url: '/api/settings',
          method: 'PATCH',
          data: newSettings,
          dataType: 'json',
        });
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
