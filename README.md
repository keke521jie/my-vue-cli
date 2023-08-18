## 1、功能介绍
现在让我们来归纳下，vue-cli 到底帮我们做了哪些功能：
• 将代码中所有引用的 js 文件打包并添加进 html 中
• 打包时引用自定义的 html 模版
• 每次构建之前清理 dist 文件夹
• 利用 vue-loader 处理 .vue 文件
• 将除j s, css 类型之外的所有被引用到的文件打包处理(例如图片资源)
• 将代码中引用的 css 文件打包并添加进 html 文件中
• 构建一个静态文件服务器以在浏览器中展现网页
• 支持最新的 Javascript 语法和 API
• 集成 ESLint 以进行静态代码检验
除了以上的几点功能，vue-cli 还实现了例如单元测试、css自动前缀、TS 集成等等功能，甚至还有一套图形化界面管理所有的项目，当然作为从 0 到 1 的文章，本篇只能暂时关注以上几个功能的具体实现了。
## 2、准备工作
先做准备工作：新建目录vue-cli，利用我们心爱的 yarn 工具执行 yarn init，生成 package.json 文件；随后执行 yarn，创建 node_modules 文件夹和 yarn.lock 文件。
安装webpack:
yarn add webpack webpack-cli --dev
安装 vue: 
yarn add vue
然后将通过 vue new 执行得到的 src 文件夹和 public 文件夹复制到新项目中。以上就完成了准备工作。
接下来，我们分步来实现前面提到的几点功能。
### 1. js 文件打包并添加进 html 中
首先我们要使用 webpack 提供的功能将代码中的 js 文件及其依赖打包并添加 hash 值，然后将文件路径写进 html 中。我们在项目的根目录建立 webpack.config.js，设置环境(mode)为 development，设置入口(entry)为 src 中的 main.js，设置输出(output)为 dist 文件夹中的 output.js 文件：
~~~ js
const path = require('path')
module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/main.js'),
  output: {
    filename: 'output.js',
    path: path.resolve(__dirname, './dist')
  }
}
~~~
编辑 package.json 文件，添加 scripts 属性："scripts": { "build": "webpack" }，由于 webpack 可自行找到位于根目录下的webpack.config.js，故这里不需要添加参数。如果你需要把 webpack.config.js 放到其他文件夹中（例如 build ）则需要添加: webpack --config build/webpack.config.js。目前的 package.json 文件如下：
~~~ json
{
  "name": "vue-cli",
  "version": "1.0.0",
  "scripts": {
    "build": "webpack"
  },
  "devDependencies": {
    "webpack": "^4.42.1",
    "webpack-cli": "^3.3.11"
  }
}
~~~
让我们现在运行 yarn run build 来看下，成功建立了 dist 文件夹，虽然在解析 App.vue 时报错
我们此时暂将 src/main.js 中和引用 App.vue 相关的代码注释掉，只留下 import Vue from 'vue' 这一句。别担心，后续再通过使用vue-loader进行解决这个错误。
~~~ vue
import Vue from 'vue'
/*
import App from './App.vue'
Vue.config.productionTip = false
new Vue({
  render: h => h(App),
}).$mount('#app')
*/
~~~

然后我们为生成的 js 文件添加 hash 值来保证每次修改 js 文件不会被浏览器缓存影响调试。得益于webpack 的智能这一步非常简单，直接更改 output 的 filename，由output.js 变为[name].[hash:8].js 即可完成。运行 yarn run build 之后发现 dist 文件夹中已经生成了main.****.js文件，其中包含了main.js还有它依赖的全部js文件。
### 2. 打包时引用自定义模版
接下来我们使用public文件夹中的html模板来构造dist的html文件：这时候我们需要用到webpack的html-webpack-plugin插件。首先安装插件：yarn add html-webpack-plugin --dev，然后在webpack.config.js中添加相应的plugin:
~~~ js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/main.js'),
  output: {
    filename: 'output.js',
    path: path.resolve(__dirname, './dist')
  },
  plugins:[ new HtmlWebpackPlugin() ]
}
~~~

