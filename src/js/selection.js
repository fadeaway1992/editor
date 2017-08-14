/* eslint-disable no-undef */

(function () {
    'use strict';

    /*
        Gets the offset of a node within another node. Text nodes are
        counted a n where n is the length. Entering (or passing) an
        element is one offset. Exiting is 0.
        精准的存储与还原选区时用到的函数
    */
    var getNodeOffset = function(start, dest) {
        var offset = 0;

        var node = start;
        var stack = [];

        while (true) {
            if (node === dest) {
                return offset;
            }

            // Go into children
            if (node.firstChild) {
                // Going into first one doesn't count
                if (node !== start)
                    offset += 1;
                stack.push(node);
                node = node.firstChild;
            }
            // If can go to next sibling
            else if (stack.length > 0 && node.nextSibling) {
            // If text, count length (plus 1)
                if (node.nodeType === 3)
                    offset += node.nodeValue.length + 1;
                else
                    offset += 1;

                node = node.nextSibling;
            }
            else {
                // If text, count length
                if (node.nodeType === 3)
                    offset += node.nodeValue.length + 1;
                else
                    offset += 1;

                // No children or siblings, move up stack
                while (true) {
                    if (stack.length <= 1)
                        return offset;

                    var next = stack.pop();

                    // Go to sibling
                    if (next.nextSibling) {
                        node = next.nextSibling;
                        break;
                    }
                }
            }
        }
    };

    // Calculate the total offsets of a node
    /* 精准的存储与还原选区的时候用到的函数 */
    var calculateNodeOffset = function(node) {
        var offset = 0;

        // If text, count length
        if (node.nodeType === 3)
            offset += node.nodeValue.length + 1;
        else
            offset += 1;

        if (node.childNodes) {
            for (var i=0;i<node.childNodes.length;i++) {
                offset += calculateNodeOffset(node.childNodes[i]);
            }
        }

        return offset;
    };

    // Determine total offset length from returned offset from ranges
    /* 精准的存储与还原选区的时候用到的函数 */
    var totalOffsets = function(parentNode, offset) {
        if (parentNode.nodeType == 3)
            return offset;

        if (parentNode.nodeType == 1) {
            var total = 0;
            // Get child nodes
            for (var i=0;i<offset;i++) {
                total += calculateNodeOffset(parentNode.childNodes[i]);
            }
            return total;
        }

        return 0;
    };

    /* 精准的存储与还原选区的时候用到的函数 */
    var getNodeAndOffsetAt = function(start, offset) {
        var node = start;
        var stack = [];

        while (true) {
            // If arrived
            if (offset <= 0)
                return { node: node, offset: 0 };

            // If will be within current text node
            if (node.nodeType == 3 && (offset <= node.nodeValue.length))
                return { node: node, offset: Math.min(offset, node.nodeValue.length) };

            // Go into children (first one doesn't count)
            if (node.firstChild) {
                if (node !== start)
                    offset -= 1;
                stack.push(node);
                node = node.firstChild;
            }
            // If can go to next sibling
            else if (stack.length > 0 && node.nextSibling) {
                // If text, count length
                if (node.nodeType === 3)
                    offset -= node.nodeValue.length + 1;
                else
                    offset -= 1;

                node = node.nextSibling;
            }
            else {
                // No children or siblings, move up stack
                while (true) {
                    if (stack.length <= 1) {
                    // No more options, use current node
                        if (node.nodeType == 3)
                            return { node: node, offset: Math.min(offset, node.nodeValue.length) };
                        else
                            return { node: node, offset: 0 };
                    }

                    var next = stack.pop();

                    // Go to sibling
                    if (next.nextSibling) {
                        // If text, count length
                        if (node.nodeType === 3)
                            offset -= node.nodeValue.length + 1;
                        else
                            offset -= 1;

                        node = next.nextSibling;
                        break;
                    }
                }
            }
        }
    };

    var Selection = {
        /**
         *  Find the caret position within an element irrespective of any inline tags it may contain.
         *
         *  @param {DOMElement} An element containing the cursor to find offsets relative to.
         *  @param {Range} A Range representing cursor position. Will window.getSelection if none is passed.
         *  @return {Object} 'left' and 'right' attributes contain offsets from begining and end of Element
         *  确定当前光标的位置
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
         * 将光标移到指定的位置
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

        /* 保存选区 */
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

        /* 恢复选区 */
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
        },

        /* 精准储存选区 */
        saveSelectionPrecise: function(containerEl) {
            var selection = window.getSelection();
            if (selection.rangeCount > 0) {
                var range = selection.getRangeAt(0);
                return {
                    start: getNodeOffset(containerEl, range.startContainer) + totalOffsets(range.startContainer, range.startOffset),
                    end: getNodeOffset(containerEl, range.endContainer) + totalOffsets(range.endContainer, range.endOffset)
                };
            }
            else
                return null;
        },

        /* 精准还原选区 */
        restoreSelectionPrecise: function(containerEl, savedSel) {
            if (!savedSel)
                return;

            var range = document.createRange();

            var startNodeOffset, endNodeOffset;
            startNodeOffset = getNodeAndOffsetAt(containerEl, savedSel.start);
            endNodeOffset = getNodeAndOffsetAt(containerEl, savedSel.end);

            range.setStart(startNodeOffset.node, startNodeOffset.offset);
            range.setEnd(endNodeOffset.node, endNodeOffset.offset);

            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    MoreEditor.selection = Selection;
}());

/* eslint-enable no-undef */