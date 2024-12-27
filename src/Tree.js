const fs = require('fs')
const path = require('path')
const {
    Utils,
    objectUtils: { emptyObject, uniqueArray },
    fileSystemUtils: { isValidPath, getSortedItems, getFileStats },
    sizeUtils: { formatSize, getDirSize },
} = require('./Utils')
const utils = new Utils()

class Tree {
    static defaultConfig = {
        configFilePath: '.ignore.json',
        ignoreDirs: [
            'node_modules',
            '.idea',
            '.git',
            '.vscode',
            'build',
            'dist',
            '__tests__',
            'temp',
        ],
        excludeDirs: [],
        buildOptions: {
            keepIgnoredName: false,
            maxDepth: 5,
            outputFormat: 'console',
            showFileSize: false,
            showIgnoredFileSize: false,
            appendIgnore: true,
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
        try {
            if (fs.existsSync(configFilePath)) {
                const config = JSON.parse(
                    fs.readFileSync(configFilePath, 'utf-8'),
                )
                this._mergeConfig(config)
            }
        } catch (error) {
            console.error(`加载配置文件失败: ${error}`)
        }

        this.options.ignoreDirs = this.options.ignoreDirs.filter(
            dir => !this.options.excludeDirs.includes(dir),
        )

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
            excludeDirs: defaultExcludeDirs,
            buildOptions: defaultBuildOptions,
        } = this.options
        const ignore = config.ignore || config.ignoreDirs || defaultIgnoreDirs
        const exclude =
            config.exclude || config.excludeDirs || defaultExcludeDirs
        const buildOptions = { ...defaultBuildOptions, ...config.buildOptions }
        const { appendIgnore, appendExclude } = buildOptions

        if (ignore) {
            this.options.ignoreDirs = appendIgnore
                ? [...this.options.ignoreDirs, ...ignore]
                : ignore
        }
        if (exclude) {
            this.options.excludeDirs = appendExclude
                ? [...this.options.excludeDirs, ...exclude]
                : exclude
        }
        if (buildOptions) {
            this.options.buildOptions = {
                ...this.options.buildOptions,
                ...buildOptions,
            }
        }

        this.options.ignoreDirs = uniqueArray(this.options.ignoreDirs)
        this.options.excludeDirs = uniqueArray(this.options.excludeDirs)
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
    defaultExcludeDirs: Tree.defaultConfig.excludeDirs,
    defaultBuildOptions: Tree.defaultConfig.buildOptions,
    supportedOutputFormats: Tree.supportedOutputFormats,
}
