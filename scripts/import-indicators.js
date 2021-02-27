const path = require('path')
const fs = require('fs')

const sdgMetadataConvert = require('sdg-metadata-convert')
const wordTemplateInput = new sdgMetadataConvert.WordTemplateInput({debug:true})
const yamlOutput = new sdgMetadataConvert.YamlOutput()

const sourceFolder = 'indicators'
const targetFolder = path.join('translations-metadata', 'en')
const extensions = ['.docx', '.docm']
const files = fs.readdirSync(sourceFolder).filter(file => {
    return extensions.includes(path.extname(file).toLowerCase());
})
const conversions = files.map(sourceFile => {
    const sourcePath = path.join(sourceFolder, sourceFile)
    const targetFile = sourceFile.split('.')[0] + '.yml'
    const blankTranslationFile = sourceFile.split('.')[0] + '.yml'
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
                        const blankTranslationOutput = new sdgMetadataConvert.YamlOutput()
                        const blankTranslationPath = path.join('translations', languageFolder, blankTranslationFile)
                        await blankTranslationOutput.write(metadata, blankTranslationPath)
                        console.log(`Converted ${inputFile} to ${blankTranslationPath}.`);
                    }
                }
            }
            await yamlOutput.write(metadata, outputFile)
            console.log(`Converted ${inputFile} to ${outputFile}.`);
        } catch(e) {
            console.log(e)
        }
    }
}
