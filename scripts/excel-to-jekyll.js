const readXlsxFile = require('read-excel-file/node')
const fs = require('fs')
const path = require('path')
const os = require('os')
const YAML = require('yaml')
const excelFile = 'source.xlsx'

// Create folders from a Unix path (eg, "foo/bar").
function createFolder(folderPath) {
    const parts = folderPath.split('/')
    let folder = '.'
    for (const part of parts) {
        folder = folder + path.sep + part
        if (!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }
    }
}

// Figure out what indicator a sheet refers to (with dashes, not dots).
function indicatorFromSheet(sheetName) {
    return sheetName.split(".").slice(0, 3).join("-").split(' ')[0]
}

// Write a Markdown file.
function writeMarkdownFile(folder, filename, content, frontMatter={}) {
    createFolder(folder)

    const lines = [
        '---',
        YAML.stringify(frontMatter).trim(),
        '---',
        content,
    ]
    const filePath = folder + path.sep + filename + '.md'

    fs.writeFile(filePath, lines.join(os.EOL), function(err) {
        if (err) {
            return console.log(err);
        }
    });
}

async function doLanguage(language) {

    // Create the base folder for this language.
    const baseFolder = 'docs/metadata/' + language

    // In the course of generating the files, we'll also be compiling a set of
    // translations for goals and targets.
    const targets = {}
    const goals = {}

    const sheets = await readXlsxFile(excelFile, { getSheets: true })
    for (const sheet of sheets) {
        const sheetName = sheet.name
        const indicator = indicatorFromSheet(sheetName)
        const indicatorFolder = baseFolder + '/' + indicator
        const fields = []

        // Loop through the rows of the Excel file to get the fields.
        const rows = await readXlsxFile(excelFile, { sheet: sheetName })
        rows.shift() // Remove the header.
        for (const row of rows) {
            const [parent, id, value] = row
            // Skip any that are missing a column.
            if (!id || !value || !parent) {
                continue
            }

            // Create page for this field.
            writeMarkdownFile(indicatorFolder, id, value, {
                title: 'Field: ' + id,
                layout: 'field',
                parent: parent,
                language: language,
                indicator: indicator,
                slug: id,
            })
            // Save fields for later.
            fields.push(id)
        }

        // Create the page for this indicator.
        writeMarkdownFile(indicatorFolder, 'index', '', {
            title: 'Indicator: ' + indicator,
            layout: 'indicator',
            language: language,
            fields: fields,
            slug: indicator,
        })
    }

    // Create a page for this language.
    writeMarkdownFile(baseFolder, 'index', '', {
        title: 'Language: ' + language,
        layout: 'language',
        language: language,
        slug: language,
    })
}

// Run this import for both languages.
const targetLanguages = ['en', 'ru']
for (const targetLanguage of targetLanguages) {
    doLanguage(targetLanguage);
}

// Create a metadata landing page.
writeMarkdownFile('docs/metadata', 'index', '', {
    title: 'Browse metadata',
    layout: 'metadata',
    slug: 'metadata',
    languages: targetLanguages
})
