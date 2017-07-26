/* eslint-disable no-undef */

/* MoreEditor 的原型属性和原型方法 */

/* 
    定义在 MoreEditor 中按下 BACKSPACE 或者 ENTER 时的行为
*/
function handleBackAndEnterKeydown(event) {
    var range = document.getSelection().getRangeAt(0)
    var node = MoreEditor.selection.getSelectionStart(this.options.ownerDocument)
    var topBlockContainer = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)
    var cloestBlockContainer = MoreEditor.util.getClosestBlockContainer(node)
    
    if(!range) {
        return
    }

    /* 按下的是 enter 或者 backspace */
    if(MoreEditor.util.isKey(event, [MoreEditor.util.keyCode.BACKSPACE, MoreEditor.util.keyCode.ENTER])) {
        console.log('按下了 back 或者 enter 键')

        /* 处理在 chrome 中有时无法获取正确 range 的错误 */
        if(node === this.editableElement) {
            console.log('获取 range 不正确')
            return
        }

        if(range.collapsed===true) {  // 只有光标没有选区

            /* 如果是在列表元素中 */
            if(cloestBlockContainer.nodeName.toLowerCase() === 'li') {

                /* 选中了图片 */
                if(cloestBlockContainer.getAttribute('data-type') === 'image-placeholder') {
                    
                    /* 选中图片按下 enter 键 */
                    if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.ENTER)) {

                        /* 图片是编辑器中的第一个元素，在选中图片等时候按下了 enter 键 */
                        if(!topBlockContainer.previousElementSibling && topBlockContainer.nextElementSibling) {
                            
                            /* 在前面新增一行 */
                            var newLine = document.createElement('p')
                            newLine.innerHTML = '<br>'
                            topBlockContainer.parentNode.insertBefore(newLine, topBlockContainer)
                            MoreEditor.selection.moveCursor(document, newLine, 0)

                        } else {

                            /* 图片不是编辑器中的第一个元素，按下 enter 键在图片后面新增一行 */
                            var newLine = document.createElement('p')
                            newLine.innerHTML = '<br>'
                            MoreEditor.util.after(topBlockContainer,newLine)
                            MoreEditor.selection.moveCursor(document, newLine, 0)

                        }

                        event.preventDefault()
                        return
                    }

                    /* 选中图片按下 backspace 键 */
                    if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.BACKSPACE)) {

                        /* 把图片换成 p */
                        var newLine = document.createElement('p')
                        newLine.innerHTML = '<br>'
                        topBlockContainer.parentNode.replaceChild(newLine, topBlockContainer)
                        MoreEditor.selection.moveCursor(document, newLine, 0)
                        event.preventDefault()
                        return

                    }
                }

                /* 空列表中按下 enter */
                if(!cloestBlockContainer.textContent && MoreEditor.util.isKey(event, MoreEditor.util.keyCode.ENTER)) {

                    /* 最后 或者唯一一个空列表 按下 enter */
                    if(!cloestBlockContainer.nextElementSibling) {
                        console.log('下一个不存在')
                        var newLine = document.createElement('p')
                        newLine.innerHTML = '<br>'
                        if(topBlockContainer.nextElementSibling) {
                            topBlockContainer.parentNode.insertBefore(newLine,topBlockContainer.nextElementSibling)
                        } else {
                            topBlockContainer.parentNode.appendChild(newLine)
                        }
                        MoreEditor.selection.moveCursor(document,newLine,0)
                        topBlockContainer.removeChild(cloestBlockContainer)
                        if(!topBlockContainer.hasChildNodes()) {
                            console.log(topBlockContainer, 'topBlockContainer')
                            topBlockContainer.parentNode.removeChild(topBlockContainer)
                        }
                        event.preventDefault()
                        return
                    }
                    
                    /* 中间的或者第一个空列表，按下回车拓展新行 */
                    var newLi = document.createElement('li')
                    newLi.innerHTML = '<br>'
                    cloestBlockContainer.parentNode.insertBefore(newLi, cloestBlockContainer)
                    event.preventDefault()
                    return
                }

                /* 第一个列表 或者 唯一一个列表 光标在最前 按下 backspace */
                if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.BACKSPACE) && !cloestBlockContainer.previousElementSibling && MoreEditor.util.isElementAtBeginningOfBlock(node) && MoreEditor.selection.getCaretOffsets(node).left === 0) {
                    var newLine = document.createElement('p')
                    newLine.innerHTML = cloestBlockContainer.innerHTML
                    topBlockContainer.parentNode.insertBefore(newLine,topBlockContainer)
                    MoreEditor.selection.moveCursor(document,newLine,0)
                    topBlockContainer.removeChild(cloestBlockContainer)

                    /* 判断原列表是否还有内容 */
                    if(!topBlockContainer.hasChildNodes()) {
                        topBlockContainer.parentNode.removeChild(topBlockContainer)
                    }

                    event.preventDefault()
                    return
                }
                return
            }

            /*  在当前块元素的最后一个字符按下 enter 键  非列表元素中 */
            if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.ENTER) && MoreEditor.util.isElementAtEndofBlock(node) && MoreEditor.selection.getCaretOffsets(node).right === 0 ) {

                var newLine = document.createElement('p')
                newLine.innerHTML = '<br>'
                if(topBlockContainer.nextElementSibling) {
                    topBlockContainer.parentNode.insertBefore(newLine, topBlockContainer.nextElementSibling)
                    console.log('插入新行')
                } else {
                    topBlockContainer.parentNode.appendChild(newLine)
                    console.log('插入新行')
                }
                if(topBlockContainer.classList.contains('text-center')){
                    newLine.classList.add('text-center')
                }
                MoreEditor.selection.moveCursor(document, newLine, 0)
                event.preventDefault()
                return
            }

            /*  在当前块元素的第一个字符按下 backspace 键 */
            if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.BACKSPACE) && MoreEditor.util.isElementAtBeginningOfBlock(node) && MoreEditor.selection.getCaretOffsets(node).left === 0 ) {

            }

        } else {
            console.log('有选区')
            var endNode = MoreEditor.selection.getSelectionEnd(this.options.ownerDocument)
            if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.ENTER) && MoreEditor.util.isElementAtEndofBlock(endNode) && MoreEditor.selection.getCaretOffsets(endNode).right === 0) {
                console.log('删除并换行')
                document.execCommand('delete', false)
                
                /* 如果选区开始是在列表中 并且删除后列表项内容不为空，我们让浏览器默认处理回车。否则我们自己再执行一次这个函数，把当前事件传进去，也就是手动处理回车。*/
                if(cloestBlockContainer.nodeName.toLowerCase() === 'li' && !(MoreEditor.util.isElementAtBeginningOfBlock(node) && MoreEditor.selection.getCaretOffsets(node).left === 0)) return

                handleBackAndEnterKeydown.call(this, event)
                event.preventDefault()
                return
            }
        }
    } else {
        return
    }
}


