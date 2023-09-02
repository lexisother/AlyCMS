ig.module('cms.select-post-box').defines(() => {
  cms.SelectPostBox = ig.Class.extend({
    buttonDiv: null,
    apiUrl: null,
    div: null,

    init(buttonDiv, apiUrl) {
      this.apiUrl = apiUrl;
      this.buttonDiv = $(buttonDiv);

      this.div = $('<div/>', { class: 'modalSelectBox' });
      this.div.on('mousedown', this.stopEvents.bind(this));
      this.buttonDiv.before(this.div);

      this.loadPosts();
    },

    loadPosts() {
      let res = $.ajax({
        url: this.apiUrl,
        dataType: 'json',
        async: false,
        success: this.showPosts.bind(this),
      });
      ig.editor.postCache = res.responseJSON.posts;
    },

    selectPost(event) {
      $(this.div).children().css('background-color', '');
      let item = $(event.target);
      ig.editor.postToEdit = parseInt(item.attr('href'));
      item.css({ 'background-color': 'rgba(255, 255, 255, 0.3)' });
      return false;
    },

    showPosts(data) {
      this.div.empty();

      for (let post of data.posts) {
        let item = $('<a/>', { class: 'post', href: post.id, html: post.title, title: post.title });
        item.on('click', this.selectPost.bind(this));
        this.div.append(item);
      }
    },

    stopEvents(event) {
      event.stopPropagation();
    },
  });
});
