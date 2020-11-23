const path = require('path')
const fs = require('fs')
const gettextParser = require('gettext-parser')
const readXlsxFile = require('read-excel-file/node')
const downloadFile = require('download-file')

const spreadsheets = ['ru', 'es', 'fr']

const splitIndicators = {
    '1-1-1': ['1-1-1a', '1-1-1b'],
    '2-2-2': ['2-2-2a', '2-2-2b'],
    '4-1-1': ['4-1-1a', '4-1-1bc'],
    '5-5-1': ['5-5-1a', '5-5-1b'],
    '6-6-1': ['6-6-1a', '6-6-1b'],
    '17-3-1': ['17-3-1a', '17-3-1b'],
    '1-3-1': ['1-3-1a', '1-3-1b'],
    '12-3-1': ['12-3-1a', '12-3-1b'],
}

for (const language of spreadsheets) {
    importSpreadsheet(language)
}

async function importSpreadsheet(language) {
    filename = '2020-' + language + '.xlsx'

    const data = await readXlsxFile(filename)

    indicators = {}
    targets = {}
    goals = {}
    for (const row of data.slice(3)) {
        const goal = getGoal(row)
        const target = getTarget(row)
        const indicator = getIndicator(row)
        if (goal) {
            if (typeof goals[goal.id] === 'undefined') {
                goals[goal.id] = getGoalPrefix(language) + ' ' + goal.dots + ': ' + goal.title
            }
        }
        if (target) {
            if (typeof targets[target.id] === 'undefined') {
                targets[target.id] = getTargetPrefix(language) + ' ' + target.dots + ': ' + target.title
            }
        }
        if (indicator) {
            const indicatorIds = splitIndicators[indicator.id] ? splitIndicators[indicator.id] : [indicator.id]
            for (const indicatorId of indicatorIds) {
                if (typeof indicators[indicatorId] === 'undefined') {
                    indicators[indicatorId] = getIndicatorPrefix(language) + ' ' + indicator.dots + ': ' + indicator.title
                }
            }
        }
    }

    const baseFolder = 'translations'

    if (language == 'en') {
        for (const indicatorId of Object.keys(indicators)) {
            const goalId = indicatorId.split('-')[0]
            const targetId = indicatorId.split('-').slice(0, 2).join('-')
            const sourceFolder = path.join(baseFolder, 'templates')
            const sourceFile = path.join(sourceFolder, indicatorId + '.pot')
            if (!fs.existsSync(sourceFile)) {
                continue
            }
            const indicatorTranslation = '<p>' + indicators[indicatorId] + '</p>'
            const goalTranslation = '<p>' + goals[goalId] + '</p>'
            const targetTranslation = '<p>' + targets[targetId] + '</p>'
            const input = fs.readFileSync(sourceFile)
            const po = gettextParser.po.parse(input)
            updateGettextTranslation(po, 'SDG_INDICATOR', indicatorTranslation)
            updateGettextTranslation(po, 'SDG_GOAL', goalTranslation)
            updateGettextTranslation(po, 'SDG_TARGET', targetTranslation)
            const output = gettextParser.po.compile(po)
            fs.writeFileSync(sourceFile, output)
        }
    }
    else {
        const baseFolder = 'translations'
        const templateFolder = path.join(baseFolder, 'templates')
        const files = fs.readdirSync(templateFolder).filter(file => {
            return path.extname(file).toLowerCase() === '.pot'
        })
        for (const file of files) {
            const indicatorId = normalizeIndicatorId(file.split('.')[0])
            const goalId = indicatorId.split('-')[0]
            const targetId = indicatorId.split('-').slice(0, 2).join('-')

            if (typeof indicators[indicatorId] === 'undefined') {
                continue
            }

            if (!fs.existsSync(path.join(baseFolder, language))) {
                continue
            }

            const sourceFolder = path.join(baseFolder, language)
            const sourceFile = path.join(sourceFolder, file.replace('.pot', '.po'))

            const indicatorTranslation = '<p>' + indicators[indicatorId] + '</p>'
            const goalTranslation = '<p>' + goals[goalId] + '</p>'
            const targetTranslation = '<p>' + targets[targetId] + '</p>'

            const inputFile = (fs.existsSync(sourceFile)) ? sourceFile : path.join(templateFolder, file)
            const input = fs.readFileSync(inputFile)
            const po = gettextParser.po.parse(input)
            updateGettextTranslation(po, 'SDG_INDICATOR', indicatorTranslation)
            updateGettextTranslation(po, 'SDG_GOAL', goalTranslation)
            updateGettextTranslation(po, 'SDG_TARGET', targetTranslation)
            const output = gettextParser.po.compile(po)
            fs.writeFileSync(sourceFile, output)
        }
    }
}

