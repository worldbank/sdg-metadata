const fs = require('fs')
const os = require('os')
const path = require('path')
const YAML = require('yaml')
const gettextParser = require('gettext-parser')

const baseFolder = 'translations'
const sourceLanguage = 'en'
const sourceLanguageFolder = 'templates'

let translationStore = buildTranslationStore()
let fieldOrders = buildFieldOrders()

/**
 * Make sure an indicator ID is dash-delimited.
 *
 * @param {String} indicatorId
 *   An indicator ID using dashes or dots
 * @returns {String}
 *   The same indicator ID using dashes
 */
function normalizeIndicatorId(indicatorId) {
    return indicatorId.replace(/\./g, '-')
}

/**
 * Get an array of all the language codes being translated, including English.
 *
 * @returns {Array}
 *   the language codes being translated, including English
 */
function getLanguages() {
    return Object.keys(translationStore)
}

/**
 * Get an array of all the indicator IDs being translated.
 *
 * @returns {Array}
 *   the indicator IDs being translated
 */
function getIndicatorIds() {
    return Object.keys(translationStore[sourceLanguage])
}

/**
 * Get an array of all the fields in an indicator.
 *
 * @param {String} indicatorId
 *   the indicator ID, such as '1-1-1' or '1.1.1' (dashes or dots is fine)
 */
function getFields(indicatorId) {
    indicatorId = normalizeIndicatorId(indicatorId)
    return fieldOrders[indicatorId] || []
}

/**
 * Get a translation of a particular metadata field.
 *
 * @param {String} indicatorId
 *   the indicator ID, such as '1-1-1' or '1.1.1' (dashes or dots is fine)
 * @param {String} field
 *   the field name, such as 'COLL_METHOD'
 * @param {String} language
 *   the language code, such as 'ru'
 * @returns {String}
 *   the translation of the specified metadata field
 */
function translateField(indicatorId, field, language) {
    indicatorId = normalizeIndicatorId(indicatorId)
    return translationStore[language][indicatorId][field]
}

/**
 * Get a translation of all the metadata fields together.
 *
 * @param {String} indicatorId
 *   the indicator ID, such as '1-1-1' or '1.1.1' (dashes or dots is fine)
 * @param {String} language
 *   the language code, such as 'ru'
 * @returns {String}
 *   the translation of all the metadata for the specified indicator
 */
function translateAllFields(indicatorId, language) {
    indicatorId = normalizeIndicatorId(indicatorId)
    const omitFromFull = [
        'META_PAGE',
        'META_LAST_UPDATE',
        'LANGUAGE',
        'TRANS_SOURCE',
    ]
    let output = ''
    for (const field of getFields(indicatorId)) {
        if (omitFromFull.includes(field)) {
            continue
        }
        output += translateField(indicatorId, field, language)
        output += os.EOL + os.EOL
    }
    return output
}

/**
 * Return the full translation store nested object.
 *
 * @returns {Object}
 *   A nested object - language code -> indicator id -> metadata field
 */
function getTranslationStore() {
    return translationStore
}

/**
 * Return the hardcoded orders of fields per indicator.
 *
 * @returns {Object}
 *   An object with indicator IDs keyed to lists of fields
 */
function getFieldOrders() {
    return fieldOrders
}

/**
 * Build our hardcoded orders of fields per indicator. Internal only.
 *
 * @returns {Object}
 *   An object with indicator IDs keyed to lists of fields
 */
function buildFieldOrders() {
    return YAML.parse(fs.readFileSync(path.join('scripts', 'field-order.yml'), {
        encoding: 'utf-8'
    }))
}

/**
 * Parse the translation files and construct the data structure. Internal only.
 *
 * @returns {Object}
 *   A nested object - language code -> indicator id -> metadata field
 */
function buildTranslationStore() {
    const translations = {}

    // Construct an object with all the individual translations of fields.
    for (const languageFolder of fs.readdirSync(baseFolder)) {

        const sourceFolder = path.join(baseFolder, languageFolder)
        const language = (languageFolder === sourceLanguageFolder) ? sourceLanguage : languageFolder
        translations[language] = {}

        const files = fs.readdirSync(sourceFolder)
        for (const file of files) {
            const filePath = path.join(sourceFolder, file)
            const po = fs.readFileSync(filePath, { encoding: 'utf-8' })
            const parsed = gettextParser.po.parse(po)
            const group = normalizeIndicatorId(file.split('.')[0])
            if (!group) {
                continue
            }
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
    for (const language of Object.keys(translations)) {
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

    return translations
}

/**
 * Refresh the data.
 */
function refresh() {
    translationStore = buildTranslationStore()
    fieldOrders = buildFieldOrders()
}

module.exports = {
    normalizeIndicatorId,
    getLanguages,
    getIndicatorIds,
    getFields,
    getFieldOrders,
    getTranslationStore,
    translateField,
    translateAllFields,
    refresh,
}