/* 不能删没了，至少保留一个 p 标签 */
function keepAtleastOneParagraph(event) {
    if(!this.editableElement.hasChildNodes()) {
        console.log('删没了')
        var newLine = document.createElement('p')
        newLine.innerHTML = '<br>'
        this.editableElement.appendChild(newLine)
        MoreEditor.selection.moveCursor(document, newLine, 0)
        event.preventDefault()
        return
    }

}



/* 
    每次 keydown 检查光标位置是否距离窗口底部距离太近，适当滚动文档，保持光标在窗口中。
*/

function checkCaretPosition (event) {
    var node = MoreEditor.selection.getSelectionStart(this.options.ownerDocument)  

    if (!node || event.keyCode !==13 && event.keyCode !== 40) {
        return;
    }

    var selection = this.options.ownerDocument.getSelection()  
    if(selection.rangeCount>0) {                               
        var range = selection.getRangeAt(0)                    
        var rects = range.getClientRects()                       // 获取选区／光标 clientRect 对象  对于光标换行，如果是从文本中间断句换行，可以获取到 rect 对象，如果是在文本末尾另起一行，这样是获取不到 rect 对象的。
        var clineHeight = document.documentElement.clientHeight  // 获取当前客户端窗口高度
        if(rects[0]) {
            var bottom = clineHeight - rects[0].bottom           // 获取光标距离窗口底部的高度
            if(bottom < 50) {
                var scrollTop = this.options.ownerDocument.documentElement.scrollTop || this.options.ownerDocument.body.scrollTop  // 文档获取向上滚动的距离
                this.options.ownerDocument.documentElement.scrollTop = scrollTop + rects[0].height    
                this.options.ownerDocument.body.scrollTop = scrollTop + rects[0].height
            }                                                                                  // 这一段是讲如果当前光标距离窗口底部很近了（<50），就将文档向上滚动一个光标的距离。
        } else if (event.keyCode == 13) {    // 当前按下的键是 enter， 但是却没有获取到光标的 rect 对象。有些场景下无法获取到光标的 rect 对象，这时我们使用光标所在节点的父元素的 rect 对象。
            var parentNode = MoreEditor.util.getClosestBlockContainer(node)  
            if(!parentNode)return
            var rect = parentNode.getBoundingClientRect()
            var bottom = clineHeight - rect.bottom
            if(bottom < 50) {
                var scrollTop = this.options.ownerDocument.documentElement.scrollTop || this.options.ownerDocument.body.scrollTop
                var height = rect.height + parseInt(getComputedStyle(parentNode).marginTop) + parseInt(getComputedStyle(parentNode).marginBottom)
                this.options.ownerDocument.documentElement.scrollTop = scrollTop + height
                this.options.ownerDocument.body.scrollTop = scrollTop + height    
            }
        }
    }
}

