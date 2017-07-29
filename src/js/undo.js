(function () {
  'use strict';

  /* 构造函数 */
  var UndoManager = function (instance) {
    this.base = instance
    this.options = this.base.options
    this.init()
  };

  /* 原型 */
  UndoManager.prototype = {

    init: function() {
      this.stack = []
      this.curIndex = 0
      this.hasUndo = false
      this.hasRedo = false
      this.timer = 0
      this.maxUndo = 20
      this.inputing = false
      this.bindEvents()
    },

    bindEvents: function() {
      this.base.on(this.base.editableElement, 'keydown', this.CommandListener.bind(this))
    },

    CommandListener: function(event) {
      if(MoreEditor.util.isMetaCtrlKey(event) && !event.altKey && !event.shiftKey) {
        if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.Z)) {
          this.undo()
          event.preventDefault()
          return
        }
        if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.Y)) {
          event.preventDefault()
          this.redo()
          return
        }
      }
      if(MoreEditor.util.isMetaCtrlKey(event) && !event.altKey && event.shiftKey && MoreEditor.util.isKey(event, MoreEditor.util.keyCode.Z)) {
        event.preventDefault()
        this.redo()
        return
      }
    },

    undo: function() {
      console.log('撤销')
    },

    redo: function() {
      console.log('重做')
    }
    
  }
  MoreEditor.UndoManager = UndoManager;
}());