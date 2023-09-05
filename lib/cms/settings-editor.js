ig.module('cms.settings-editor')
  .requires('cms.editor-components')
  .defines(() => {
    cms.SettingEditorBox = ig.Class.extend({
      div: null,

      init(buttonDiv, apiUrl) {
        this.div = $('<div/>', { class: 'modalSettingTable' });
        buttonDiv.before(this.div);

        this.constructTable();
      },

      constructTable() {
        let el = $('<table><tbody><tr><th>Key</th><th>Editor</th></tr></tbody></table>');
        let body = el.find('tbody');

        let blacklistedKeys = ['id', 'created_at', 'updated_at'];
        let editableKeys = Object.keys(ig.editor.postCache[0]).filter(
          (k) => !blacklistedKeys.includes(k),
        );

        for (let key of editableKeys) {
          let dropdown = $(`<select name="${key}-editorPicker"></select>`);
          for (let editor of Object.keys(cms.EditorComponents)) {
            // TODO: Set `selected` on the value retrieved from the API
            dropdown.append(`<option value="${editor}" selected>${editor}</option>`);
          }
          let tr = $(`<tr><td>${key}</td><td></td></tr>`);
          $($(tr).find('td')[1]).append(dropdown);
          body.append(tr);
        }

        this.div.append(el);
      },

      getSettings() {
        let settings = {
          typeMappings: {},
        };

        let body = $('.modalSettingTable').find('tbody');
        body.children().each((i, el) => {
          if (i === 0) return;
          let key = $($(el).children()[0]).text();
          let value = $($(el).children()[1]).find('select')[0].value;
          settings.typeMappings[key] = value;
        });

        return settings;
      },
    });
  });
