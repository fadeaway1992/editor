(function() {
  var API = function (instance) {
    this.base = instance;
    this.options = this.base.options;
  };

  API.prototype = {
    h2: function(range, crossBlock) {
      console.log(range, crossBlock)
      if (crossBlock || !range || range.collapsed) return
      MoreEditor.util.execFormatBlock(document, 'h2')
    }
  }

  MoreEditor.API = API
}());