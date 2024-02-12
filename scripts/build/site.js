module.exports = function(refresh=false) {

    const fs = require('fs')
    const path = require('path')
    const store = require('../translation-store')
    const { conceptStore } = require('sdg-metadata-convert')
    const bent = require('bent')

    const headers = {
        'Authorization': 'Token ' + process.env.WEBLATE_API_TOKEN
    }
    const getJSON = bent('json', headers)

    if (refresh) {
        store.refresh()
    }

    // We need to put a file in www/_data for Jekyll to use.
    const destinationFolder = path.join('www', '_data')
    const jekyllData = {
        metadata: store.getTranslationStore(),
        // For the site's purposes we would like fields in the pre-2020 order.
        fields: store.getFields().map(cid => conceptStore.getConcept(cid)),
        // The 't' namespace contains all miscellaneous translations.
        t: store.getMiscellaneousTranslationStore(),
    }

    fs.writeFileSync(path.join(destinationFolder, 'store.json'), JSON.stringify(jekyllData), 'utf8')

    const languageProperties = [
        'total',
        'approved',
        'failing',
        'fuzzy',
        'translated',
    ]

    writeStatistics()
    async function writeStatistics() {
        let stats = {}
        try {
            stats = await getStatistics('https://hosted.weblate.org/api/projects/sdg-metadata/components/')
        }
        catch (ex) {
            console.log('Unable to get translation stats.')
            console.log(ex.message)
        }
        fs.writeFileSync(path.join(destinationFolder, 'stats.json'), JSON.stringify(stats), 'utf8')
    }

    async function getStatistics(endpoint) {
        const components = await getJSON(endpoint)
        let nextPage = components.next
        while (nextPage) {
            let nextPageComponents = await getJSON(nextPage)
            components.results = components.results.concat(nextPageComponents.results)
            nextPage = nextPageComponents.next
        }
        const languages = {}
        for (const component of components.results) {
            if (typeof component === 'undefined') {
                continue
            }
            const stats = await getJSON(component.statistics_url)
            for (const language of stats.results) {
                if (typeof languages[language.code] === 'undefined') {
                    languages[language.code] = {}
                    for (const prop of languageProperties) {
                        languages[language.code][prop] = 0
                    }
                    languages[language.code].indicators = {}
                }

                // Set some boolean flags (not currently used).
                language.is_updated = (language.fuzzy > 0)
                language.is_new = (language.translated === 0)
                language.is_complete = (language.translated === language.total)
                language.is_in_progress = (language.translated < language.total && language.translated > 0)
                languages[language.code].indicators[component.slug] = language

                for (const prop of languageProperties) {
                    languages[language.code][prop] += language[prop]
                }
            }
        }
        for (const lang of Object.keys(languages)) {
            for (const prop of languageProperties) {
                const percentProp = prop + '_percent'
                const percent = Math.round((languages[lang][prop] / languages[lang].total) * 100)
                languages[lang][percentProp] = percent
            }
        }
        return languages
    }
}
