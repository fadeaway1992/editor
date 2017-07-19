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

    if(MoreEditor.util.isKey(event, [MoreEditor.util.keyCode.BACKSPACE, MoreEditor.util.keyCode.ENTER])) {
        console.log('按下了 back 或者 enter 键')

        /* 处理在 chrome 中第一个元素为空列表时无法获取正确 range 的错误 */
        if(node === this.editableElement) {
            console.log('获取 range 不正确')

            /* 唯一的一个子元素已经被删掉了 */
            if(!node.hasChildNodes()) {
                return
            }

            /* 第一个空元素是列表 */
            if(node.firstChild.firstChild.nodeName.toLowerCase() === 'li') {
                this.editableElement.removeChild(this.editableElement.firstChild)
                event.preventDefault()
                return
            }

            /* 第一个空元素是 p */
            if(node.firstChild.nodeName.toLowerCase() === 'p' && MoreEditor.util.isKey(event, MoreEditor.util.keyCode.ENTER)) {
                var newLine = document.createElement('p')
                newLine.innerHTML = '<br>'
                this.editableElement.appendChild(newLine)
                MoreEditor.selection.moveCursor(document, newLine, 0)
                console.log('插入新行')
                event.preventDefault()
                return
            }
            return
            
        }

        if(range.collapsed===true) {  // 只有光标没有选区

            /* 如果是在列表元素中 */
            if(cloestBlockContainer.nodeName.toLowerCase() === 'li') {

                /* 空列表中按下 enter */
                if(!cloestBlockContainer.textContent && MoreEditor.util.isKey(event, MoreEditor.util.keyCode.ENTER)) {

                    /* 最后一个空列表 */
                    if(!cloestBlockContainer.nextElementSibling) {
                        console.log('下一个不存在')
                        setTimeout(function(){   // 利用默认事件，删除这个 li ，在后面生成一个新的 div 或者 p， 利用 settimeout 将这个新生成的元素确保为 <p><br></p>
                            MoreEditor.util.execFormatBlock(document, 'p')
                            MoreEditor.util.getClosestBlockContainer(document.getSelection().anchorNode).innerHTML = '<br>'
                        },0)
                        return
                    }
                    
                    /* 中间的或者第一个空列表，默认行为会删除这个列表元素 */
                    var newLi = document.createElement('li')
                    newLi.innerHTML = '<br>'
                    cloestBlockContainer.parentNode.insertBefore(newLi, cloestBlockContainer)
                    event.preventDefault()
                    return
                }

                /* 第一个空列表中按下 backspace */
                if(!cloestBlockContainer.textContent && MoreEditor.util.isKey(event, MoreEditor.util.keyCode.BACKSPACE) && !cloestBlockContainer.previousElementSibling) {
                    var newLine = document.createElement('p')
                    newLine.innerHTML = '<br>'
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

            /*  在当前块元素的最后一个字符按下 enter 键 */
            if(MoreEditor.util.isKey(event, MoreEditor.util.keyCode.ENTER) && MoreEditor.util.isElementAtEndofBlock(node) && MoreEditor.selection.getCaretOffsets(node).right === 0 ) {

                /* 如果不是在列表元素中，新增一行 p 标签 */
                var newLine = document.createElement('p')
                newLine.innerHTML = '<br>'
                if(topBlockContainer.nextElementSibling) {
                    topBlockContainer.parentNode.insertBefore(newLine, topBlockContainer.nextElementSibling)
                    console.log('插入新行')
                } else {
                    topBlockContainer.parentNode.appendChild(newLine)
                    console.log('插入新行')
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


/* MoreEditor 实例初始化时增添的一些属性 */
var initialOptions = {
    contentWindow: window,
    ownerDocument: document,
    imageUploadAddress: null,
}

function initExtensions() {
    this.extensions = {}
}

function attachHandlers() {
    this.on(this.editableElement, 'keydown', handleBackAndEnterKeydown.bind(this))
    this.on(this.editableElement, 'keydown', checkCaretPosition.bind(this))
    this.on(this.editableElement, 'keyup', keepAtleastOneParagraph.bind(this))
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

