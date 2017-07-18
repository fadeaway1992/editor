(function() {
  var API = function (instance) {
    this.base = instance;
    this.options = this.base.options;
  };

  API.prototype = {

    /* 增加大标题 */
    h2: function() {
      this.base.delegate.updateStatus()
      if (this.base.delegate.crossBlock || !this.base.delegate.range || this.base.delegate.range.collapsed) return
      MoreEditor.util.execFormatBlock(document, 'h2')
    },

    /* 添加小标题 */
    h3: function() {
      this.base.delegate.updateStatus()
      if (this.base.delegate.crossBlock || !this.base.delegate.range || this.base.delegate.range.collapsed) return
      MoreEditor.util.execFormatBlock(document, 'h3')
    },

    /* 创建引用列表 */
    quote: function() {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate

      /* 如果选区中有列表就取消整个列表 */
      if(delegate.hasListItem === true) {
        this.unWrapWholeList()
        return
      }

      if (delegate.crossBlock || !delegate.range || delegate.closestBlock.nodeName.toLowerCase() !== 'p') return
      document.execCommand('insertUnorderedList',false)

      // 扒掉原来的标签
      var node = MoreEditor.selection.getSelectionStart(document)
      var topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)
      MoreEditor.util.unwrap(topBlock,document)

      // 给 ul 加上 blockquote 类
      topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)
      topBlock.classList.add('blockquote')
      topBlock.setAttribute('data-type', 'blockquote')
    },

    /* 创建无需列表 */
    ul: function() {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate

      /* 如果选区中有列表就取消整个列表 */
      if(delegate.hasListItem === true) {
        this.unWrapWholeList()
        return
      }

      if (delegate.crossBlock || !delegate.range || delegate.closestBlock.nodeName.toLowerCase() !== 'p') return
      document.execCommand('insertUnorderedList',false)

      // 扒掉原来的标签
      var node = MoreEditor.selection.getSelectionStart(document)
      var topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)
      MoreEditor.util.unwrap(topBlock,document)
    },

    /* 创建有序列表 */
    ol: function() {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate

      /* 如果选区中有列表就取消整个列表 */
      if(delegate.hasListItem === true) {
        this.unWrapWholeList()
        return
      }

      if (delegate.crossBlock || !delegate.range || delegate.closestBlock.nodeName.toLowerCase() !== 'p') return
      document.execCommand('insertOrderedList',false)

      // 扒掉原来的标签
      var node = MoreEditor.selection.getSelectionStart(document)
      var topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)
      MoreEditor.util.unwrap(topBlock,document)
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

    }
  }

  MoreEditor.API = API
}());