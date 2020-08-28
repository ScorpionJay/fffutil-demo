# 开发一个 sdk

## 为什么写这个

项目写多了，总有一些常用的工具类，之前的做法是不停的 copy，也没个管理，是否可以将这些常用的方法写在一起，封装成一个库，用的时候直接安装就行了，这样也方便维护统一管理，答案是肯定的，那就开动吧。

## 开发前的准备

> 打包工具

要写一个库，先选一个打包工具，目前流行的有 webpack rollup，如何选择呢。webpack 适合用来写项目，里面有 html css javascript 这种。rollup 更适合用来写工具，react vue 都是用它来打包的。

> 模块

模块有 iife cjs amd umd esm。为了更好的用上 tree sharking，我们主推 esm，当然作为一个合格的库，其他的模块方式我们也要支持的。

> sdk 名字

起名太复杂了，各种重复，fffutil-demo 就这么随意吧，哈哈。

## 开发

```
# 新建一个文件夹
mkdir fffutil-demo

# 切换目录
cd fffutil-demo

# npm初始化，一路到底，生成package.json
npm init

# rollup
npm i rollup -D
```

新建 src 文件夹，创建 index.js 文件

写一个方法

```
function foo() {
  console.log("foo");
}

```

使用 rollup 打包到 dist 文件夹，模块使用 cjs

```
rollup --format=cjs --file=dist/index.js -- src/index.js
```

看下 dist 文件夹下 index.js 打包出来的内容。

WTF??? 'use strict'; 写的 foo 方法呢？因为 rollup 天然的支持 tree sharking，foo 方法没有被调用也没有导出，认为写的是一个废代码，就默认给扔了。

```
export function foo() {
  console.log("foo");
}
```

加一个导出，再打包，就看到 foo 方法了

```
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function foo() {
  console.log("foo");
}

exports.foo = foo;

```

打出其他模块的包

```
rollup --format=es --file=dist/index.es.js -- src/index.js

rollup --format=umd  --output.name=fffutil --file=dist/index.umd.js --input=src/index.js

rollup --format=iife  --output.name=fffutil --file=dist/index.iife.js --input=src/index.js
```

命令行里敲那么长的命令太复杂了，创建一个 rollup.config.js 文件，在 package.json script 里加上命令

在根路径下创建 rollup.config.js

```
const config = {
  input: "src/index.js",
  output: {
    file: "dist/index.cjs.js",
    format: "cjs",
  },
};

export default config;
```

package.json script 中添加

```
"build": "rollup -c rollup.config.js"
```

执行 npm run build 即可打包,这样一次只能打包一种模式的包，改造下 rollup 配置文件

```
const outputs = [
  {
    file: "dist/index.cjs.js",
    format: "cjs",
  },
  {
    file: "dist/index.es.js",
    format: "es",
  },
  {
    file: "dist/index.umd.js",
    format: "umd",
    name: "fffutil",
  },
];

const config = outputs.map((item) => ({
  input: "src/index.js",
  output: item,
}));

export default config;

```

再次执行，即可一次打出多种包

到此我们的 sdk 已经写好了，那么如何测试呢?

umd 的我们只需要在 html 中引入 js 即可测试，创建 test 文件下，写一个 html 文件

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>test</title>
    <script src="../dist/index.umd.js"></script>
  </head>
  <body>
    test
  </body>
  <script>
    fffutil.foo();
  </script>
</html>
```

打开浏览器，我们会在控制台看到打印 foo 方法。

esm 的需要通过 npm link 来测试了。

```
jay$ yarn link
yarn link v1.19.1
success Registered "fffutil".
info You can now run `yarn link "fffutil-demo"` in the projects where you want to use this package and it will be used instead.
✨  Done in 0.04s.
```

在测试的项目中执行 yarn link fffutil-demo

发生错误 (!) Unresolved dependencies

这里需要安装@rollup/plugin-node-resolve 插件 用来查找外部的依赖

源码

```
import { foo } from "fffutil-demo";

console.log(foo);
```

打包

```
'use strict';

function foo() {
  console.log("foo");
}

console.log(foo);
```

继续完善，使用 rollup-plugin-terser 插件压缩打包后的代码，

```
npm i rollup-plugin-terser -D
```

```
import { terser } from "rollup-plugin-terser";


plugins: [
    terser({
      compress: { warnings: true, drop_console: false, unused: true },
      output: {
        comments: /fffutil/i,
      },
    }),
  ],
```

开发不压缩 打包的时候压缩，需要添加环境--environment NODE_ENV:production

package.json 改造

```
 "scripts": {
    "dev": "rollup -cw rollup.config.js --environment NODE_ENV:development",
    "build": "rollup -c rollup.config.js --environment NODE_ENV:production"
  },
```

rollup.config.js

```
const mode = process.env.NODE_ENV;
const isDev = mode === "development";

plugins: [
    !isDev &&
      terser({
        compress: { warnings: true, drop_console: false, unused: true },
        output: {
          comments: /fffutil/i,
        },
      }),
  ],
```

再来添加一下 banner

安装 rollup-plugin-json 处理 json

```
npm i rollup-plugin-json -D
```

```
import json from "rollup-plugin-json";
import { name, version } from "./package.json";

const banner = `/*!
 * ${name}.js ${version}
 * Build in ${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}
 */`;


plugins: [
    json(),
```

发不到 npm
不是所有文件都发布上去 创建一个.npmginore 文件

```
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
node_modules
.dea
.DS_Store
.editorconfig
.prettierignore
yarn.lock
.prettierrc
.babelrc
.editorconfig
.gitignore
rollup.config.js
yarn.lock
src
```

配置 cdn unpkg jsdevlivr
在 package.json 中添加配置

```
"jsdelivr": "dist/index.umd.js",
"unpkg": "dist/index.umd.js",
```

```
jay\$ npm login
Username: 你的用户名字
Password: 你的秘密
Email: (this IS public) 你的邮箱
Enter one-time password from your authenticator app:

# 发布
npm publish

jays-MacBook-Pro:fffutil jay$ npm publish
npm notice
npm notice 📦  fffutil-demo@0.1.0
npm notice === Tarball Contents ===
npm notice 309B test/index.html
npm notice 168B dist/index.cjs.js
npm notice 106B dist/index.es.js
npm notice 343B dist/index.umd.js
npm notice 590B package.json
npm notice 15B  README.md
npm notice === Tarball Details ===
npm notice name:          fffutil-demo
npm notice version:       0.1.0
npm notice package size:  962 B
npm notice unpacked size: 1.5 kB
npm notice shasum:        cca4f77ba1563f3f0d3e1a7a74bac2a94b717cf4
npm notice integrity:     sha512-WuuVRuhNmCTr/[...]MZaYjZPJCjMSg==
npm notice total files:   6
npm notice
+ fffutil-demo@0.1.0

```

https://www.npmjs.com/package/fffutil-demo 发上去了

cdn 上也可以打开了

https://unpkg.com/fffutil-demo@0.1.0/dist/index.umd.js

https://cdn.jsdelivr.net/npm/fffutil-demo@0.1.0

测试一下
在刚刚的测试 demo 中安装

```
npm i fffutil-demo -S
```

再次打包,成功，输出如下

```
'use strict';

/*!
 * fffutil-demo.js 0.1.0
 * Build in 2020-8-28
 */
function o(){console.log("foo ");}

console.log(o);

```

Bingo!!!
