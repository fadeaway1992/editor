
/* 
  fileDragging 
*/
(function() {
  var line = null
  var imageWrapperHTML = '<figure data-type="more-editor-inserted-image" class="more-editor-inserted-image" contenteditable="false"><li data-type="image-placeholder" class="image-placeholder" contenteditable="true"></li><div class="image-wrapper"></div></figure>'

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
          return
        }
        return
      }
      var target = MoreEditor.util.getTopBlockContainer(event.target)
      if(!target) return

      /* 拖拽到无内容区域的时候在编辑器最后添加 line */
      if (MoreEditor.util.isMoreEditorElement(target)) {
        var bottom = this.base.editableElement.lastChild.getClientRects()[0].bottom
        if (event.clientY < bottom) return
        this.base.editableElement.appendChild(line)
        return
      }

        MoreEditor.util.after(target, line)

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
        
        var fileReader = new FileReader()

        var addImageElement = new Image
        addImageElement.onload = function() {
          console.log('imageload')
            if(this.width<768) {
              this.style.width = this.width +'px'
            } else {
              this.style.width = "768px"
            }
          }

        fileReader.addEventListener('load', function (e) {
          addImageElement.classList.add('insert-image')
          addImageElement.src = e.target.result
          console.log('image 设置src')
          var imageParent = imageWrapper.querySelector('.image-wrapper')
          imageParent.appendChild(addImageElement)
          if(line.parentNode) {
            MoreEditor.util.after(line, imageWrapper)
            MoreEditor.util.unwrap(imageWrapper, document)
            line.parentNode.removeChild(line)
          }
        }.bind(this))

        fileReader.readAsDataURL(file)
        this.options.imageUpload(file, function(result) {
          addImageElement.src = result
        }.bind(this))
      }
    },

    sizeAlert: function() {
      var sizeAlert = document.querySelector(this.base.options.sizeAlert)
      sizeAlert.style.display = "block"
    }

  }

  MoreEditor.extensions.fileDragging = fileDragging

}())