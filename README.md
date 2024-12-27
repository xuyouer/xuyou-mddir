# xuyou-mddir

## 存储库

[https://github.com/xuyouer/xuyou-mddir](https://github.com/xuyouer/xuyou-mddir)

## NPM

[https://www.npmjs.com/package/xuyou-mddir](https://www.npmjs.com/package/xuyou-mddir)

## 安装

```shell
npm i xuyou-mddir
```

## 使用

### 调用方法使用

> 在项目根目录创建 `test.js` 文件
>
> create `test.js` in root directory

```js
// test.js
const {Tree, generateTree} = require('xuyou-mddir')

generateTree()
// OR
const tree = new Tree()
tree.generateTree();

```

### 运行结果

```markdown
xuyou-mddir/
│
├── .gitattributes
├── .gitignore
├── .ignore.json
├── .npmrc
├── LICENSE
├── README.md
├── index.js
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── src/
│   ├── Tree.js
│   ├── Utils.js
│   └── ...
│
└── ...
```

## 自定义使用

### 添加配置

> 在项目根目录创建 `.ignore.json` 文件
>
> create `.ignore.json` or other name file in root directory
>
> default configuration file name is `.ignore.json`

```json
{
  "ignore": [
    "node_modules",
    ".git",
    ".idea",
    ".vscode",
    "build",
    "dist",
    "__tests__",
    "temp"
  ],
  "exclude": [
    ".gitignore"
  ],
  "buildOptions": {
    "keepIgnoredName": false,
    "maxDepth": 5,
    "outputFormat": "console",
    "showFileSize": false,
    "showIgnoredFileSize": false,
    "appendIgnore": true,
    "appendExclude": true
  }
}
```

### 调用方法使用

```js
// test.js
const {Tree, generateTree} = require('xuyou-mddir')

const options = {
    configFilePath: '.ignore.json',
    buildOptions: {
        keepIgnoredName: true,
    },
}

generateTree(null, options)
// OR
const tree = new Tree(null, options)
tree.generateTree()
```

### 运行结果

```markdown
xuyou-mddir/
│
├── .git/
│   └── ...
│
├── .gitattributes
├── .gitignore
├── .ignore.json
├── .npmrc
├── LICENSE
├── README.md
├── __tests__/
│   └── ...
│
├── index.js
├── node_modules/
│   └── ...
│
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── src/
│   ├── Tree.js
│   ├── Utils.js
│   └── ...
│
└── ...
```

## 默认配置

### 获取

```js
// test.js
const {
    defaultConfigFilePath,
    defaultIgnoreDirs,
    defaultExcludeDirs,
    defaultBuildOptions,
    supportedOutputFormats,
} = require('xuyou-mddir')

console.log(defaultConfigFilePath)
console.log(defaultIgnoreDirs)
console.log(defaultExcludeDirs)
console.log(defaultBuildOptions)
console.log(supportedOutputFormats)
```

## 解析

### 部分配置解析

```jsonc
{
  "ignore": ['customIgnore'],           # 忽略文件(目录)
  "exclude": ['customExclude'],         # 取消忽略文件(目录)
  "buildOptions" : {                    # 生成配置选项
    "keepIgnoredName": Boolean,         # 忽略文件(目录)是否保留名称, 默认 false
    "maxDepth": Number,                 # 树的生成最大深度, 默认 5
    "outputFormat": String,             # 输出格式选项, 默认 console
    "showFileSize": Boolean,            # 显示文件(目录)大小, 默认 false
    "showIgnoredFileSize": Boolean,     # 显示忽略文件(目录)大小, 默认 false
    "appendIgnore": Boolean,            # 是否追加忽略模式, 默认 true
    "appendExclude": Boolean,           # 是否追加包含模式, 默认 true
    ...
  }
  ...
}
```

### 部分方法参数解析

```text
// Tree.js
...

class Tree {
    static defaultConfig = {  // 默认配置
        configFilePath: '.ignore.json',  // 配置文件路径
        ignoreDirs: [  // 忽略配置
            'node_modules',
            '.idea',
            '.git',
            '.vscode',
            'build',
            'dist',
            '__tests__',
            'temp',
        ],
        excludeDirs: [],  // 包含配置
        buildOptions: {  // 生成配置
            keepIgnoredName: false,  // 忽略是否保留名称
            maxDepth: 5,  // 树的生成最大深度
            outputFormat: 'console',,  // 输出方式
            showFileSize: false,  // 显示文件大小
            showIgnoredFileSize: false,  // 显示忽略文件大小
            appendIgnore: true,  // 是否追加忽略
            appendExclude: true,  // 是否追加包含
        },
    }
    static supportedOutputFormats = ['console', 'json']  // 支持的输出格式

    constructor(rootPath = process.cwd(), options = {}) {
        this.rootPath = typeof rootPath === 'string' ? rootPath : process.cwd()  // 项目路径
        this.options = {
            ...Tree.defaultConfig,
            projectName: path.basename(this.rootPath),  // 项目名
        }
        this._loadConfigFilePath(options)
        this._loadConfig()  // 读取配置
        this._loadOptions(options)  // 读取options
    }

    _loadConfig() {  // 读取配置信息
        ...
    }

    generateTreeData(currentPath = null, level = 0) {  // 生成树形结构的 JSON 数据
        ...
    }

    generateTreeConsole(currentPath = null, level = 0) {  // 生成树形结构的默认控制台输出
        ...
    }

    generateTree(currentPath = null, level = 0) {  // 选择不同的输出方式生成项目结构树
        ...
    }

    ...
}

module.exports = {
    ...
}
```





