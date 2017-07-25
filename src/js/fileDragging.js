
/* 
  fileDragging 
*/
(function() {
  var lastTarget = null
  var line = null
  var imageWrapperHTML = '<div data-type="more-editor-inserted-image" class="more-editor-inserted-image" contenteditable="false"><li data-type="image-placeholder" class="image-placeholder" contenteditable="true"></li></div>'

  var fileDragging = function(instance) {
    this.base = instance
    this.options = this.base.options
    this.init()
  }

  fileDragging.prototype = {
    init: function() {
      line = document.createElement('div')
      line.classList.add('line')
      document.addEventListener('dragover',function(event) {
        event.preventDefault()
      }.bind(this))
      document.addEventListener('drop', function(event) {
        event.preventDefault()
      }.bind(this))
      this.base.editableElement.addEventListener('dragover', this.handleDrag.bind(this))
      document.addEventListener('dragenter', this.handleDragEnter.bind(this))
      this.base.editableElement.addEventListener('drop', this.handleDrop.bind(this))
    },

    handleDrag: function(event) {
      event.dataTransfer.dropEffect = 'copy'
      event.preventDefault()
    },

    handleDragEnter: function(event) {
      if(!MoreEditor.util.isDescendant(this.base.editableElement, event.target, true)) {
        if(line.parentNode) {
          line.parentNode.removeChild(line)
        }
      }
      var target = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(event.target)
      if(!target) return
      if(lastTarget != target) {
        MoreEditor.util.after(target, line)
        lastTarget = target
      }
    },

    handleDrop: function(event) {
      
      event.preventDefault()
      event.stopPropagation()
      
      if(event.dataTransfer.files[0].type.match('image')) {
        var file = event.dataTransfer.files[0]
        var fileReader = new FileReader()
        fileReader.readAsDataURL(file)
        fileReader.addEventListener('load', function (e) {
          var addImageElement = document.createElement('img')
          addImageElement.classList.add('insert-image')
          addImageElement.src = e.target.result
          var imageWrapper = document.createElement('div')
          imageWrapper.innerHTML = imageWrapperHTML
          var imagePlaceHolder = imageWrapper.querySelector('li')
          MoreEditor.util.after(imagePlaceHolder, addImageElement)
          MoreEditor.util.after(line, imageWrapper)
          MoreEditor.util.unwrap(imageWrapper, document)
          line.parentNode.removeChild(line)
        }.bind(this))
      }
    }

  }

  MoreEditor.extensions.fileDragging = fileDragging

}())