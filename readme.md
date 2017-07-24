# more-editor
 v 1.0

 ## 开始使用

 ### 调试
 在根目录下运行 ```gulp``` 、 ```npm run test``` 、或者手动打开 ```dist/demo/index.html```。

 ### 使用
 1. 在你的编辑器页面引入  ```dist/js/more-editor.js```
 2. 在你的编辑页面引入    ```dist/css/more-editor.css```
 3. 初始化编辑器：
 ```
 var editor = new MoreEditor('.editable', {  // 第一个参数是你的编辑器元素的选择器
      imageUploadAddress: 'zi.com',  // 图片上传到服务器的地址
      buttons: {
        h2: '.h2',  // 大标题按钮的选择器
        h3: '.h3',  // 小标题按钮的选择器
        ul: '.ul',  // 无序列表按钮的选择器
        ol: '.ol',  // 顺序列表按钮的选择器按钮
        quote: '.quote',  // 引用按钮的选择器
        bold: '.bold',  // 加粗按钮的选择器
        italic: '.italic',  // 斜体按钮的选择器
        strike: '.strike',  // 删除线按钮的选择器
        url: '.url',  // 链接地址输入框的选择器
        link: '.link',  // 生成链接按钮选择器
        center: '.center'  // 居中按钮选择器
      }
    })
 ```

## 功能逻辑

## 1. 功能概述

- 基础功能
  - 段落
  - 标题
  - 列表
  - 引用
  - 链接
  - 加粗
  - 斜体
  - 删除线
  - 居中
- 高阶功能
  - 拖拽／上传 图片
  - 粘贴文本
  - 撤销与重做
  - 快捷键操作


## 2. 文本结构

  - 标题
    - 装饰文本／链接
  - 段落
    - 装饰文本／链接
  - 列表
    - 装饰文本／链接
  - 引用
    - 装饰文本／链接
  - 图片

## 3. 编辑规则

### 选区

选区不能跨越块级元素，否则功能无法使用。即只有当用户的选区在 **一个标题**／**一个段落**／**一个列表项** 中的时候，各种功能才可用。

### 装饰文本

装饰文本不能嵌套使用。这里的装饰文本是指 **加粗**／**斜体**／**删除线**。 装饰一个字符，只能在这三种方式中选一个，不能多选。或者说同一个字不能既加粗又斜体。

当用户选中一段文字并执行加粗时，程序会判断选中的第一个字是否是粗体，如果不是，把选中的文字加粗，如果第一个字已经加粗，则将选中的文字中的粗体全部改为纯文本。这个命令相当于：执行加粗或者取消加粗，如果选区的第一个字符没有加粗，把选区所有的字符变成粗体，并取消其中的斜体和删除线；如果第一个字符已经加粗，则把选区所有已经加粗的文字变成纯文本。

### 列表

段落可以转换成顺序列表和无序列表。

顺序列表可以转换成段落和无序列表。

无序列表可以转换成段落或顺序列表。

无序列表、顺序列表、段落之间的转换的最低单位是 顶级块元素。 即如果用户选中无序列表的一个列表项并执行生成顺序列表命令，整个无序列表都会变成顺序列表。如果用户选中一个列表项并执行转换成文本的命令，整个列表都会转换成文本。即用户不能只转换一个列表项。

### 引用

本项目中用无序列表实现引用（给无序列表添加一些样式使它看起来像在引用一段话）。生成引用和生成无序列表命令不同的地方在于：
1. 引用会拥有一个 blockquote 的类名，一个 data-type=true 的属性。
2. 引用只能转换成文本，不能转换成顺序列表。

### 链接

使用 execCommand 执行 createLink 时浏览器的默认行为：
- 选区跨元素的时候，生成的链接会被打断
- 执行加粗的时候，如果选区里有链接，加粗会被打断。
- 我们生成装饰标签的时候不用担心会打断 a 标签
- 但我们生成链接的时候要处理链接被装饰标签打断的情况
- 当选区中有链接的时候，不论是在链接中还是包含链接，还是有交叉，浏览器都会自动处理，所以不用手动 unlink

所以我好像只需要处理链接被装饰标签打断的情况。

我们要判断我们的 anchorNode 和 FocusNode 被包含在一个装饰标签内
并且，这个装饰标签没有同时包含 anchorNode 和 endNode

为了方便上面的判断，首先我们要排除有一个装饰标签同时包含了 anchorNode 和 startNode 的情况

我们可以用 range.CommonAncestorContainer 向上追溯，如果没有装饰元素被匹配到，说明我们的选区没有被包含在一个装饰标签中。

接下来就可以分别判断 anchorNode 和 startNode 是否被包含在一个装饰标签中了。

以 anchorNode 为例，如果他被包含在了一个装饰标签中。我们先把装饰标签与选区交叉的部分的装饰效果去掉，再执行创建链接的命令，这样链接就不会被打断了，创建好链接后，我们再选中刚才的交叉部分，把装饰效果恢复即可。

### 在键盘上按下 ENTER 或 BACKSPACE

**选中了文字的情况下**：

- 按下退格，默认删除。
- 按下回车，浏览器默认操作 **删除并换行**。如果选中的文本的最后是一个块元素的最后一个文字，这种情况下浏览器会新起一行，这时候要保证新起的一行我们规定的段落。其余情况按浏览器默认。

**只有一个光标的情况（只列与浏览器默认行为冲突的部分）**：

- 在列表的最后或者唯一一个空列表项按下回车：产生一个新的段落，删除原来的空列表项。
- 其余的空列表项（非最后、非唯一）中按下回车：向下产生一行新列表项。
- 第一个或者唯一一个列表项、并且内容为空的或者光标在第一个字前：把列表项的内容放在一个新的段落中，退出列表项。
- 光标在当前段落或者标题的最后时按下回车：向下新产生一个段落。




