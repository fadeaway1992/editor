(function() {
  var API = function (instance) {
    this.base = instance;
    this.options = this.base.options;
  };

  API.prototype = {
    h2: function() {
      this.base.delegate.updateStatus()
      if (this.base.delegate.crossBlock || !this.base.delegate.range || this.base.delegate.range.collapsed) return
      MoreEditor.util.execFormatBlock(document, 'h2')
    },
    quote: function() {
      this.base.delegate.updateStatus()
      if (this.base.delegate.crossBlock || !this.base.delegate.range || this.base.delegate.range.collapsed) return
      MoreEditor.util.execFormatBlock(document, 'blockquote')
    }
  }

  MoreEditor.API = API
}());