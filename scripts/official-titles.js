const path = require('path')
const fs = require('fs')
const gettextParser = require('gettext-parser')
const bent = require('bent')
const getJSON = bent('json')

async function getOfficialTitles() {
    const translations = await getJSON('https://open-sdg.org/sdg-translations/translations.json')
    const baseFolder = 'translations'
    const templateFolder = path.join(baseFolder, 'templates')
    const files = fs.readdirSync(templateFolder).filter(file => {
        return path.extname(file).toLowerCase() === '.pot'
    })
    for (const file of files) {
        const indicatorId = normalizeIndicatorId(file.split('.')[0])

        const indicatorKey = indicatorId + '-title'
        const goalKey = indicatorId.split('-')[0] + '-title'
        const targetKey = indicatorId.split('-').slice(0, 2).join('-') + '-title'

        if (typeof translations.en.global_indicators[indicatorKey] === 'undefined') {
            continue
        }

        for (const languageFolder of fs.readdirSync(baseFolder)) {
            if (languageFolder === 'templates') {
                continue
            }
            if (typeof translations[languageFolder] === 'undefined') {
                continue
            }
            const sourceFolder = path.join(baseFolder, languageFolder)
            const sourceFile = path.join(sourceFolder, file.replace('.pot', '.po'))

            const goal = '<p>' + translations[languageFolder].global_goals[goalKey] + '</p>'
            const target = '<p>' + translations[languageFolder].global_targets[targetKey] + '</p>'

            const inputFile = (fs.existsSync(sourceFile)) ? sourceFile : path.join(templateFolder, file)
            const input = fs.readFileSync(inputFile)
            const po = gettextParser.po.parse(input)
            updateGettextTranslation(po, 'SDG_GOAL', goal)
            updateGettextTranslation(po, 'SDG_TARGET', target)
            const output = gettextParser.po.compile(po)
            fs.writeFileSync(sourceFile, output)
        }
    }
}

getOfficialTitles()

function normalizeIndicatorId(indicatorId) {
    return indicatorId.replace(/\./g, '-')
}

function updateGettextTranslation(po, key, translation) {
    for (const sourceString of Object.keys(po.translations[key])) {
        po.translations[key][sourceString].msgstr = [translation]
    }
}