function handleKeydown(event) {
    handleBackAndEnterKeydown.call(this, event)
    checkCaretPosition.call(this, event)
}

function handleKeyup(event) {
    keepAtleastOneParagraph.call(this, event)
    updateButtonStatus.call(this)
    checkoutIfFocusedImage.call(this)
}

/* 
    每次 keyup, mouseup 以及编辑器 blur 时都会执行下面的函数检测当前选区的变化，相应的调整哪些按钮可用，哪些按钮不可用。
*/
function updateButtonStatus() {
    this.delegate.updateStatus()
    var available = this.delegate.available

    if(available.h) {
      this.buttons.h3.removeAttribute('disabled')
      this.buttons.h2.removeAttribute('disabled')
    } else {
      this.buttons.h2.setAttribute('disabled', 'disabled')
      this.buttons.h3.setAttribute('disabled', 'disabled')
    }

    if(available.decorate) {
      this.buttons.bold.removeAttribute('disabled')
      this.buttons.italic.removeAttribute('disabled')
      this.buttons.strike.removeAttribute('disabled')
    } else {
      this.buttons.bold.setAttribute('disabled', 'disabled')
      this.buttons.italic.setAttribute('disabled', 'disabled')
      this.buttons.strike.setAttribute('disabled', 'disabled')
    }

    if(available.list) {
      this.buttons.ul.removeAttribute('disabled')
      this.buttons.ol.removeAttribute('disabled')
    } else {
      this.buttons.ul.setAttribute('disabled', 'disabled')
      this.buttons.ol.setAttribute('disabled', 'disabled')
    }

    if(available.quote) {
      this.buttons.quote.removeAttribute('disabled')
    } else {
      this.buttons.quote.setAttribute('disabled', 'disabled')
    }

    if(available.center) {
      this.buttons.center.removeAttribute('disabled')
    } else {
      this.buttons.center.setAttribute('disabled', 'disabled')
    }

    if(available.image) {
      this.buttons.imageButton.removeAttribute('disabled')
    } else {
      this.buttons.imageButton.setAttribute('disabled', 'disabled')  
    }
}

function handleClick(event) {
    checkIfClickedAnImage.call(this,event)
}

function checkIfClickedAnImage(event) {
    if(event.target.nodeName.toLowerCase() === 'img') {
        var clickedImage = event.target
        if(clickedImage.previousElementSibling.getAttribute('data-type') === 'image-placeholder') {
            var imageHolder = clickedImage.previousElementSibling
            MoreEditor.selection.select(document,imageHolder, 0)
            checkoutIfFocusedImage.call(this)
            return
        }
    } else {
        checkoutIfFocusedImage.call(this)
    }
}

function checkoutIfFocusedImage() {
    var selection = document.getSelection()
    var range
    if(selection.rangeCount>0) {
        range = selection.getRangeAt(0)
    }
    if(MoreEditor.util.getClosestBlockContainer(range.startContainer).getAttribute('data-type') === 'image-placeholder') {
        console.log('我进去了图片中')
        var images = document.querySelectorAll('.insert-image')
        if(images) {
            for(var i=0; i<images.length; i++) {
                images[i].classList.remove('insert-image-active')
            }
        }
        var topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(range.startContainer)
        topBlock.querySelector('.insert-image').classList.add('insert-image-active')
    } else {
        var images = document.querySelectorAll('.insert-image')
        if(images) {
            for(var i=0; i<images.length; i++) {
                images[i].classList.remove('insert-image-active')
            }
        }
    }
}


