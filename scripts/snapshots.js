/**
 * This file cycles through all the Git branches in this repository, and for
 * any that start with "snapshot-" will perform a "make build" and add the built
 * site to a subfolder of the "www" folder. This will presumably be followed
 * by a "make build". The end result is a subfolder version of the site for
 * every branch starting with "snapshot-".
 */

const git = require('simple-git')()
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path')

git.branch((err, branchSummary) => {
    if (err) {
        throw err
    }
    const prefix = 'snapshot-'
    const branches = branchSummary.all.filter(branch => branch.startsWith(prefix))
    for (const branch of branches) {
        git.clone('.', branch, ['--single-branch', '--branch=' + branch], err => {
            if (err) {
                throw err
            }
            // Make sure Jekyll builds using the right subfolder.
            const subfolder = branch.replace(prefix, '')
            const baseUrl = '/sdg-metadata/' + subfolder
            const configPath = path.join(branch, 'www', '_config.yml')
            let config = fs.readFileSync(configPath, 'utf8')
            config = config.replace(': /sdg-metadata', ': ' + baseUrl)
            // Also turn on the alert.
            config = config + '\n\ntest_banner: true\n'
            fs.writeFileSync(configPath, config, 'utf8')

            exec('cd ' + branch + ' && make build', (err, stdout, stderr) => {
                if (err) {
                    console.error(err)
                }
                else {
                    const source = path.join(branch, 'www', '_site')
                    const destination = path.join('www', subfolder)
                    fs.rename(source, destination, function (err) {
                        if (err) {
                            throw err
                        }
                        console.log('Built branch "' + branch + '" and moved to subfolder "' + subfolder + '".')
                    })
                }
            });
        })
    }
})
