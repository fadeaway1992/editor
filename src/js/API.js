(function() {
  var API = function (instance) {
    this.base = instance;
    this.options = this.base.options;
  };

  API.prototype = {

    /* 增加大标题 */
    h2: function() {
      var delegate = this.base.delegate
      delegate.updateStatus()

      /* 基本判断 */  // 只有 段落 和 小标题  可以执行大标题命令哦！
      if (delegate.crossBlock || !delegate.range || delegate.closestBlock.nodeName.toLowerCase() === 'li') return

      MoreEditor.util.execFormatBlock(document, 'h2')
    },

    /* 添加小标题 */
    h3: function() {
      this.base.delegate.updateStatus()

      /* 基本判断 */
      if (this.base.delegate.crossBlock || !this.base.delegate.range || this.base.delegate.closestBlock.nodeName.toLowerCase() === 'li') return

      MoreEditor.util.execFormatBlock(document, 'h3')
    },


    /* 创建引用列表 */
    quote: function() {

      /* 刷新选区状态，获取选区信息 */
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var needSeperator

      /* 基本判断 */
      if(delegate.crossBlock || !delegate.range) return

       /* 如果选区中有引用就取消引用，转为纯文本 */
      if(delegate.setAlready.quote === true) {
        this.unWrapWholeList()
        return 
      }

      /* 选区不在引用中，生成引用，判断选区是否是段落（选区在 列表／标题 中时不能执行命令） */
      if(delegate.closestBlock.nodeName.toLowerCase() !== 'p') return

        /* 
          在谷歌浏览器中，生成的列表会和相邻的列表自动合并到一个浏览器中。
          如果检测到相邻的元素也是列表，我们可以先在要生成的列表要相邻的列表之间插入一个块元素
          生成新列表后再删除这个块元素之间
          这样可以防止合并。
        */

      /* 防止生成的引用和下面的无序列表合并 */
      if(delegate.topBlock.nextElementSibling && delegate.topBlock.nextElementSibling.nodeName.toLowerCase() === 'ul' && !delegate.topBlock.nextElementSibling.getAttribute('data-type')) {
        var newLine = document.createElement('p')
        newLine.innerHTML = '<br>'
        newLine.classList.add('seperator')
        delegate.topBlock.parentNode.insertBefore(newLine, delegate.topBlock.nextElementSibling)
        needSeperator = true
      }

      /* 防止生成的引用和上面的无序列表合并 */
      if(delegate.topBlock.previousElementSibling && delegate.topBlock.previousElementSibling.nodeName.toLowerCase() === 'ul' && !delegate.topBlock.previousElementSibling.getAttribute('data-type')) {
        var newLine = document.createElement('p')
        newLine.innerHTML = '<br>'
        newLine.classList.add('seperator')
        delegate.topBlock.parentNode.insertBefore(newLine, delegate.topBlock)
        needSeperator = true
      }
      
      /* 执行创建列表的函数，返回列表的标签名 */
      var list = this.createList()
      console.log(list, '这里应该是创建列表时返回的列表')

      /* 如果有插入了放合并的分隔符，需要在生成列表后删掉分隔符 */
      if(needSeperator) {
        this.base.editableElement.removeChild(document.querySelector('.seperator'))
      }

      // 给 引用 加上 blockquote 类
      list.classList.add('blockquote')
      list.setAttribute('data-type', 'blockquote')
    },


    /* 创建无序列表 */
    ul: function() {

      /* 刷新选区状态，获取选区信息 */
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var needSeperator

      /* 基本判断 */
      if(delegate.crossBlock || !delegate.range) return

      /* 如果选中的是无序列表就取消整个列表 */
      if(delegate.setAlready.ul === true) {
        this.unWrapWholeList()
        return
      }

      /* 如果选中的是顺序列表，将其转换为无序列表 */
      if(delegate.setAlready.ol === true) {
        MoreEditor.util.changeTag(delegate.topBlock, 'ul')
        return
      }

      /* 只有选中的是段落的情况下才生成无序列表， 标题、引用都不能执行生成无序列表的命令 */
      if(delegate.closestBlock.nodeName.toLowerCase() !== 'p') return

      /* 防止生成的无序列表和毗邻的引用合并 */
      if(delegate.topBlock.nextElementSibling && delegate.topBlock.nextElementSibling.nodeName.toLowerCase() === 'ul' && delegate.topBlock.nextElementSibling.getAttribute('data-type') === 'blockquote') {
        var newLine = document.createElement('p')
        newLine.innerHTML = '<br>'
        newLine.classList.add('seperator')
        delegate.topBlock.parentNode.insertBefore(newLine, delegate.topBlock.nextElementSibling)
        needSeperator = true
      }

      if(delegate.topBlock.previousElementSibling && delegate.topBlock.previousElementSibling.nodeName.toLowerCase() === 'ul' && delegate.topBlock.previousElementSibling.getAttribute('data-type') === 'blockquote') {
        var newLine = document.createElement('p')
        newLine.innerHTML = '<br>'
        newLine.classList.add('seperator')
        delegate.topBlock.parentNode.insertBefore(newLine, delegate.topBlock)
        needSeperator = true
      }

      /* 如果程序没有在前面几步退出，而是成功走到了这里，说明当前的环境可以生成顺序列表 */
      var list = this.createList()
      if(list.nodeName.toLowerCase() !== 'ul') console.log('%c你在生成无序列表的过程中出错啦！', 'color: red;')

      if(needSeperator) {
        this.base.editableElement.removeChild(document.querySelector('.seperator'))
      }
    },


    /* 创建顺序列表 */
    ol: function() {

      /* 刷新选区状态，获取选区信息 */
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate

      /* 基本判断 */
      if(delegate.crossBlock || !delegate.range) return

      /* 如果选中的是顺序列表就取消整个列表 */
      if(delegate.setAlready.ol === true) {
        this.unWrapWholeList()
        return
      }

      /* 如果选中的是无序列表，将其转换为顺序列表 */
      if(delegate.setAlready.ul === true) {
        MoreEditor.util.changeTag(delegate.topBlock, 'ol')
        return
      }

      /* 只有选中的是段落的情况下才生成顺序列表， 标题、引用都不能执行生成顺序列表的命令 */
      if(delegate.closestBlock.nodeName.toLowerCase() !== 'p') return

      /* 如果程序没有在前面几步退出，而是成功走到了这里，说明当前的环境可以生成顺序列表 */
      var list = this.createList(true)
      if(list.nodeName.toLowerCase() !== 'ol') console.log('%c你在生成顺序列表的过程中出错啦！', 'color: red;')
    },


    /*  
    **  创建列表 
    **  接收一个 ordered 参数,参数为 true 创建顺序列表，否则创建无序列表
    **  返回创建的列表 
    */
    createList: function(ordered) {
      
      if(ordered) {
        document.execCommand('insertOrderedList',false)
      } else {
        document.execCommand('insertUnorderedList',false)
      }
      
      /* sometimes 我们在 p 标签中创建出来的列表会被包裹在 p 标签中，这时候我们要手动扒掉 p 标签。 */ 
      var node = MoreEditor.selection.getSelectionStart(document)
      var topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)

      if(topBlock.nodeName.toLowerCase() !== 'ul' && topBlock.nodeName.toLowerCase() !== 'ol') {
        MoreEditor.util.unwrap(topBlock,document)
        topBlock =  MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)
      }

      if(topBlock.nodeName.toLowerCase() !== 'ol' && topBlock.nodeName.toLowerCase() !== 'ul') {
          console.error('%c创建标签的过程中出现错误', 'color:red;')
      }

      /* 防止生成的第一个列表项中有 br 标签 */
      if(topBlock.querySelector('li').textContent !== '') {
        topBlock.querySelector('li').innerHTML = topBlock.querySelector('li').innerHTML.replace(/<br>/g, '')
      }

      /* 把光标手动移到第一个列表项中，因为有时候浏览器会出现光标显示但获取不到 range 的 bug */
      MoreEditor.selection.moveCursor(document, topBlock.firstChild, 0)

      /* 返回创建的列表 */
      return topBlock
    },
    

    /* 取消列表 , 这时用户选区中包含 List Item */
    unWrapWholeList: function() {
      var delegate = this.base.delegate
      var topBlock = delegate.topBlock
      
      var listItems = Array.prototype.slice.apply(topBlock.children) // 将所有 li 放入一个数组
      for (var i=0; i<listItems.length; i++) {
        MoreEditor.util.changeTag(listItems[i],'p')
      }
      MoreEditor.util.unwrap(topBlock, document)
    },


    /* 加粗／取消加粗 */
    bold: function() {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var isCancle
     

      /* 基本判断 命令是否可以执行 */
      if (delegate.crossBlock || !delegate.range || (delegate.range.collapsed  && this.base.options.decorateOnlyWhenTextSelected)) return

      /* 标题不可加粗 */
      if(delegate.setAlready.h2 || delegate.setAlready.h3) return
      
      /* 判断将要执行的是加粗还是取消加粗 */
      if(delegate.setAlready.bold) {
        isCancle = true
      }

      document.execCommand('bold', false)

      // 如果只有一个光标没有选中文字，则执行的是开启粗体输入或者关闭粗体输入，这时候不需要去执行下面的 preventNestedDecorate
      if(delegate.collapsed) {
        this.base.buttons.bold.classList.toggle('button-active')
        return
      }

      /* 如果上一步执行的是加粗操作而不是取消加粗，则需要检查 粗体／斜体／删除线 之间的嵌套 */
      if(!isCancle) {
        MoreEditor.util.preventNestedDecorate(delegate.closestBlock, 'b i, b strike', 'i b, strike b')
      }
    },


    /* 斜体／取消斜体 */
    italic: function() {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var isCancle

      /* 基本判断 命令是否可以执行 */
      if (delegate.crossBlock || !delegate.range || (delegate.range.collapsed  && this.base.options.decorateOnlyWhenTextSelected)) return

      /* 标题不可加粗 */
      if(delegate.setAlready.h2 || delegate.setAlready.h3) return

      /* 判断将要执行的是斜体还是取消斜体 */
      if(delegate.setAlready.italic) {
        isCancle = true
      }

      document.execCommand('italic', false)

      // 如果只有一个光标没有选中文字，则执行的是开启斜体输入或者关闭斜体输入，这时候不需要去执行下面的 preventNestedDecorate
      if(delegate.collapsed) {
        this.base.buttons.italic.classList.toggle('button-active')
        return
      }

      /* 如果上一步执行的是斜体操作而不是取消斜体，则需要检查 粗体／斜体／删除线 之间的嵌套 */
      if(!isCancle) {
        MoreEditor.util.preventNestedDecorate(delegate.closestBlock, 'i b, i strike', 'b i, strike i') 
      }  
    },

    /* 斜体／取消斜体 */
    strike: function() {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var isCancle

      /* 基本判断 命令是否可以执行 */
      if (delegate.crossBlock || !delegate.range || delegate.range.collapsed) return

      /* 标题不可加粗 */
      if(delegate.setAlready.h2 || delegate.setAlready.h3) return

      /* 判断将要执行的是斜体还是取消斜体 */
      if(delegate.setAlready.strike) {
        isCancle = true
      }

      document.execCommand('strikeThrough', false)

      /* 检查 粗体／斜体／删除线 之间的嵌套 */
      if(!isCancle) {
        MoreEditor.util.preventNestedDecorate(delegate.closestBlock, 'strike b, strike i', 'b strike, i strike') 
      }  
    },

    /* 创建链接 */
    createLink: function(url) {
      if(!url) {
        return
      }

      var delegate = this.base.delegate
      delegate.updateStatus()

      /* 基本判断 */
      if(delegate.crossBlock || !delegate.range) return
      
      /* 确定我们的选区不是全部在一个装饰标签内 */ 
      if(!MoreEditor.util.wrappedByDecoratedElement(delegate.range.commonAncestorContainer)) {
        console.log('确定不全在一个标签内')

        var anchorDecorateCommand, focusDecoratedCommand
        var origSelection = MoreEditor.selection.saveSelection(delegate.closestBlock)  //  存储当前选区(要执行创建链接的选区)
        var anchorOverlap, focusOverlap
          
        var anchorDecoratedElement = MoreEditor.util.traverseUp(delegate.startElement, function(element) {
              return (element.nodeName.toLowerCase() === 'i' || element.nodeName.toLowerCase() === 'b' || element.nodeName.toLowerCase() === 'strike')
        })

        var focusDecoratedElement = MoreEditor.util.traverseUp(delegate.range.endContainer, function(element) {
              return (element.nodeName.toLowerCase() === 'i' || element.nodeName.toLowerCase() === 'b' || element.nodeName.toLowerCase() === 'strike')
        })

        /* 这个地方要做一个判断：anchorNode 是否在左边， focusNode是否在右边，否则会出现错误 */

        /* 可以确定我们的 anchorNode 在 装饰标签内。并且这个装饰标签不包含 focusNode */
        if(anchorDecoratedElement) {
          
          MoreEditor.selection.select(document, delegate.range.startContainer, delegate.range.startOffset, anchorDecoratedElement, anchorDecoratedElement.childNodes.length) // 选中重叠部分
          anchorOverlap = MoreEditor.selection.saveSelection(delegate.closestBlock)  //  存储当前选区（装饰标签与选区重叠的部分）
          
          /* 对装饰标签与选区交叉的部分取消装饰效果 */
          if (anchorDecoratedElement.nodeName.toLowerCase() === 'i') {
            document.execCommand('italic', false)
            anchorDecorateCommand = 'italic'
          } else if(anchorDecoratedElement.nodeName.toLowerCase() === 'strike') {
            document.execCommand('strikeThrough', false)
            anchorDecorateCommand = 'strikeThrough'
          } else if(anchorDecoratedElement.nodeName.toLowerCase() === 'b') {
            document.execCommand('bold', false)
            anchorDecorateCommand = 'bold'
          } else {
            console.log('%c出错了')
          }
        }

        /* 可以确定我们的 focusNode 在 装饰标签内。并且这个装饰标签不包含 anchorNode */
        if(focusDecoratedElement) {
          
          MoreEditor.selection.select(document, focusDecoratedElement, 0, delegate.range.endContainer, delegate.range.endOffset) // 选中重叠部分
          focusOverlap = MoreEditor.selection.saveSelection(delegate.closestBlock)  //  存储当前选区（装饰标签与选区重叠的部分）
          
          /* 对装饰标签与选区交叉的部分取消装饰效果 */
          if (focusDecoratedElement.nodeName.toLowerCase() === 'i') {
            document.execCommand('italic', false)
            focusDecoratedCommand = 'italic'
          } else if(focusDecoratedElement.nodeName.toLowerCase() === 'strike') {
            document.execCommand('strikeThrough', false)
            focusDecoratedCommand = 'strikeThrough'
          } else if(focusDecoratedElement.nodeName.toLowerCase() === 'b') {
            document.execCommand('bold', false)
            focusDecoratedCommand = 'bold'
          } else {
            console.log('%c出错了')
          }
        }

        /* 重叠部分装饰效果已经取消了，现在可以执行链接操作 */
        MoreEditor.selection.restoreSelection(delegate.closestBlock, origSelection)  // 恢复要执行链接的选区
        document.execCommand('createLink', false, url.trim())

        /* 恢复原重叠部分的装饰效果 */
        if(anchorDecorateCommand) {
          MoreEditor.selection.restoreSelection(delegate.closestBlock, anchorOverlap) // 恢复开始处重叠部分的选区
          document.execCommand(anchorDecorateCommand, false)
        }
        if(focusDecoratedCommand) {
          MoreEditor.selection.restoreSelection(delegate.closestBlock, focusOverlap) // 恢复开始处重叠部分的选区
          document.execCommand(focusDecoratedCommand, false)
        }

        MoreEditor.selection.restoreSelection(delegate.closestBlock, origSelection)  // 恢复最开始的选区并退出
        return

      } else {

        document.execCommand('createLink', false, url.trim())
        return
      }
    },

    /* 居中 */
    center: function() {
      var delegate = this.base.delegate
      delegate.updateStatus()

      /* 基本判断 */
      if(delegate.crossBlock || !delegate.range) return

      if(delegate.closestBlock.nodeName.toLowerCase() === 'li') {
        return delegate.topBlock.classList.toggle('block-center')
      }

       delegate.topBlock.classList.toggle('text-center')
       
       /* 如果只有一个光标的话，执行居中后光标会消失，需要重新手动聚焦，有碍连续操作体验。下面的代码对此进行了优化。 */
       if(delegate.range.collapsed) {
         this.base.editableElement.focus()
         MoreEditor.selection.select(document, delegate.range.startContainer, delegate.range.startOffset)
       }
    },

    /* 
      创建链接时，我们首先选中一段文字，然后点击输入链接地址的输入框，这时候选区就消失了🤷‍。
      当我们输入完链接地址，再点击生成链接按钮的时候，程序会去编辑器中寻找我们的选区，给我们选中的选区加链接。
      然而因为刚才点击输入框的时候选区消失了，所以这时候我们的选区时不存在的。
      所以我们要在点击输入框之前先把选区存储起来，等输入完链接地址，点击生成链接按钮的时候再恢复存储起来的选区。
    */
    exportSelection: function() {
      this.base.delegate.updateStatus()
      console.log(this.base.delegate.range, '输出的选区')
      this.savedSelectionContainer = this.base.delegate.closestBlock
      this.savedSelection = MoreEditor.selection.saveSelection(this.savedSelectionContainer)
    },

    importSelection: function() {
      console.log(this.savedSelectionContainer,'看看你还在吗')
      MoreEditor.selection.restoreSelection(this.savedSelectionContainer, this.savedSelection)
      console.log(document.getSelection().getRangeAt(0), '恢复的选区')
    },

    /* 插入图片 */
    insertImage: function(event) {
      console.log(event.target.files, 'insertImage files')
      var file = event.target.files[0]
      if(!file) {
        return
      }

      /* 判断图片大小是否超限 */
      var maxFileSize = 10 * 1024 * 1024
      if(file.size > maxFileSize) {
        this.base.extensions.fileDragging.sizeAlert()
        return
      }

      var delegate = this.base.delegate
      delegate.updateStatus()

      /* 基本判断 */
      if(!delegate.range || delegate.crossBlock ) {return}

      var fileReader = new FileReader()

      var addImageElement = new Image
      addImageElement.classList.add('insert-image')
      addImageElement.onload = function() {
          if(this.width<768) {
            this.style.width = this.width +'px'
          } else {
            this.style.width = "768px"
          }
        }
      
      fileReader.addEventListener('load', function (e) {
        
        addImageElement.src = e.target.result

        this.options.imageUpload(file, function(result) {
          addImageElement.src = result
        }.bind(this))

        console.log('这时候上传完毕了吗？')
        var imageWrapperHTML = '<figure data-type="more-editor-inserted-image" class="more-editor-inserted-image" contenteditable="false"><li data-type="image-placeholder" class="image-placeholder" contenteditable="true"></li><div class="image-wrapper"></div></figure>'
        var imageWrapper = document.createElement('div')
        imageWrapper.innerHTML = imageWrapperHTML
        var imageParent = imageWrapper.querySelector('.image-wrapper')
        imageParent.appendChild(addImageElement)

        /* 当前选区存在内容的情况下在后面插入图片 */
        if(delegate.topBlock.textContent && delegate.topBlock.nodeName.toLowerCase() !== 'figure') {
          console.log('在后面插入')
          console.log(delegate.topBlock.nodeName.toLowerCase)
          MoreEditor.util.after(delegate.topBlock, imageWrapper)
          MoreEditor.util.unwrap(imageWrapper, document)
          return
        } else {
          console.log('替换')
          this.base.editableElement.replaceChild(imageWrapper, delegate.topBlock)
          MoreEditor.util.unwrap(imageWrapper, document)
          return
        }
      }.bind(this))

      fileReader.readAsDataURL(file) 
    },
    
    /* 点击按钮删除选中的图片 */
    removeImage: function() {
      var currentImage = document.querySelector('.insert-image-active')
      if(!currentImage){console.log('出错了！')}

      var imagefigure = currentImage.parentNode.parentNode
      if(imagefigure.nodeName.toLocaleLowerCase() !== 'figure') {console.log('出错了')}
      
      var newLine = document.createElement('p')
      newLine.innerHTML = '<br>'

      /* 先把图片中的 图片选项 移出去，这样后期添加 撤销／重做 的时候，程序会记录我们删除的内容，这个内容中不能包括 图片选项 */
      this.base.buttons.imageOptions.style.display = 'none'
      document.body.appendChild(this.base.buttons.imageOptions)

      this.base.editableElement.insertBefore(newLine, imagefigure)
      this.base.editableElement.removeChild(imagefigure)
      MoreEditor.selection.moveCursor(document, newLine, 0)
    },

    /* 为图片添加注释 */
    figCaption: function() {
      var currentImage = document.querySelector('.insert-image-active')
      if(!currentImage){console.log('出错了！')}

      var imagefigure = currentImage.parentNode.parentNode
      if(imagefigure.nodeName.toLocaleLowerCase() !== 'figure') {console.log('出错了')}

      /* 判断当前图片是否已经存在 figurecaption */
      if(imagefigure.querySelector('figcaption')) {
        var oldCaption = imagefigure.querySelector('figcaption')
        oldCaption.parentNode.removeChild(oldCaption)
        return
      }

      var figCaption = document.createElement('figcaption')
      figCaption.innerHTML = '<br>'
      figCaption.setAttribute('contenteditable', 'true')
      figCaption.style.width = currentImage.offsetWidth + 'px'
      imagefigure.appendChild(figCaption)
      MoreEditor.selection.moveCursor(document, figCaption, 0)
      updateButtonStatus.call(this.base)
      return
    }
  }

  MoreEditor.API = API
}());