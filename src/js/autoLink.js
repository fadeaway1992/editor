(function () {
  'use strict';

  /* 构造函数 */
  var autoLink = function (instance) {
    this.base = instance;
    this.options = this.base.options;
    this.init()
  };


  /* 原型 */
  autoLink.prototype = {

    /* 用于匹配链接地址的正则表达式 */
    regExpURL:  /(http:\/\/|https:\/\/|ftp:\/\/)((\w|=|\?|\.|\/|&|-|;|:|@|\+|\$|,|!|~|\*|'|\(|\)|#|%|")+)/g, // 这个正则有待完善

    init: function() {
      this.base.on(this.base.editableElement, 'keydown', this.handleKeydown.bind(this))
    },

    handleKeydown: function(event) {
      if(MoreEditor.util.isKey(event, [MoreEditor.util.keyCode.SPACE, MoreEditor.util.keyCode.ENTER])) {
        this.checkLinks(event)
      }
    },

    /* 
      每次按下空格和回车的时候遍历整个编辑器中的所有文本节点，将其放入一个数组。
      遍历数组中的每一个文本节点，如果是 a 标签的子元素，跳过。如果不是 a 标签的子元素，检查文本内容中是否有可以匹配 对应正则表达式 的字符串
      如果有，（也许一个文本节点中有多个字符串可以匹配）,对匹配结果进行遍历，分别选中它们，生成链接。
    */
    checkLinks: function(event) {
      var allTextNodes = this.getAlltextNodes(this.base.editableElement)
      var result
      allTextNodes.forEach(function(node) {
        var isInAnchor = MoreEditor.util.traverseUp(node, function(current) {
          return current.nodeName.toLowerCase() === 'a'
        })
        if(isInAnchor) return
        result = node.data.match(this.regExpURL)
        if(!result) return
        
        /* 阻止其他侦听器与默认事件，是否使用有待讨论 */
        event.stopImmediatePropagation()
        event.preventDefault()

        result.forEach(function(url){
          var savedSelection = MoreEditor.selection.saveSelection(this.base.editableElement)
          var startOffset = node.data.indexOf(url)
          var endOffset = startOffset + url.length
          MoreEditor.selection.select(document, node, startOffset, node, endOffset)
          document.execCommand('createLink', false, url)
          MoreEditor.selection.restoreSelection(this.base.editableElement, savedSelection)
        }.bind(this))

      }.bind(this))
    },

    /* 获取某个元素下所有的文本节点 */
    getAlltextNodes: function(el){
      var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
      while(n=walk.nextNode()) a.push(n)
      return a
    }
  }    
  MoreEditor.autoLink = autoLink;
}());