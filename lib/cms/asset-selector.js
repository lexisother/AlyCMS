ig.module('cms.asset-selector')
  .requires('cms.select-file-dropdown')
  .defines(() => {
    cms.AssetSelector = cms.SelectFileDropdown.extend({
      buttonDiv: null,
      div: null,
      apiUrl: null,
      selectedAsset: null,

      init(buttonDiv, apiUrl) {
        // Overrides
        this.filetype = 'images';
        this.apiUrl = apiUrl;

        this.buttonDiv = buttonDiv;
        this.div = $('<div/>', { class: 'assetPicker' });
        this.buttonDiv.before(this.div);

        this.loadDir('');
      },

      selectDir(event) {
        this.loadDir($(event.target.parentElement).attr('href'));
        return false;
      },

      selectFile(event) {
        $(this.div).children().css('background-color', '');
        let item = $(event.target.parentElement);
        this.selectedAsset = item.attr('href');
        item.css({ 'background-color': 'rgba(255, 255, 255, 0.3)' });
        return false;
      },

      showFiles(data) {
        // Initial UI construction
        this.parent(data);

        // Prettify
        this.div.children().each((_, e) => {
          let el = $(e);
          let title = el.attr('title') ?? '…parent directory';
          let href = el.attr('href');

          let url =
            title === '…parent directory' || title.endsWith('/')
              ? 'https://cdn-icons-png.flaticon.com/512/5994/5994710.png'
              : `/${href}`;

          el.html(`
            <img src="${url}" />
            <span>${title}</span>
          `);
        });
      },
    });
  });