function getGoalPrefix(language) {
    switch (language) {
        case 'fr':
            return 'Objectif'
        case 'es':
            return 'Meta'
        case 'ru':
            return 'Цель'
    }
}

function getTargetPrefix(language) {
    switch (language) {
        case 'fr':
            return 'Cible'
        case 'es':
            return 'Objetivo'
        case 'ru':
            return 'Задача'
    }
}

function getIndicatorPrefix(language) {
    switch (language) {
        case 'fr':
            return 'Indicateur'
        case 'es':
            return 'Indicador'
        case 'ru':
            return 'Показатель'
    }
}

function getGoal(row) {
    if (row[1] != null || row[2] != null) {
        return false
    }
    if (!row[0]) {
        return false
    }
    const id = sdgNumberFromText(row[0])
    if (!id) {
        return false
    }
    const parts = id.split('.')
    if (parts.length > 1) {
        return false
    }
    if (!isNumeric(id)) {
        return false
    }
    if (parseInt(id) > 17) {
        return false
    }
    const title = titleWithoutId(row[0], id)
    return {
        id: dotsToDashes(id),
        title: title,
        dots: id,
    }
}

function getTarget(row) {
    if (!row[0]) {
        return false
    }
    const id = sdgNumberFromText(row[0])
    if (!id) {
        return false
    }
    const parts = id.split('.')
    if (parts.length != 2) {
        return false
    }
    const title = titleWithoutId(row[0], id)
    return {
        id: dotsToDashes(id),
        title: title,
        dots: id,
    }
}

function getIndicator(row) {
    if (!row[1]) {
        return false
    }
    const id = sdgNumberFromText(row[1])
    if (!id) {
        return false
    }
    const parts = id.split('.')
    if (parts.length != 3) {
        return false
    }
    const title = titleWithoutId(row[1], id)
    return {
        id: dotsToDashes(id),
        title: title,
        dots: id,
    }
}

function sdgNumberFromText(text) {
    if (!text) {
        return false
    }
    const regex = /(\d+)(\.\w+)?(\.\w+)?/g
    const matches = text.match(regex)
    if (matches == null || matches.length < 1) {
        return false
    }
    let match = matches[0]
    const matchParts = match.split('.')
    if (matchParts.length === 3 && matchParts[2].length > 2) {
        let match2Replacement = ''
        for (const character of matchParts[2]) {
            if (isNumeric(character) || isLowerCase(character)) {
                match2Replacement += character
            }
            else {
                break
            }
        }
        if (match2Replacement != '' && match2Replacement != matchParts[2]) {
            match = matchParts[0] + '.' + matchParts[1] + '.' + match2Replacement
        }
    }
    return match
}

function titleWithoutId(text, id) {
    for (let i = 1; i < 10; i++) {
        if (text.slice(-1) == i.toString()) {
            text = text.slice(0, -1)
            break
        }
    }
    if (text.slice(-1) == 'i') {
        text = text.slice(0, -1)
    }
    const parts = text.split(id)
    if (parts.length == 2) {
        text = parts[1].trim()
        if (text.slice(0, 1) == '.') {
            text = text.slice(1)
        }
    }
    return text.trim()
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isLowerCase(c) {
    return c == c.toLowerCase()
}

function dotsToDashes(text) {
    return text.replace(/\./g, '-')
}

function normalizeIndicatorId(indicatorId) {
    return indicatorId.replace(/\./g, '-')
}

function updateGettextTranslation(po, key, translation) {
    for (const sourceString of Object.keys(po.translations[key])) {
        po.translations[key][sourceString].msgstr = [translation]
    }
}
