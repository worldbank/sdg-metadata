const fs = require('fs')
const path = require('path')

module.exports = {

    // Create folders from an array of parts. Returns the path of the folder.
    createFolder: function(folderParts) {
        let folder = '.'
        for (const part of folderParts) {
            folder = folder + path.sep + part
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
        }
        return folderParts.join(path.sep)
    }
}