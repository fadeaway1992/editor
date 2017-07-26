
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

        /* 判断图片大小是否超限 */
        var maxFileSize = 10 * 1024 * 1024
        if(file.size > maxFileSize) {
          this.sizeAlert()
          line.parentNode.removeChild(line)
          return
        }
        
        var imageWrapper = document.createElement('div')
        imageWrapper.innerHTML = imageWrapperHTML
        console.log(imageWrapper, 'imageWrapper in filedragging')
        
        var fileReader = new FileReader()
        

        fileReader.addEventListener('load', function (e) {
          var addImageElement = new Image
          addImageElement.onload = function() {
            if(this.width<768) {
              this.style.width = this.width +'px'
            } else {
              this.style.width = "768px"
            }
          }
          addImageElement.classList.add('insert-image')
          addImageElement.src = e.target.result
          var imagePlaceHolder = imageWrapper.querySelector('li')
          console.log(imagePlaceHolder, 'imagePlaceholder in filedragging')
          MoreEditor.util.after(imagePlaceHolder, addImageElement)
          if(line.parentNode) {
            MoreEditor.util.after(line, imageWrapper)
            MoreEditor.util.unwrap(imageWrapper, document)
            line.parentNode.removeChild(line)
          }
        }.bind(this))
        
        fileReader.readAsDataURL(file)
      }
    },

    sizeAlert: function() {
      var sizeAlert = document.querySelector(this.base.options.sizeAlert)
      sizeAlert.style.display = "block"
    }

  }

  MoreEditor.extensions.fileDragging = fileDragging

}())