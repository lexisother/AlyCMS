ig.module('cms.asset-selector')
    .defines(() => {
        cms.AssetSelector = ig.Class.extend({
            apiUrl: null,
            selectedAsset: null,

            init(apiUrl) {
                this.apiUrl = apiUrl;
            },

            loadDir(dir) {
                console.log(dir);
            }
        })
    });
