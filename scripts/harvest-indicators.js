const bent = require('bent')
const path = require('path')
const yaml = require('js-yaml')
const fs = require('fs')
const fsp = require('fs').promises
const dom = require('xmldom').DOMParser
const xpath = require('xpath')
const sdgMetadataConvert = require('sdg-metadata-convert')
const seriesDescriptor = sdgMetadataConvert.descriptorStore.getDescriptor('SERIES')
const seriesOptions = seriesDescriptor.options
const harvestGoals = [
    '1',
    '2',
]

let xmlString
//const source = 'global-metadata.xml'
const source = 'https://unstats.un.org/SDGMetadataAPI/api/Metadata/SDMXReport/G.ALL.1'
harvestMetadata()

async function harvestMetadata() {
    if (source.startsWith('http')) {
        const getString = bent('string')
        xmlString = await getString(source)
    }
    else {
        xmlString = await fsp.readFile(source, { encoding: 'utf-8' })
    }

    const doc = new dom().parseFromString(xmlString)

    const namespaces = {
        mes: 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message',
        com: 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common',
        gen: 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/metadata/generic',
    }
    const select = xpath.useNamespaces(namespaces)

    const metadataByIndicator = {}
    const metadataSets = select('.//mes:MetadataSet', doc)
    for (const metadataSet of metadataSets) {
        const series = select('.//com:KeyValue[@id="SERIES"]/com:Value', metadataSet, true)
        const seriesCode = series.firstChild.nodeValue
        const indicatorIds = getIndicatorIdsFromSeries(seriesCode)
        const concepts = select('.//gen:ReportedAttribute', metadataSet)
        const conceptValues = {}
        for (const concept of concepts) {
            const conceptId = concept.getAttribute('id')
            const conceptValue = select('string(./com:Text)', concept)
            // Change \r\n to \n.
            conceptValues[conceptId] = conceptValue.replace(/\r\n/g, '\n')
        }
        for (const indicatorId of indicatorIds) {
            const goalId = indicatorId.split('.')[0]
            if (harvestGoals.includes(goalId)) {
                metadataByIndicator[indicatorId] = conceptValues
            }
        }
    }

    for (const indicatorId of Object.keys(metadataByIndicator)) {
        const filename = indicatorId.replace(/\./g, '-') + '.yml'
        const filepath = path.join('translations-metadata', 'en', filename)
        const yamlStr = yaml.dump(metadataByIndicator[indicatorId])
        fs.writeFileSync(filepath, yamlStr, 'utf8')
    }
}

