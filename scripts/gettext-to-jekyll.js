const gettextParser = require('gettext-parser')
const fs = require('fs')
const path = require('path')
const os = require('os')
const YAML = require('yaml')

const fieldOrder = YAML.parse(fs.readFileSync('field-order.yml', { encoding: 'utf-8' }))

// Create folders from a Unix path (eg, "foo/bar").
function createFolder(folderPath) {
    const parts = folderPath.split('/')
    let folder = '.'
    for (const part of parts) {
        folder = folder + path.sep + part
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    }
}

const baseFolder = 'translations'
const destinationFolder = '_build'
createFolder(destinationFolder)

const languages = ['en', 'ru']

for (const language of languages) {

    const sourceFolder = path.join(baseFolder, language === 'en' ? 'templates' : language)

    const files = fs.readdirSync(sourceFolder)
    for (const file of files) {
        const filePath = path.join(sourceFolder, file)
        const po = fs.readFileSync(filePath, { encoding: 'utf-8' })
        const parsed = gettextParser.po.parse(po)
        const indicator_id = file.split('.')[0]
        const outputFolder = path.join(destinationFolder, language)
        const fileName = indicator_id + '.md'

        // Remove headers.
        delete parsed.translations['']

        const frontMatter = [
            '---',
            'title: "Indicator: ' + indicator_id + '"',
            'layout: indicator',
            'language: ' + language,
            'slug: "' + indicator_id + '"',
            '---'
        ].join(os.EOL)

        const fieldOutput = []
        fieldOrder[indicator_id].forEach(field => {
            const source = Object.keys(parsed.translations[field])[0]
            const target = language === 'en' ? source : parsed.translations[field][source]['msgstr'][0]
            fieldOutput.push(target)
        })

        const fileOutput = frontMatter + os.EOL + fieldOutput.join(os.EOL + os.EOL)
        createFolder(outputFolder)
        fs.writeFileSync(path.join(outputFolder, fileName), fileOutput, 'utf8')
    }
}