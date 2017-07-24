
/* 
  fileDragging 
*/
(function() {
  var lastTarget = null
  var line = null

  var fileDragging = function(instance) {
    this.base = instance
    this.options = this.base.options
    this.init()
  }

  fileDragging.prototype = {
    init: function() {
      line = document.createElement('div')
      line.classList.add('line')
      this.base.editableElement.addEventListener('dragover', this.handleDrag.bind(this))
      this.base.editableElement.addEventListener('dragenter', this.handleDragEnter.bind(this))
      this.base.editableElement.addEventListener('drop', this.handleDrop.bind(this))
    },

    handleDrag: function(event) {
      event.dataTransfer.dropEffect = 'copy'
      event.preventDefault()
    },

    handleDragEnter: function(event) {
      console.log(event, 'event')
      console.log(event.target, 'event.target')
      var target = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(event.target)
      if(!target) return
      if(lastTarget != target) {
        MoreEditor.util.after(target, line)
        console.log(line)
        lastTarget = target
      }
    },

    handleDrop: function(event) {
      event.preventDefault()
      event.stopPropagation()
      var target = MoreEditor.util.getTopBlockContainer(event.target)
      MoreEditor.selection.selectNode(target, document)
      var savedSelection = MoreEditor.selection.saveSelection(target)
      savedSelection.start = savedSelection.end
      MoreEditor.selection.restoreSelection(target,savedSelection)
      if(event.dataTransfer.files[0].type.match('image')) {
        this.insertImageFile(event.dataTransfer.files[0])
      }
    },

    insertImageFile: function (file) {
      if (typeof FileReader !== 'function') {
          return;
      }
      var fileReader = new FileReader()
      fileReader.readAsDataURL(file)

      fileReader.addEventListener('load', function (e) {
          var addImageElement = document.createElement('img')
          addImageElement.src = e.target.result
          document.execCommand('insertHTML', false, addImageElement.outerHTML);
      }.bind(this))
    }

  }

  MoreEditor.extensions.fileDragging = fileDragging

}())