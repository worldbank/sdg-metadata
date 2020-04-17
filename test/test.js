var expect = require('chai').expect;
var store = require('../scripts/translation-store');

describe('normalizeIndicatorId("1.2.1")', function() {
    it('should convert it to "1-2-1"', function() {
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

describe('getFields("1-2-1")', function() {
    it('should return a list of fields including META_LAST_UPDATE', function() {
        expect(store.getFields('1-2-1')).to.include('META_LAST_UPDATE')
    })
})

describe('translateField("1-2-1", "META_LAST_UPDATE", "en")', function() {
    it('should return more than 5 characters', function() {
        expect(store.translateField('1-2-1', 'META_LAST_UPDATE', 'en').length).to.be.above(5)
    })
})

describe('translateAllFields("1-2-1", "en")', function() {
    it('should return more than 1000 characters', function() {
        expect(store.translateAllFields('1-2-1', 'en').length).to.be.above(1000)
    })
})
