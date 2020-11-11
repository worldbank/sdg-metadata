const path = require('path')
const fs = require('fs')

const sdgMetadataConvert = require('sdg-metadata-convert')
const wordTemplateInput = new sdgMetadataConvert.WordTemplateInput({debug:true})
const gettextOutput = new sdgMetadataConvert.GettextOutput()

const sourceFolder = 'indicators'
const targetFolder = path.join('translations', 'templates')
const files = fs.readdirSync(sourceFolder).filter(file => {
    return path.extname(file).toLowerCase() === '.docx';
})
const conversions = files.map(sourceFile => {
    const sourcePath = path.join(sourceFolder, sourceFile)
    const targetFile = sourceFile.replace('.docx', '.pot')
    const blankTranslationFile = sourceFile.replace('.docx', '.po')
    const targetPath = path.join(targetFolder, targetFile)
    return [sourcePath, targetPath, blankTranslationFile]
})

importIndicators()

async function importIndicators() {
    for (const conversion of conversions) {
        const [inputFile, outputFile, blankTranslationFile] = conversion
        try {
            const metadata = await wordTemplateInput.read(inputFile)
            const indicatorIsNew = !fs.existsSync(outputFile);
            if (indicatorIsNew) {
                for (const languageFolder of fs.readdirSync('translations')) {
                    if (languageFolder != 'templates') {
                        const blankTranslationOutput = new sdgMetadataConvert.GettextOutput({
                            language: languageFolder
                        })
                        const blankTranslationPath = path.join('translations', languageFolder, blankTranslationFile)
                        await blankTranslationOutput.write(metadata, blankTranslationPath)
                        console.log(`Converted ${inputFile} to ${blankTranslationPath}.`);
                    }
                }
            }
            await gettextOutput.write(metadata, outputFile)
            console.log(`Converted ${inputFile} to ${outputFile}.`);
        } catch(e) {
            console.log(e)
        }
    }
}
