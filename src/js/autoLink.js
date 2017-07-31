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

    init: function() {
      this.base.on(this.base.editableElement, 'keydown', this.handleKeydown.bind(this))
    },

    handleKeydown: function(event) {
      if(MoreEditor.util.isKey(event, [MoreEditor.util.keyCode.SPACE, MoreEditor.util.keyCode.ENTER])) {
        this.checkLinks()
      }
    },

    checkLinks: function() {
      
    }
  }    
  MoreEditor.autoLink = autoLink;
}());