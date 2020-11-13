const fs = require('fs')
const path = require('path')
const git = require('simple-git')()

main()

async function main() {
    for (const file of fs.readdirSync('indicators')) {
        const filePath = path.join('indicators', file)
        git.log({ file: filePath }, (err, log) => {
            const commits = log.all.map(l => l.hash)
            if (commits.length > 1) {
                console.log(commits)
                console.log(filePath)
            }
        })
    }
}