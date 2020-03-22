const fs = require('fs')
const path = require('path')
const translationStore = require('./translation-store')

// We need to put some files in www/_data for Jekyll to use.
const destinationFolder = path.join('www', '_data')
const metadata = translationStore.getTranslationStore()
const fields = translationStore.getFieldOrders()
fs.writeFileSync(path.join(destinationFolder, 'all.json'), JSON.stringify(metadata), 'utf8')
fs.writeFileSync(path.join(destinationFolder, 'fields.json'), JSON.stringify(fields), 'utf8')
