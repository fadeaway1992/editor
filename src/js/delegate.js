/* 
  Delegate 对象存储触发修改 DOM 的函数的参数。 例如用户点击 小标题按钮，程序会调用一个函数将当前用户选中的文字转为
  小标题。这个函数需要的参数：用户选中了哪些文字、当前文字是否可以转化成小标题、小标题按钮是否被禁用，等。 这些参数都
  存储在 Delegate 对象中。
*/


(function() {
  var Delegate = function (instance) {
    this.base = instance;
    this.options = this.base.options;
  };

  Delegate.prototype = {
    range: null,

    crossBlock: false,


    h2: {
      setAlready: false
    },


    updateStatus: function() {
      console.log('updateStatus')
      var range = document.getSelection().getRangeAt(0)
      if(range && MoreEditor.util.isDescendant(this.base.editableElement, range.startContainer, false) && MoreEditor.util.isDescendant(this.base.editableElement, range.endContainer, false)) {
        this.range = range
        if(MoreEditor.util.getClosestBlockContainer(range.startContainer) !== MoreEditor.util.getClosestBlockContainer(range.endContainer)) {
          this.crossBlock = true
        } else {
          this.crossBlock = false
        }
      } else {   // 没有选区或者选区不在 editableElement 内
        this.setDefault()
      }

      console.log(this.range, 'range', this.crossBlock, 'crossBlock')
    },

    setDefault: function() {
      this.range = null
      this.crossBlock = false
      this.h2.setAlready = false
    }
  }

  MoreEditor.Delegate = Delegate
}());

