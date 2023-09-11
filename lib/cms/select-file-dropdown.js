ig.module('cms.select-file-dropdown').defines(() => {
  cms.SelectFileDropdown = ig.Class.extend({
    input: null,
    boundShow: null,
    boundHide: null,
    div: null,
    apiUrl: '',
    filetype: '',

    init(elementId, apiUrl, filetype = '') {
      this.filetype = filetype;
      this.apiUrl = apiUrl;
      this.input = $(elementId);
      this.boundHide = this.hide.bind(this);
      this.input.bind('focus', this.show.bind(this));

      this.div = $('<div/>', { class: 'selectFileDialog' });
      this.input.after(this.div);
      this.div.bind('mousedown', this.noHide.bind(this));

      this.loadDir('');
    },

    loadDir(dir) {
      let path = `${this.apiUrl}?dir=${encodeURIComponent(dir || '')}&type=${this.filetype}`;
      $.ajax({
        url: path,
        dataType: 'json',
        async: false,
        success: this.showFiles.bind(this),
      });
    },

    selectDir(event) {
      this.loadDir($(event.target).attr('href'));
      return false;
    },

    selectFile(event) {
      this.input.val($(event.target).attr('href'));
      this.input.blur();
      this.hide();
      return false;
    },

    showFiles(data) {
      this.div.empty();
      if (data.parent !== false) {
        let parentDir = $('<a/>', {
          class: 'dir',
          href: data.parent,
          html: '&hellip;parent directory',
        });
        parentDir.on('click', this.selectDir.bind(this));
        this.div.append(parentDir);
      }
      for (let dir of data.dirs) {
        let name = dir.match(/[^\/]*$/)[0] + '/';
        let item = $('<a/>', { class: 'dir', href: dir, html: name, title: name });
        item.on('click', this.selectDir.bind(this));
        this.div.append(item);
      }
      for (let file of data.files) {
        let name = file.match(/[^\/]*$/)[0];
        let item = $('<a/>', { class: 'file', href: file, html: name, title: name });
        item.on('click', this.selectFile.bind(this));
        this.div.append(item);
      }
    },

    noHide(event) {
      event.stopPropagation();
    },

    show() {
      let inputPos = this.input.position();
      let inputHeight = parseInt(this.input.innerHeight()) + parseInt(this.input.css('margin-top'));
      let inputWidth = this.input.innerWidth();
      $(document).on('mousedown', this.boundHide);
      this.div
        .css({
          top: inputPos.top + inputHeight + 1,
          left: inputPos.left,
          width: inputWidth,
        })
        .slideDown(100);
    },

    hide() {
      $(document).off('mousedown', this.boundHide);
      this.div.slideUp(100);
    },
  });
});
