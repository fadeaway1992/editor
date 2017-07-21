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