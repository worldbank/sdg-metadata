const fs = require('fs')
const os = require('os')
const path = require('path')
const gettextParser = require('gettext-parser')
const { conceptStore, GettextInput, YamlOutput } = require('sdg-metadata-convert')

const baseFolder = 'translations'
const sourceLanguage = 'en'
const sourceLanguageFolder = 'templates'
const destinationFolder = 'translations-metadata'
const output = new YamlOutput()

function convertToYaml() {
    const translations = {}

    // Construct an object with all the individual translations of fields.
    for (const languageFolder of fs.readdirSync(baseFolder)) {

        const sourceFolder = path.join(baseFolder, languageFolder)
        const isSourceLanguage = (languageFolder === sourceLanguageFolder)
        const language = (isSourceLanguage) ? sourceLanguage : languageFolder
        const gettextInput = new GettextInput({ sourceStrings: isSourceLanguage })
        const extension = (languageFolder === sourceLanguageFolder) ? '.pot' : '.po'
        translations[language] = {}

        const files = fs.readdirSync(sourceFolder).filter(file => {
            return path.extname(file).toLowerCase() === extension
        })
        for (const file of files) {
            const destinationFileName = file.replace(extension, '.yml')
            const filePath = path.join(sourceFolder, file)
            const destinationFilePath = path.join(destinationFolder, language, destinationFileName)
            gettextInput.read(filePath)
                .then(metadata => output.write(metadata, destinationFilePath))
                .catch(err => console.log(err))
        }
    }
}

convertToYaml()