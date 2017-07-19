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
      
      var list = this.createList()
      console.log(list, '这里应该是创建列表时返回的列表')

      // 执行了取消列表，不再继续
      if(list === 'stop') return


      // 给 ul 加上 blockquote 类
      list.classList.add('blockquote')
      list.setAttribute('data-type', 'blockquote')

    },


    /* 创建无需列表 */
    ul: function() {
      this.createList()
    },


    /* 创建顺序列表 */
    ol: function() {
      this.createList(true)
    },


    /*  
    **  创建列表 
    **  接收一个 ordered 参数,参数为 true 创建顺序列表，否则创建无序列表 
    */
    createList: function(ordered) {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      console.log(this.base.delegate, 'delegate')

      /* 如果选区中有列表就取消整个列表 */
      if(delegate.hasListItem === true) {
        this.unWrapWholeList()
        return 'stop'
      }

      if (delegate.crossBlock || !delegate.range || delegate.closestBlock.nodeName.toLowerCase() !== 'p') return 'stop'
      
      if(ordered) {
        document.execCommand('insertOrderedList',false)
      } else {
        document.execCommand('insertUnorderedList',false)
      }
      
      // 扒掉原来的标签
      var node = MoreEditor.selection.getSelectionStart(document)
      var topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)

      if(topBlock.nodeName.toLowerCase() !== 'ul' && topBlock.nodeName.toLowerCase() !== 'ol') {
        MoreEditor.util.unwrap(topBlock,document)
        topBlock =  MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)
      }

      if(topBlock.nodeName.toLowerCase() !== 'ol' && topBlock.nodeName.toLowerCase() !== 'ul') {
          console.error('创建标签的过程中出现错误')
      }

      console.log(topBlock.querySelector('li').textContent, 'textContent')
      if(topBlock.querySelector('li').textContent !== '') {
        topBlock.querySelector('li').innerHTML = topBlock.querySelector('li').innerHTML.replace(/<br>/g, '')
      }
      
      console.log(topBlock.querySelector('li').innerHTML, 'li innerHTML')
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

    }
  }

  MoreEditor.API = API
}());