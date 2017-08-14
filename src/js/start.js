/* 
  整个编辑器插件封装为一个立即执行函数，函数的返回结果是 MoreEditor 构造函数。执行 new MoreEditor(editableSlector, editorOptions) 就可以生成一个编辑器对象
*/
(function (root, factory) {
    'use strict';
    var isElectron = typeof module === 'object' && typeof process !== 'undefined' && process && process.versions && process.versions.electron;
    if (!isElectron && typeof module === 'object') {
        module.exports = factory;
    } else if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory;
        });
    } else {
        root.MoreEditor = factory;
    }
}(this, function () {
    'use strict';  