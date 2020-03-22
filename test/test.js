var expect = require('chai').expect;
var store = require('../scripts/translation-store');

describe('normalizeIndicatorId()', function() {
    it('should convert dots to dashes', function() {
        expect(store.normalizeIndicatorId('1.2.1')).to.be.equal('1-2-1')
    })
})

describe('getLanguages()', function() {
    it('should return a list of languages including Russian and English', function() {
        expect(store.getLanguages()).to.include('ru')
        expect(store.getLanguages()).to.include('en')
    })
})

describe('getIndicatorIds()', function() {
    it('should return a list of indicators including 1-2-1', function() {
        expect(store.getIndicatorIds()).to.include('1-2-1')
    })
})

describe('getFields()', function() {
    it('should return a list of fields including META_LAST_UPDATE', function() {
        expect(store.getFields('1-2-1')).to.include('META_LAST_UPDATE')
    })
})

describe('translateField()', function() {
    it('should return a short translation of a field', function() {
        expect(store.translateField('1-2-1', 'META_LAST_UPDATE', 'ru').length).to.be.above(5)
    })
})

describe('translateAllFields()', function() {
    it('should return a long translation of all fields', function() {
        expect(store.translateAllFields('1-2-1', 'ru').length).to.be.above(1000)
    })
})
