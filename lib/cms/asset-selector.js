ig.module('cms.asset-selector').defines(() => {
  cms.AssetSelector = ig.Class.extend({
    buttonDiv: null,
    div: null,
    apiUrl: null,
    selectedAsset: null,

    init(buttonDiv, apiUrl) {
      this.buttonDiv = buttonDiv;
      this.apiUrl = apiUrl;

      this.div = $('<div>e</div>', {class: 'assetPicker'});

      for (let name of ['folder1/', 'folder2/', 'folder3/', 'file1.png', 'file2.jpeg', 'file3.jpg']) {
        let el = $(`<div class="assetEntry"><img src="https://placekitten.com/100/100" /><p>${name}</p></div>`);
        this.div.append(el);
      }

      this.buttonDiv.before(this.div);

      this.loadDir('');
    },

    loadDir(dir) {
      let path = `${this.apiUrl}?dir=${encodeURIComponent(dir || '')}&type=images`;
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
      this.selectedAsset = $(event.target).attr('href');
      this.hide();
      return false;
    },

    showFiles(data) {
      // this.div.empty();
      console.log(data)
    }
  });
});
