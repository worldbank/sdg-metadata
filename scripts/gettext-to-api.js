const gettextParser = require('gettext-parser')
const fs = require('fs')
const path = require('path')
const YAML = require('yaml')
const os = require('os')

const baseFolder = 'translations'
const destinationFolder = '_build'

// Create folders from an array of parts. Returns the path of the folder.
function createFolder(folderParts) {
    let folder = '.'
    for (const part of folderParts) {
        folder = folder + path.sep + part
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    }
    return folderParts.join(path.sep)
}

// Write data to a json file.
function writeJson(fileName, data, folderParts=[]) {
    folderParts.unshift('api')
    folderParts.unshift(destinationFolder)
    const folderPath = createFolder(folderParts)
    const filePath = path.join(folderPath, fileName + '.json')
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8')
}

const languages = ['en', 'ru']
const translations = {}

// Construct an object with all the individual translations of fields.
for (const language of languages) {

    const sourceFolder = path.join(baseFolder, language === 'en' ? 'templates' : language)
    translations[language] = {}

    const files = fs.readdirSync(sourceFolder)
    for (const file of files) {
        const filePath = path.join(sourceFolder, file)
        const po = fs.readFileSync(filePath, { encoding: 'utf-8' })
        const parsed = gettextParser.po.parse(po)
        const group = file.split('.')[0]
        translations[language][group] = {}

        // Remove headers.
        delete parsed.translations['']

        for (const id of Object.keys(parsed.translations)) {
          const source = Object.keys(parsed.translations[id])[0]
          const target = language === 'en' ? source : parsed.translations[id][source]['msgstr'][0]
          translations[language][group][id] = target
        }
    }
}

const indicatorIds = Object.keys(translations[languages[0]])
const fieldOrder = YAML.parse(fs.readFileSync(path.join('scripts', 'field-order.yml'), { encoding: 'utf-8' }))

// Also compile the individual fields into a big "full" field.
for (const language of languages) {
    for (const indicatorId of indicatorIds) {
        translations[language][indicatorId]['full'] = ''
        for (const field of fieldOrder[indicatorId]) {
            translations[language][indicatorId]['full'] += translations[language][indicatorId][field]
            translations[language][indicatorId]['full'] += os.EOL + os.EOL
        }
    }
}

// Path: /api/indicators.json
// An array of indicator ids.
writeJson('indicators', indicatorIds)

// Path: /api/[indicator id]/fields.json
// An array of field names for that indicator.
for (const indicatorId of indicatorIds) {
    const fields = fieldOrder[indicatorId]
    writeJson('fields', fields, [indicatorId])
}

// Path: /api/[indicator id].json
// A json object, concatenation of all fields in all languages
for (const indicatorId of indicatorIds) {
    const fullIndicatorInAllLanguages = {}
    for (const language of languages) {
        fullIndicatorInAllLanguages[language] = translations[language][indicatorId]['full']
    }
    writeJson(indicatorId, fullIndicatorInAllLanguages)
}

// Path: /api/[indicator id]/[language].json
// Concatenation of all fields translated in that language
for (const indicatorId of indicatorIds) {
    for (const language of languages) {
        writeJson(language, translations[language][indicatorId]['full'], [indicatorId])
    }
}

// Path: /api/[indicator id]/[field].json
// A json object, translations for each language
for (const indicatorId of indicatorIds) {
    for (const field of fieldOrder[indicatorId]) {
        const translationsForField = {}
        for (const language of languages) {
            translationsForField[language] = translations[language][indicatorId][field]
        }
        writeJson(field, translationsForField, [indicatorId])
    }
}

// Path: /api/[indicator id]/[field]/[language].json
// Translation of field in that language
for (const indicatorId of indicatorIds) {
    for (const field of fieldOrder[indicatorId]) {
        for (const language of languages) {
            writeJson(language, translations[language][indicatorId][field], [indicatorId, field])
        }
    }
}

// Path: /api/all.json
// All translations of all fields in all indicators.
writeJson('all', translations)
