const jsToXliff12 = require('xliff/jsToXliff12')
const YAML = require('yaml')
const fs = require('fs')
const path = require('path')
const os = require('os')

const sourceLanguage = 'en'
const baseFolder = path.join('docs', 'metadata')

// These fields should be ignored in the spreadsheet.
const doNotTranslate = [
    'META_PAGE',
    'LANGUAGE',
    'TRANS_SOURCE',
]

// Given the contents of a folder, return the relevant Jekyll files/folders.
function getJekyllFiles(filenames) {
    const thingsToOmit = ['index.md', 'images']
    return filenames.filter(val => !thingsToOmit.includes(val))
}

// Generate translatable units.
function getUnit(source, target, note=null) {
    const unit = {
        source: source,
        target: target,
        additionalAttributes: {
        'xml:space': 'preserve',
        },
    }
    if (note) {
        unit.note = note
    }
    return unit
}
// Helper function to an XLIFF file.
function writeXliff(folder, filename, namespace, units, targetLanguage) {
    const js = {
        resources: {},
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
    }
    js.resources[namespace] = units
    jsToXliff12(js, (err, res) => {
        fs.writeFile(path.join(folder, filename), res, function(err) {
            if (err) {
                return console.log(err);
            }
        });
    });
}

// Convert the files for a particular language.
function doLanguage(language) {

    // Create the destination folder
    const destinationFolder = path.join('.', 'translations', language);
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
            // See if we should skip this one.
            const id = file.replace('.md', '')
            if (doNotTranslate.includes(id)) {
                continue
            }
            const filePath = path.join(fileFolder, file)
            const fileContents = fs.readFileSync(filePath, { encoding: 'utf8' })
            // This sequence parses the Jekyll-style front-matter and content.
            const [frontMatter, content] = fileContents.split('---').map(x => x.trim()).filter(x => x)
            const info = YAML.parse(frontMatter)
            units[id] = getUnit(content, language === 'en' ? content : '', info.parent)
        }

        // Write the output for this indicator.
        writeXliff(destinationFolder, folder + '.xliff', folder, units, language)
    }
}

// Figure out the target languages from the folders.
const targetLanguages = getJekyllFiles(fs.readdirSync(baseFolder))
for (const targetLanguage of targetLanguages) {
    // Process each language.
    doLanguage(targetLanguage);
}
