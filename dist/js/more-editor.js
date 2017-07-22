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
/* eslint-disable no-unused-vars, no-undef */

var MoreEditor = function(elements, options) {
    'use strict'
    return this.init(elements, options)
}

MoreEditor.extensions = {};

/* eslint-enable no-unused-vars, no-undef */


(function (window) {
    'use strict';

    function copyInto(overwrite, dest) {
        var prop,
            sources = Array.prototype.slice.call(arguments, 2);
        dest = dest || {};
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            if (source) {
                for (prop in source) {
                    if (source.hasOwnProperty(prop) &&
                        typeof source[prop] !== 'undefined' &&
                        (overwrite || dest.hasOwnProperty(prop) === false)) {
                        dest[prop] = source[prop];
                    }
                }
            }
        }
        return dest;
    }


    // https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
    // Some browsers (including phantom) don't return true for Node.contains(child)
    // if child is a text node.  Detect these cases here and use a fallback
    // for calls to Util.isDescendant()
    var nodeContainsWorksWithTextNodes = false;
    try {
        var testParent = document.createElement('div'),
            testText = document.createTextNode(' ');
        testParent.appendChild(testText);
        nodeContainsWorksWithTextNodes = testParent.contains(testText);
    } catch (exc) {}

    var Util = {

        // http://stackoverflow.com/questions/17907445/how-to-detect-ie11#comment30165888_17907562
        // by rg89
        isIE: ((navigator.appName === 'Microsoft Internet Explorer') || ((navigator.appName === 'Netscape') && (new RegExp('Trident/.*rv:([0-9]{1,}[.0-9]{0,})').exec(navigator.userAgent) !== null))),

        isEdge: (/Edge\/\d+/).exec(navigator.userAgent) !== null,

        // if firefox
        isFF: (navigator.userAgent.toLowerCase().indexOf('firefox') > -1),

        // http://stackoverflow.com/a/11752084/569101
        isMac: (window.navigator.platform.toUpperCase().indexOf('MAC') >= 0),

        // https://github.com/jashkenas/underscore
        // Lonely letter MUST USE the uppercase code
        keyCode: {
            BACKSPACE: 8,
            TAB: 9,
            ENTER: 13,
            ESCAPE: 27,
            SPACE: 32,
            DELETE: 46,
            K: 75, // K keycode, and not k
            M: 77,
            V: 86
        },

        /**
         * Returns true if it's metaKey on Mac, or ctrlKey on non-Mac.
         * See #591
         */
        isMetaCtrlKey: function (event) {
            if ((Util.isMac && event.metaKey) || (!Util.isMac && event.ctrlKey)) {
                return true;
            }

            return false;
        },

        /**
         * Returns true if the key associated to the event is inside keys array
         *
         * @see : https://github.com/jquery/jquery/blob/0705be475092aede1eddae01319ec931fb9c65fc/src/event.js#L473-L484
         * @see : http://stackoverflow.com/q/4471582/569101
         */
        isKey: function (event, keys) {
            var keyCode = Util.getKeyCode(event);

            // it's not an array let's just compare strings!
            if (false === Array.isArray(keys)) {
                return keyCode === keys;
            }

            if (-1 === keys.indexOf(keyCode)) {
                return false;
            }

            return true;
        },

        getKeyCode: function (event) {
            var keyCode = event.which;

            // getting the key code from event
            if (null === keyCode) {
                keyCode = event.charCode !== null ? event.charCode : event.keyCode;
            }

            return keyCode;
        },

        blockContainerElementNames: [
            // elements our editor generates
            'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'ul', 'li', 'ol',
            // all other known block elements
            'address', 'article', 'aside', 'audio', 'canvas', 'dd', 'dl', 'dt', 'fieldset',
            'figcaption', 'figure', 'footer', 'form', 'header', 'hgroup', 'main', 'nav',
            'noscript', 'output', 'section', 'video',
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'div'
        ],

        emptyElementNames: ['br', 'col', 'colgroup', 'hr', 'img', 'input', 'source', 'wbr'],

        extend: function extend(/* dest, source1, source2, ...*/) {
            var args = [true].concat(Array.prototype.slice.call(arguments));
            return copyInto.apply(this, args);
        },

        defaults: function defaults(/*dest, source1, source2, ...*/) {
            var args = [false].concat(Array.prototype.slice.call(arguments));
            return copyInto.apply(this, args);
        },


        // https://github.com/jashkenas/underscore
        isElement: function isElement(obj) {
            return !!(obj && obj.nodeType === 1);
        },

       

        traverseUp: function (current, testElementFunction) {
            if (!current) {
                return false;
            }

            do {
                if (current.nodeType === 1) {
                    if (testElementFunction(current)) {
                        return current;
                    }
                    // do not traverse upwards past the nearest containing editor
                    if (Util.isMoreEditorElement(current)) {
                        return false;
                    }
                }

                current = current.parentNode;
            } while (current);

            return false;
        },


        /* END - based on http://stackoverflow.com/a/6183069 */
        // 判断元素是否为块元素中第一个有文本的元素
        isElementAtBeginningOfBlock: function (node) {
            var textVal,
                sibling;
            while (!Util.isBlockContainer(node) && !Util.isMoreEditorElement(node)) {
                sibling = node;
                while (sibling = sibling.previousSibling) {
                    textVal = sibling.nodeType === 3 ? sibling.nodeValue : sibling.textContent;
                    if (textVal.length > 0) {
                        return false;
                    }
                }
                node = node.parentNode;
            }
            return true;
        },


        // 判断元素是否为块元素中最后一个有文本的元素
        isElementAtEndofBlock: function(node) {
            var textVal,
                sibling;
            while(!Util.isBlockContainer(node)&&!Util.isMoreEditorElement(node)) {
            sibling = node;
            while (sibling = sibling.nextSibling ) {
                textVal = sibling.nodeType ===3 ? sibling.nodeValue : sibling.textContent;
                if(textVal.length>0) {
                return false;
                }
            }
            node = node.parentNode;
            }
            return true;
        },

        isMoreEditorElement: function (element) {
            return element && element.getAttribute && !!element.getAttribute('data-more-editor-element');
        },


        isBlockContainer: function (element) {
            return element && element.nodeType !== 3 && Util.blockContainerElementNames.indexOf(element.nodeName.toLowerCase()) !== -1;
        },

        /* Finds the closest ancestor which is a block container element
         * If element is within editor element but not within any other block element,
         * the editor element is returned
         */
        getClosestBlockContainer: function (node) {
            return Util.traverseUp(node, function (node) {
                return Util.isBlockContainer(node) || Util.isMoreEditorElement(node);
            });
        },

        /* Finds highest level ancestor element which is a block container element
         * If element is within editor element but not within any other block element,
         * the editor element is returned
         */
        // 向上获取 MoreEditor 元素下的最顶级的块元素。如果没有则返回 MoreEditor 元素
        getTopBlockContainer: function (element) {
            var topBlock  
            Util.traverseUp(element, function (el) {  // 向上追溯
                if (Util.isBlockContainer(el) && !Util.isMoreEditorElement(el)) {
                    topBlock = el;    
                }
                if (!topBlock && Util.isMoreEditorElement(el)) {
                    topBlock = el;
                    return true;
                }
                return false;
            });
            return topBlock;
        },

        // 向上获取 MoreEditor 元素下的最顶级的块元素。如果没有返回 false
        getTopBlockContainerWithoutMoreEditor: function (element) {
            var topBlock = false
            if (Util.isMoreEditorElement(element)) {
                return false
            }
            Util.traverseUp(element, function (el) {  // 向上追溯
                if (Util.isBlockContainer(el) && Util.isMoreEditorElement(el.parentNode)) {
                    topBlock = el; 
                    return true   
                }
                return false;
            });
            return topBlock;
        },

        execFormatBlock: function (doc, tagName) {

            // Get the top level block element that contains the selection
            var blockContainer = Util.getTopBlockContainer(MoreEditor.selection.getSelectionStart(doc)),
                childNodes;

            // If the blockContainer is already the element type being passed in
            // treat it as 'undo' formatting and just convert it to a <p>
            if (blockContainer && tagName === blockContainer.nodeName.toLowerCase()) {
                tagName = 'p';
            }

            // When IE we need to add <> to heading elements
            // http://stackoverflow.com/questions/10741831/execcommand-formatblock-headings-in-ie
            if (Util.isIE) {
                tagName = '<' + tagName + '>';
            }

            return doc.execCommand('formatBlock', false, tagName);
        },


        isDescendant: function isDescendant(parent, child, checkEquality) {
            if (!parent || !child) {
                return false;
            }
            if (parent === child) {
                return !!checkEquality;
            }
            // If parent is not an element, it can't have any descendants
            if (parent.nodeType !== 1) {
                return false;
            }
            if (nodeContainsWorksWithTextNodes || child.nodeType !== 3) {
                return parent.contains(child);
            }
            var node = child.parentNode;
            while (node !== null) {
                if (node === parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        },

        /* based on http://stackoverflow.com/a/6183069 */
        depthOfNode: function (inNode) {
            var theDepth = 0,
                node = inNode;
            while (node.parentNode !== null) {
                node = node.parentNode;
                theDepth++;
            }
            return theDepth;
        },

        findCommonRoot: function (inNode1, inNode2) {
            var depth1 = Util.depthOfNode(inNode1),
                depth2 = Util.depthOfNode(inNode2),
                node1 = inNode1,
                node2 = inNode2;

            while (depth1 !== depth2) {
                if (depth1 > depth2) {
                    node1 = node1.parentNode;
                    depth1 -= 1;
                } else {
                    node2 = node2.parentNode;
                    depth2 -= 1;
                }
            }

            while (node1 !== node2) {
                node1 = node1.parentNode;
                node2 = node2.parentNode;
            }

            return node1;
        },
        /* END - based on http://stackoverflow.com/a/6183069 */
        
        /* 判断选区是否在 editableElement 元素内 */
        isRangeInsideMoreEditor: function(editableElement, range) {
            if(!range) return
            var commonRoot = MoreEditor.util.findCommonRoot(range.startContainer, range.endContainer)
            return MoreEditor.util.isDescendant(editableElement, commonRoot, true)
        },
       
        /* 判断选区是否跨越块元素 */
        isRangeCrossBlock: function(range) {
            if(!range) return
            return MoreEditor.util.getClosestBlockContainer(range.startContainer) !== MoreEditor.util.getClosestBlockContainer(range.endContainer)
        },

        /* 扒掉元素最外层的标签  比如在 p 标签里插入了 ul ,这时需要扒掉 p */
        unwrap: function (el, doc) {
            var fragment = doc.createDocumentFragment(),
                nodes = Array.prototype.slice.call(el.childNodes);

            // cast nodeList to array since appending child
            // to a different node will alter length of el.childNodes
            for (var i = 0; i < nodes.length; i++) {
                fragment.appendChild(nodes[i]);
            }

            if (fragment.childNodes.length) {
                el.parentNode.replaceChild(fragment, el);
            } else {
                el.parentNode.removeChild(el);
            }
        },

        /* 改变节点的包裹标签，内容不变 */
        changeTag: function(element, tagName) {
            var newElement = document.createElement(tagName)
            newElement.innerHTML = element.innerHTML
            element.parentNode.replaceChild(newElement, element)
            return newElement
        },

        /* 取消装饰元素之间的嵌套 */
        preventNestedDecorate: function(root, selector1, selector2) {

            var savedSelection = MoreEditor.selection.saveSelection(root) // 存储当前的选区

            var unwrapSelf = root.querySelectorAll(selector1)
            for(var i=0; i<unwrapSelf.length; i++) {
            this.unwrap(unwrapSelf[i], document)
            }

            var unwrapParent = root.querySelectorAll(selector2)
            for(var i=0; i<unwrapParent.length; i++) {
                MoreEditor.selection.selectNode(unwrapParent[i], document)
                switch(unwrapParent[i].parentNode.nodeName.toLowerCase()) {  //  这里要考虑 a 标签
                    case 'i':
                        document.execCommand('italic',false)
                        break
                    case 'b':
                        document.execCommand('bold',false)
                        break
                    case 'strike':
                        document.execCommand('strikeThrough',false)
                        break
                    case 'a' :
                        switch (unwrapParent[i].parentNode.parentNode.nodeName.toLowerCase()) {
                            case 'i':
                                document.execCommand('italic',false)
                                break
                            case 'b':
                                document.execCommand('bold',false)
                                break
                            case 'strike':
                                document.execCommand('strikeThrough',false)
                                break 
                            default:
                                console.log('出错了')
                                break
                        }
                        break
                    default: 
                        console.log('出错了')
                        break
                }
            }

            MoreEditor.selection.restoreSelection(root, savedSelection)
        },

        wrappedByDecoratedElement: function(container) {
            return this.traverseUp(container, function(node) {
                return (node.nodeName.toLowerCase() === 'b' || node.nodeName.toLowerCase() === 'i' || node.nodeName.toLowerCase() === 'strike')
            })
        }
    };

    MoreEditor.util = Util;
}(window));




/* eslint-disable no-undef */

(function () {
    'use strict';

    var Selection = {


        /**
         *  Find the caret position within an element irrespective of any inline tags it may contain.
         *
         *  @param {DOMElement} An element containing the cursor to find offsets relative to.
         *  @param {Range} A Range representing cursor position. Will window.getSelection if none is passed.
         *  @return {Object} 'left' and 'right' attributes contain offsets from begining and end of Element
         */
        getCaretOffsets: function getCaretOffsets(element, range) {
            var preCaretRange, postCaretRange;

            if (!range) {
                range = window.getSelection().getRangeAt(0);
            }

            preCaretRange = range.cloneRange();
            postCaretRange = range.cloneRange();

            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);

            postCaretRange.selectNodeContents(element);
            postCaretRange.setStart(range.endContainer, range.endOffset);

            return {
                left: preCaretRange.toString().length,
                right: postCaretRange.toString().length
            };
        },

        

       
        selectNode: function (node, doc) {
            var range = doc.createRange();
            range.selectNodeContents(node);
            this.selectRange(doc, range);
        },

        select: function (doc, startNode, startOffset, endNode, endOffset) {
            var range = doc.createRange();
            range.setStart(startNode, startOffset);
            if (endNode) {
                range.setEnd(endNode, endOffset);
            } else {
                range.collapse(true);
            }
            this.selectRange(doc, range);
            return range;
        },


        /**
         * Move cursor to the given node with the given offset.
         *
         * @param  {DomDocument} doc     Current document
         * @param  {DomElement}  node    Element where to jump
         * @param  {integer}     offset  Where in the element should we jump, 0 by default
         */
        moveCursor: function (doc, node, offset) {
            this.select(doc, node, offset);
        },

        getSelectionRange: function (ownerDocument) {
            var selection = ownerDocument.getSelection();
            if (selection.rangeCount === 0) {
                return null;
            }
            return selection.getRangeAt(0);
        },

        selectRange: function (ownerDocument, range) {
            var selection = ownerDocument.getSelection();

            selection.removeAllRanges();
            selection.addRange(range);
        },

        // http://stackoverflow.com/questions/1197401/how-can-i-get-the-element-the-caret-is-in-with-javascript-when-using-contentedi
        // by You
        getSelectionStart: function (ownerDocument) {
            var node = ownerDocument.getSelection().anchorNode,
                startNode = (node && node.nodeType === 3 ? node.parentNode : node);

            return startNode;
        },

        getSelectionEnd: function (ownerDocument) {
            var node = ownerDocument.getSelection().focusNode,
                endNode = (node && node.nodeType === 3 ? node.parentNode : node);

            return endNode;
        },

        saveSelection: function(containerEl) {
            var range = window.getSelection().getRangeAt(0)
            var preSelectionRange = range.cloneRange()
            preSelectionRange.selectNodeContents(containerEl)
            preSelectionRange.setEnd(range.startContainer, range.startOffset)
            var start = preSelectionRange.toString().length

            return {
                start: start,   
                end: start + range.toString().length
            }
        },

        restoreSelection : function(containerEl, savedSel) {
            var charIndex = 0, range = document.createRange()
            range.setStart(containerEl, 0)
            range.collapse(true)
            var nodeStack = [containerEl], node, foundStart = false, stop = false

            while (!stop && (node = nodeStack.pop())) {
                if (node.nodeType == 3) {
                    var nextCharIndex = charIndex + node.length
                    if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                        range.setStart(node, savedSel.start - charIndex)
                        foundStart = true
                    }
                    if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                        range.setEnd(node, savedSel.end - charIndex)
                        stop = true
                    }
                    charIndex = nextCharIndex
                } else {
                    var i = node.childNodes.length
                    while (i--) {
                        nodeStack.push(node.childNodes[i])
                    }
                }
            }
            var sel = document.getSelection()
            sel.removeAllRanges()
            sel.addRange(range)
        }
    };

    MoreEditor.selection = Selection;
}());

