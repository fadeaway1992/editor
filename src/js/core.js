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

                        /* 先把图片中的 图片选项 移出去，这样后期添加 撤销／重做 的时候，程序会记录我们删除的内容，这个内容中不能包括 图片选项 */
                        this.buttons.imageOptions.style.display = 'none'
                        document.body.appendChild(this.buttons.imageOptions)

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

                /* figcaption 中最后一个字符按下 enter : 选中图片  */
                if(cloestBlockContainer.nodeName.toLowerCase() === 'figcaption') {
                    var imagePlaceHolder = cloestBlockContainer.parentNode.querySelector('.image-placeholder')
                    MoreEditor.selection.moveCursor(document, imagePlaceHolder, 0)
                    checkoutIfFocusedImage.call(this)
                    event.preventDefault()
                    return
                }

                var newLine = document.createElement('p')
                newLine.innerHTML = '<br>'
                if(topBlockContainer.nextElementSibling) {
                    topBlockContainer.parentNode.insertBefore(newLine, topBlockContainer.nextElementSibling)
                    console.log('插入新行')
                } else {
                    topBlockContainer.parentNode.appendChild(newLine)
                    console.log('插入新行')
                }
                if(topBlockContainer.classList.contains('text-align-center')){
                    newLine.classList.add('text-align-center')
                }
                MoreEditor.selection.moveCursor(document, newLine, 0)
                event.preventDefault()
                return
            }

            /* 在没有内容的、居中的段落和标题中按下 backspace 键， 取消居中 */
            if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.BACKSPACE) && cloestBlockContainer.textContent === '' && cloestBlockContainer.classList.contains('text-align-center')) {
                this.API.center()
                event.preventDefault()
                return
            }

            /* editableElement 中只剩最后一个空元素的时候按下 backspace, 保持 editableElement 中有一个 p 标签 */
            if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.BACKSPACE) && this.editableElement.textContent === '' && this.editableElement.children && this.editableElement.children.length === 1) {
                console.log('再删就要gg')
                var newLine = document.createElement('p')
                newLine.innerHTML = "<br>"
                this.editableElement.replaceChild(newLine, this.editableElement.firstChild)
                MoreEditor.selection.moveCursor(document, newLine, 0)
                event.preventDefault()
                return
            }

            /*  在当前块元素的第一个字符按下 backspace 键 */
            if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.BACKSPACE) && MoreEditor.util.isElementAtBeginningOfBlock(node) && MoreEditor.selection.getCaretOffsets(node).left === 0) {
                console.log('hahahah')
                /* 前面是图片 */
                if((topBlockContainer.nodeName.toLowerCase() === 'p' || topBlockContainer.nodeName.toLowerCase().indexOf('h') !== -1) && topBlockContainer.previousElementSibling && topBlockContainer.previousElementSibling.nodeName.toLowerCase() == 'figure') {
                    console.log('enenen?')
                    var imageHolder = topBlockContainer.previousElementSibling.querySelector('li')
                    MoreEditor.selection.moveCursor(document, imageHolder, 0)
                    event.preventDefault()
                    return
                }
                return
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
    return
    // if(!this.editableElement.hasChildNodes()) {
    //     console.log('删没了')
    //     var newLine = document.createElement('p')
    //     newLine.innerHTML = '<br>'
    //     this.editableElement.appendChild(newLine)
    //     MoreEditor.selection.moveCursor(document, newLine, 0)
    //     event.preventDefault()
    //     return
    // }

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
        var clineHeight = this.editableElement.getBoundingClientRect().bottom  // 获取编辑区客户端窗口高度
        if(rects[0]) {
            var bottom = clineHeight - rects[0].bottom           // 获取光标距离窗口底部的高度
            if(bottom < 50) {
                var scrollTop = this.editableElement.scrollTop  // 编辑区获取向上滚动的距离
                this.editableElement.scrollTop = scrollTop + rects[0].height    
            }                                                                                  // 这一段是讲如果当前光标距离窗口底部很近了（<50），就将文档向上滚动一个光标的距离。
        } else if (event.keyCode == 13) {    // 当前按下的键是 enter， 但是却没有获取到光标的 rect 对象。有些场景下无法获取到光标的 rect 对象，这时我们使用光标所在节点的父元素的 rect 对象。
            var parentNode = MoreEditor.util.getClosestBlockContainer(node)  
            if(!parentNode)return
            var rect = parentNode.getBoundingClientRect()
            var bottom = clineHeight - rect.bottom
            if(bottom < 50) {
                var scrollTop = this.editableElement.scrollTop  // 编辑区获取向上滚动的距离
                var height = rect.height + parseInt(getComputedStyle(parentNode).marginTop) + parseInt(getComputedStyle(parentNode).marginBottom)
                this.editableElement.scrollTop = scrollTop + height
            }
        }
    }
}

