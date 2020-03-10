const gettextParser = require('gettext-parser')
const fs = require('fs')
const path = require('path')
const YAML = require('yaml')
const os = require('os')
const builder = require('xmlbuilder')
const jsontoxml = require('jsontoxml')
const convertHTMLToPDF = require("pdf-puppeteer")
const pdfTemplate = require('./pdf-template')
const md = require('markdown-it')({
    html: true
}).use(require('markdown-it-footnote'))

const absoluteUrl = 'https://opendataenterprise.github.io/sdg-metadata'
const baseFolder = 'translations'
const destinationFolder = 'www'

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

// Get the absolute URL for an image.
function getImageFolder(language, indicatorId) {
    const path = `/metadata/${language}/${indicatorId}/images`
    return absoluteUrl + path
}

// Write data to a json file.
function writeJson(fileName, data, folderParts, message) {
    const payload = {
        status: 'success',
        message: message,
        data: data
    }
    folderParts.unshift('api')
    folderParts.unshift(destinationFolder)
    const folderPath = createFolder(folderParts)
    const filePath = path.join(folderPath, fileName + '.json')
    fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8')
}

// Write data to an XML file.
function writeXml(fileName, data, folderParts, message) {
    const payload = {
        root: {
            status: 'success',
            message: message,
            data: data,
        }
    }
    folderParts.unshift('api')
    folderParts.unshift(destinationFolder)
    const folderPath = createFolder(folderParts)
    const filePath = path.join(folderPath, fileName + '.xml')
    fs.writeFileSync(filePath, jsontoxml(payload, {
        escape: true,
        xmlHeader: true,
        prettyPrint: true,
    }), 'utf8')
}

// Figure out what languages we've translated.
const sourceLanguage = 'en'
const languages = [sourceLanguage]
for (const languageFolder of fs.readdirSync('translations')) {
    if (languageFolder != 'templates') {
        languages.push(languageFolder)
    }
}

const omitFromFull = [
    'META_PAGE',
    'META_LAST_UPDATE',
    'LANGUAGE',
    'TRANS_SOURCE',
]

const translations = {}

