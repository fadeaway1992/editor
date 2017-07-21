

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
            console.log('execFormatBlock 函数执行')
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

            var unwrapSelf = root.querySelectorAll(selector1)
            for(var i=0; i<unwrapSelf.length; i++) {
            this.unwrap(unwrapSelf[i], document)
            }

            var unwrapParent = root.querySelectorAll(selector2)
            for(var i=0; i<unwrapParent.length; i++) {
            this.unwrap(unwrapParent[i].parentNode, document)
            }
        }
    };

    MoreEditor.util = Util;
}(window));



