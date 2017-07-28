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
        跨块元素、光标在图片中的情况下不能粘贴
      */
      if(!delegate.range || delegate.crossBlock || delegate.closestBlock.getAttribute('data-type') === 'image-placeholder') return

      /* 粘贴时要匹配当前的标签，可以是 p, h, li, figcaption */
      this.pasteTag = delegate.closestBlock.nodeName.toLowerCase()

      var clipboardContent = getClipboardContent(event, window, document)
      var pastedHTML = clipboardContent['text/html']
      var pastedPlain = clipboardContent['text/plain']

      if (pastedHTML || pastedPlain) {
        this.doPaste.call(this, pastedPlain)
      }
      return
    },

    doPaste: function(pastedPlain) {
      var paragraphs
      var html = ''

      //  如果是在 figcaption 或者 li 中粘贴，直接粘贴没有换行符的纯文本 
      if(this.pasteTag === 'figcaption' || this.pasteTag === 'li') {
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