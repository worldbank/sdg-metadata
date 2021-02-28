const fs = require('fs')
const os = require('os')
const path = require('path')
const yaml = require('js-yaml')
const gettextParser = require('gettext-parser')

const baseFolder = 'translations-misc'
const sourceLanguage = 'en'
const sourceLanguageFolder = 'templates'
const destinationFolder = 'translations-site'

function convertToYaml() {
    const translations = {}

    // Construct an object with all the individual translations of fields.
    for (const languageFolder of fs.readdirSync(baseFolder)) {

        const sourceFolder = path.join(baseFolder, languageFolder)
        const isSourceLanguage = (languageFolder === sourceLanguageFolder)
        const language = (isSourceLanguage) ? sourceLanguage : languageFolder
        const extension = (languageFolder === sourceLanguageFolder) ? '.pot' : '.po'
        translations[language] = {}

        const files = fs.readdirSync(sourceFolder).filter(file => {
            return path.extname(file).toLowerCase() === extension
        })
        for (const file of files) {
            const destinationFileName = file.replace(extension, '.yml')
            const filePath = path.join(sourceFolder, file)
            const destinationFilePath = path.join(destinationFolder, language, destinationFileName)
            const data = fs.readFileSync(filePath, { encoding: 'utf-8' })
            const parsed = gettextParser.po.parse(data)
            delete parsed.translations['']
            const yamlData = {}
            for (const id of Object.keys(parsed.translations)) {
                const source = Object.keys(parsed.translations[id])[0]
                const item = parsed.translations[id][source]
                const value = (isSourceLanguage) ? item.msgid : item.msgstr[0]
                yamlData[id] = value
            }
            const yamlStr = yaml.dump(yamlData)
            fs.writeFileSync(destinationFilePath, yamlStr, 'utf8');
        }
    }
}

convertToYaml()