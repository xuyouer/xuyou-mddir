const {
    Tree,
    generateTree,
    defaultConfigFilePath,
    defaultIgnoreDirs,
    defaultExcludeDirs,
    defaultBuildOptions,
    supportedOutputFormats,
} = require('../index')
// } = require('xuyou-mddir')

const options = {
    configFilePath: '.ignore.json',
    buildOptions: {
        keepIgnoredName: true,
    },
}

// generateTree(__dirname)
// generateTree()
generateTree(null, options)
// const tree = new Tree(null, options)
// tree.generateTree()