function keepImagePlaceHolderEmpty (event) {
    var range = document.getSelection().getRangeAt(0)
    if (!range) return
    var cloestBlockContainer = MoreEditor.util.getClosestBlockContainer(range.startContainer)
    if(cloestBlockContainer.getAttribute('data-type') === 'image-placeholder') {
        cloestBlockContainer.innerHTML = ''
    }
    
}

function handleKeydown(event) {
    handleBackAndEnterKeydown.call(this, event)
    checkCaretPosition.call(this, event)
   
}

function handleKeyup(event) {
    keepAtleastOneParagraph.call(this, event)
    updateButtonStatus.call(this, event)
    checkoutIfFocusedImage.call(this)
    keepImagePlaceHolderEmpty.call(this.event)
}


function handleMousedown(event) {
    if(event.target.nodeName.toLowerCase() === 'button' && event.target !== this.buttons.link) { // 这个地方暂时排除了 link 按钮，因为 link mousedown 时需要触发输入框的 blur 事件
        event.preventDefault()
    }
    if(this.editableElement.contains(event.target)) {
        window.setTimeout(function(){
            updateButtonStatus.call(this)
        }.bind(this), 0)
    }
}

/* anchor-preview  链接预览 */
var timer = 0
function handleMouseover(event) {

    /* 
      当鼠标移入 editable 内的 a 标签中时。
      或者鼠标移入 anchor-preview 时
      显示链接预览
    */

    var isInAnchorPreview = MoreEditor.util.traverseUp(event.target, function(current) {
        return current.getAttribute('data-type') === 'anchor-preview'
    })
    if((event.target.nodeName.toLowerCase() === 'a' && this.editableElement.contains(event.target)) || isInAnchorPreview) {
        clearTimeout(timer)
        this.anchorPreview.style.display = 'block'
        if(event.target.nodeName.toLowerCase() === 'a' && event.target.parentNode.getAttribute('data-type') !== 'anchor-preview') {
            var view = document.createElement('a')
            view.href = event.target.href
            view.target = '_blank'
            view.innerHTML = event.target.href
            this.anchorPreview.innerHTML = ''
            this.anchorPreview.appendChild(view)
            var rect = event.target.getClientRects()[0]
            var anchorWidth = this.anchorPreview.offsetWidth
            var left = rect.left + rect.width/2 - anchorWidth/2
            this.anchorPreview.style.left = left + 'px'

            var scrollTop = document.documentElement.scrollTop || document.body.scrollTop
            var top = rect.bottom + scrollTop + 10
            this.anchorPreview.style.top = top + 'px'
        }
    }

    /* 移动到图片中的时候显示图片选项 */
    var theFigure = MoreEditor.util.traverseUp(event.target, function(current){
        return current.nodeName.toLowerCase() === 'figure'
    })
    if(theFigure){
        if(this.options.imageOptionsEnabled) {
            theFigure.querySelector('.image-wrapper').appendChild(this.buttons.imageOptions)
            this.buttons.imageOptions.style.display = 'block'
        }
        theFigure.querySelector('.insert-image').classList.add('hover')
    }
    
}

function handleMouseout(event) {
    if(event.target.nodeName.toLowerCase() === 'a' || event.target.getAttribute('data-type') === 'anchor-preview') {
        timer = setTimeout(function() {
            this.anchorPreview.style.display = 'none'
        }.bind(this), 500)
    }

    /* 移出图片的时候隐藏图片选项 */
    var toTarget = event.toElement || event.relatedTarget  // FF 不支持 event.toElement, 要用 relatedTarget
    var toFigure = MoreEditor.util.traverseUp(toTarget, function(current){
        return current.nodeName.toLowerCase() === 'figure'
    })
    var fromFigure = MoreEditor.util.traverseUp(event.target, function(current){
        return current.nodeName.toLowerCase() === 'figure'
    })
    if(!toFigure && fromFigure){
        if(this.options.imageOptionsEnabled) {
            this.buttons.imageOptions.style.display = 'none'
            document.body.appendChild(this.buttons.imageOptions)
        }
        fromFigure.querySelector('.insert-image').classList.remove('hover')
    }
}

