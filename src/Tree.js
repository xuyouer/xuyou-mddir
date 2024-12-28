const fs = require('fs')
const path = require('path')
const {
    Utils,
    objectUtils: { emptyObject, uniqueArray, mergeArray },
    fileSystemUtils: {
        isValidPath,
        getSortedItems,
        getFileStats,
        parseYamlFile,
    },
    sizeUtils: { formatSize, getDirSize },
} = require('./Utils')

class Tree {
    static defaultConfig = {
        configFilePath: '.mddirignore',
        ignoreDirs: [
            'node_modules',
            '.idea',
            '.git',
            '.vscode',
            'build',
            '__tests__',
            'temp',
        ],
        includeDirs: [],
        excludeDirs: [],
        buildOptions: {
            keepIgnoredName: false,
            maxDepth: 5,
            outputFormat: 'console',
            showFileSize: false,
            showIgnoredFileSize: false,
            appendIgnore: true,
            appendInclude: true,
            appendExclude: true,
        },
    }
    static supportedOutputFormats = ['console', 'json']

    constructor(rootPath = process.cwd(), options = {}) {
        this.rootPath = typeof rootPath === 'string' ? rootPath : process.cwd()
        this.options = {
            ...Tree.defaultConfig,
            projectName: path.basename(this.rootPath),
        }
        this._loadConfigFilePath(options)
        this._loadConfig()
        this._loadOptions(options)
    }

    _loadConfig() {
        const configFilePath = this.options.configFilePath
        if (fs.existsSync(configFilePath)) {
            const config = parseYamlFile(configFilePath)
            this._mergeConfig(config)
        }
        return {}
    }

    _loadOptions(options) {
        if (emptyObject(options)) return
        this._mergeConfig(options)
    }

    _loadConfigFilePath(options) {
        if (emptyObject(options)) return
        this.options.configFilePath =
            options.configFilePath || this.options.configFilePath
    }

    _mergeConfig(config) {
        const {
            ignoreDirs: defaultIgnoreDirs,
            includeDirs: defaultIncludeDirs,
            excludeDirs: defaultExcludeDirs,
            buildOptions: defaultBuildOptions,
        } = this.options

        const buildOptions = {
            ...defaultBuildOptions,
            ...(config?.build || config?.buildOptions),
        }
        const mergedConfig = {
            ignoreDirs: uniqueArray(
                mergeArray(
                    defaultIgnoreDirs,
                    config?.ignore || config?.ignoreDirs || defaultIgnoreDirs,
                    buildOptions?.appendIgnore,
                ),
            ),
            includeDirs: uniqueArray(
                mergeArray(
                    defaultIncludeDirs,
                    config?.include ||
                        config?.includeDirs ||
                        defaultIncludeDirs,
                    buildOptions?.appendInclude,
                ),
            ),
            excludeDirs: uniqueArray(
                mergeArray(
                    defaultExcludeDirs,
                    config?.exclude ||
                        config?.excludeDirs ||
                        defaultExcludeDirs,
                    buildOptions?.appendExclude,
                ),
            ),
            buildOptions: {
                ...defaultBuildOptions,
                ...(config?.build || config?.buildOptions),
            },
        }
        this.options = {
            ...this.options,
            ...mergedConfig,
        }

        // const ignore = config?.ignore || config?.ignoreDirs || defaultIgnoreDirs
        // const include = config?.include || config?.includeDirs || defaultIncludeDirs
        // const exclude = config?.exclude || config?.excludeDirs || defaultExcludeDirs
        // const buildOptions = { ...defaultBuildOptions, ...(config?.build || config?.buildOptions), }
        // const { appendIgnore, appendInclude, appendExclude } = buildOptions
        // if (ignore) {
        //     // this.options.ignoreDirs = appendIgnore ? [...defaultIgnoreDirs, ...ignore] : ignore
        //     this.options.ignoreDirs = mergeArray( defaultIgnoreDirs, ignore, appendIgnore, ) }
        // if (include) { this.options.includeDirs = mergeArray( defaultIncludeDirs, include, appendInclude, ) }
        // if (exclude) { this.options.excludeDirs = mergeArray( defaultExcludeDirs, exclude, appendExclude, ) }
        // if (buildOptions) { this.options.buildOptions = { ...defaultBuildOptions, ...buildOptions, } }
        // this.options.ignoreDirs = uniqueArray(this.options.ignoreDirs)
        // this.options.includeDirs = uniqueArray(this.options.includeDirs)
        // this.options.excludeDirs = uniqueArray(this.options.excludeDirs)

        this.options.ignoreDirs = this.options.ignoreDirs.filter(
            dir => !this.options.includeDirs.includes(dir),
        )
    }

