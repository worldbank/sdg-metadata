module.exports = function(refresh=false) {

    const path = require('path')
    const fs = require('fs')
    const utils = require('./utils')
    const store = require('../translation-store')

    const docOptions = {
        layout: 'iaeg-sdg.njk',
        layoutFolder: path.join(__dirname, 'layouts'),
    }
    const sdgMetadataConvert = require('sdg-metadata-convert')
    const pdfOutput = new sdgMetadataConvert.PdfOutput(docOptions)
    const yamlInput = new sdgMetadataConvert.YamlInput()

    if (refresh) {
        store.refresh()
    }

    // Compile arrays of source -> target conversions.
    const pdfConversions = []
    for (const language of store.getLanguages()) {
        const sourceLangFolder = language
        const sourceExtension = '.yml'
        const sourceFolder = path.join('translations-metadata', sourceLangFolder)
        const files = fs.readdirSync(sourceFolder).filter(file => {
            return path.extname(file).toLowerCase() === sourceExtension
        })
        for (const sourceFile of files) {
            const sourcePath = path.join(sourceFolder, sourceFile)
            const targetFolder = utils.createFolder(['www', 'documents', language])
            const pdfFile = sourceFile.replace(sourceExtension, '.pdf')
            const pdfPath = path.join(targetFolder, pdfFile)
            pdfConversions.push([sourcePath, pdfPath])
        }
    }
    convertPdfs()

    async function convertPdfs() {
        for (const conversion of pdfConversions) {
            const [inputFile, outputFile] = conversion
            try {
                const metadata = await yamlInput.read(inputFile)
                await pdfOutput.write(metadata, outputFile)
                console.log(`Converted ${inputFile} to ${outputFile}.`);
            } catch(e) {
                console.log(e)
            }
        }
    }
}