/* 
    每次 keyup, mouseup 以及编辑器 blur 时都会执行下面的函数检测当前选区的变化，相应的调整按钮高亮，以及哪些按钮可用，哪些按钮不可用。
*/
function updateButtonStatus(event) {
    console.log('updateButtonStatus')
    /* 在按钮上 mouseup 时不执行 */
    if(event && event.target.nodeName.toLowerCase() === 'button') {
        console.log('我要 return')
        return
    }

    this.delegate.updateStatus()
    var available = this.delegate.available
    var setAlready = this.delegate.setAlready

    /* 高亮已经设置的按钮 */
    if(setAlready.bold) {
        this.buttons.bold.classList.add('button-active')
    } else {
        this.buttons.bold.classList.remove('button-active')
    }

    if(setAlready.italic) {
        this.buttons.italic.classList.add('button-active')
    } else {
        this.buttons.italic.classList.remove('button-active')
    }

    if(setAlready.strike) {
        this.buttons.strike.classList.add('button-active')
    } else {
        this.buttons.strike.classList.remove('button-active')
    }

    if(setAlready.quote) {
        this.buttons.quote.classList.add('button-active')
    } else {
        this.buttons.quote.classList.remove('button-active')
    }

    if(setAlready.ol) {
        this.buttons.ol.classList.add('button-active')
    } else {
        this.buttons.ol.classList.remove('button-active')
    }

    if(setAlready.ul) {
        this.buttons.ul.classList.add('button-active')
    } else {
        this.buttons.ul.classList.remove('button-active')
    }

    if(setAlready.h2) {
        this.buttons.h2.classList.add('button-active')
    } else {
        this.buttons.h2.classList.remove('button-active')
    }

    if(setAlready.h3) {
        this.buttons.h3.classList.add('button-active')
    } else {
        this.buttons.h3.classList.remove('button-active')
    }

    if(setAlready.center) {
        this.buttons.center.classList.add('button-active')
    } else {
        this.buttons.center.classList.remove('button-active')
    }

    


    /* disable 当前不能使用的按钮 */
    if(available.h) {
      this.buttons.h3.removeAttribute('disabled')
      this.buttons.h2.removeAttribute('disabled')
      this.buttons.switchTitle.removeAttribute('disabled')
    } else {
      this.buttons.h2.setAttribute('disabled', 'disabled')
      this.buttons.h3.setAttribute('disabled', 'disabled')
      this.buttons.switchTitle.setAttribute('disabled', 'disabled')
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

    if(available.promptLink) {
      this.buttons.promptLink.removeAttribute('disabled')
    } else {
      this.buttons.promptLink.setAttribute('disabled', 'disabled')
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

/* 判断点击的是不是图片，如果是图片，检查这个图片是否已经激活，如果已经激活，什么都不做。如果没有激活，把光标移到 imagePlaceHolder 中，执行相关的操作。如果点击的不是图片，执行相关的操作。 */
function checkIfClickedAnImage(event) {
    var theFigure = MoreEditor.util.traverseUp(event.target, function(current) {
        return current.nodeName.toLowerCase() === 'figure'
    })
    if(theFigure) {
        var clickedImage = theFigure.querySelector('img')
        if(clickedImage.classList.contains('insert-image-active')) {
            return
        }
        if(clickedImage.parentNode.previousElementSibling.getAttribute('data-type') === 'image-placeholder') {
            var imageHolder = clickedImage.parentNode.previousElementSibling
            MoreEditor.selection.select(document,imageHolder, 0)
            checkoutIfFocusedImage.call(this)
            return
        }
    } else {

        // if(event.target.nodeName.toLowerCase() === 'figure') {
        //     if(MoreEditor.util.isFF) {
        //         console.log('firefox')
        //         MoreEditor.selection.select(document, event.target, 0)
        //     }
        // }

        checkoutIfFocusedImage.call(this)
    }
}

/*
    检查光标是否在图片中  
    当 keyup 时，或者鼠标点击图片聚焦在 imagePlaceholder 时会执行。
    先判断当前光标是否在 imagePlaceHolder 中，如果是，并且当前的图片没有添加 active 类， 检查有没有已经激活的图片，清除它们的 active 类。给当前图片添加 active 类，把图片选项按钮放到这个图片中。 如果当前光标在图片中，而图片已经激活则什么都不做。
    否则，当前光标不在 imagePlaceHolder 中，检查文档中有无 active 的图片，去掉 active 类，并隐藏 图片选项按钮。
*/
function checkoutIfFocusedImage() {
    var selection = document.getSelection()
    var range
    if(selection.rangeCount>0) {
        range = selection.getRangeAt(0)
    }
    if(range && MoreEditor.util.getClosestBlockContainer(range.startContainer).getAttribute('data-type') === 'image-placeholder') {
        console.log('我进去了图片中')
        var topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(range.startContainer)
        var image = topBlock.querySelector('.insert-image')
        if(image.classList.contains('insert-image-active')) {
            return
        }
        var activeImage = document.querySelector('.insert-image-active')
        if(activeImage) {
            activeImage.classList.remove('insert-image-active')
        }
        
        image.classList.add('insert-image-active')
        if(this.options.imageOptionsEnabled) {
            image.parentNode.appendChild(this.buttons.imageOptions)
            this.buttons.imageOptions.style.display = 'block'
        }
        
    } else {
        var activeImage = document.querySelector('.insert-image-active')
        if(activeImage) {
            console.log('准备移除已经聚焦的图片')
            activeImage.classList.remove('insert-image-active')
            if(this.options.imageOptionsEnabled) {
                this.buttons.imageOptions.style.display = 'none'
                document.body.appendChild(this.buttons.imageOptions)
            }
        }
        return
    }
}


/* MoreEditor 默认设置设置，会被手动设置覆盖。 */

var initialOptions = {

    imageUpload: function() {
        return
    },

    initReedit: function() {
        return
    },

    contentWindow: window,
    ownerDocument: document,

    canListsBeAligned: false,
    spellcheck: false,
    shouldImageUpload: true,
    decorateOnlyWhenTextSelected: false,
    fileDraggingEnabled: true,
    autoLinkEnabled: true,
    imageOptionsEnabled: true,

    anchorPreview: '.anchor-preview-default',  // 内置 anchorPreview
    loadingImg: '.loading-default',  // 内置 loadingImg

}



function attachHandlers() {
    this.on(this.editableElement, 'keydown', handleKeydown.bind(this))
    this.on(document.body, 'keyup', handleKeyup.bind(this))
    this.on(document.body, 'mouseup', updateButtonStatus.bind(this))
    this.on(this.editableElement, 'blur', updateButtonStatus.bind(this))
    this.on(document.body, 'click', handleClick.bind(this))
    this.on(document.body, 'mousedown', handleMousedown.bind(this))
    this.on(document.body, 'mouseover', handleMouseover.bind(this))
    this.on(document.body, 'mouseout', handleMouseout.bind(this))
}

var agentBtn = document.createElement('span')  // 一个放在内存里的 dom 元素。对于用户没有设置的按钮，我们把事件加在它身上。

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

        // 如果用户设置了开启拼写检查则开启
        editableElement.setAttribute('spellcheck', this.options.spellcheck)
        editableElement.setAttribute('data-more-editor-element', true)
        editableElement.classList.add('more-editor-element')
        console.log(editableElement.innerHTML, 'editableElement.innerHTML')
        if(editableElement.innerHTML === '' || editableElement.innerHTML === '<br>') {  // 在 Edge 中默认 html 是 <br>
            editableElement.innerHTML = '<p><br></p>'
            /* 火狐浏览器直接输入会写到 div 中，所以要先选中 p 标签 */
            var firstLine = editableElement.querySelector('p')
            MoreEditor.selection.moveCursor(document, firstLine, 0)
        } else {
            this.options.initReedit(editableElement)
        }
    },

    activateButtons: function() {
        this.buttons = {}

        /* 创建上传图片的 input 按钮 */
        var imageInput = document.createElement('input')
        imageInput.type = 'file'
        imageInput.accept = "image/jpg, image/png, image/jpeg, image/gif"
        imageInput.classList.add("image-input")
        imageInput.style.display = 'none'
        document.body.appendChild(imageInput)
        this.buttons.imageInput = imageInput

        /* 创建上传文件的 input 按钮 */
        var fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = "application/pdf"
        fileInput.classList.add("file-input")
        fileInput.style.display = 'none'
        document.body.appendChild(fileInput)
        this.buttons.fileInput = fileInput


        /* 设置图片选项 */
        if(this.options.imageOptionsEnabled) {
            if(!this.options.buttons.imageOptions) {
                /* 使用内置 imageOptions */
                var imageOptions = document.createElement('div')
                imageOptions.className = 'image-options-default'
                
                imageOptions.innerHTML = '<button class="rechoose">替换</button><button class="figure-caption">注释</button><button class="delete">移除</button>'
                this.buttons.imageOptions = imageOptions
                this.buttons.imageReChoose = imageOptions.querySelector('.rechoose')
                this.buttons.imageRemove = imageOptions.querySelector('.delete')
                this.buttons.figCaption = imageOptions.querySelector('.figure-caption')
            } else if(this.options.buttons.imageOptions) {
                /* 使用用户自定义 imageOptions */
                this.buttons.imageOptions  = document.querySelector(this.options.buttons.imageOptions)
                this.buttons.imageReChoose = this.options.buttons.imageRechoose ? document.querySelector(this.options.buttons.imageRechoose) : false
                this.buttons.imageRemove   = this.options.buttons.imageRemove ? document.querySelector(this.options.buttons.imageRemove) : false
                this.buttons.figCaption    = this.options.buttons.figCaption ? document.querySelector(this.options.buttons.figCaption) : false
            }
    
            /* 将 image-options 放到 body 下 */
            this.buttons.imageOptions.style.display = 'none'
            this.buttons.imageOptions.setAttribute('data-type', 'image-options')
            document.body.appendChild(this.buttons.imageOptions)

            if(this.buttons.imageReChoose) this.on(this.buttons.imageReChoose, 'click', function() {this.buttons.imageInput.click()}.bind(this))
            if(this.buttons.imageRemove) this.on(this.buttons.imageRemove, 'click', this.API.removeImage.bind(this.API))
            if(this.buttons.figCaption) this.on(this.buttons.figCaption, 'click', this.API.figCaption.bind(this.API))
        }
    


        this.buttons.h3            = this.options.buttons.h3 ? document.querySelector(this.options.buttons.h3) : agentBtn
        this.buttons.h2            = this.options.buttons.h2 ? document.querySelector(this.options.buttons.h2) : agentBtn
        this.buttons.ul            = this.options.buttons.ul ? document.querySelector(this.options.buttons.ul) : agentBtn
        this.buttons.switchTitle   = this.options.buttons.switchTitle ? document.querySelector(this.options.buttons.switchTitle) : agentBtn
        this.buttons.ol            = this.options.buttons.ol ? document.querySelector(this.options.buttons.ol) : agentBtn
        this.buttons.quote         = this.options.buttons.quote ? document.querySelector(this.options.buttons.quote) : agentBtn
        this.buttons.bold          = this.options.buttons.bold ? document.querySelector(this.options.buttons.bold) : agentBtn
        this.buttons.italic        = this.options.buttons.italic ? document.querySelector(this.options.buttons.italic) : agentBtn
        this.buttons.strike        = this.options.buttons.strike ? document.querySelector(this.options.buttons.strike) : agentBtn
        this.buttons.url           = this.options.buttons.url ? document.querySelector(this.options.buttons.url) : agentBtn
        this.buttons.link          = this.options.buttons.link ? document.querySelector(this.options.buttons.link) : agentBtn
        this.buttons.promptLink    = this.options.buttons.promptLink ? document.querySelector(this.options.buttons.promptLink) : agentBtn
        this.buttons.center        = this.options.buttons.center ? document.querySelector(this.options.buttons.center) : agentBtn
        this.buttons.imageButton   = this.options.buttons.imageButton ? document.querySelector(this.options.buttons.imageButton) : agentBtn
        this.buttons.fileButton   = this.options.buttons.fileButton ? document.querySelector(this.options.buttons.fileButton) : agentBtn
        


        this.on(this.buttons.h2, 'click', this.API.h2.bind(this.API))
        this.on(this.buttons.h3, 'click', this.API.h3.bind(this.API))
        this.on(this.buttons.switchTitle, 'click', this.API.switchTitle.bind(this.API))
        this.on(this.buttons.ul, 'click', this.API.ul.bind(this.API))
        this.on(this.buttons.ol, 'click', this.API.ol.bind(this.API))
        this.on(this.buttons.quote, 'click', this.API.quote.bind(this.API))
        this.on(this.buttons.bold, 'click', this.API.bold.bind(this.API))
        this.on(this.buttons.italic, 'click', this.API.italic.bind(this.API))
        this.on(this.buttons.strike, 'click', this.API.strike.bind(this.API))
        this.on(this.buttons.center, 'click', this.API.center.bind(this.API))
        this.on(this.buttons.imageInput, 'change', this.API.insertImage.bind(this.API))
        this.on(this.buttons.imageButton, 'click', function() {
            this.API.exportSelection()
            this.buttons.imageInput.click()
        }.bind(this))
        this.on(this.buttons.fileButton, 'click', function() {
            this.API.exportSelection()
            this.buttons.fileInput.click()
        }.bind(this))
        this.on(this.buttons.fileInput, 'change', this.API.insertFile.bind(this.API))

        this.on(this.buttons.promptLink, 'click', this.API.promptLink.bind(this.API))

        var _this = this
        this.on(this.buttons.link, 'click', function() {
            _this.API.createLink(_this.buttons.url.value)
            _this.buttons.url.value = ''
        })
        
        /* 如果用户设置了 sizeAlert, 就使用用户自定义的 ui，否则使用我们默认的 alert 窗口 */
        if(this.options.sizeAlert) {
            this.sizeAlert = document.querySelector(this.options.sizeAlert)
            document.body.appendChild(this.sizeAlert)
        } else {
            this.sizeAlert = 'default'
        }
        

        /* 内置 anchorPreview */
        if(this.options.anchorPreview === '.anchor-preview-default') {
            var anchorPreview = document.createElement('div')
            anchorPreview.className = 'anchor-preview-default'
            document.body.appendChild(anchorPreview)
        }
        /* 找到 anchorPreview 并放到 body 下 */
        this.anchorPreview = document.querySelector(this.options.anchorPreview)
        this.anchorPreview.setAttribute('data-type', 'anchor-preview')
        this.anchorPreview.style.display = 'none'
        document.body.appendChild(this.anchorPreview)


        /* 内置 loadingImg */
        if(this.options.loadingImg === '.loading-default') {
            var loadingImg = document.createElement('div')
            loadingImg.className = 'loading-default'
            loadingImg.innerHTML = '<div class="double-bounce1"></div><div class="double-bounce2"></div>'
            document.body.appendChild(loadingImg)
        }
        /* 找到 loadingImg 并把其放入 body 下 */
        this.loadingImg = document.querySelector(this.options.loadingImg)
        this.loadingImg.setAttribute('data-type', 'loading')
        this.loadingImg.style.display = 'none'
        document.body.appendChild(this.loadingImg)
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
        this.paste = new MoreEditor.Paste(this)
        this.undoManager = new MoreEditor.UndoManager(this)
        if(this.options.autoLinkEnabled) this.autoLink = new MoreEditor.autoLink(this)
        if(this.options.fileDraggingEnabled) this.fileDragging = new MoreEditor.fileDragging(this)
        this.activateButtons()
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

    // 销毁所有事件
    destroy: function() {
        console.log('调用 destroy')
        this.events.detachAllDOMEvents()

        /* 删除 sizeAlert 元素 */
        if(this.sizeAlert !== 'default') {
            this.sizeAlert.remove()
        }

        /* 删除 imageOptions 元素 */
        this.buttons.imageOptions.remove()

        /* 删除 anchorPreview 元素 */
        this.anchorPreview.remove()

        /* 删除 loadingImg 元素 */
        this.loadingImg.remove()

        /* 删除 imgInput 元素 */
        this.buttons.imageInput.remove()
        console.log('销毁所有事件')
    }
}
  
/* eslint-enable no-undef */

