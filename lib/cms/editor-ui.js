ig.module('cms.editor-ui').defines(() => {
  cms.EditorUI = ig.Class.extend({
    post: null,
    div: null,

    init(post) {
      this.post = post;

      this.div = $('<div/>', { class: 'editorRoot' });
      $('#headerMenu').after(this.div);

      this.constructUi();
    },

    constructUi() {
      let blacklistedKeys = ['id', 'created_at', 'updated_at'];
      let editableKeys = Object.keys(this.post).filter((k) => !blacklistedKeys.includes(k));

      // Construct our UI in this loop
      for (let key of editableKeys) {
        let val = this.post[key];
        console.log(`${key}: ${val}`);
      }
    },
  });
});
