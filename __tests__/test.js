const {
    Tree,
    generateTree,
    defaultConfigFilePath,
    defaultIgnoreDirs,
    defaultIncludeDirs,
    defaultExcludeDirs,
    defaultBuildOptions,
    supportedOutputFormats,
} = require('../index')
// } = require('xuyou-mddir')

const options = {
    configFilePath: '.mddirignore',
    // ignore: ['node_modules', '.git'],
    include: ['__tests__'],
    build: {
        keepIgnoredName: false,
    },
}

// generateTree(__dirname)
// generateTree()
generateTree(null, options)
// const tree = new Tree(null, options)
// tree.generateTree()
