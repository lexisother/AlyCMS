ig.module('cms.settings-editor')
  .requires('cms.editor-components')
  .defines(() => {
    cms.SettingEditorBox = ig.Class.extend({
      apiUrl: null,
      div: null,

      init(buttonDiv, apiUrl) {
        this.apiUrl = apiUrl;
        this.div = $('<div/>', { class: 'modalSettingTable' });
        buttonDiv.before(this.div);

        this.loadSettings();
        this.constructTable();
      },

      constructTable() {
        if (!ig.editor.postCache[0]) {
          let el = $('<p>Please create a dummy post first!</p>');
          this.div.append(el);
          return;
        }
        let el = $('<table><tbody><tr><th>Key</th><th>Editor</th></tr></tbody></table>');
        let body = el.find('tbody');

        let blacklistedKeys = ['id', 'created_at', 'updated_at'];
        let editableKeys = Object.keys(ig.editor.postCache[0]).filter(
          (k) => !blacklistedKeys.includes(k),
        );

        for (let key of editableKeys) {
          let savedSetting = ig.editor.settings.typeMappings
            ? ig.editor.settings.typeMappings[key]
            : 'StringEditor';
          let dropdown = $('<select name="editorPicker"></select>');
          for (let editor of Object.keys(cms.EditorComponents)) {
            let option = $(`<option value="${editor}">${editor}</option>`);
            if (editor === savedSetting) option.attr('selected', '');
            dropdown.append(option);
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

      loadSettings() {
        let res = $.ajax({
          url: this.apiUrl,
          dataType: 'json',
          async: false,
        });
        console.log('Fetched settings:', res.responseJSON);
        res.responseJSON.map((s) => {
          let val;
          try {
            val = JSON.parse(`"${s.value}"`);
          } catch {
            val = JSON.parse(s.value);
          }
          ig.editor.settings[s.key] = val;
        });
      },
    });
  });
