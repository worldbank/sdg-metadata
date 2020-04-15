const path = require('path')
const fs = require('fs')

const sdgMetadataConvert = require('sdg-metadata-convert')
const wordTemplateInput = new sdgMetadataConvert.WordTemplateInput()
const gettextOutput = new sdgMetadataConvert.GettextOutput()

const sourceFolder = 'indicators'
const targetFolder = path.join('translations', 'templates')
const files = fs.readdirSync(sourceFolder).filter(file => {
    return path.extname(file).toLowerCase() === '.docx';
})
const conversions = files.map(sourceFile => {
    const sourcePath = path.join(sourceFolder, sourceFile)
    const targetFile = sourceFile.replace('.docx', '.pot')
    const targetPath = path.join(targetFolder, targetFile)
    return [sourcePath, targetPath]
})

importIndicators()

async function importIndicators() {
    for (const conversion of conversions) {
        const [inputFile, outputFile] = conversion
        try {
            const metadata = await wordTemplateInput.read(inputFile)
            await gettextOutput.write(metadata, outputFile)
            console.log(`Converted ${inputFile} to ${outputFile}.`);
        } catch(e) {
            console.log(e)
        }
    }
}
