function getMetadataStructure() {
    return [
        {
            title: 'Indicator Information',
            main: 'SDG_INDICATOR_INFO',
            detailed: [
                'SDG_GOAL',
                'SDG_TARGET',
                'SDG_INDICATOR',
                'SDG_SERIES_DESCR',
                'META_LAST_UPDATE',
                'SDG_RELATED_INDICATORS',
                'SDG_CUSTODIAN_AGENCIES',
            ],
        },
        {
            title: 'Data reporter',
            main: 'CONTACT',
            detailed: [
                'CONTACT_ORGANISATION',
                'CONTACT_NAME',
                'ORGANISATION_UNIT',
                'CONTACT_FUNCT',
                'CONTACT_PHONE',
                'CONTACT_MAIL',
                'CONTACT_EMAIL',
            ],
        },
        {
            title: 'Definition, concepts and classifications',
            main: 'IND_DEF_CON_CLASS',
            detailed: [
                'STAT_CONC_DEF',
                'UNIT_MEASURE',
                'CLASS_SYSTEM',
            ],
        },
        {
            title: 'Data source type and data collection method',
            main: 'SRC_TYPE_COLL_METHOD',
            detailed: [
                'SOURCE_TYPE',
                'COLL_METHOD',
                'FREQ_COLL',
                'REL_CAL_POLICY',
                'DATA_SOURCE',
                'COMPILING_ORG',
                'INST_MANDATE',
            ],
        },
        {
            title: 'Other methodological considerations',
            main: 'OTHER_METHOD',
            detailed: [
                'RATIONALE',
                'REC_USE_LIM',
                'DATA_COMP',
                'DATA_VALIDATION',
                'ADJUSTMENT',
                'IMPUTATION',
                'REG_AGG',
                'DOC_METHOD',
                'QUALITY_MGMNT',
                'QUALITY_ASSURE',
                'QUALITY_ASSMNT',
                'SDG_QA_CONSULT',
            ],
        },
        {
            title: 'Data availability and disaggregation',
            main: 'COVERAGE',
            detailed: [],
        },
        {
            title: 'Comparability / Deviation from international standards',
            main: 'COMPARABILITY',
            detailed: [],
        },
        {
            title: 'References and Documentation',
            main: 'OTHER_DOC',
            detailed: []
        }
    ]
}

function getSectionByTitle(title) {
    const sections = getMetadataStructure().filter(section => section.title === title)
    if (!sections.length) {
        throw `ERROR: Unexpected section title: "${title}"`
    }
    return sections[0]
}

module.exports = {
    getMetadataStructure,
    getSectionByTitle,
}
