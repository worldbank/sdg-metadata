module.exports = function(refresh=false) {

    const fs = require('fs')
    const path = require('path')
    const store = require('../translation-store')
    const { conceptStore } = require('sdg-metadata-convert')

    if (refresh) {
        store.refresh()
    }

    // We need to put a file in www/_data for Jekyll to use.
    const destinationFolder = path.join('www', '_data')
    const jekyllData = {
        metadata: store.getTranslationStore(),
        // For the site's purposes we would like fields in the pre-2020 order.
        fields: store.getFields('iaeg').map(cid => conceptStore.getConcept(cid))
    }

    fs.writeFileSync(path.join(destinationFolder, 'store.json'), JSON.stringify(jekyllData), 'utf8')
}