function getIndicatorIdsFromSeries(seriesCode) {
    const hardcoded = {
        SI_POV_DAY1: ['1.1.1a'],
        SI_POV_EMP1: ['1.1.1b'],
        SI_COV_BENFTS: ['1.3.1a'],
        SI_COV_CHLD: ['1.3.1a'],
        SI_COV_DISAB: ['1.3.1a'],
        SI_COV_LMKT: ['1.3.1b'],
        SI_COV_MATNL: ['1.3.1a'],
        SI_COV_PENSN: ['1.3.1a'],
        SI_COV_POOR: ['1.3.1a'],
        SI_COV_SOCAST: ['1.3.1b'],
        SI_COV_SOCINS: ['1.3.1b'],
        SI_COV_UEMP: ['1.3.1a'],
        SI_COV_VULN: ['1.3.1a'],
        SI_COV_WKINJRY: ['1.3.1a'],
        SH_STA_WAST: ['2.2.2b'],
        SH_STA_WASTN: ['2.2.2b'],
        SN_STA_OVWGT: ['2.2.2a'],
        SN_STA_OVWGTN: ['2.2.2a'],
        ER_GRF_ANIMKPT: ['2.5.1b'],
        ER_GRF_ANIMRCNT: ['2.5.1b'],
        ER_GRF_ANIMRCNTN: ['2.5.1b'],
        ER_GRF_ANIMSTOR: ['2.5.1b'],
        ER_GRF_ANIMSTORN: ['2.5.1b'],
        ER_GRF_GENEBNK: ['2.5.1b'],
        ER_GRF_PLNTSTOR: ['2.5.1a'],
        SG_GEN_LOCGELS: ['5.5.1b'],
        SG_GEN_PARL: ['5.5.1a'],
        SG_GEN_PARLN: ['5.5.1a'],
        SG_GEN_PARLNT: ['5.5.1a'],
        SG_GEN_LOCG: ['5.5.1b'],
        EN_WBE_PMPR: ['6.6.1a'],
        EN_WBE_PMNR: ['6.6.1a'],
        EN_WBE_PMPP: ['6.6.1a'],
        EN_WBE_PMPN: ['6.6.1a'],
        EN_WBE_NDETOT: ['6.6.1a'],
        EN_WBE_NDOPW: ['6.6.1a'],
        EN_WBE_NDQLGRW: ['6.6.1a'],
        EN_WBE_NDQLOPW: ['6.6.1a'],
        EN_WBE_NDQLRVR: ['6.6.1a'],
        EN_WBE_NDQLTOT: ['6.6.1a'],
        EN_WBE_NDQTGRW: ['6.6.1a'],
        EN_WBE_NDQTOPW: ['6.6.1a'],
        EN_WBE_NDQTRVR: ['6.6.1a'],
        EN_WBE_NDQTTOT: ['6.6.1a'],
        EN_WBE_NDRV: ['6.6.1a'],
        EN_WBE_NDWTL: ['6.6.1a'],
        EN_WBE_HMWTL: ['6.6.1b'],
        EN_WBE_INWTL: ['6.6.1b'],
        EN_LKRV_PWAN: ['6.6.1a'],
        EN_LKRV_PWAP: ['6.6.1a'],
        EN_LKRV_SWAN: ['6.6.1a'],
        EN_LKRV_SWAP: ['6.6.1a'],
        EN_LKRV_PWAC: ['6.6.1a'],
        EN_LKRV_SWAC: ['6.6.1a'],
        EN_RSRV_MNWAN: ['6.6.1a'],
        EN_RSRV_MNWAP: ['6.6.1a'],
        EN_RSRV_MXWAN: ['6.6.1a'],
        EN_RSRV_MXWAP: ['6.6.1a'],
        EN_WBE_WTLN: ['6.6.1a'],
        EN_WBE_WTLP: ['6.6.1a'],
        EN_LKW_QLTRB: ['6.6.1a'],
        EN_LKW_QLTRST: ['6.6.1a'],
        EN_WBE_MANGN: ['6.6.1a'],
        EN_WBE_MANGBN: ['6.6.1a'],
        EN_WBE_MANGGN: ['6.6.1a'],
        EN_WBE_MANGGP: ['6.6.1a'],
        EN_WBE_MANGLN: ['6.6.1a'],
        EN_WBE_MANGLP: ['6.6.1a'],
        EN_WBE_MANGC: ['6.6.1a'],
        AG_FLS_IDX: ['12.3.1a'],
        AG_FOOD_WST_PC: ['12.3.1b'],
        AG_FOOD_WST: ['12.3.1b'],
        SG_DMK_PARLCC_UC: ['16.7.1a'],
        SG_DMK_PARLCC_LC: ['16.7.1a'],
        SG_DMK_PARLMP_UC: ['16.7.1a'],
        SG_DMK_PARLMP_LC: ['16.7.1a'],
        SG_DMK_PARLSP_UC: ['16.7.1a'],
        SG_DMK_PARLSP_LC: ['16.7.1a'],
        SG_DMK_PARLCC_JC: ['16.7.1a'],
        SG_DMK_PARLYR_LC: ['16.7.1a'],
        SG_DMK_PARLYP_LC: ['16.7.1a'],
        SG_DMK_PARLYN_LC: ['16.7.1a'],
        SG_DMK_PARLYR_UC: ['16.7.1a'],
        SG_DMK_PARLYP_UC: ['16.7.1a'],
        SG_DMK_PARLYN_UC: ['16.7.1a'],
        GF_FRN_FDI: ['17.3.1a'],
        SG_REG_BRTH90: ['17.19.2b'],
        SG_REG_BRTH90N: ['17.19.2b'],
        SG_REG_CENSUS: ['17.19.2a'],
        SG_REG_CENSUSN: ['17.19.2a'],
        SG_REG_DETH75: ['17.19.2b'],
        SG_REG_DETH75N: ['17.19.2b'],
    }
    if (typeof hardcoded[seriesCode] !== 'undefined') {
        return hardcoded[seriesCode]
    }
    const series = seriesOptions.find(option => option.key === seriesCode)
    if (!series) {
        throw new InputError(`WARNING: Series with code "${seriesCode}" could not be found.`)
    }
    else {
        return series.indicatorIds
    }
}
