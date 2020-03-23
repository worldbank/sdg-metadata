module.exports = function(refresh=false) {

    const fs = require('fs')
    const path = require('path')
    const store = require('../translation-store')

    if (refresh) {
        store.refresh()
    }

    // We need to put a file in www/_data for Jekyll to use.
    const destinationFolder = path.join('www', '_data')
    const jekyllData = {
        metadata: store.getTranslationStore(),
        fields: store.getFieldOrders(),
    }

    fs.writeFileSync(path.join(destinationFolder, 'store.json'), JSON.stringify(jekyllData), 'utf8')
}
