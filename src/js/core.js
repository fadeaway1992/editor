/* MoreEditor 的原型属性和原型方法 */

var initialOptions = {
    contentWindow: window,
    ownerDocument: document,
    imageUploadAddress: null,
}


MoreEditor.prototype = {  // eslint-disable-line
    init: function(element, options) {
        console.log('初始化编辑器')
        this.origElement = element
        this.options = MoreEditor.util.defaults({}, options, initialOptions) // eslint-disable-line
        this.initElement(element)
    },
    initElement: function(element) {
        var editableElement = document.querySelector(element)
        this.editableElement = editableElement
        if(!editableElement.getAttribute('contentEditable')) {
            editableElement.setAttribute('contentEditable', true)
        }
        editableElement.setAttribute('data-more-editor-element', true)
        editableElement.classList.add('more-editor-element')
    }
}