/* MoreEditor 实例初始化时增添的一些属性 */
var initialOptions = {
    contentWindow: window,
    ownerDocument: document,
    imageUploadAddress: null,
}

function initExtensions() {
    this.extensions = {}
    this.extensions.fileDragging = new MoreEditor.extensions.fileDragging(this)
}

function attachHandlers() {
    this.on(this.editableElement, 'keydown', handleKeydown.bind(this))
    this.on(document.body, 'keyup', handleKeyup.bind(this))
    this.on(document.body, 'mouseup', updateButtonStatus.bind(this))
    this.on(this.editableElement, 'blur', updateButtonStatus.bind(this))
    this.on(this.editableElement, 'click', handleClick.bind(this))
}


MoreEditor.prototype = {
    init: function(element, options) {
        console.log('初始化编辑器')
        this.origElement = element
        this.options = MoreEditor.util.defaults({}, options, initialOptions)
        this.initElement(element)
        this.setup()
    },

    initElement: function(element) {
        var editableElement = document.querySelector(element)
        this.editableElement = editableElement
        if(!editableElement.getAttribute('contentEditable')) {
            editableElement.setAttribute('contentEditable', true)
        }
        editableElement.setAttribute('data-more-editor-element', true)
        editableElement.classList.add('more-editor-element')
        editableElement.innerHTML = '<p><br></p>'
    },

    activateButtons: function() {
        this.buttons = {}
        this.buttons.h2 = document.querySelector(this.options.buttons.h2)
        this.buttons.h3 = document.querySelector(this.options.buttons.h3)
        this.buttons.ul = document.querySelector(this.options.buttons.ul)
        this.buttons.ol = document.querySelector(this.options.buttons.ol)
        this.buttons.quote = document.querySelector(this.options.buttons.quote)
        this.buttons.bold = document.querySelector(this.options.buttons.bold)
        this.buttons.italic = document.querySelector(this.options.buttons.italic)
        this.buttons.strike = document.querySelector(this.options.buttons.strike)
        this.buttons.url = document.querySelector(this.options.buttons.url)
        this.buttons.link = document.querySelector(this.options.buttons.link)
        this.buttons.center = document.querySelector(this.options.buttons.center)
        this.buttons.imageInput = document.querySelector(this.options.buttons.imageInput)
        this.buttons.imageButton = document.querySelector(this.options.buttons.imageButton)

        this.buttons.h2.addEventListener('click', this.API.h2.bind(this.API))
        this.buttons.h3.addEventListener('click', this.API.h3.bind(this.API))
        this.buttons.ul.addEventListener('click', this.API.ul.bind(this.API))
        this.buttons.ol.addEventListener('click', this.API.ol.bind(this.API))
        this.buttons.quote.addEventListener('click', this.API.quote.bind(this.API))
        this.buttons.bold.addEventListener('click', this.API.bold.bind(this.API))
        this.buttons.italic.addEventListener('click', this.API.italic.bind(this.API))
        this.buttons.strike.addEventListener('click', this.API.strike.bind(this.API))
        this.buttons.center.addEventListener('click', this.API.center.bind(this.API))
        this.buttons.imageInput.addEventListener('change', this.API.insertImage.bind(this.API))

        var _this = this
        this.buttons.link.addEventListener('click', function() {
            _this.API.createLink(_this.buttons.url.value)
            _this.buttons.url.value = ''
        })
    },
    /* 
        setup 方法：
        添加 events 属性
        初始化拓展对象
        绑定退格、回车等处理事件
    */
    setup: function() {
        this.events = new MoreEditor.Events(this)
        this.delegate = new MoreEditor.Delegate(this)
        this.API = new MoreEditor.API(this)
        this.activateButtons()
        initExtensions.call(this)
        attachHandlers.call(this)
    },
    // 添加 dom 事件
    on: function (target, event, listener, useCapture) {
        this.events.attachDOMEvent(target, event, listener, useCapture);
        return this;
    },
    // 移除 dom 事件
    off: function (target, event, listener, useCapture) {
        this.events.detachDOMEvent(target, event, listener, useCapture);
        return this;
    },
}
  
/* eslint-enable no-undef */