    generateTreeData(currentPath = null, level = 0) {
        const pathToExplore = currentPath || this.rootPath

        if (
            !fs.existsSync(pathToExplore) ||
            level > this.options.buildOptions.maxDepth
        ) {
            return []
        }

        const items = getSortedItems(pathToExplore)

        const node = {
            name: path.basename(pathToExplore),
            children: [],
        }

        items.forEach(item => {
            const fullPath = path.join(pathToExplore, item)
            const showSize = this.options.buildOptions.showIgnoredFileSize

            if (this.options.ignoreDirs.includes(item)) {
                if (this.options.buildOptions.keepIgnoredName) {
                    node.children.push({
                        name: item,
                        isDir: fs.lstatSync(fullPath).isDirectory(),
                        size: showSize
                            ? formatSize(getDirSize(fullPath))
                            : undefined,
                    })
                }
                return
            }
            node.children.push(this._getNodeData(fullPath, level))
        })

        return [node]
    }

    _getNodeData(fullPath, level) {
        const showSize = this.options.buildOptions.showFileSize
        const stats = getFileStats(fullPath)
        const node = {
            name: path.basename(fullPath),
            isDir: stats.isDirectory(),
        }
        if (!node.isDir && this.options.buildOptions.showFileSize) {
            node.size = formatSize(stats.size)
        }
        if (node.isDir) {
            node.size = showSize ? formatSize(getDirSize(fullPath)) : undefined
            node.children = this.generateTreeData(fullPath, level + 1)
        }
        return node
    }

    generateTreeConsole(currentPath = null, level = 0) {
        const pathToExplore = currentPath || this.rootPath

        if (
            !isValidPath(pathToExplore) ||
            level > this.options.buildOptions.maxDepth
        ) {
            return
        }

        const items = getSortedItems(pathToExplore)

        if (level === 0 && this.options.projectName) {
            console.log(`${this.options.projectName}/`)
            console.log('│')
        }

        items.forEach(item => {
            const fullPath = path.join(pathToExplore, item)
            const stats = getFileStats(fullPath)

            if (this.options.ignoreDirs.includes(item)) {
                if (this.options.buildOptions.keepIgnoredName) {
                    this._printIgnoredNode(item, level, stats, fullPath)
                }
                return
            }
            this._printNode(item, level, stats, fullPath)
        })

        if (level === 0) {
            console.log('└── ...')
        }
    }

    _printIgnoredNode(item, level, stats, fullPath) {
        const indent = '│   '.repeat(level)
        const showSize = this.options.buildOptions.showIgnoredFileSize

        if (stats.isDirectory()) {
            console.log(
                `${indent}├── ${item}/    ${
                    showSize ? formatSize(getDirSize(fullPath)) : ''
                }`,
            )
            console.log(`${indent}│   └── ...`)
            console.log(`${indent}│`)
        } else {
            console.log(
                `${indent}├── ${item}    ${
                    showSize ? formatSize(stats.size) : ''
                }`,
            )
        }
    }

    _printNode(item, level, stats, fullPath) {
        const indent = '│   '.repeat(level)
        const showSize = this.options.buildOptions.showFileSize

        if (stats.isDirectory()) {
            console.log(
                `${indent}├── ${item}/    ${
                    showSize ? formatSize(getDirSize(fullPath)) : ''
                }`,
            )
            this.generateTree(fullPath, level + 1)

            if (level > 0 || level === 0) {
                console.log(`${indent}│   └── ...`)
                console.log(`${indent}│`)
            }
        } else {
            console.log(
                `${indent}├── ${item}    ${
                    showSize ? formatSize(stats.size) : ''
                }`,
            )
        }
    }

    generateTree(currentPath = null, level = 0) {
        const { outputFormat } = this.options.buildOptions
        if (!Tree.supportedOutputFormats.includes(outputFormat)) {
            throw new Error(`不支持的输出格式: ${outputFormat}`)
        }
        const generateMethods = {
            console: this.generateTreeConsole.bind(this),
            json: () =>
                console.log(JSON.stringify(this.generateTreeData(), null, 2)),
        }
        generateMethods[outputFormat](currentPath, level)
    }
}

module.exports = {
    Tree,
    generateTree: (rootPath, options = {}) =>
        new Tree(rootPath, options).generateTree(),
    ...Tree.defaultConfig,
    defaultConfigFilePath: Tree.defaultConfig.configFilePath,
    defaultIgnoreDirs: Tree.defaultConfig.ignoreDirs,
    defaultIncludeDirs: Tree.defaultConfig.includeDirs,
    defaultExcludeDirs: Tree.defaultConfig.excludeDirs,
    defaultBuildOptions: Tree.defaultConfig.buildOptions,
    supportedOutputFormats: Tree.supportedOutputFormats,
}
