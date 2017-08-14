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

      /* 设立第一个空的撤销栈 */
      this.base.editableElement.focus()
      this.save()
    },

    bindEvents: function() {
      this.base.saveScene = this.save.bind(this)
      this.base.on(this.base.editableElement, 'keydown', this.CommandListener.bind(this))
      this.base.on(this.base.editableElement, 'keydown', this.saveAfterInput.bind(this))
      this.base.on(this.base.editableElement, 'compositionstart', this)
      this.base.on(this.base.editableElement, 'compositionend', this)
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
      if(this.hasUndo) {
        this.index = this.index - 1
        this.restore()
      }
    },

    redo: function() {
      console.log('重做')
      if(this.hasRedo) {
        this.index = this.index + 1
        this.restore()
      }
    },

    saveAfterInput: function(event) {
      var keyCode = MoreEditor.util.getKeyCode(event)
      if ([16,17,18,37,38,39,40].indexOf(keyCode)==-1 && !MoreEditor.util.isMetaCtrlKey(event) && !event.shiftKey && !event.altKey) {
        clearTimeout(this.timer)
        if(this.inputing) return
        this.timer = setTimeout(function() {
          this.save()
        }.bind(this), 300)
      }
    },

    save: function() {

      /* 排除几种不可保存的情况 */
      if(this.base.editableElement.querySelector('[data-type=image-options]') || this.base.editableElement.querySelector('[data-type=loading]')) {
        console.log('防止存入撤销栈')
        return
      }

      var curScene = this.getContent()
      var lastScene
      if(this.stack[this.index]) {
        lastScene = this.stack[this.index].scene
      }
      if(curScene === lastScene) return
      this.stack = this.stack.slice(0, this.index + 1)
      this.stack.push({scene: curScene, selection: MoreEditor.selection.saveSelectionPrecise(this.base.editableElement)})
      if(this.stack.length > this.maxUndo) this.stack.shift()  // Array.prototype.shift      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
      this.index = this.stack.length -1
      this.update()
      console.log('设立撤销站')
    },

    update: function() {
      this.hasRedo = !!this.stack[this.index + 1]
      this.hasUndo = !!this.stack[this.index - 1]
    },

    restore: function() {
      var item = this.stack[this.index]
      var scene = item.scene
      var selection = item.selection

      this.setContent(scene)
      MoreEditor.selection.restoreSelectionPrecise(this.base.editableElement, selection)
      this.update()
      updateButtonStatus.call(this.base)
    },

    getContent: function() {
      return this.base.editableElement.innerHTML.trim()
    },

    setContent: function(html) {
      this.base.editableElement.innerHTML = html
    },

    handleEvent: function(event) {
      switch(event.type) {
        case 'compositionstart':
          this.inputing = true
          break
        case 'compositionend':
          this.inputing = false
          this.save()
          break
        default:
          console.log('出错了')
          break
      }
    }
    
  }
  MoreEditor.UndoManager = UndoManager;
}());