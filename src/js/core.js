/* MoreEditor 的原型属性和原型方法 */

var initialOptions = {
    contentWindow: window,
    ownerDocument: document,
    imageUploadAddress: null,
}

/* eslint-disable no-undef */
MoreEditor.prototype = {
    init: function(element, options) {
        console.log('初始化编辑器')
        this.origElement = element
        this.options = MoreEditor.util.defaults({}, options, initialOptions)
    }
}
/* eslint-enable no-undef */