执行 yarn run build 之后我们发现 dist 文件夹中出现了index.html, 在index.html 内部加载了main.****.js 文件。这和我们所期望的一致！当然我们可以使用 public 文件夹中的 index.html 模板来构造这个 dist 中的html 文件：

new HtmlWebpackPlugin({ template: path.resolve(__dirname, './public/index.html') })

但是再次执行yarn run build之后，输出会报错
我们通过查看 public/index.html 文件发现，文件中引用了：
~~~ html
<link rel="icon" href="<%= BASE_URL %>favicon.ico">和<%= htmlWebpackPlugin.options.title%>
~~~
这些变量我们目前还没有进行赋值。我们通过查看html-webpack-plugin 的文档发现可以设置 title 和 templateParameters 这两个属性来为 html 模板设置变量，据此我们更新 webpack.config.js 文件:
~~~ js
plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
      title: '从0搭建vue cli',
      templateParameters: {BASE_URL: '/'},
    })
],
~~~
再次执行yarn run build之后，我们发现dist文件夹中的index.html已经用上了public/index.html这个模板。
### 3.构建前清理dist文件夹
但是此时经过了一遍一遍的 yarn run build 之后，dist 文件夹中留存了很多已经无用的 main.****.js 文件（实际上每次更改 main.js 再重新build 才会生成新的 main.****.js 文件），我们需要用到clean-webpack-plugin 这个插件来在每次需生成新的 main.****.js 时，清理一下这个文件夹。首先来安装它：

yarn add clean-webpack-plugin --dev

然后在webpack.config.js文件中声明并引用:

const {CleanWebpackPlugin} = require('clean-webpack-plugin')
Plugins:[new
CleanWebpackPlugin(), ...] //...代表其他的plugins
此时再执行 yarn run build发现dist文件夹中只有index.html和main.****.js 两个文件了。整个世界清净了。
### 4.利用vue-loader处理.vue文件
接下来我们再用起yarn来安装vue-loader以支持对.vue文件的解析：yarn add vue-loader vue-template-compiler --dev，有关vue-loader相关的知识请参考官方文档：https://vue-loader.vuejs.org/zh/guide/

然后将vue-loader配置到webpack中：
~~~ js
const {VueLoaderPlugin} = require('vue-loader')
plugins:[ new VueLoaderPlugin() ] // 确保引入这个插件！
module: {rules: [{ test: /\.vue$/, loader: 'vue-loader' }]}
~~~

此时我们便可将之前 src/main.js 中对 App.vue 相关代码的部分去除注释了，在执行 yarn run build 之后，我们发现了还有其他的资源文件并未匹配到相应的 loader 来进行打包(例如 src/assets/logo.png )：
### 5.对图片等资源打包处理
此时我们需要使用 file-loader 和 url-loader 这两个工具来进行处理，file-loader 将文件在进行一些处理后（主要是处理文件名和路径、解析文件 url ），将文件移动到输出的目录中；url-loader 一般和 file-loader搭配使用，功能与 file-loader 类似，如果文件小于限制的大小。则会返回 base64 编码以减少 http 请求，否则使用 file-loader 将文件移动到输出的目录中。让我们从安装开始：

yarn add file-loader url-loader --dev

然后添加 url-loader 和 file-loader 到 webpack.config.js 中：
~~~ js
module: {
  rules: [
    { test: /\.(jpe?g|png|gif|ico)$/i, use: [{
      loader: 'url-loader', options: { limit: 10240, esModule: false, fallback: {
        loader: 'file-loader', options: { name: 'img/[name].[hash:8].[ext]' }
      }}
    }]}
   ]
},
~~~
此时再执行 yarn run build 之后发现 logo.png 构建成功，注意在上面的配置段中，我们添加了 ico 扩展文件，这是用来把 favicon.ico 添加到 dist 文件夹中，我们还需要更新之前的 html-webpack-plugin 配置属性（还记不记得是在plugins中？）添加：