/* eslint-enable no-undef */
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

/* 
  Delegate 对象存储触发修改 DOM 的函数的参数。 例如用户点击 小标题按钮，程序会调用一个函数将当前用户选中的文字转为
  小标题。这个函数需要的参数：用户选中了哪些文字、当前文字是否可以转化成小标题、小标题按钮是否被禁用，等。 这些参数都
  存储在 Delegate 对象中。
*/


(function() {
  var Delegate = function (instance) {
    this.base = instance;
    this.options = this.base.options;
    this.setDefault()
  };

  Delegate.prototype = {

    /* 
      检查当前选区状态，并输出当前选区的数据
    */
    updateStatus: function() {
      console.log('updateStatus')
      var selection = document.getSelection()
      var range

      if(selection.rangeCount>0) {
        range = selection.getRangeAt(0)
      }

      /* 选区存在并且选区在 editableElement 中 */
      if(range && MoreEditor.util.isRangeInsideMoreEditor(this.base.editableElement, range)) {   
        this.range = range
        this.startElement = MoreEditor.selection.getSelectionStart(document)
        this.closestBlock = MoreEditor.util.getClosestBlockContainer(this.startElement)
        this.topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(this.startElement)

        /* 判断选区是否跨越块元素 */
        if(MoreEditor.util.isRangeCrossBlock(range)) {
          this.crossBlock = true
        } else {
          this.crossBlock = false
        }

        /* 判断是否有选中有序列表 */ 
        if(this.topBlock.nodeName.toLowerCase() === 'ol') {
          this.setAlready.ol = true
        } else {
          this.setAlready.ol = false
        }

        /* 判断是否有选中 无序列表／引用 */ 
        if(this.topBlock.nodeName.toLowerCase() === 'ul') {
          if(this.topBlock.getAttribute('data-type') === 'blockquote') {
            this.setAlready.quote = true
            this.setAlready.ul = false
          } else {
            this.setAlready.ul = true
            this.setAlready.quote = false
          }
        } else {
          this.setAlready.ul = false
          this.setAlready.quote = false
        }

        /* 判断是否选中标题 */
        if(this.closestBlock.nodeName.toLowerCase() === 'h2'){
          this.setAlready.h2 = true
        } else {
          this.setAlready.h2 = false
        }

        if(this.closestBlock.nodeName.toLowerCase() === 'h3'){
          this.setAlready.h3 = true
        } else {
          this.setAlready.h3 = false
        }

        /* 判断是否选中粗体 以选区开始处为准*/
        if(this.startElement.nodeName.toLowerCase() === 'b' || this.startElement.parentNode.nodeName === 'b') {
          this.setAlready.bold = true
        } else {
          this.setAlready.bold = false
        }
        
        /* 判断是否选中斜体 以选区开始处为准 */
        if(this.startElement.nodeName.toLowerCase() === 'i' || this.startElement.parentNode.nodeName === 'i') {
          this.setAlready.italic = true
        } else {
          this.setAlready.italic = false
        }

        /* 判断是否选中删除线 以选区开始处为准 */
        if(this.startElement.nodeName.toLowerCase() === 'strike' || this.startElement.parentNode.nodeName === 'strike') {
          this.setAlready.strike = true
        } else {
          this.setAlready.strike = false
        }
        

      /* 没有选区或者选区不在 editableElement 内 */
      } else {
        console.log('set defaults')
        this.setDefault()
      }
    },

    setDefault: function() {
      this.range = null
      this.startElement = null
      this.closestBlock = null
      this.topBlock = null
      this.crossBlock = false
      this.setAlready = {
        h2: false,
        h3: false,
        bold: false,
        italic: false,
        strike: false,
        quote: false,
        ul: false,
        ol: false
      }
    }
  }

  MoreEditor.Delegate = Delegate
}());


