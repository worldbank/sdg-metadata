const fs = require('fs')
const os = require('os')
const path = require('path')
const { conceptStore, GettextInput } = require('sdg-metadata-convert')

const baseFolder = 'translations'
const sourceLanguage = 'en'
const sourceLanguageFolder = 'templates'

let translationStore = buildTranslationStore()

/**
 * Get an array of the fields in the order of the pre-2020 IAEG metadata.
 */
function getIaegFields() {
    return [
        'SDG_INDICATOR_INFO',
        'SDG_GOAL',
        'SDG_TARGET',
        'SDG_INDICATOR',
        'SDG_SERIES_DESCR',
        'SDG_CUSTODIAN_AGENCIES',
        'CONTACT',
        'CONTACT_ORGANISATION',
        'CONTACT_NAME',
        'ORGANISATION_UNIT',
        'CONTACT_FUNCT',
        'CONTACT_PHONE',
        'CONTACT_MAIL',
        'CONTACT_EMAIL',
        'IND_DEF_CON_CLASS',
        'STAT_CONC_DEF',
        'UNIT_MEASURE',
        'CLASS_SYSTEM',
        'OTHER_METHOD',
        'RATIONALE',
        'REC_USE_LIM',
        'DATA_COMP',
        'DATA_VALIDATION',
        'ADJUSTMENT',
        'IMPUTATION',
        'REG_AGG',
        'COMPARABILITY',
        'DOC_METHOD',
        'QUALITY_MGMNT',
        'QUALITY_ASSURE',
        'QUALITY_ASSMNT',
        'SDG_QA_CONSULT',
        'SRC_TYPE_COLL_METHOD',
        'SOURCE_TYPE',
        'COLL_METHOD',
        'COVERAGE',
        'FREQ_COLL',
        'REL_CAL_POLICY',
        'DATA_SOURCE',
        'COMPILING_ORG',
        'INST_MANDATE',
        'OTHER_DOC',
        'SDG_RELATED_INDICATORS',
    ]
}

/**
 * Get an array of fields in particular order.
 *
 * @param {String} order
 *   Description of the particular order to use. Possible values are:
 *     - default: The post-2020 UNSD order
 *     - iaeg: The pre-2020 IAEG order
 */
function getFields(order='default') {
    return (order === 'iaeg') ? getIaegFields() : conceptStore.getConceptIds()
}

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
 * @param {String} order
 *   parameter passed on to getFields()
 * @returns {String}
 *   the translation of all the metadata for the specified indicator
 */
function translateAllFields(indicatorId, language, order='default') {
    indicatorId = normalizeIndicatorId(indicatorId)
    return getFields(order).map(field => translateField(indicatorId, field, language)).join('')
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
 * Parse the translation files and construct the data structure. Internal only.
 *
 * @returns {Object}
 *   A nested object - language code -> indicator id -> metadata field
 */
function buildTranslationStore() {
    const translations = {}
    const gettextInput = new GettextInput()

    // Construct an object with all the individual translations of fields.
    for (const languageFolder of fs.readdirSync(baseFolder)) {

        const sourceFolder = path.join(baseFolder, languageFolder)
        const language = (languageFolder === sourceLanguageFolder) ? sourceLanguage : languageFolder
        const extension = (languageFolder === sourceLanguageFolder) ? '.pot' : 'po'
        translations[language] = {}

        const files = fs.readdirSync(sourceFolder).filter(file => {
            return path.extname(file).toLowerCase() === extension
        })
        for (const file of files) {
            const indicatorId = normalizeIndicatorId(file.split('.')[0])
            const filePath = path.join(sourceFolder, file)
            translations[language][indicatorId] = gettextInput.readSync(filePath)
        }
    }

    // Make sure that missing translations at least have empty strings.
    const sourceStrings = translations[sourceLanguage]
    for (const language of Object.keys(translations)) {
        for (const group of Object.keys(sourceStrings)) {
            if (!(group in translations[language])) {
                translations[language][group] = {}
            }
            for (const id of getFields()) {
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
}

module.exports = {
    normalizeIndicatorId,
    getLanguages,
    getFields,
    getIaegFields,
    getIndicatorIds,
    getTranslationStore,
    translateField,
    translateAllFields,
    refresh,
}
