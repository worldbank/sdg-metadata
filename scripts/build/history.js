const fs = require('fs')
const path = require('path')
const git = require('simple-git')()

const sdgMetadataConvert = require('sdg-metadata-convert')
const wordTemplateInput = new sdgMetadataConvert.WordTemplateInput({debug:true})

main()

async function main() {
    for (const file of fs.readdirSync('indicators')) {
        const filePath = path.join('indicators', file)
        console.log(filePath)
        git.log({ file: filePath }, (err, log) => {
            const commits = log.all.map(l => l.hash)
            const metadataObjects = commits.map(commit => convertCommitToMetadata(commit, filePath))
            //console.log(metadataObjects)
        })
        break
    }
}

async function convertCommitToMetadata(commit, filePath) {
    await git.checkout(commit, [filePath])
}
