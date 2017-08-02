(function () {
    'use strict';

    var Events = function (instance) {
        this.base = instance
        this.options = this.base.options
        this.events = []
    };

    Events.prototype = {

        /* 给 dom 元素添加事件并将事件存放到 events 对象中 */
        attachDOMEvent: function (target, event, listener, useCapture) {

            target.addEventListener(event, listener, useCapture)
            this.events.push([target, event, listener, useCapture])

        },

        /* 销毁 dom 元素的某个事件，并将该事件在 events 对象中的纪录删除 */
        detachDOMEvent: function (target, event, listener, useCapture) {
            var index, e
            target.removeEventListener(event, listener, useCapture)
            index = this.indexOfListener(target, event, listener, useCapture);
            if (index !== -1) {
                e = this.events.splice(index, 1)[0];
                e[0].removeEventListener(e[1], e[2], e[3]);
            }
        },

        //查找某个元素上的监听事件，返回序号
        indexOfListener: function (target, event, listener, useCapture) {
            var i, n, item;
            for (i = 0, n = this.events.length; i < n; i = i + 1) {
                item = this.events[i];
                if (item[0] === target && item[1] === event && item[2] === listener && item[3] === useCapture) {
                    return i;
                }
            }
            return -1;
        },
        
        //解除所有事件
        detachAllDOMEvents: function () {
            var e = this.events.pop();
            while (e) {
                e[0].removeEventListener(e[1], e[2], e[3]);
                e = this.events.pop();
            }
        },

    }    
    MoreEditor.Events = Events;
}());
