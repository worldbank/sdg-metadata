function getMetadataStructure() {
    return [
        {
            title: '0. Indicator information',
            main: 'SDG_INDICATOR_INFO',
            concepts: {
                'SDG_INDICATOR_INFO': '0. Indicator information',
                'SDG_GOAL': '0.a. Goal',
                'SDG_TARGET': '0.b. Target',
                'SDG_INDICATOR': '0.c. Indicator',
                'SDG_SERIES_DESCR': '0.d. Series',
                'META_LAST_UPDATE': '0.e. Metadata update',
                'SDG_RELATED_INDICATORS': '0.f. Related Indicators',
                'SDG_CUSTODIAN_AGENCIES': '0.g. International organisations(s) responsible for global monitoring',
            },
        },
        {
            title: '1. Data reporter',
            main: 'CONTACT',
            concepts: {
                'CONTACT': '1. Data reporter',
                'CONTACT_ORGANISATION': '1.a. Organisation',
                'CONTACT_NAME': '1.b. Contact person(s)',
                'ORGANISATION_UNIT': '1.c. Contact Organisation Unit',
                'CONTACT_FUNCT': '1.d. Contact Person Function',
                'CONTACT_PHONE': '1.e. Contact Phone',
                'CONTACT_MAIL': '1.f. Contact Mail',
                'CONTACT_EMAIL': '1.g. Contact emails',
            },
        },
        {
            title: '2. Definition, concepts, and classifications',
            main: 'IND_DEF_CON_CLASS',
            concepts: {
                'IND_DEF_CON_CLASS': '2. Definition, concepts and classifications',
                'STAT_CONC_DEF': '2.a. Definition and Concepts',
                'UNIT_MEASURE': '2.b. Unit of Measure',
                'CLASS_SYSTEM': '2.c. Classifications',
            },
        },
        {
            title: '3. Data source type and data collection method',
            main: 'SRC_TYPE_COLL_METHOD',
            concepts: {
                'SRC_TYPE_COLL_METHOD': '3. Data source type and data collection method',
                'SOURCE_TYPE': '3.a. Data sources',
                'COLL_METHOD': '3.b. Data collection method',
                'FREQ_COLL': '3.d. Data collection calendar',
                'REL_CAL_POLICY': '3.e. Data release calendar',
                'DATA_SOURCE': '3.f. Data providers',
                'COMPILING_ORG': '3.g. Data compilers',
                'INST_MANDATE': '3.h. Institutional Mandate',
            },
        },
        {
            title: '4. Other methodological considerations',
            main: 'OTHER_METHOD',
            concepts: {
                'OTHER_METHOD': '4. Other methodological considerations',
                'RATIONALE': '4.a. Rationale',
                'REC_USE_LIM': '4.b. Comment and limitations',
                'DATA_COMP': '4.c. Method of computation',
                'DATA_VALIDATION': '4.d. Validation',
                'ADJUSTMENT': '4.e. Adjustments',
                'IMPUTATION': '4.f. Treatment of missing values (i) at country level and (ii) at regional level.',
                'REG_AGG': '4.g. Regional aggregations',
                'DOC_METHOD': '4.h. Methods and guidance available to countries for the compilation of the data at the national level',
                'QUALITY_MGMNT': '4.i. Quality Assurance',
                'QUALITY_ASSURE': '4.i.i. QA: Practices and guidelines',
                'QUALITY_ASSMNT': '4.i.ii. QA: Assessment',
                'SDG_QA_CONSULT': '4.i.iii. QA: Consultation process',
            },
        },
        {
            title: '5. Data availability and disaggregation',
            main: 'COVERAGE',
            concepts: {
                'COVERAGE': '5. Data availability and disaggregation',
            },
        },
        {
            title: '6. Comparability/deviation from international standards',
            main: 'COMPARABILITY',
            concepts: {
                'COMPARABILITY': '6. Comparability / Deviation from international standards',
            },
        },
        {
            title: '7. References and documentation',
            main: 'OTHER_DOC',
            concepts: {
                'OTHER_DOC': '7. References and Documentation',
            }
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

function getConceptIdByName(sectionTitle, conceptName) {
    const section = getSectionByTitle(sectionTitle)
    const concepts = section.concepts
    return Object.keys(concepts).find(key => concepts[key] === conceptName);
}

module.exports = {
    getMetadataStructure,
    getSectionByTitle,
    getConceptIdByName,
}
