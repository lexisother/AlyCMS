ig.module('cms.select-file-dropdown').defines(() => {
  cms.SelectFileDropdown = ig.Class.extend({
    input: null,
    boundShow: null,
    boundHide: null,
    div: null,
    filelistPHP: '',
    filetype: '',

    init(elementId, filelistPHP, filetype = '') {
      this.filetype = filetype;
      this.filelistPHP = filelistPHP;
      this.input = $(elementId);
      this.boundHide = this.hide.bind(this);
      this.input.bind('focus', this.show.bind(this));

      this.div = $('<div/>', { class: 'selectFileDialog' });
      this.input.after(this.div);
      this.div.bind('mousedown', this.noHide.bind(this));

      this.loadDir('');
    },

    loadDir(dir) {
      let path = `${this.filelistPHP}?dir=${encodeURIComponent(dir || '')}&type=${this.filetype}`;
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
          html: '%hellip;parent directory',
        });
        parentDir.on('click', this.selectDir.bind(this));
        this.div.append(parentDir);
      }
      for (let dir of data.dirs) {
        let name = dir.match(/[^\/]*$/)[0] + '/';
        let dir = $('<a/>', { class: 'dir', href: dir, html: name, title: name });
        dir.on('click', this.selectDir.bind(this));
        this.div.append(dir);
      }
      for (let file of data.files) {
        let name = file.match(/[^\/]*$/)[0];
        let file = $('<a/>', { class: 'file', href: file, html: name, title: name });
        file.on('click', this.selectFile.bind(this));
        this.div.append(file);
      }
    },

    noHide(event) {
      event.stopPropagation();
    },

    show(event) {
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
