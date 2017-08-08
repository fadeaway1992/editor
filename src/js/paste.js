(function () {
  'use strict';

  /* 从剪贴板中抓取数据 */
  function getClipboardContent(event, win, doc) {
    var dataTransfer = event.clipboardData || win.clipboardData || doc.dataTransfer,
      data = {};

    if (!dataTransfer) {
      return data;
    }

    // Use old WebKit/IE API
    if (dataTransfer.getData) {
      var legacyText = dataTransfer.getData('Text');
      if (legacyText && legacyText.length > 0) {
        data['text/plain'] = legacyText;
      }
    }

    if (dataTransfer.types) {
      for (var i = 0; i < dataTransfer.types.length; i++) {
        var contentType = dataTransfer.types[i];
        data[contentType] = dataTransfer.getData(contentType);
      }
    }

    return data;
  }

  var Paste = function (instance) {
    this.base = instance
    this.options = this.base.options
    this.init()
  };

  Paste.prototype = {

    init: function() {
      this.base.on(this.base.editableElement, 'paste', this.handlePaste.bind(this))
    },

    handlePaste: function(event) {
      console.log('侦听到粘贴事件。')
      event.preventDefault()

      /* 获取选区 */
      var delegate = this.base.delegate
      delegate.updateStatus()

      /* 
        基本判断
        光标在图片中的情况下不能粘贴
        跨块元素选择时可以粘贴，行为为先删除选中内容，再执行粘贴。
      */
      if(!delegate.range || delegate.closestBlock.getAttribute('data-type') === 'image-placeholder') return

      /* 粘贴时要匹配当前的标签，可以是 p, h, li, figcaption */
      this.pasteTag = delegate.closestBlock.nodeName.toLowerCase()

      var clipboardContent = getClipboardContent(event, window, document)
      var pastedHTML = clipboardContent['text/html']
      var pastedPlain = clipboardContent['text/plain']

      if (pastedHTML || pastedPlain) {
        this.doPaste(pastedPlain)
      }
      this.base.saveScene()  // 设立撤销点
      return
    },

    doPaste: function(pastedPlain) {
      var delegate = this.base.delegate
      var paragraphs
      var html = ''

      //  如果是在 figcaption 或者 li 中粘贴，直接粘贴没有换行符的纯文本 
      if(this.pasteTag === 'figcaption') {
        html = MoreEditor.util.htmlEntities(pastedPlain.replace(/[\r\n]+/g, ''))
      } else {
        //  检查文本中的换行，将每一行用光标所在块元素的标签包裹 
        paragraphs = pastedPlain.split(/[\r\n]+/g)
        if (paragraphs.length > 1) {
          for (var i = 0; i < paragraphs.length; i += 1) {
            if (paragraphs[i] !== '') {
              html += '<' + this.pasteTag + '>' + MoreEditor.util.htmlEntities(paragraphs[i]) + '</' + this.pasteTag + '>'
            }
          }
          /* 如果是在 li 中执行粘贴操作，当粘贴内容为多行 li html 时，li 会进行嵌套，我们需要手动处理 */
          if(this.pasteTag === 'li') {
            if(!delegate.collapsed) {
              document.execCommand('delete', false)
            }
            var wrapper = document.createElement('div')
            wrapper.innerHTML = html
            wrapper.firstChild.innerHTML = delegate.closestBlock.innerHTML.replace(/<br\s{0,1}\/?>/, '') + wrapper.firstChild.innerHTML
            delegate.closestBlock.outerHTML = wrapper.innerHTML
            MoreEditor.selection.moveCursor(document, delegate.topBlock.lastChild, delegate.topBlock.lastChild.childNodes.length)
            return
          }
        } else {
          html = MoreEditor.util.htmlEntities(paragraphs[0])
        }
      } 
    

      console.log(html, 'html')
      document.execCommand('insertHTML', false, html)
      return
    }
  }    
  MoreEditor.Paste = Paste;
}());