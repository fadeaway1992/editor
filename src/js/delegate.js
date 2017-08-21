/* 
  Delegate 对象存储触发修改 DOM 的函数的参数。 例如用户点击 小标题按钮，程序会调用一个函数将当前用户选中的文字转为
  小标题。这个函数需要的参数：用户选中了哪些文字、当前文字是否可以转化成小标题、小标题按钮是否被禁用，等。 这些参数都
  存储在 Delegate 对象中。
*/


(function() {
  var Delegate = function (instance) {
    this.base = instance;
    this.options = this.base.options;
    this.setDefault()
  };

  Delegate.prototype = {

    /* 
      检查当前选区状态，并输出当前选区的数据
    */
    updateStatus: function() {

      var selection = document.getSelection()
      var range

      if(selection.rangeCount>0) {
        range = selection.getRangeAt(0)
      }

      /* 选区存在并且选区在 editableElement 中 */
      if(range && MoreEditor.util.isRangeInsideMoreEditor(this.base.editableElement, range)) {
        this.range = range
        this.collapsed = range.collapsed
        this.startContainer = range.startContainer
        this.endContainer = range.endContainer
        this.commonAncestorContainer = range.commonAncestorContainer
        this.startElement = MoreEditor.selection.getSelectionStart(document)
        this.closestBlock = MoreEditor.util.getClosestBlockContainer(this.startElement)
        this.topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(this.startElement)

        /* 有时候获取到 this.startElement 是整个编辑器，获取 topBlock 是 false, 不知道为什么会产生这种错误。如果获取到 topBlock 是错误，暂时先退出函数。 */
        if(!this.topBlock) {
          return
        }

        /* 判断是否是连续点击选中，这种情况下会选中下一个块元素会被选中 */
        if(this.crossBlock && MoreEditor.util.isBlockContainer(this.endContainer) && this.range.endOffset === 0) {
          console.log('aaaaaa')
          MoreEditor.selection.selectNode(this.closestBlock, document)
          this.updateStatus()
          console.log('重新选中')
          return
        }

        /* 判断选区是否跨越块元素 */
        if(MoreEditor.util.isRangeCrossBlock(range)) {
          this.crossBlock = true
        } else {
          this.crossBlock = false
        }

        /* 判断是否有选中有序列表 */ 
        if(this.topBlock.nodeName.toLowerCase() === 'ol') {
          this.setAlready.ol = true
        } else {
          this.setAlready.ol = false
        }

        /* 判断是否有选中 无序列表／引用 */ 
        if(this.topBlock.nodeName.toLowerCase() === 'ul') {
          if(this.topBlock.getAttribute('data-type') === 'blockquote') {
            this.setAlready.quote = true
            this.setAlready.ul = false
          } else {
            this.setAlready.ul = true
            this.setAlready.quote = false
          }
        } else {
          this.setAlready.ul = false
          this.setAlready.quote = false
        }

        /* 判断是否选中标题 */
        if(this.closestBlock.nodeName.toLowerCase() === 'h2'){
          this.setAlready.h2 = true
        } else {
          this.setAlready.h2 = false
        }

        if(this.closestBlock.nodeName.toLowerCase() === 'h3'){
          this.setAlready.h3 = true
        } else {
          this.setAlready.h3 = false
        }

        /* 判断是否选中粗体 以选区开始处为准*/
        if(this.startElement.nodeName.toLowerCase() === 'b' || this.startElement.parentNode.nodeName.toLowerCase() === 'b') {
          this.setAlready.bold = true
        } else {
          this.setAlready.bold = false
        }
        
        /* 判断是否选中斜体 以选区开始处为准 */
        if(this.startElement.nodeName.toLowerCase() === 'i' || this.startElement.parentNode.nodeName.toLowerCase() === 'i') {
          this.setAlready.italic = true
        } else {
          this.setAlready.italic = false
        }

        /* 判断是否选中删除线 以选区开始处为准 */
        if(this.startElement.nodeName.toLowerCase() === 'strike' || this.startElement.parentNode.nodeName.toLowerCase() === 'strike') {
          this.setAlready.strike = true
        } else {
          this.setAlready.strike = false
        }

        /* 判断选中的部分是否已经居中 */
        if(this.topBlock.classList.contains('text-align-center') || this.topBlock.classList.contains('block-center')) {
          this.setAlready.center = true
        } else {
          this.setAlready.center = false
        }

        /* 判断 h2 h3 switchTitle 是否可用 */
        if (this.crossBlock || this.closestBlock.nodeName.toLowerCase() === 'li' || this.closestBlock.nodeName.toLowerCase() === 'figcaption') {
          this.available.h = false
        } else {
          this.available.h = true
        }

        /* 判断 bold italic strike 是否可用 */
        if(this.crossBlock || (this.collapsed  && this.base.options.decorateOnlyWhenTextSelected) || this.closestBlock.getAttribute('data-type') === 'image-placeholder' || this.closestBlock.nodeName.toLowerCase() === 'figcaption' || this.topBlock.nodeName.toLowerCase().match(/h[23]/)) {
          this.available.decorate = false
        } else {
          this.available.decorate = true
        }

        /* 判断 ul ol quote 是否可用 */
        if (!this.crossBlock) {
          if(this.closestBlock.nodeName.toLowerCase() === 'p') {
            this.available.list = true
            this.available.quote = true
          } else if(this.closestBlock.nodeName.toLowerCase() === 'li') {
            if(this.topBlock.getAttribute('data-type') === 'blockquote') {
              this.available.quote = true
              this.available.list = false
            } else if(this.closestBlock.getAttribute('data-type') === 'image-placeholder') {
              this.available.quote = false
              this.available.list = false
            } else {
              this.available.quote = false
              this.available.list = true
            }
          } else if(this.closestBlock.nodeName.toLowerCase() === 'figcaption') {
            this.available.list = false
            this.available.quote = false
          } else {
            this.available.list = false
            this.available.quote = false
          }
        }

        /* 判断居中是否可用 */
        if(this.crossBlock || this.closestBlock.getAttribute('data-type') === 'image-placeholder' || this.closestBlock.nodeName.toLowerCase() === 'figcaption') {
          this.available.center = false
        } else {
          if(!this.base.options.canListsBeAligned && this.closestBlock.nodeName.toLowerCase() === 'li') {
            this.available.center = false
          } else {
            this.available.center = true
          }
        }

        /* 判断 上传图片 是否可用 */
        if(this.crossBlock || this.closestBlock.nodeName.toLowerCase() === 'figcaption') {
          this.available.image = false
        } else {
          this.available.image = true
        }

      /* 没有选区或者选区不在 editableElement 内 */
      } else {
        console.log('set defaults')
        this.setDefault()
      }

    },

    setDefault: function() {
      this.range = null
      this.collapsed = null
      this.startContainer = null
      this.endContainer = null
      this.commonAncestorContainer = null
      this.startElement = null
      this.closestBlock = null
      this.topBlock = null
      this.crossBlock = false
      this.setAlready = {
        h2: false,
        h3: false,
        bold: false,
        italic: false,
        strike: false,
        quote: false,
        ul: false,
        ol: false,
        center: false
      }
      this.available = {
        h: false,
        decorate: false,
        quote: false,
        list: false,
        center: false,
        image: false,
      }
    }
  }

  MoreEditor.Delegate = Delegate
}());

