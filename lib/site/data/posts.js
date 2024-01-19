ig.module("site.data.posts")
  .requires('impact.base.loader')
  .defines(() => {
    ig.Posts = ig.JsonLoadable.extend({
      cacheType: "Posts",
      data: {},
      onload(data) {
        this.data = data.posts;
      }
    });
    ig.posts = new ig.Posts('/api/posts');
  });