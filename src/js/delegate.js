/* 
  Delegate 对象存储触发修改 DOM 的函数的参数。 例如用户点击 小标题按钮，程序会调用一个函数将当前用户选中的文字转为
  小标题。这个函数需要的参数：用户选中了哪些文字、当前文字是否可以转化成小标题、小标题按钮是否被禁用，等。 这些参数都
  存储在 Delegate 对象中。
*/


(function() {
  var Delegate = function (instance) {
    this.base = instance;
    this.options = this.base.options;
    this.setAlready = {
      h2: false,
      h3: false,
      bold: false,
      italic: false,
      strikeThrough: false
    }
  };

  Delegate.prototype = {
    range: null,

    crossBlock: false,


    updateStatus: function() {
      console.log('updateStatus')
      var selection = document.getSelection()
      var range

      if(selection.rangeCount>0) {
        range = selection.getRangeAt(0)
      }

      /* 选区存在并且选区在 editableElement 中 */
      if(range && MoreEditor.util.isRangeInsideMoreEditor(this.base.editableElement, range)) {   
        this.range = range
        this.startElement = MoreEditor.selection.getSelectionStart(document)
        this.closestBlock = MoreEditor.util.getClosestBlockContainer(this.startElement)
        this.topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(this.startElement)

        /* 判断选区是否跨越块元素 */
        if(MoreEditor.util.isRangeCrossBlock(range)) {
          this.crossBlock = true
        } else {
          this.crossBlock = false
        }

        /* 判断是否有选中 列表   TODO: 这个地方有待细分 */ 
        if(this.closestBlock.nodeName.toLowerCase() === 'li') {
          this.hasListItem = true
        } else {
          this.hasListItem = false
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
        if(this.startElement.nodeName.toLowerCase() === 'b') {
          this.setAlready.bold = true
        } else {
          this.setAlready.bold = false
        }
        
        /* 判断是否选中斜体 以选区开始处为准 */
        if(this.startElement.nodeName.toLowerCase() === 'i') {
          this.setAlready.italic = true
        } else {
          this.setAlready.italic = false
        }
        

      /* 没有选区或者选区不在 editableElement 内 */
      } else {
        console.log('set defaults')
        this.setDefault()
      }
    },

    setDefault: function() {
      this.range = null
      this.startElement = null
      this.closestBlock = null
      this.topBlock = null
      this.crossBlock = false
      this.h2.setAlready = false
      this.hasListItem = false
      this.setAlready = {
        h2: false,
        h3: false,
        bold: false,
        italic: false,
        strikeThrough: false
      }
    }
  }

  MoreEditor.Delegate = Delegate
}());