// Construct an object with all the individual translations of fields.
for (const language of languages) {

    const sourceFolder = path.join(baseFolder, language === sourceLanguage ? 'templates' : language)
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

// Make sure that missing translations at least have empty strings.
const sourceStrings = translations[sourceLanguage]
for (const language of languages) {
    if (language == sourceLanguage) {
        continue
    }
    for (const group of Object.keys(sourceStrings)) {
        if (!(group in translations[language])) {
            translations[language][group] = {}
        }
        for (const id of Object.keys(sourceStrings[group])) {
            if (!(id in translations[language][group])) {
                translations[language][group][id] = ''
            }
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
            if (omitFromFull.includes(field)) {
                continue
            }
            translations[language][indicatorId]['full'] += translations[language][indicatorId][field]
            translations[language][indicatorId]['full'] += os.EOL + os.EOL
        }
    }
}

let fileName, message

// Path: /api/indicators.json
// An array of indicator ids.
fileName = 'indicators'
jsonData = indicatorIds
message = 'An array of indicator ids'
writeJson(fileName, indicatorIds, [], message)
const indicatorIdsXml = {
    indicators: indicatorIds.map(o => Object.assign({
        name: 'indicator',
        attrs: {id: o},
        children: o,
    }))
}
writeXml(fileName, indicatorIdsXml, [], message)

// Path: /api/[indicator id]/fields.json
// An array of field names for that indicator.
for (const indicatorId of indicatorIds) {
    fileName = 'fields'
    message = 'An array of field names for indicator ' + indicatorId
    writeJson(fileName, fieldOrder[indicatorId], [indicatorId], message)
    const fieldsXml = {
        fields: fieldOrder[indicatorId].map(o => Object.assign({
            name: 'field',
            attrs: {id: o},
            children: o,

        }))
    }
    writeXml(fileName, fieldsXml, [indicatorId], message)
}

// Path: /api/[indicator id].json
// A json object, concatenation of all fields in all languages
for (const indicatorId of indicatorIds) {
    const fullIndicatorInAllLanguages = {}
    for (const language of languages) {
        fullIndicatorInAllLanguages[language] = translations[language][indicatorId]['full']
    }
    fileName = indicatorId
    message = 'All metadata fields for indicator ' + indicatorId + ', translated into all languages'
    writeJson(fileName, fullIndicatorInAllLanguages, [], message)
    const fullIndicatorInAllLanguagesXml = {
        languages: Object.entries(fullIndicatorInAllLanguages).map(o => Object.assign({
            name: 'language',
            attrs: {lang: o[0]},
            children: o[1],
        }))
    }
    writeXml(fileName, fullIndicatorInAllLanguagesXml, [], message)
}

// Path: /api/[indicator id]/[language].json
// Concatenation of all fields translated in that language
for (const indicatorId of indicatorIds) {
    for (const language of languages) {
        fileName = language
        message = 'All metadata fields for the indicator ' + indicatorId + ', translated into ' + language
        writeJson(fileName, translations[language][indicatorId]['full'], [indicatorId], message)
        writeXml(fileName, translations[language][indicatorId]['full'], [indicatorId], message)
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
        fileName = field
        message = 'The ' + field + ' field for indicator ' + indicatorId + ', translated into all languages'
        writeJson(fileName, translationsForField, [indicatorId], message)
        const translationsForFieldXml = {
            languages: Object.entries(translationsForField).map(o => Object.assign({
                name: 'language',
                attrs: {lang: o[0]},
                children: o[1],
            }))
        }
        writeXml(fileName, translationsForFieldXml, [indicatorId], message)
    }
}

// Path: /api/[indicator id]/[field]/[language].json
// Translation of field in that language
for (const indicatorId of indicatorIds) {
    for (const field of fieldOrder[indicatorId]) {
        for (const language of languages) {
            fileName = language
            message = 'The ' + field + ' field for indicator ' + indicatorId + ', translated into ' + language
            writeJson(fileName, translations[language][indicatorId][field], [indicatorId, field], message)
            writeXml(fileName, translations[language][indicatorId][field], [indicatorId, field], message)
        }
    }
}

// Path: /api/all.json
// All translations of all fields in all indicators.
fileName = 'all'
message = 'All translations of all fields in all indicators'
writeJson(fileName, translations, [], message)
const translationsXml = {
    languages: Object.entries(translations).map(oLang => Object.assign({
        name: 'language',
        attrs: {lang: oLang[0]},
        children: {
            indicators: Object.entries(oLang[1]).map(oIndicator => Object.assign({
                name: 'indicator',
                attrs: {id: oIndicator[0]},
                children: {
                    fields: Object.entries(oIndicator[1]).map(oField => Object.assign({
                        name: 'field',
                        attrs: {id: oField[0]},
                        children: oField[1],
                    })),
                },
            })),
        },
    })),
}
writeXml(fileName, translationsXml, [], message)

// We also need to put some files in www/_data for Jekyll to use.
fs.writeFileSync(path.join(destinationFolder, '_data', 'all.json'), JSON.stringify(translations), 'utf8')
fs.writeFileSync(path.join(destinationFolder, '_data', 'fields.json'), JSON.stringify(fieldOrder), 'utf8')

// Convert an indicator to fully-rendered HTML.
function getHtml(indicatorContent, language, indicatorId) {
    let html = '<p>This indicator has not been translated yet.</p>'
    if (indicatorContent.trim()) {
        html = md.render(indicatorContent)
    }
    // Images need to absolute instead of relative.
    const prefix = 'src="'
    const srcSearch = new RegExp(prefix + 'images', 'g')
    const srcReplace = prefix + getImageFolder(language, indicatorId)
    return html.replace(srcSearch, srcReplace)
}

// Generate the PDFs.
function getPuppeteerPdfOptions(lastUpdated) {
    return {
        // See https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagepdfoptions
        displayHeaderFooter: true,
        // Because of Puppeteer (or Chromium?) issues, we have to pass styles
        // in with the footer markup.
        footerTemplate: `
            <style>
                #footer { padding: 0 !important; }
                * { box-sizing: border-box; }
                div.footer {
                    text-align: right;
                    font-size: 10px;
                    height: 30px;
                    width: 100%;
                    margin: 0 50px;
                }
            </style>
            <div class='footer'>
                Page: <span class='pageNumber'></span> of <span class='totalPages'></span>
            </div>
        `,
        // Because of Puppeteer (or Chromium?) issues, we have to pass styles
        // in with the header markup.
        headerTemplate: `
            <style>
                #header { padding: 0 !important; }
                * { box-sizing: border-box; }
                div.header {
                    text-align: right;
                    font-size: 10px;
                    height: 50px;
                    width: 100%;
                    margin: 20px 50px 0 50px;
                }
            </style>
            <div class='header'>
                Last update: ${ lastUpdated }
            </div>
        `,
        format: 'A4',
        margin: {
            // These numbers tweaked to look OK despite the header/footer issues
            // linked above.
            top: '66px',
            right: '60px',
            bottom: '45px',
            left: '60px',
        },
    }
}
const pdfs = []
for (const indicatorId of indicatorIds) {
    for (const language of languages) {
        createFolder([destinationFolder, 'pdf', language])
        const html = getHtml(translations[language][indicatorId]['full'], language, indicatorId)
        const lastUpdated = translations[language][indicatorId]['META_LAST_UPDATE']
        pdfs.push([language, indicatorId, html, lastUpdated])
    }
}
processPdf(0)

// Write a PDF file.
function processPdf(pdfIndex) {
    if (pdfIndex < pdfs.length) {
        const [language, indicatorId, html, lastUpdated] = pdfs[pdfIndex]
        const fileName = 'Metadata-' + indicatorId + '.pdf'
        const filePath = path.join(destinationFolder, 'pdf', language, fileName)
        const htmlDoc = pdfTemplate(indicatorId, html)
        convertHTMLToPDF(htmlDoc, pdf => {
            fs.writeFileSync(filePath, pdf)
            processPdf(pdfIndex + 1)
        }, getPuppeteerPdfOptions(lastUpdated))
    }
}

// Generate an alternate XML structure for feedback.
const indicators = builder.create('indicators')

for (const indicatorId of indicatorIds) {

    const indicator = indicators.ele('indicator', { id: indicatorId })
    const fields = indicator.ele('fields')

    for (const fieldName of fieldOrder[indicatorId]) {

        const field = fields.ele('field', { id: fieldName })
        const translationsEle = field.ele('translations')

        for (const language of languages) {

            const translation = translationsEle.ele(
                'translation',
                { lang: language },
                translations[language][indicatorId][fieldName]
            )
        }
    }
}

const xml = indicators.end({ pretty: true });

if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder);
}

fs.writeFileSync(path.join(destinationFolder, 'api', 'all-alternate.xml'), xml, 'utf8')
