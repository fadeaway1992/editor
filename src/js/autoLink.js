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
    regExpURL:  /(http:\/\/|https:\/\/|ftp:\/\/)((\w|=|\?|\.|\/|&|-|;|:|@|\+|\$|,|!|~|\*|'|\(|\)|#|%|")+)/g,

    init: function() {
      this.base.on(this.base.editableElement, 'keydown', this.handleKeydown.bind(this))
    },

    handleKeydown: function(event) {
      if(MoreEditor.util.isKey(event, [MoreEditor.util.keyCode.SPACE, MoreEditor.util.keyCode.ENTER])) {
        this.checkLinks()
      }
    },

    checkLinks: function() {
      var allTextNodes = this.getAlltextNodes(this.base.editableElement)
      console.log(allTextNodes, 'allTextNodes')
      var result
      allTextNodes.forEach(function(node) {
        var isInAnchor = MoreEditor.util.traverseUp(node, function(current) {
          return current.nodeName.toLowerCase() === 'a'
        })
        if(isInAnchor) return
        result = node.data.match(this.regExpURL)
        if(!result) return
          
        result.forEach(function(url){
          var savedSelection = MoreEditor.selection.saveSelection(this.base.editableElement)
          var startOffset = node.data.indexOf(url)
          var endOffset = startOffset + url.length
          MoreEditor.selection.select(document, node, startOffset, node, endOffset)
          document.execCommand('createLink', false, url)
          MoreEditor.selection.restoreSelection(this.base.editableElement, savedSelection)
        }.bind(this))
        console.log(result)

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