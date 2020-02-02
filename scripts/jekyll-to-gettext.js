const gettextParser = require('gettext-parser')
const YAML = require('yaml')
const fs = require('fs')
const path = require('path')
const os = require('os')

const baseFolder = path.join('docs', 'metadata')

// Given the contents of a folder, return the relevant Jekyll files/folders.
function getJekyllFiles(filenames) {
    const thingsToOmit = ['index.md', 'images', 'translations.json']
    return filenames.filter(val => !thingsToOmit.includes(val))
}

// Get a header for a PO file.
function getHeaders(language=null) {
    const headers = {
        'MIME-Version': '1.0',
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding': '8bit'
    }
    if (language) {
        headers['Language'] = language
    }
    return headers
}

// Generate translatable units.
function getUnit(source, target, context=null) {
    source = source.replace(/\r\n/g, "\n")
    const unit = {
        msgid: source,
        msgstr: target
    }
    if (context) {
        unit.msgctxt = context
    }
    return unit
}

// Helper function to a PO file.
function writePo(folder, component, units, targetLanguage=null) {
    const extension = targetLanguage ? '.po' : '.pot'
    const data = {
        headers: getHeaders(targetLanguage),
        translations: {
            "": units
        }
    }
    const fileData = gettextParser.po.compile(data)
    fs.writeFileSync(path.join(folder, component + extension), fileData)
}

// Convert the files for a particular language.
function doLanguage(language) {

    // Create the destination folder
    const destinationFolder = path.join('.', 'translations', language === 'en' ? 'templates' : language);
    if (!fs.existsSync(destinationFolder)) {
        fs.mkdirSync(destinationFolder);
    }

    // Get the list of files from the Jekyll folders.
    const languageFolder = path.join(baseFolder, language)
    const folders = getJekyllFiles(fs.readdirSync(languageFolder))
    for (const folder of folders) {
        const units = {}
        const fileFolder = path.join(languageFolder, folder)
        const files = getJekyllFiles(fs.readdirSync(fileFolder))
        for (const file of files) {
            const id = file.replace('.md', '')
            const filePath = path.join(fileFolder, file)
            const fileContents = fs.readFileSync(filePath, { encoding: 'utf8' })
            // Remove the "front matter" and get just the content.
            const content = fileContents.split('---').slice(2).join('---').trim()
            units[id] = getUnit(content, null, id)
        }

        // Write the output for this indicator.
        writePo(destinationFolder, folder, units, language === 'en' ? null : language)
    }
}

// Figure out the target languages from the folders.
const targetLanguages = getJekyllFiles(fs.readdirSync(baseFolder))
for (const targetLanguage of targetLanguages) {
    doLanguage(targetLanguage);
}