favicon: path.resolve(__dirname, './public/favicon.ico')

这样我们的 plugin s配置看上去丰富多了：
~~~ js

plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
      title: '从0搭建vue cli',
      favicon: path.resolve(__dirname, './public/favicon.ico'),
      templateParameters: {BASE_URL: '/'}
    }),
    new VueLoaderPlugin()
  ],
  ~~~
  ### 6. css文件打包并添加进html文件中
  接下来我们来处理css的解析和打包问题：
  解析css文件，我们需要使用css-loader和style-loader这两个打包工具，他们分别的作用是将代码中引用到的css文件收集并添加到字符串、style-loader再将上述css-loader生成的输出字符串添加进html文件的<style>标签中。我们先来安装： 

yarn add css-loader style-loader --dev

更新下 webpack.config.js 文件以启用 css 解析：
~~~  js

module: { rules: [{ 
  test: /\.css$/, use: ['style-loader', 'css-loader'] }] 
}

~~~
我们终于不报错地构建好了！太兴奋了：
### 7.构建静态文件服务器
dis t文件夹中的文件已经构建成功了，但是我们如何去看构建成功后的这个网页呢？很自然地我们就会想到把dist文件夹放到静态文件服务器上，我们先用 node 来搭建一个很简单的静态文件服务器，在项目根目录新建 server.js:
~~~js 

const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')

const httpServer = http.createServer( function (req, res) {
  fs.createReadStream(path.resolve(__dirname, './dist/'+req.url)).pipe(res)
})
httpServer.listen(8080, function() { 
  console.log('App running at: http://localhost:8080/index.html') 
})
~~~

index.html 即可看到生成的网页。虽然这个 webserver 可以正常使用，但是我们每次编译代码时，手动运行 yarn run build 然后刷新网页会显得非常麻烦，还好 webpack 提供了非常好用的 webpack-dev-server，不仅仅提供给我们一个简单的 web server，还具有live reloading功能。

首先添加：webpack-dev-server: yarn add webpack-dev-server --dev

然后修改 webpack.config.js，告诉 dev server 从什么位置查找文件(为了方便调试，把 source-map 也添加上)：
~~~ js

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/main.js'),
  output: {
    filename: 'output.js',
    path: path.resolve(__dirname, './dist')
  },
  devtool: 'inline-source-map',
  devServer: {
    static: './dist'
  },
  ...
}
~~~

然后在package.json的scripts中添加可以运行 dev server 的 script:

"start": "webpack-dev-server --open"

最后执行 yarn run start，webpack-dev-server 自动帮我们打开网页供我们进行调试：


### 8.支持最新的JS语法和API

现在看上去和利用 vue-cli 工具生成的页面已经差不多了，我们还需要再配置几个功能让我们的开发更加便捷：

下一步将代码中的最新的 Javascript 语法和最新的API转换为浏览器支持的版本，这里我们引入 babel 进行转译，首先安装 babel: 

yarn add @babel/core @babel/preset-env babel-loader --dev

然后在项目根目录建立 babel.config.js 配置文件，preset-env 是babel7 强烈建议使用的预设插件组，并且它可以根据项目运行平台的支持情况自行选择编译版本；关于 useBuiltIns 的配置，由于全局引入bable-polyfill 打包后的整个文件体积非常大，通过设置 useBuiltIns 为usage，能够把 polyfill 中项目中需要到的部分打包进来，去除不需要的部分。另外，webpack从v7.4.0 版本之后废弃了@babel/polyfill，需要单独安装 core-js 模块: 

yarn add core-js --dev

好了，以上就是配置babel相关的准备工作，现在我们直接在 webpack.config.js 中添加 babel-loader 来解析 js 文件:

~~~ js

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
            loader: 'babel-loader',
            options: { presets: [['@babel/env', 
            { 'useBuiltIns': 'usage', 'corejs': 3 }]] }
        }]
      },
    ]
  },
}

~~~ 


为了方便查看我们用babel进行转换的结果，我们在 src 中新建一个单独的 index.js 文件：

~~~ js 

const fn = () => 1
let num = 3 ** 2
Promise.resolve().finally()
console.log(fn())
console.log(num)
~~~

这个 index.js 文件包含了es6 和 es7 相关的语法和新的API，然后修改一下 webpack.config.js 的 entry（由原来的 main.js 修改为 index.js）。最后启动我们刚刚搭建好的 webserver: yarn run start，在新打开的网页中启动调试，Network选项卡中查看生成的main.****.js:

可以看到，ES6箭头函数被转换为了普通函数，ES7 的 Math.pow 被正常执行（查看Console选项卡），另外在 main.****.js 文件中添加了很多的 polyfill，具体可以去查看生成的这个文件。现在连我最喜欢的 ES2020 链判断运算符 ?. 都可以支持了，我们可以在 src/index.js 中尝试一下：

~~~ js

const fn = () => 1
let num = 3 ** 2
Promise.resolve().finally()
console.log(fn())
console.log(num)
const obj = {test1: {test2: {test3: 'yes'}}}
console.log(obj?.test1?.test2?.test3)
console.log(obj?.test1?.test2?.test3?.test4)
~~~

好了，现在让我们把webpack.config.js的entry改回正常的main.js，重启我们的web-dev-server。接下来需要给Babel设定目标浏览器的版本，合理的设置可以平衡生成文件的大小和支持设备的数量。我们利用browserlist的推荐，在package.json中添加相关配置：

~~~ js

{
  "browserslist": [
    "> 1%",
    "last 2 versions"
  ]
}
~~~ 

### 9.集成ESLint以进行静态代码检验

最后，在我们写代码的时候，希望遵循已有的编码规范，这时使用Lint工具和代码风格检测工具，可以辅助编码规范执行，有效控制代码质量。

安装ESLint: yarn add eslint eslint-loader --dev

然后在 webpack.config.js 中引入 eslint-loder:
~~~ js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: { presets: [['@babel/env', { 'useBuiltIns': 'usage', 'corejs': 3 }]] }
          },
          'eslint-loader'
        ]
      },
    ]
  },
}
~~~ 

再通过交互式命令 eslint --init 来生成一份 eslint 的配置文件：

生成的 .eslintrc.js 文件代码如下：

~~~ js
module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:vue/vue3-essential"
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module",
        "parser": "babel-eslint"
    },
    "plugins": [
        "vue"
    ],
    "rules": {
    }
}

~~~

首先我们需要保证在vscode中安装了ESLint 的扩展程序，然后在src/main.js 中添加一句错误的语句：console.log(test)，其中test未定义，我们发现ESLint已经帮我们标记出来错误了：

这说明 ESLint 的配置生效了，如果你还保留之前为了测试 babel 所建立的 src/index.js 文件的话，你会发现此时 ESLint 对链判断运算符还在报错，如下图所示：

这是由于此时 ESLint 还不支持链判断运算符（可参考 https://github.com/babel/babel-eslint/issues/511），让我们来使用babel-eslint 来修复他，babel-eslint 的作用就是将不能被常规 linter 解析的代码转换为能被常规解析的代码：

安装babel-eslint: yarn add babel-eslint --dev

修改 .eslintrc.js , 在 parserOptions 中添加 "parser":  "babel-eslint"

保存之后，发现eslint已经不再报错了，到这里我们的eslint 工具已经配置完成了，我们可以开心地用最新的语法开发应用了！

以上就是从0到1搭建 vue-cli 的全部过程，在实现的过程中，我们对Webpack、Babel、ESLint 有了更加深入的理解，我想这就是重新学习搭建脚手架的意义，如果你已经看完这篇文章，建议自己去尝试一下这个有趣又有意义的过程。
