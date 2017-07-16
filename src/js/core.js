/* eslint-disable no-undef */

/* MoreEditor 的原型属性和原型方法 */

/* 
    定义在 MoreEditor 中按下 BACKSPACE 或者 ENTER 时的行为
*/
function handleBackAndEnterKeydown(event) {
    var range = document.getSelection().getRangeAt(0)
    var node = MoreEditor.selection.getSelectionStart(this.options.ownerDocument)
    var topBlockContainer = MoreEditor.util.getTopBlockContainer(node)
    var cloestBlockContainer = MoreEditor.util.getClosestBlockContainer(node)
    if(!range) {
        return
    }

    if(MoreEditor.util.isKey(event, [MoreEditor.util.keyCode.BACKSPACE, MoreEditor.util.keyCode.ENTER])) {
        console.log('按下了 back 或者 enter 键')
        if(range.collapsed===true) {  // 只有光标没有选区
            if(MoreEditor.util.isKey(event, [MoreEditor.util.keyCode.ENTER]) &&  // 按下的是 enter 键
                MoreEditor.util.isElementAtEndofBlock(node) &&   // 当前元素后面不再有文本
                MoreEditor.selection.getCaretOffsets(node).right === 0 ) {  // 光标在当前元素的最后一个字符后
                    if(cloestBlockContainer.nodeName.toLowerCase() === 'li' || topBlockContainer.nodeName.toLowerCase() === 'ul' || topBlockContainer.nodeName.toLowerCase() === 'ol') return
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
            }
        } else {
            console.log('有选区')
        }
    } else {
        return
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

