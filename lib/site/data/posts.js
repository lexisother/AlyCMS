ig.module("site.data.posts")
  .requires('impact.base.loader')
  .defines(() => {
    ig.Posts = ig.SingleLoadable.extend({
      path: '/api/posts',
      cacheType: "Posts",
      data: {},
      init() {
        this.parent();
      },
      loadInternal() {
        $.ajax({
          url: this.path,
          dataType: 'json',
          success: this.onload.bind(this)
        })
      },
      onload(data) {
        this.data = data.posts;
        this.loadingFinished(true);
      }
    })
    ig.posts = new ig.Posts();
  });