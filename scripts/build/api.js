module.exports = function(refresh=false) {

    const fs = require('fs')
    const path = require('path')
    const builder = require('xmlbuilder')
    const jsontoxml = require('jsontoxml')
    const store = require('../translation-store')
    const utils = require('./utils')

    if (refresh) {
        store.refresh()
    }

    const destinationFolder = 'www'

    // Write data to a json file.
    function writeJson(fileName, data, folderParts, message) {
        const payload = {
            status: 'success',
            message: message,
            data: data
        }
        folderParts.unshift('api')
        folderParts.unshift(destinationFolder)
        const folderPath = utils.createFolder(folderParts)
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
        const folderPath = utils.createFolder(folderParts)
        const filePath = path.join(folderPath, fileName + '.xml')
        fs.writeFileSync(filePath, jsontoxml(payload, {
            escape: true,
            xmlHeader: true,
            prettyPrint: true,
        }), 'utf8')
    }

    // These general-use variables will be used below.
    const indicatorIds = store.getIndicatorIds()
    const languages = store.getLanguages()

    // We'll re-use these variables throughout the endpoints generated below.
    let fileName, message

    // Path: /api/indicators.json
    // An array of indicator ids.
    fileName = 'indicators'
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
        const fields = store.getFields()
        if (!fields) {
            continue
        }

        fileName = 'fields'
        message = 'An array of field names for indicator ' + indicatorId
        writeJson(fileName, fields, [indicatorId], message)
        const fieldsXml = {
            fields: fields.map(o => Object.assign({
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
            fullIndicatorInAllLanguages[language] = store.translateAllFields(indicatorId, language)
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
            const fullTranslation = store.translateAllFields(indicatorId, language)
            fileName = language
            message = 'All metadata fields for the indicator ' + indicatorId + ', translated into ' + language
            writeJson(fileName, fullTranslation, [indicatorId], message)
            writeXml(fileName, fullTranslation, [indicatorId], message)
        }
    }

    // Path: /api/[indicator id]/[field].json
    // A json object, translations for each language
    for (const indicatorId of indicatorIds) {
        for (const field of store.getFields()) {
            const translationsForField = {}
            for (const language of languages) {
                translationsForField[language] = store.translateField(indicatorId, field, language)
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
        for (const field of store.getFields()) {
            for (const language of languages) {
                const translation = store.translateField(indicatorId, field, language)
                fileName = language
                message = 'The ' + field + ' field for indicator ' + indicatorId + ', translated into ' + language
                writeJson(fileName, translation, [indicatorId, field], message)
                writeXml(fileName, translation, [indicatorId, field], message)
            }
        }
    }

    // Path: /api/all.json
    // All translations of all fields in all indicators.
    fileName = 'all'
    message = 'All translations of all fields in all indicators'
    const allTranslations = store.getTranslationStore()
    writeJson(fileName, allTranslations, [], message)
    const translationsXml = {
        languages: Object.entries(allTranslations).map(oLang => Object.assign({
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

    // Generate an alternate XML structure for feedback.
    const indicators = builder.create('indicators')

    for (const indicatorId of indicatorIds) {

        const indicator = indicators.ele('indicator', { id: indicatorId })
        const fields = indicator.ele('fields')

        for (const fieldName of store.getFields()) {

            const field = fields.ele('field', { id: fieldName })
            const translationsEle = field.ele('translations')

            for (const language of languages) {

                const translation = translationsEle.ele(
                    'translation',
                    { lang: language },
                    store.translateField(indicatorId, fieldName, language)
                )
            }
        }
    }

    const xml = indicators.end({ pretty: true });
    fs.writeFileSync(path.join(destinationFolder, 'api', 'all-alternate.xml'), xml, 'utf8')
}
