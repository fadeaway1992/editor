
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
      this.base.on(document, 'dragover',function(event) {
        event.preventDefault()
      }.bind(this))
      this.base.on(document, 'drop', function(event) {
        event.preventDefault()
      }.bind(this))
      this.base.on(this.base.editableElement, 'dragover', this.handleDrag.bind(this))
      this.base.on(document, 'dragenter', this.handleDragEnter.bind(this))
      this.base.on(this.base.editableElement, 'drop', this.handleDrop.bind(this)) 
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
          line.remove()
          return
        }
        
        var imageWrapper = document.createElement('div')
        imageWrapper.innerHTML = imageWrapperHTML
        
        var fileReader = new FileReader()

        var addImageElement = new Image
        addImageElement.classList.add('insert-image')

        var imageParent = imageWrapper.querySelector('.image-wrapper')
        var theFigure = imageWrapper.firstChild
        imageParent.appendChild(addImageElement)
        imageParent.appendChild(this.base.loadingImg)
        this.base.loadingImg.style.display = 'block'
        if(line.parentNode) {
          MoreEditor.util.after(line, imageWrapper)
          MoreEditor.util.unwrap(imageWrapper, document)
          line.parentNode.removeChild(line)
        }

        /* 根据是否需要将图片上传到服务器分为两种情况 */
        if(this.options.shouldImageUpload) {
          addImageElement.onload = function() {
            if(addImageElement.src.indexOf('http') !== -1) {
              addImageElement.style.opacity = 1
              addImageElement.setAttribute('realwidth', addImageElement.width)
              addImageElement.setAttribute('realheight', addImageElement.width)
              if(addImageElement.getAttribute('realwidth') == 0 || addImageElement.getAttribute('realheight') == 0) {
                this.base.loadingImg.style.display = 'none'
                document.body.appendChild(this.base.loadingImg)
                theFigure.remove()
                alert("图片上传失败，请再试一次！")
                return
              }
              this.base.loadingImg.style.display = 'none'
              document.body.appendChild(this.base.loadingImg)
              this.base.saveScene()  // 设立撤销点
            } else {
              addImageElement.style.opacity = 0.6
            }
          }.bind(this)
        } else {
          addImageElement.onload = function() {
            this.base.loadingImg.style.display = 'none'
            document.body.appendChild(this.base.loadingImg)
            this.base.saveScene() // 设立撤销栈
          }.bind(this)
        }

        fileReader.addEventListener('load', function (e) {
          addImageElement.src = e.target.result

          if(this.options.shouldImageUpload) {
            this.options.imageUpload(
              file,
  
              function(result) {
                addImageElement.src = result
              }.bind(this),
  
              function() {
                this.base.loadingImg.style.display = "none"
                document.body.appendChild(this.base.loadingImg)
                theFigure.remove()
                alert('图片上传失败，请再试一次！')
              }.bind(this)
            )
          }
        }.bind(this))

        fileReader.readAsDataURL(file)
      } else {
        if(line) {
          line.remove()
        }
        alert('拖拽失败，只能拖拽图片，请检查文件格式。')
      }
    },

    sizeAlert: function() {
      if(this.base.sizeAlert === 'default') {
        alert('上传的图片大小不能超过 10Mb')
      } else {
        this.base.sizeAlert.style.display = "block"
      }
    }

  }

  MoreEditor.fileDragging = fileDragging

}());