(function() {
  var API = function (instance) {
    this.base = instance;
    this.options = this.base.options;
  };

  API.prototype = {

    /* 增加大标题 */
    h2: function() {
      var delegate = this.base.delegate
      delegate.updateStatus()

      /* 基本判断 */  // 只有 段落 和 小标题  可以执行大标题命令哦！
      if (delegate.crossBlock || !delegate.range || delegate.closestBlock.nodeName.toLowerCase() === 'li') return

      MoreEditor.util.execFormatBlock(document, 'h2')
    },

    /* 添加小标题 */
    h3: function() {
      this.base.delegate.updateStatus()

      /* 基本判断 */
      if (this.base.delegate.crossBlock || !this.base.delegate.range || this.base.delegate.closestBlock.nodeName.toLowerCase() === 'li') return

      MoreEditor.util.execFormatBlock(document, 'h3')
    },


    /* 创建引用列表 */
    quote: function() {

      /* 刷新选区状态，获取选区信息 */
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var needSeperator

      /* 基本判断 */
      if(delegate.crossBlock || !delegate.range) return

       /* 如果选区中有引用就取消引用，转为纯文本 */
      if(delegate.setAlready.quote === true) {
        this.unWrapWholeList()
        return 
      }

      /* 选区不在引用中，生成引用，判断选区是否是段落（选区在 列表／标题 中时不能执行命令） */
      if(delegate.closestBlock.nodeName.toLowerCase() !== 'p') return

        /* 
          在谷歌浏览器中，生成的列表会和相邻的列表自动合并到一个浏览器中。
          如果检测到相邻的元素也是列表，我们可以先在要生成的列表要相邻的列表之间插入一个块元素
          生成新列表后再删除这个块元素之间
          这样可以防止合并。
        */

      /* 防止生成的引用和下面的无序列表合并 */
      if(delegate.topBlock.nextElementSibling && delegate.topBlock.nextElementSibling.nodeName.toLowerCase() === 'ul' && !delegate.topBlock.nextElementSibling.getAttribute('data-type')) {
        var newLine = document.createElement('p')
        newLine.innerHTML = '<br>'
        newLine.classList.add('seperator')
        delegate.topBlock.parentNode.insertBefore(newLine, delegate.topBlock.nextElementSibling)
        needSeperator = true
      }

      /* 防止生成的引用和上面的无序列表合并 */
      if(delegate.topBlock.previousElementSibling && delegate.topBlock.previousElementSibling.nodeName.toLowerCase() === 'ul' && !delegate.topBlock.previousElementSibling.getAttribute('data-type')) {
        var newLine = document.createElement('p')
        newLine.innerHTML = '<br>'
        newLine.classList.add('seperator')
        delegate.topBlock.parentNode.insertBefore(newLine, delegate.topBlock)
        needSeperator = true
      }
      
      /* 执行创建列表的函数，返回列表的标签名 */
      var list = this.createList()
      console.log(list, '这里应该是创建列表时返回的列表')

      /* 如果有插入了放合并的分隔符，需要在生成列表后删掉分隔符 */
      if(needSeperator) {
        this.base.editableElement.removeChild(document.querySelector('.seperator'))
      }

      // 给 引用 加上 blockquote 类
      list.classList.add('blockquote')
      list.setAttribute('data-type', 'blockquote')
    },


    /* 创建无序列表 */
    ul: function() {

      /* 刷新选区状态，获取选区信息 */
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var needSeperator

      /* 基本判断 */
      if(delegate.crossBlock || !delegate.range) return

      /* 如果选中的是无序列表就取消整个列表 */
      if(delegate.setAlready.ul === true) {
        this.unWrapWholeList()
        return
      }

      /* 如果选中的是顺序列表，将其转换为无序列表 */
      if(delegate.setAlready.ol === true) {
        MoreEditor.util.changeTag(delegate.topBlock, 'ul')
        return
      }

      /* 只有选中的是段落的情况下才生成无序列表， 标题、引用都不能执行生成无序列表的命令 */
      if(delegate.closestBlock.nodeName.toLowerCase() !== 'p') return

      /* 防止生成的无序列表和毗邻的引用合并 */
      if(delegate.topBlock.nextElementSibling && delegate.topBlock.nextElementSibling.nodeName.toLowerCase() === 'ul' && delegate.topBlock.nextElementSibling.getAttribute('data-type') === 'blockquote') {
        var newLine = document.createElement('p')
        newLine.innerHTML = '<br>'
        newLine.classList.add('seperator')
        delegate.topBlock.parentNode.insertBefore(newLine, delegate.topBlock.nextElementSibling)
        needSeperator = true
      }

      if(delegate.topBlock.previousElementSibling && delegate.topBlock.previousElementSibling.nodeName.toLowerCase() === 'ul' && delegate.topBlock.previousElementSibling.getAttribute('data-type') === 'blockquote') {
        var newLine = document.createElement('p')
        newLine.innerHTML = '<br>'
        newLine.classList.add('seperator')
        delegate.topBlock.parentNode.insertBefore(newLine, delegate.topBlock)
        needSeperator = true
      }

      /* 如果程序没有在前面几步退出，而是成功走到了这里，说明当前的环境可以生成顺序列表 */
      var list = this.createList()
      if(list.nodeName.toLowerCase() !== 'ul') console.log('%c你在生成无序列表的过程中出错啦！', 'color: red;')

      if(needSeperator) {
        this.base.editableElement.removeChild(document.querySelector('.seperator'))
      }
    },


    /* 创建顺序列表 */
    ol: function() {

      /* 刷新选区状态，获取选区信息 */
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate

      /* 基本判断 */
      if(delegate.crossBlock || !delegate.range) return

      /* 如果选中的是顺序列表就取消整个列表 */
      if(delegate.setAlready.ol === true) {
        this.unWrapWholeList()
        return
      }

      /* 如果选中的是无序列表，将其转换为顺序列表 */
      if(delegate.setAlready.ul === true) {
        MoreEditor.util.changeTag(delegate.topBlock, 'ol')
        return
      }

      /* 只有选中的是段落的情况下才生成顺序列表， 标题、引用都不能执行生成顺序列表的命令 */
      if(delegate.closestBlock.nodeName.toLowerCase() !== 'p') return

      /* 如果程序没有在前面几步退出，而是成功走到了这里，说明当前的环境可以生成顺序列表 */
      var list = this.createList(true)
      if(list.nodeName.toLowerCase() !== 'ol') console.log('%c你在生成顺序列表的过程中出错啦！', 'color: red;')
    },


    /*  
    **  创建列表 
    **  接收一个 ordered 参数,参数为 true 创建顺序列表，否则创建无序列表
    **  返回创建的列表 
    */
    createList: function(ordered) {
      
      if(ordered) {
        document.execCommand('insertOrderedList',false)
      } else {
        document.execCommand('insertUnorderedList',false)
      }
      
      /* sometimes 我们在 p 标签中创建出来的列表会被包裹在 p 标签中，这时候我们要手动扒掉 p 标签。 */ 
      var node = MoreEditor.selection.getSelectionStart(document)
      var topBlock = MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)

      if(topBlock.nodeName.toLowerCase() !== 'ul' && topBlock.nodeName.toLowerCase() !== 'ol') {
        MoreEditor.util.unwrap(topBlock,document)
        topBlock =  MoreEditor.util.getTopBlockContainerWithoutMoreEditor(node)
      }

      if(topBlock.nodeName.toLowerCase() !== 'ol' && topBlock.nodeName.toLowerCase() !== 'ul') {
          console.error('%c创建标签的过程中出现错误', 'color:red;')
      }

      /* 防止生成的第一个列表项中有 br 标签 */
      if(topBlock.querySelector('li').textContent !== '') {
        topBlock.querySelector('li').innerHTML = topBlock.querySelector('li').innerHTML.replace(/<br>/g, '')
      }

      /* 把光标手动移到第一个列表项中，因为有时候浏览器会出现光标显示但获取不到 range 的 bug */
      MoreEditor.selection.moveCursor(document, topBlock.firstChild, 0)

      /* 返回创建的列表 */
      return topBlock
    },
    

    /* 取消列表 , 这时用户选区中包含 List Item */
    unWrapWholeList: function() {
      var delegate = this.base.delegate
      var topBlock = delegate.topBlock
      
      var listItems = Array.prototype.slice.apply(topBlock.children) // 将所有 li 放入一个数组
      for (var i=0; i<listItems.length; i++) {
        MoreEditor.util.changeTag(listItems[i],'p')
      }
      MoreEditor.util.unwrap(topBlock, document)
    },


    /* 加粗／取消加粗 */
    bold: function() {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var isCancle

      /* 基本判断 命令是否可以执行 */
      if (delegate.crossBlock || !delegate.range || delegate.range.collapsed) return

      /* 标题不可加粗 */
      if(delegate.setAlready.h2 || delegate.setAlready.h3) return
      
      /* 判断将要执行的是加粗还是取消加粗 */
      if(delegate.setAlready.bold) {
        isCancle = true
      }

      document.execCommand('bold', false)

      /* 如果上一步执行的是加粗操作而不是取消加粗，则需要检查 粗体／斜体／删除线 之间的嵌套 */
      if(!isCancle) {
        MoreEditor.util.preventNestedDecorate(delegate.closestBlock, 'b i, b strike', 'i b, strike b')
      }
    },


    /* 斜体／取消斜体 */
    italic: function() {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var isCancle

      /* 基本判断 命令是否可以执行 */
      if (delegate.crossBlock || !delegate.range || delegate.range.collapsed) return

      /* 标题不可加粗 */
      if(delegate.setAlready.h2 || delegate.setAlready.h3) return

      /* 判断将要执行的是斜体还是取消斜体 */
      if(delegate.setAlready.italic) {
        isCancle = true
      }

      document.execCommand('italic', false)

      /* 如果上一步执行的是斜体操作而不是取消斜体，则需要检查 粗体／斜体／删除线 之间的嵌套 */
      if(!isCancle) {
        MoreEditor.util.preventNestedDecorate(delegate.closestBlock, 'i b, i strike', 'b i, strike i') 
      }  
    },

    /* 斜体／取消斜体 */
    strike: function() {
      this.base.delegate.updateStatus()
      var delegate = this.base.delegate
      var isCancle

      /* 基本判断 命令是否可以执行 */
      if (delegate.crossBlock || !delegate.range || delegate.range.collapsed) return

      /* 标题不可加粗 */
      if(delegate.setAlready.h2 || delegate.setAlready.h3) return

      /* 判断将要执行的是斜体还是取消斜体 */
      if(delegate.setAlready.strike) {
        isCancle = true
      }

      document.execCommand('strikeThrough', false)

      /* 检查 粗体／斜体／删除线 之间的嵌套 */
      if(!isCancle) {
        MoreEditor.util.preventNestedDecorate(delegate.closestBlock, 'strike b, strike i', 'b strike, i strike') 
      }  
    },

    /* 创建链接 */
    createLink: function(url) {
      var delegate = this.base.delegate
      delegate.updateStatus()

      /* 基本判断 */
      if(delegate.crossBlock || !delegate.range) return
      
      /* 确定我们的选区不是全部在一个装饰标签内 */ 
      if(!MoreEditor.util.wrappedByDecoratedElement(delegate.range.commonAncestorContainer)) {

        var anchorDecorateCommand, focusDecoratedCommand
        var origSelection = MoreEditor.selection.saveSelection(delegate.closestBlock)  //  存储当前选区(要执行创建链接的选区)
        var anchorOverlap, focusOverlap
          
        var anchorDecoratedElement = MoreEditor.util.traverseUp(delegate.startElement, function(element) {
              return (element.nodeName.toLowerCase() === 'i' || element.nodeName.toLowerCase() === 'b' || element.nodeName.toLowerCase() === 'strike')
        })

        var focusDecoratedElement = MoreEditor.util.traverseUp(delegate.range.endContainer, function(element) {
              return (element.nodeName.toLowerCase() === 'i' || element.nodeName.toLowerCase() === 'b' || element.nodeName.toLowerCase() === 'strike')
        })

        /* 可以确定我们的 anchorNode 在 装饰标签内。并且这个装饰标签不包含 focusNode */
        if(anchorDecoratedElement) {
          
          MoreEditor.selection.select(document, delegate.range.startContainer, delegate.range.startOffset, anchorDecoratedElement, anchorDecoratedElement.childNodes.length) // 选中重叠部分
          anchorOverlap = MoreEditor.selection.saveSelection(delegate.closestBlock)  //  存储当前选区（装饰标签与选区重叠的部分）
          
          /* 对装饰标签与选区交叉的部分取消装饰效果 */
          if (anchorDecoratedElement.nodeName.toLowerCase() === 'i') {
            document.execCommand('italic', false)
            anchorDecorateCommand = 'italic'
          } else if(anchorDecoratedElement.nodeName.toLowerCase() === 'strike') {
            document.execCommand('strikeThrough', false)
            anchorDecorateCommand = 'strikeThrough'
          } else if(anchorDecoratedElement.nodeName.toLowerCase() === 'b') {
            document.execCommand('bold', false)
            anchorDecorateCommand = 'bold'
          } else {
            console.log('%c出错了')
          }
        }

        /* 可以确定我们的 focusNode 在 装饰标签内。并且这个装饰标签不包含 anchorNode */
        if(focusDecoratedElement) {
          
          MoreEditor.selection.select(document, focusDecoratedElement, 0, delegate.range.endContainer, delegate.range.endOffset) // 选中重叠部分
          focusOverlap = MoreEditor.selection.saveSelection(delegate.closestBlock)  //  存储当前选区（装饰标签与选区重叠的部分）
          
          /* 对装饰标签与选区交叉的部分取消装饰效果 */
          if (focusDecoratedElement.nodeName.toLowerCase() === 'i') {
            document.execCommand('italic', false)
            focusDecoratedCommand = 'italic'
          } else if(focusDecoratedElement.nodeName.toLowerCase() === 'strike') {
            document.execCommand('strikeThrough', false)
            focusDecoratedCommand = 'strikeThrough'
          } else if(focusDecoratedElement.nodeName.toLowerCase() === 'b') {
            document.execCommand('bold', false)
            focusDecoratedCommand = 'bold'
          } else {
            console.log('%c出错了')
          }
        }

        /* 重叠部分装饰效果已经取消了，现在可以执行链接操作 */
        MoreEditor.selection.restoreSelection(delegate.closestBlock, origSelection)  // 恢复要执行链接的选区
        document.execCommand('createLink', false, url.trim())

        /* 恢复原重叠部分的装饰效果 */
        if(anchorDecorateCommand) {
          MoreEditor.selection.restoreSelection(delegate.closestBlock, anchorOverlap) // 恢复开始处重叠部分的选区
          document.execCommand(anchorDecorateCommand, false)
        }
        if(focusDecoratedCommand) {
          MoreEditor.selection.restoreSelection(delegate.closestBlock, focusOverlap) // 恢复开始处重叠部分的选区
          document.execCommand(focusDecoratedCommand, false)
        }

        MoreEditor.selection.restoreSelection(delegate.closestBlock, origSelection)  // 恢复最开始的选区并退出
        return

      } else {

        document.execCommand('createLink', false, url.trim())
        return
      }
    },

    exportSelection: function() {
      this.base.delegate.updateStatus()
      this.savedSelection = MoreEditor.selection.saveSelection(this.base.editableElement)
    },

    importSelection: function() {
      MoreEditor.selection.restoreSelection(this.base.editableElement, this.savedSelection)
    }
  }

  MoreEditor.API = API
}());
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

function handleKeydown(event) {
    handleBackAndEnterKeydown.call(this, event)
    checkCaretPosition.call(this, event)
}

function handleKeyup(event) {
    keepAtleastOneParagraph.call(this, event)
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
    this.on(this.editableElement, 'keydown', handleKeydown.bind(this))
    this.on(this.editableElement, 'keyup', handleKeyup.bind(this))
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


    return MoreEditor;
}()));  // eslint-disable-line

