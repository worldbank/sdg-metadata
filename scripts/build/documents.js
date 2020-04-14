module.exports = function(refresh=false) {

    const {
        GettextInput,
        PdfOutput
    } = require('sdg-metadata-convert')
    const path = require('path')
    const fs = require('fs')
    const utils = require('./utils')
    const store = require('../translation-store')

    if (refresh) {
        store.refresh()
    }

    for (const language of store.getLanguages()) {
        const sourceLangFolder = (language === 'en') ? 'templates' : language
        const sourceExtension = (language === 'en') ? '.pot' : '.po'
        const sourceFolder = path.join('translations', sourceLangFolder)
        const files = fs.readdirSync(sourceFolder).filter(file => {
            return path.extname(file).toLowerCase() === sourceExtension;
        })
        for (const sourceFile of files) {
            const sourcePath = path.join(sourceFolder, sourceFile)
            const targetFolder = utils.createFolder(['www', 'documents', language])
            const pdfFile = sourceFile.replace(sourceExtension, '.pdf')
            const pdfPath = path.join(targetFolder, pdfFile)
            const docOptions = { layout: 'iaeg-sdg.njk' }
            // @TODO: This will run out of memory if there are a lot of indicators.
            // Need to learn about Promises and use them here.
            new GettextInput(sourcePath).convertTo(new PdfOutput(pdfPath, docOptions))
        }
    }
}
