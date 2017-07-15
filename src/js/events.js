(function () {
    'use strict';

    var Events = function (instance) {
        this.base = instance;
        this.options = this.base.options;
    };

    Events.prototype = {

        // Helpers for event handling

        attachDOMEvent: function (target, event, listener, useCapture) {
            var win = this.base.options.contentWindow,
                doc = this.base.options.ownerDocument;

                target.addEventListener(event, listener, useCapture);
        },

        detachDOMEvent: function (target, event, listener, useCapture) {
            var win = this.base.options.contentWindow,
                doc = this.base.options.ownerDocument;

            target.removeEventListener(event, listener, useCapture)
        }
    }    
    MoreEditor.Events = Events;
}());
