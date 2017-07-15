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
/* eslint-disable no-undef */

/*global NodeFilter*/

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
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'
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

        /*
         * Create a link around the provided text nodes which must be adjacent to each other and all be
         * descendants of the same closest block container. If the preconditions are not met, unexpected
         * behavior will result.
         */
        createLink: function (document, textNodes, href, target) {
            var anchor = document.createElement('a');
            Util.moveTextRangeIntoElement(textNodes[0], textNodes[textNodes.length - 1], anchor);
            anchor.setAttribute('href', href);
            if (target) {
                anchor.setAttribute('target', target);
            }
            return anchor;
        },

        /*
         * Given the provided match in the format {start: 1, end: 2} where start and end are indices into the
         * textContent of the provided element argument, modify the DOM inside element to ensure that the text
         * identified by the provided match can be returned as text nodes that contain exactly that text, without
         * any additional text at the beginning or end of the returned array of adjacent text nodes.
         *
         * The only DOM manipulation performed by this function is splitting the text nodes, non-text nodes are
         * not affected in any way.
         */
        findOrCreateMatchingTextNodes: function (document, element, match) {
            var treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_ALL, null, false),
                matchedNodes = [],
                currentTextIndex = 0,
                startReached = false,
                currentNode = null,
                newNode = null;

            while ((currentNode = treeWalker.nextNode()) !== null) {
                if (currentNode.nodeType > 3) {
                    continue;
                } else if (currentNode.nodeType === 3) {
                    if (!startReached && match.start < (currentTextIndex + currentNode.nodeValue.length)) {
                        startReached = true;
                        newNode = Util.splitStartNodeIfNeeded(currentNode, match.start, currentTextIndex);
                    }
                    if (startReached) {
                        Util.splitEndNodeIfNeeded(currentNode, newNode, match.end, currentTextIndex);
                    }
                    if (startReached && currentTextIndex === match.end) {
                        break; // Found the node(s) corresponding to the link. Break out and move on to the next.
                    } else if (startReached && currentTextIndex > (match.end + 1)) {
                        throw new Error('PerformLinking overshot the target!'); // should never happen...
                    }

                    if (startReached) {
                        matchedNodes.push(newNode || currentNode);
                    }

                    currentTextIndex += currentNode.nodeValue.length;
                    if (newNode !== null) {
                        currentTextIndex += newNode.nodeValue.length;
                        // Skip the newNode as we'll already have pushed it to the matches
                        treeWalker.nextNode();
                    }
                    newNode = null;
                } else if (currentNode.tagName.toLowerCase() === 'img') {
                    if (!startReached && (match.start <= currentTextIndex)) {
                        startReached = true;
                    }
                    if (startReached) {
                        matchedNodes.push(currentNode);
                    }
                }
            }
            return matchedNodes;
        },

        /*
         * Given the provided text node and text coordinates, split the text node if needed to make it align
         * precisely with the coordinates.
         *
         * This function is intended to be called from Util.findOrCreateMatchingTextNodes.
         */
        splitStartNodeIfNeeded: function (currentNode, matchStartIndex, currentTextIndex) {
            if (matchStartIndex !== currentTextIndex) {
                return currentNode.splitText(matchStartIndex - currentTextIndex);
            }
            return null;
        },

        /*
         * Given the provided text node and text coordinates, split the text node if needed to make it align
         * precisely with the coordinates. The newNode argument should from the result of Util.splitStartNodeIfNeeded,
         * if that function has been called on the same currentNode.
         *
         * This function is intended to be called from Util.findOrCreateMatchingTextNodes.
         */
        splitEndNodeIfNeeded: function (currentNode, newNode, matchEndIndex, currentTextIndex) {
            var textIndexOfEndOfFarthestNode,
                endSplitPoint;
            textIndexOfEndOfFarthestNode = currentTextIndex + currentNode.nodeValue.length +
                    (newNode ? newNode.nodeValue.length : 0) - 1;
            endSplitPoint = matchEndIndex - currentTextIndex -
                    (newNode ? currentNode.nodeValue.length : 0);
            if (textIndexOfEndOfFarthestNode >= matchEndIndex &&
                    currentTextIndex !== textIndexOfEndOfFarthestNode &&
                    endSplitPoint !== 0) {
                (newNode || currentNode).splitText(endSplitPoint);
            }
        },

        /*
        * Take an element, and break up all of its text content into unique pieces such that:
         * 1) All text content of the elements are in separate blocks. No piece of text content should span
         *    across multiple blocks. This means no element return by this function should have
         *    any blocks as children.
         * 2) The union of the textcontent of all of the elements returned here covers all
         *    of the text within the element.
         *
         *
         * EXAMPLE:
         * In the event that we have something like:
         *
         * <blockquote>
         *   <p>Some Text</p>
         *   <ol>
         *     <li>List Item 1</li>
         *     <li>List Item 2</li>
         *   </ol>
         * </blockquote>
         *
         * This function would return these elements as an array:
         *   [ <p>Some Text</p>, <li>List Item 1</li>, <li>List Item 2</li> ]
         *
         * Since the <blockquote> and <ol> elements contain blocks within them they are not returned.
         * Since the <p> and <li>'s don't contain block elements and cover all the text content of the
         * <blockquote> container, they are the elements returned.
         */
        splitByBlockElements: function (element) {
            if (element.nodeType !== 3 && element.nodeType !== 1) {
                return [];
            }

            var toRet = [],
                blockElementQuery = MoreEditor.util.blockContainerElementNames.join(',');

            if (element.nodeType === 3 || element.querySelectorAll(blockElementQuery).length === 0) {
                return [element];
            }

            for (var i = 0; i < element.childNodes.length; i++) {
                var child = element.childNodes[i];
                if (child.nodeType === 3) {
                    toRet.push(child);
                } else if (child.nodeType === 1) {
                    var blockElements = child.querySelectorAll(blockElementQuery);
                    if (blockElements.length === 0) {
                        toRet.push(child);
                    } else {
                        toRet = toRet.concat(MoreEditor.util.splitByBlockElements(child));
                    }
                }
            }

            return toRet;
        },

        // Find the next node in the DOM tree that represents any text that is being
        // displayed directly next to the targetNode (passed as an argument)
        // Text that appears directly next to the current node can be:
        //  - A sibling text node
        //  - A descendant of a sibling element
        //  - A sibling text node of an ancestor
        //  - A descendant of a sibling element of an ancestor
        findAdjacentTextNodeWithContent: function findAdjacentTextNodeWithContent(rootNode, targetNode, ownerDocument) {
            var pastTarget = false,
                nextNode,
                nodeIterator = ownerDocument.createNodeIterator(rootNode, NodeFilter.SHOW_TEXT, null, false);

            // Use a native NodeIterator to iterate over all the text nodes that are descendants
            // of the rootNode.  Once past the targetNode, choose the first non-empty text node
            nextNode = nodeIterator.nextNode();
            while (nextNode) {
                if (nextNode === targetNode) {
                    pastTarget = true;
                } else if (pastTarget) {
                    if (nextNode.nodeType === 3 && nextNode.nodeValue && nextNode.nodeValue.trim().length > 0) {
                        break;
                    }
                }
                nextNode = nodeIterator.nextNode();
            }

            return nextNode;
        },

        // Find an element's previous sibling within a medium-editor element
        // If one doesn't exist, find the closest ancestor's previous sibling
        findPreviousSibling: function (node) {
            if (!node || Util.isMoreEditorElement(node)) {
                return false;
            }

            var previousSibling = node.previousSibling;
            while (!previousSibling && !Util.isMoreEditorElement(node.parentNode)) {
                node = node.parentNode;
                previousSibling = node.previousSibling;
            }

            return previousSibling;
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

        // https://github.com/jashkenas/underscore
        isElement: function isElement(obj) {
            return !!(obj && obj.nodeType === 1);
        },

        // https://github.com/jashkenas/underscore
        throttle: function (func, wait) {
            var THROTTLE_INTERVAL = 50,
                context,
                args,
                result,
                timeout = null,
                previous = 0,
                later = function () {
                    previous = Date.now();
                    timeout = null;
                    result = func.apply(context, args);
                    if (!timeout) {
                        context = args = null;
                    }
                };

            if (!wait && wait !== 0) {
                wait = THROTTLE_INTERVAL;
            }

            return function () {
                var now = Date.now(),
                    remaining = wait - (now - previous);

                context = this;
                args = arguments;
                if (remaining <= 0 || remaining > wait) {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    previous = now;
                    result = func.apply(context, args);
                    if (!timeout) {
                        context = args = null;
                    }
                } else if (!timeout) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
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

        htmlEntities: function (str) {
            // converts special characters (like <) into their escaped/encoded values (like &lt;).
            // This allows you to show to display the string without the browser reading it as HTML.
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        },

        // http://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div
        insertHTMLCommand: function (doc, html) {
            var selection, range, el, fragment, node, lastNode, toReplace,
                res = false,
                ecArgs = ['insertHTML', false, html];

            /* Edge's implementation of insertHTML is just buggy right now:
             * - Doesn't allow leading white space at the beginning of an element
             * - Found a case when a <font size="2"> tag was inserted when calling alignCenter inside a blockquote
             *
             * There are likely other bugs, these are just the ones we found so far.
             * For now, let's just use the same fallback we did for IE
             */
            if (!MoreEditor.util.isEdge && doc.queryCommandSupported('insertHTML')) {
                try {
                    return doc.execCommand.apply(doc, ecArgs);
                } catch (ignore) {}
            }

            selection = doc.getSelection();
            if (selection.rangeCount) {
                range = selection.getRangeAt(0);
                toReplace = range.commonAncestorContainer;

                // https://github.com/yabwe/medium-editor/issues/748
                // If the selection is an empty editor element, create a temporary text node inside of the editor
                // and select it so that we don't delete the editor element
                if (Util.isMoreEditorElement(toReplace) && !toReplace.firstChild) {
                    range.selectNode(toReplace.appendChild(doc.createTextNode('')));
                } else if ((toReplace.nodeType === 3 && range.startOffset === 0 && range.endOffset === toReplace.nodeValue.length) ||
                        (toReplace.nodeType !== 3 && toReplace.innerHTML === range.toString())) {
                    // Ensure range covers maximum amount of nodes as possible
                    // By moving up the DOM and selecting ancestors whose only child is the range
                    while (!Util.isMoreEditorElement(toReplace) &&
                            toReplace.parentNode &&
                            toReplace.parentNode.childNodes.length === 1 &&
                            !Util.isMoreEditorElement(toReplace.parentNode)) {
                        toReplace = toReplace.parentNode;
                    }
                    range.selectNode(toReplace);
                }
                range.deleteContents();

                el = doc.createElement('div');
                el.innerHTML = html;
                fragment = doc.createDocumentFragment();
                while (el.firstChild) {
                    node = el.firstChild;
                    lastNode = fragment.appendChild(node);
                }
                range.insertNode(fragment);

                // Preserve the selection:
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    range.collapse(true);
                    MoreEditor.selection.selectRange(doc, range);
                }
                res = true;
            }

            // https://github.com/yabwe/medium-editor/issues/992
            // If we're monitoring calls to execCommand, notify listeners as if a real call had happened
            if (doc.execCommand.callListeners) {
                doc.execCommand.callListeners(ecArgs, res);
            }
            return res;
        },

        execFormatBlock: function (doc, tagName) {
            // Get the top level block element that contains the selection
            var blockContainer = Util.getTopBlockContainer(MoreEditor.selection.getSelectionStart(doc)),
                childNodes;

            // Special handling for blockquote
            if (tagName === 'blockquote') {
                if (blockContainer) {
                    childNodes = Array.prototype.slice.call(blockContainer.childNodes);
                    // Check if the blockquote has a block element as a child (nested blocks)
                    if (childNodes.some(function (childNode) {
                        return Util.isBlockContainer(childNode);
                    })) {
                        // FF handles blockquote differently on formatBlock
                        // allowing nesting, we need to use outdent
                        // https://developer.mozilla.org/en-US/docs/Rich-Text_Editing_in_Mozilla
                        return doc.execCommand('outdent', false, null);
                    }
                }

                // When IE blockquote needs to be called as indent
                // http://stackoverflow.com/questions/1816223/rich-text-editor-with-blockquote-function/1821777#1821777
                if (Util.isIE) {
                    return doc.execCommand('indent', false, tagName);
                }
            }

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

            // When FF, IE and Edge, we have to handle blockquote node seperately as 'formatblock' does not work.
            // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#Commands
            if (blockContainer && blockContainer.nodeName.toLowerCase() === 'blockquote') {
                // For IE, just use outdent
                if (Util.isIE && tagName === '<p>') {
                    return doc.execCommand('outdent', false, tagName);
                }

                // For Firefox and Edge, make sure there's a nested block element before calling outdent
                if ((Util.isFF || Util.isEdge) && tagName === 'p') {
                    childNodes = Array.prototype.slice.call(blockContainer.childNodes);
                    // If there are some non-block elements we need to wrap everything in a <p> before we outdent
                    if (childNodes.some(function (childNode) {
                        return !Util.isBlockContainer(childNode);
                    })) {
                        doc.execCommand('formatBlock', false, tagName);
                    }
                    return doc.execCommand('outdent', false, tagName);
                }
            }

            return doc.execCommand('formatBlock', false, tagName);
        },

        /**
         * Set target to blank on the given el element
         *
         * TODO: not sure if this should be here
         *
         * When creating a link (using core -> createLink) the selection returned by Firefox will be the parent of the created link
         * instead of the created link itself (as it is for Chrome for example), so we retrieve all "a" children to grab the good one by
         * using `anchorUrl` to ensure that we are adding target="_blank" on the good one.
         * This isn't a bulletproof solution anyway ..
         */
        setTargetBlank: function (el, anchorUrl) {
            var i, url = anchorUrl || false;
            if (el.nodeName.toLowerCase() === 'a') {
                el.target = '_blank';
            } else {
                el = el.getElementsByTagName('a');

                for (i = 0; i < el.length; i += 1) {
                    if (false === url || url === el[i].attributes.href.value) {
                        el[i].target = '_blank';
                    }
                }
            }
        },

        /*
         * this function is called to explicitly remove the target='_blank' as FF holds on to _blank value even
         * after unchecking the checkbox on anchor form
         */
        removeTargetBlank: function (el, anchorUrl) {
            var i;
            if (el.nodeName.toLowerCase() === 'a') {
                el.removeAttribute('target');
            } else {
                el = el.getElementsByTagName('a');

                for (i = 0; i < el.length; i += 1) {
                    if (anchorUrl === el[i].attributes.href.value) {
                        el[i].removeAttribute('target');
                    }
                }
            }
        },

        /*
         * this function adds one or several classes on an a element.
         * if el parameter is not an a, it will look for a children of el.
         * if no a children are found, it will look for the a parent.
         */
        addClassToAnchors: function (el, buttonClass) {
            var classes = buttonClass.split(' '),
                i,
                j;
            if (el.nodeName.toLowerCase() === 'a') {
                for (j = 0; j < classes.length; j += 1) {
                    el.classList.add(classes[j]);
                }
            } else {
                var aChildren = el.getElementsByTagName('a');
                if (aChildren.length === 0) {
                    var parentAnchor = Util.getClosestTag(el, 'a');
                    el = parentAnchor ? [parentAnchor] : [];
                } else {
                    el = aChildren;
                }
                for (i = 0; i < el.length; i += 1) {
                    for (j = 0; j < classes.length; j += 1) {
                        el[i].classList.add(classes[j]);
                    }
                }
            }
        },

        isListItem: function (node) {
            if (!node) {
                return false;
            }
            if (node.nodeName.toLowerCase() === 'li') {
                return true;
            }

            var parentNode = node.parentNode,
                tagName = parentNode.nodeName.toLowerCase();
            while (tagName === 'li' || (!Util.isBlockContainer(parentNode) && tagName !== 'div')) {
                if (tagName === 'li') {
                    return true;
                }
                parentNode = parentNode.parentNode;
                if (parentNode) {
                    tagName = parentNode.nodeName.toLowerCase();
                } else {
                    return false;
                }
            }
            return false;
        },

        cleanListDOM: function (ownerDocument, element) {
            if (element.nodeName.toLowerCase() !== 'li') {
                return;
            }

            var list = element.parentElement;

            if (list.parentElement.nodeName.toLowerCase() === 'p') { // yes we need to clean up
                Util.unwrap(list.parentElement, ownerDocument);

                // move cursor at the end of the text inside the list
                // for some unknown reason, the cursor is moved to end of the "visual" line
                MoreEditor.selection.moveCursor(ownerDocument, element.firstChild, element.firstChild.textContent.length);
            }
        },

        /* splitDOMTree
         *
         * Given a root element some descendant element, split the root element
         * into its own element containing the descendant element and all elements
         * on the left or right side of the descendant ('right' is default)
         *
         * example:
         *
         *         <div>
         *      /    |   \
         *  <span> <span> <span>
         *   / \    / \    / \
         *  1   2  3   4  5   6
         *
         *  If I wanted to split this tree given the <div> as the root and "4" as the leaf
         *  the result would be (the prime ' marks indicates nodes that are created as clones):
         *
         *   SPLITTING OFF 'RIGHT' TREE       SPLITTING OFF 'LEFT' TREE
         *
         *     <div>            <div>'              <div>'      <div>
         *      / \              / \                 / \          |
         * <span> <span>   <span>' <span>       <span> <span>   <span>
         *   / \    |        |      / \           /\     /\       /\
         *  1   2   3        4     5   6         1  2   3  4     5  6
         *
         *  The above example represents splitting off the 'right' or 'left' part of a tree, where
         *  the <div>' would be returned as an element not appended to the DOM, and the <div>
         *  would remain in place where it was
         *
        */
        splitOffDOMTree: function (rootNode, leafNode, splitLeft) {
            var splitOnNode = leafNode,
                createdNode = null,
                splitRight = !splitLeft;

            // loop until we hit the root
            while (splitOnNode !== rootNode) {
                var currParent = splitOnNode.parentNode,
                    newParent = currParent.cloneNode(false),
                    targetNode = (splitRight ? splitOnNode : currParent.firstChild),
                    appendLast;

                // Create a new parent element which is a clone of the current parent
                if (createdNode) {
                    if (splitRight) {
                        // If we're splitting right, add previous created element before siblings
                        newParent.appendChild(createdNode);
                    } else {
                        // If we're splitting left, add previous created element last
                        appendLast = createdNode;
                    }
                }
                createdNode = newParent;

                while (targetNode) {
                    var sibling = targetNode.nextSibling;
                    // Special handling for the 'splitNode'
                    if (targetNode === splitOnNode) {
                        if (!targetNode.hasChildNodes()) {
                            targetNode.parentNode.removeChild(targetNode);
                        } else {
                            // For the node we're splitting on, if it has children, we need to clone it
                            // and not just move it
                            targetNode = targetNode.cloneNode(false);
                        }
                        // If the resulting split node has content, add it
                        if (targetNode.textContent) {
                            createdNode.appendChild(targetNode);
                        }

                        targetNode = (splitRight ? sibling : null);
                    } else {
                        // For general case, just remove the element and only
                        // add it to the split tree if it contains something
                        targetNode.parentNode.removeChild(targetNode);
                        if (targetNode.hasChildNodes() || targetNode.textContent) {
                            createdNode.appendChild(targetNode);
                        }

                        targetNode = sibling;
                    }
                }

                // If we had an element we wanted to append at the end, do that now
                if (appendLast) {
                    createdNode.appendChild(appendLast);
                }

                splitOnNode = currParent;
            }

            return createdNode;
        },

        moveTextRangeIntoElement: function (startNode, endNode, newElement) {
            if (!startNode || !endNode) {
                return false;
            }

            var rootNode = Util.findCommonRoot(startNode, endNode);
            if (!rootNode) {
                return false;
            }

            if (endNode === startNode) {
                var temp = startNode.parentNode,
                    sibling = startNode.nextSibling;
                temp.removeChild(startNode);
                newElement.appendChild(startNode);
                if (sibling) {
                    temp.insertBefore(newElement, sibling);
                } else {
                    temp.appendChild(newElement);
                }
                return newElement.hasChildNodes();
            }

            // create rootChildren array which includes all the children
            // we care about
            var rootChildren = [],
                firstChild,
                lastChild,
                nextNode;
            for (var i = 0; i < rootNode.childNodes.length; i++) {
                nextNode = rootNode.childNodes[i];
                if (!firstChild) {
                    if (Util.isDescendant(nextNode, startNode, true)) {
                        firstChild = nextNode;
                    }
                } else {
                    if (Util.isDescendant(nextNode, endNode, true)) {
                        lastChild = nextNode;
                        break;
                    } else {
                        rootChildren.push(nextNode);
                    }
                }
            }

            var afterLast = lastChild.nextSibling,
                fragment = rootNode.ownerDocument.createDocumentFragment();

            // build up fragment on startNode side of tree
            if (firstChild === startNode) {
                firstChild.parentNode.removeChild(firstChild);
                fragment.appendChild(firstChild);
            } else {
                fragment.appendChild(Util.splitOffDOMTree(firstChild, startNode));
            }

            // add any elements between firstChild & lastChild
            rootChildren.forEach(function (element) {
                element.parentNode.removeChild(element);
                fragment.appendChild(element);
            });

            // build up fragment on endNode side of the tree
            if (lastChild === endNode) {
                lastChild.parentNode.removeChild(lastChild);
                fragment.appendChild(lastChild);
            } else {
                fragment.appendChild(Util.splitOffDOMTree(lastChild, endNode, true));
            }

            // Add fragment into passed in element
            newElement.appendChild(fragment);

            if (lastChild.parentNode === rootNode) {
                // If last child is in the root, insert newElement in front of it
                rootNode.insertBefore(newElement, lastChild);
            } else if (afterLast) {
                // If last child was removed, but it had a sibling, insert in front of it
                rootNode.insertBefore(newElement, afterLast);
            } else {
                // lastChild was removed and was the last actual element just append
                rootNode.appendChild(newElement);
            }

            return newElement.hasChildNodes();
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

        isMoreEditorElement: function (element) {
            return element && element.getAttribute && !!element.getAttribute('data-medium-editor-element');
        },

        getContainerEditorElement: function (element) {
            return Util.traverseUp(element, function (node) {
                return Util.isMoreEditorElement(node);
            });
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
        getTopBlockContainer: function (element) {
            var topBlock = Util.isBlockContainer(element) ? element : false;
            Util.traverseUp(element, function (el) {
                if (Util.isBlockContainer(el)) {
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

        getFirstSelectableLeafNode: function (element) {
            while (element && element.firstChild) {
                element = element.firstChild;
            }

            // We don't want to set the selection to an element that can't have children, this messes up Gecko.
            element = Util.traverseUp(element, function (el) {
                return Util.emptyElementNames.indexOf(el.nodeName.toLowerCase()) === -1;
            });
            // Selecting at the beginning of a table doesn't work in PhantomJS.
            if (element.nodeName.toLowerCase() === 'table') {
                var firstCell = element.querySelector('th, td');
                if (firstCell) {
                    element = firstCell;
                }
            }
            return element;
        },

        // TODO: remove getFirstTextNode AND _getFirstTextNode when jumping in 6.0.0 (no code references)
        getFirstTextNode: function (element) {
            Util.warn('getFirstTextNode is deprecated and will be removed in version 6.0.0');
            return Util._getFirstTextNode(element);
        },

        _getFirstTextNode: function (element) {
            if (element.nodeType === 3) {
                return element;
            }

            for (var i = 0; i < element.childNodes.length; i++) {
                var textNode = Util._getFirstTextNode(element.childNodes[i]);
                if (textNode !== null) {
                    return textNode;
                }
            }
            return null;
        },

        ensureUrlHasProtocol: function (url) {
            if (url.indexOf('://') === -1) {
                return 'http://' + url;
            }
            return url;
        },

        warn: function () {
            if (window.console !== undefined && typeof window.console.warn === 'function') {
                window.console.warn.apply(window.console, arguments);
            }
        },

        deprecated: function (oldName, newName, version) {
            // simple deprecation warning mechanism.
            var m = oldName + ' is deprecated, please use ' + newName + ' instead.';
            if (version) {
                m += ' Will be removed in ' + version;
            }
            Util.warn(m);
        },

        deprecatedMethod: function (oldName, newName, args, version) {
            // run the replacement and warn when someone calls a deprecated method
            Util.deprecated(oldName, newName, version);
            if (typeof this[newName] === 'function') {
                this[newName].apply(this, args);
            }
        },

        cleanupAttrs: function (el, attrs) {
            attrs.forEach(function (attr) {
                el.removeAttribute(attr);
            });
        },

        cleanupTags: function (el, tags) {
            if (tags.indexOf(el.nodeName.toLowerCase()) !== -1) {
                el.parentNode.removeChild(el);
            }
        },

        unwrapTags: function (el, tags) {
            if (tags.indexOf(el.nodeName.toLowerCase()) !== -1) {
                MoreEditor.util.unwrap(el, document);
            }
        },

        // get the closest parent
        getClosestTag: function (el, tag) {
            return Util.traverseUp(el, function (element) {
                return element.nodeName.toLowerCase() === tag.toLowerCase();
            });
        },

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

        guid: function () {
            function _s4() {
                return Math
                    .floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return _s4() + _s4() + '-' + _s4() + '-' + _s4() + '-' + _s4() + '-' + _s4() + _s4() + _s4();
        }
    };

    MoreEditor.util = Util;
}(window));


/* eslint-enable no-undef */

/* eslint-disable no-undef */

(function () {
    'use strict';

    function filterOnlyParentElements(node) {
        if (MoreEditor.util.isBlockContainer(node)) {
            return NodeFilter.FILTER_ACCEPT;
        } else {
            return NodeFilter.FILTER_SKIP;
        }
    }

    var Selection = {
        findMatchingSelectionParent: function (testElementFunction, contentWindow) {
            var selection = contentWindow.getSelection(),
                range,
                current;

            if (selection.rangeCount === 0) {
                return false;
            }

            range = selection.getRangeAt(0);
            current = range.commonAncestorContainer;

            return MoreEditor.util.traverseUp(current, testElementFunction);
        },

        getSelectionElement: function (contentWindow) {
            return this.findMatchingSelectionParent(function (el) {
                return MoreEditor.util.isMoreEditorElement(el);
            }, contentWindow);
        },

        // http://stackoverflow.com/questions/17678843/cant-restore-selection-after-html-modify-even-if-its-the-same-html
        // Tim Down
        exportSelection: function (root, doc) {
            if (!root) {
                return null;
            }

            var selectionState = null,
                selection = doc.getSelection();

            if (selection.rangeCount > 0) {
                var range = selection.getRangeAt(0),
                    preSelectionRange = range.cloneRange(),
                    start;

                preSelectionRange.selectNodeContents(root);
                preSelectionRange.setEnd(range.startContainer, range.startOffset);
                start = preSelectionRange.toString().length;

                selectionState = {
                    start: start,
                    end: start + range.toString().length
                };

                // Check to see if the selection starts with any images
                // if so we need to make sure the the beginning of the selection is
                // set correctly when importing selection
                if (this.doesRangeStartWithImages(range, doc)) {
                    selectionState.startsWithImage = true;
                }

                // Check to see if the selection has any trailing images
                // if so, this this means we need to look for them when we import selection
                var trailingImageCount = this.getTrailingImageCount(root, selectionState, range.endContainer, range.endOffset);
                if (trailingImageCount) {
                    selectionState.trailingImageCount = trailingImageCount;
                }

                // If start = 0 there may still be an empty paragraph before it, but we don't care.
                if (start !== 0) {
                    var emptyBlocksIndex = this.getIndexRelativeToAdjacentEmptyBlocks(doc, root, range.startContainer, range.startOffset);
                    if (emptyBlocksIndex !== -1) {
                        selectionState.emptyBlocksIndex = emptyBlocksIndex;
                    }
                }
            }

            return selectionState;
        },

        // http://stackoverflow.com/questions/17678843/cant-restore-selection-after-html-modify-even-if-its-the-same-html
        // Tim Down
        //
        // {object} selectionState - the selection to import
        // {DOMElement} root - the root element the selection is being restored inside of
        // {Document} doc - the document to use for managing selection
        // {boolean} [favorLaterSelectionAnchor] - defaults to false. If true, import the cursor immediately
        //      subsequent to an anchor tag if it would otherwise be placed right at the trailing edge inside the
        //      anchor. This cursor positioning, even though visually equivalent to the user, can affect behavior
        //      in MS IE.
        importSelection: function (selectionState, root, doc, favorLaterSelectionAnchor) {
            if (!selectionState || !root) {
                return;
            }

            var range = doc.createRange();
            range.setStart(root, 0);
            range.collapse(true);

            var node = root,
                nodeStack = [],
                charIndex = 0,
                foundStart = false,
                foundEnd = false,
                trailingImageCount = 0,
                stop = false,
                nextCharIndex,
                allowRangeToStartAtEndOfNode = false,
                lastTextNode = null;

            // When importing selection, the start of the selection may lie at the end of an element
            // or at the beginning of an element.  Since visually there is no difference between these 2
            // we will try to move the selection to the beginning of an element since this is generally
            // what users will expect and it's a more predictable behavior.
            //
            // However, there are some specific cases when we don't want to do this:
            //  1) We're attempting to move the cursor outside of the end of an anchor [favorLaterSelectionAnchor = true]
            //  2) The selection starts with an image, which is special since an image doesn't have any 'content'
            //     as far as selection and ranges are concerned
            //  3) The selection starts after a specified number of empty block elements (selectionState.emptyBlocksIndex)
            //
            // For these cases, we want the selection to start at a very specific location, so we should NOT
            // automatically move the cursor to the beginning of the first actual chunk of text
            if (favorLaterSelectionAnchor || selectionState.startsWithImage || typeof selectionState.emptyBlocksIndex !== 'undefined') {
                allowRangeToStartAtEndOfNode = true;
            }

            while (!stop && node) {
                // Only iterate over elements and text nodes
                if (node.nodeType > 3) {
                    node = nodeStack.pop();
                    continue;
                }

                // If we hit a text node, we need to add the amount of characters to the overall count
                if (node.nodeType === 3 && !foundEnd) {
                    nextCharIndex = charIndex + node.length;
                    // Check if we're at or beyond the start of the selection we're importing
                    if (!foundStart && selectionState.start >= charIndex && selectionState.start <= nextCharIndex) {
                        // NOTE: We only want to allow a selection to start at the END of an element if
                        //  allowRangeToStartAtEndOfNode is true
                        if (allowRangeToStartAtEndOfNode || selectionState.start < nextCharIndex) {
                            range.setStart(node, selectionState.start - charIndex);
                            foundStart = true;
                        }
                        // We're at the end of a text node where the selection could start but we shouldn't
                        // make the selection start here because allowRangeToStartAtEndOfNode is false.
                        // However, we should keep a reference to this node in case there aren't any more
                        // text nodes after this, so that we have somewhere to import the selection to
                        else {
                            lastTextNode = node;
                        }
                    }
                    // We've found the start of the selection, check if we're at or beyond the end of the selection we're importing
                    if (foundStart && selectionState.end >= charIndex && selectionState.end <= nextCharIndex) {
                        if (!selectionState.trailingImageCount) {
                            range.setEnd(node, selectionState.end - charIndex);
                            stop = true;
                        } else {
                            foundEnd = true;
                        }
                    }
                    charIndex = nextCharIndex;
                } else {
                    if (selectionState.trailingImageCount && foundEnd) {
                        if (node.nodeName.toLowerCase() === 'img') {
                            trailingImageCount++;
                        }
                        if (trailingImageCount === selectionState.trailingImageCount) {
                            // Find which index the image is in its parent's children
                            var endIndex = 0;
                            while (node.parentNode.childNodes[endIndex] !== node) {
                                endIndex++;
                            }
                            range.setEnd(node.parentNode, endIndex + 1);
                            stop = true;
                        }
                    }

                    if (!stop && node.nodeType === 1) {
                        // this is an element
                        // add all its children to the stack
                        var i = node.childNodes.length - 1;
                        while (i >= 0) {
                            nodeStack.push(node.childNodes[i]);
                            i -= 1;
                        }
                    }
                }

                if (!stop) {
                    node = nodeStack.pop();
                }
            }

            // If we've gone through the entire text but didn't find the beginning of a text node
            // to make the selection start at, we should fall back to starting the selection
            // at the END of the last text node we found
            if (!foundStart && lastTextNode) {
                range.setStart(lastTextNode, lastTextNode.length);
                range.setEnd(lastTextNode, lastTextNode.length);
            }

            if (typeof selectionState.emptyBlocksIndex !== 'undefined') {
                range = this.importSelectionMoveCursorPastBlocks(doc, root, selectionState.emptyBlocksIndex, range);
            }

            // If the selection is right at the ending edge of a link, put it outside the anchor tag instead of inside.
            if (favorLaterSelectionAnchor) {
                range = this.importSelectionMoveCursorPastAnchor(selectionState, range);
            }

            this.selectRange(doc, range);
        },

        // Utility method called from importSelection only
        importSelectionMoveCursorPastAnchor: function (selectionState, range) {
            var nodeInsideAnchorTagFunction = function (node) {
                return node.nodeName.toLowerCase() === 'a';
            };
            if (selectionState.start === selectionState.end &&
                    range.startContainer.nodeType === 3 &&
                    range.startOffset === range.startContainer.nodeValue.length &&
                    MoreEditor.util.traverseUp(range.startContainer, nodeInsideAnchorTagFunction)) {
                var prevNode = range.startContainer,
                    currentNode = range.startContainer.parentNode;
                while (currentNode !== null && currentNode.nodeName.toLowerCase() !== 'a') {
                    if (currentNode.childNodes[currentNode.childNodes.length - 1] !== prevNode) {
                        currentNode = null;
                    } else {
                        prevNode = currentNode;
                        currentNode = currentNode.parentNode;
                    }
                }
                if (currentNode !== null && currentNode.nodeName.toLowerCase() === 'a') {
                    var currentNodeIndex = null;
                    for (var i = 0; currentNodeIndex === null && i < currentNode.parentNode.childNodes.length; i++) {
                        if (currentNode.parentNode.childNodes[i] === currentNode) {
                            currentNodeIndex = i;
                        }
                    }
                    range.setStart(currentNode.parentNode, currentNodeIndex + 1);
                    range.collapse(true);
                }
            }
            return range;
        },

        // Uses the emptyBlocksIndex calculated by getIndexRelativeToAdjacentEmptyBlocks
        // to move the cursor back to the start of the correct paragraph
        importSelectionMoveCursorPastBlocks: function (doc, root, index, range) {
            var treeWalker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, filterOnlyParentElements, false),
                startContainer = range.startContainer,
                startBlock,
                targetNode,
                currIndex = 0;
            index = index || 1; // If index is 0, we still want to move to the next block

            // Chrome counts newlines and spaces that separate block elements as actual elements.
            // If the selection is inside one of these text nodes, and it has a previous sibling
            // which is a block element, we want the treewalker to start at the previous sibling
            // and NOT at the parent of the textnode
            if (startContainer.nodeType === 3 && MoreEditor.util.isBlockContainer(startContainer.previousSibling)) {
                startBlock = startContainer.previousSibling;
            } else {
                startBlock = MoreEditor.util.getClosestBlockContainer(startContainer);
            }

            // Skip over empty blocks until we hit the block we want the selection to be in
            while (treeWalker.nextNode()) {
                if (!targetNode) {
                    // Loop through all blocks until we hit the starting block element
                    if (startBlock === treeWalker.currentNode) {
                        targetNode = treeWalker.currentNode;
                    }
                } else {
                    targetNode = treeWalker.currentNode;
                    currIndex++;
                    // We hit the target index, bail
                    if (currIndex === index) {
                        break;
                    }
                    // If we find a non-empty block, ignore the emptyBlocksIndex and just put selection here
                    if (targetNode.textContent.length > 0) {
                        break;
                    }
                }
            }

            if (!targetNode) {
                targetNode = startBlock;
            }

            // We're selecting a high-level block node, so make sure the cursor gets moved into the deepest
            // element at the beginning of the block
            range.setStart(MoreEditor.util.getFirstSelectableLeafNode(targetNode), 0);

            return range;
        },

        // Returns -1 unless the cursor is at the beginning of a paragraph/block
        // If the paragraph/block is preceeded by empty paragraphs/block (with no text)
        // it will return the number of empty paragraphs before the cursor.
        // Otherwise, it will return 0, which indicates the cursor is at the beginning
        // of a paragraph/block, and not at the end of the paragraph/block before it
        getIndexRelativeToAdjacentEmptyBlocks: function (doc, root, cursorContainer, cursorOffset) {
            // If there is text in front of the cursor, that means there isn't only empty blocks before it
            if (cursorContainer.textContent.length > 0 && cursorOffset > 0) {
                return -1;
            }

            // Check if the block that contains the cursor has any other text in front of the cursor
            var node = cursorContainer;
            if (node.nodeType !== 3) {
                node = cursorContainer.childNodes[cursorOffset];
            }
            if (node) {
                // The element isn't at the beginning of a block, so it has content before it
                if (!MoreEditor.util.isElementAtBeginningOfBlock(node)) {
                    return -1;
                }

                var previousSibling = MoreEditor.util.findPreviousSibling(node);
                // If there is no previous sibling, this is the first text element in the editor
                if (!previousSibling) {
                    return -1;
                }
                // If the previous sibling has text, then there are no empty blocks before this
                else if (previousSibling.nodeValue) {
                    return -1;
                }
            }

            // Walk over block elements, counting number of empty blocks between last piece of text
            // and the block the cursor is in
            var closestBlock = MoreEditor.util.getClosestBlockContainer(cursorContainer),
                treeWalker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, filterOnlyParentElements, false),
                emptyBlocksCount = 0;
            while (treeWalker.nextNode()) {
                var blockIsEmpty = treeWalker.currentNode.textContent === '';
                if (blockIsEmpty || emptyBlocksCount > 0) {
                    emptyBlocksCount += 1;
                }
                if (treeWalker.currentNode === closestBlock) {
                    return emptyBlocksCount;
                }
                if (!blockIsEmpty) {
                    emptyBlocksCount = 0;
                }
            }

            return emptyBlocksCount;
        },

        // Returns true if the selection range begins with an image tag
        // Returns false if the range starts with any non empty text nodes
        doesRangeStartWithImages: function (range, doc) {
            if (range.startOffset !== 0 || range.startContainer.nodeType !== 1) {
                return false;
            }

            if (range.startContainer.nodeName.toLowerCase() === 'img') {
                return true;
            }

            var img = range.startContainer.querySelector('img');
            if (!img) {
                return false;
            }

            var treeWalker = doc.createTreeWalker(range.startContainer, NodeFilter.SHOW_ALL, null, false);
            while (treeWalker.nextNode()) {
                var next = treeWalker.currentNode;
                // If we hit the image, then there isn't any text before the image so
                // the image is at the beginning of the range
                if (next === img) {
                    break;
                }
                // If we haven't hit the iamge, but found text that contains content
                // then the range doesn't start with an image
                if (next.nodeValue) {
                    return false;
                }
            }

            return true;
        },

        getTrailingImageCount: function (root, selectionState, endContainer, endOffset) {
            // If the endOffset of a range is 0, the endContainer doesn't contain images
            // If the endContainer is a text node, there are no trailing images
            if (endOffset === 0 || endContainer.nodeType !== 1) {
                return 0;
            }

            // If the endContainer isn't an image, and doesn't have an image descendants
            // there are no trailing images
            if (endContainer.nodeName.toLowerCase() !== 'img' && !endContainer.querySelector('img')) {
                return 0;
            }

            var lastNode = endContainer.childNodes[endOffset - 1];
            while (lastNode.hasChildNodes()) {
                lastNode = lastNode.lastChild;
            }

            var node = root,
                nodeStack = [],
                charIndex = 0,
                foundStart = false,
                foundEnd = false,
                stop = false,
                nextCharIndex,
                trailingImages = 0;

            while (!stop && node) {
                // Only iterate over elements and text nodes
                if (node.nodeType > 3) {
                    node = nodeStack.pop();
                    continue;
                }

                if (node.nodeType === 3 && !foundEnd) {
                    trailingImages = 0;
                    nextCharIndex = charIndex + node.length;
                    if (!foundStart && selectionState.start >= charIndex && selectionState.start <= nextCharIndex) {
                        foundStart = true;
                    }
                    if (foundStart && selectionState.end >= charIndex && selectionState.end <= nextCharIndex) {
                        foundEnd = true;
                    }
                    charIndex = nextCharIndex;
                } else {
                    if (node.nodeName.toLowerCase() === 'img') {
                        trailingImages++;
                    }

                    if (node === lastNode) {
                        stop = true;
                    } else if (node.nodeType === 1) {
                        // this is an element
                        // add all its children to the stack
                        var i = node.childNodes.length - 1;
                        while (i >= 0) {
                            nodeStack.push(node.childNodes[i]);
                            i -= 1;
                        }
                    }
                }

                if (!stop) {
                    node = nodeStack.pop();
                }
            }

            return trailingImages;
        },

        // determine if the current selection contains any 'content'
        // content being any non-white space text or an image
        selectionContainsContent: function (doc) {
            var sel = doc.getSelection();

            // collapsed selection or selection withour range doesn't contain content
            if (!sel || sel.isCollapsed || !sel.rangeCount) {
                return false;
            }

            // if toString() contains any text, the selection contains some content
            if (sel.toString().trim() !== '') {
                return true;
            }

            // if selection contains only image(s), it will return empty for toString()
            // so check for an image manually
            var selectionNode = this.getSelectedParentElement(sel.getRangeAt(0));
            if (selectionNode) {
                if (selectionNode.nodeName.toLowerCase() === 'img' ||
                    (selectionNode.nodeType === 1 && selectionNode.querySelector('img'))) {
                    return true;
                }
            }

            return false;
        },

        selectionInContentEditableFalse: function (contentWindow) {
            // determine if the current selection is exclusively inside
            // a contenteditable="false", though treat the case of an
            // explicit contenteditable="true" inside a "false" as false.
            var sawtrue,
                sawfalse = this.findMatchingSelectionParent(function (el) {
                    var ce = el && el.getAttribute('contenteditable');
                    if (ce === 'true') {
                        sawtrue = true;
                    }
                    return el.nodeName !== '#text' && ce === 'false';
                }, contentWindow);

            return !sawtrue && sawfalse;
        },

        // http://stackoverflow.com/questions/4176923/html-of-selected-text
        // by Tim Down
        getSelectionHtml: function getSelectionHtml(doc) {
            var i,
                html = '',
                sel = doc.getSelection(),
                len,
                container;
            if (sel.rangeCount) {
                container = doc.createElement('div');
                for (i = 0, len = sel.rangeCount; i < len; i += 1) {
                    container.appendChild(sel.getRangeAt(i).cloneContents());
                }
                html = container.innerHTML;
            }
            return html;
        },

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

        // http://stackoverflow.com/questions/15867542/range-object-get-selection-parent-node-chrome-vs-firefox
        rangeSelectsSingleNode: function (range) {
            var startNode = range.startContainer;
            return startNode === range.endContainer &&
                startNode.hasChildNodes() &&
                range.endOffset === range.startOffset + 1;
        },

        getSelectedParentElement: function (range) {
            if (!range) {
                return null;
            }

            // Selection encompasses a single element
            if (this.rangeSelectsSingleNode(range) && range.startContainer.childNodes[range.startOffset].nodeType !== 3) {
                return range.startContainer.childNodes[range.startOffset];
            }

            // Selection range starts inside a text node, so get its parent
            if (range.startContainer.nodeType === 3) {
                return range.startContainer.parentNode;
            }

            // Selection starts inside an element
            return range.startContainer;
        },

        getSelectedElements: function (doc) {
            var selection = doc.getSelection(),
                range,
                toRet,
                currNode;

            if (!selection.rangeCount || selection.isCollapsed || !selection.getRangeAt(0).commonAncestorContainer) {
                return [];
            }

            range = selection.getRangeAt(0);

            if (range.commonAncestorContainer.nodeType === 3) {
                toRet = [];
                currNode = range.commonAncestorContainer;
                while (currNode.parentNode && currNode.parentNode.childNodes.length === 1) {
                    toRet.push(currNode.parentNode);
                    currNode = currNode.parentNode;
                }

                return toRet;
            }

            return [].filter.call(range.commonAncestorContainer.getElementsByTagName('*'), function (el) {
                return (typeof selection.containsNode === 'function') ? selection.containsNode(el, true) : true;
            });
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
         *  Clear the current highlighted selection and set the caret to the start or the end of that prior selection, defaults to end.
         *
         *  @param {DomDocument} doc            Current document
         *  @param {boolean} moveCursorToStart  A boolean representing whether or not to set the caret to the beginning of the prior selection.
         */
        clearSelection: function (doc, moveCursorToStart) {
            if (moveCursorToStart) {
                doc.getSelection().collapseToStart();
            } else {
                doc.getSelection().collapseToEnd();
            }
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
        }
    };

    MoreEditor.selection = Selection;
}());

/* eslint-enable no-undef */
(function () {
    'use strict';

    function isElementDescendantOfExtension(extensions, element) {
        return extensions.some(function (extension) {
            if (typeof extension.getInteractionElements !== 'function') {
                return false;
            }

            var extensionElements = extension.getInteractionElements();
            if (!extensionElements) {
                return false;
            }

            if (!Array.isArray(extensionElements)) {
                extensionElements = [extensionElements];
            }
            return extensionElements.some(function (el) {
                return MoreEditor.util.isDescendant(el, element, true);
            });
        });
    }

    var Events = function (instance) {
        this.base = instance;
        this.options = this.base.options;
        this.events = [];
        this.disabledEvents = {};
        this.customEvents = {};
        this.listeners = {};
    };

    Events.prototype = {
        InputEventOnContenteditableSupported: !MoreEditor.util.isIE && !MoreEditor.util.isEdge,

        // Helpers for event handling

        attachDOMEvent: function (targets, event, listener, useCapture) {
            var win = this.base.options.contentWindow,
                doc = this.base.options.ownerDocument;

            targets = MoreEditor.util.isElement(targets) || [win, doc].indexOf(targets) > -1 ? [targets] : targets;

            Array.prototype.forEach.call(targets, function (target) {
                target.addEventListener(event, listener, useCapture);
                this.events.push([target, event, listener, useCapture]);
            }.bind(this));
        },

        detachDOMEvent: function (targets, event, listener, useCapture) {
            var index, e,
                win = this.base.options.contentWindow,
                doc = this.base.options.ownerDocument;

            if (targets !== null) {
                targets = MoreEditor.util.isElement(targets) || [win, doc].indexOf(targets) > -1 ? [targets] : targets;

                Array.prototype.forEach.call(targets, function (target) {
                    index = this.indexOfListener(target, event, listener, useCapture);
                    if (index !== -1) {
                        e = this.events.splice(index, 1)[0];
                        e[0].removeEventListener(e[1], e[2], e[3]);
                    }
                }.bind(this));
            }
        },

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

        detachAllDOMEvents: function () {
            var e = this.events.pop();
            while (e) {
                e[0].removeEventListener(e[1], e[2], e[3]);
                e = this.events.pop();
            }
        },

        detachAllEventsFromElement: function (element) {
            var filtered = this.events.filter(function (e) {
                return e && e[0].getAttribute && e[0].getAttribute('medium-editor-index') === element.getAttribute('medium-editor-index');
            });

            for (var i = 0, len = filtered.length; i < len; i++) {
                var e = filtered[i];
                this.detachDOMEvent(e[0], e[1], e[2], e[3]);
            }
        },

        // Attach all existing handlers to a new element
        attachAllEventsToElement: function (element) {
            if (this.listeners['editableInput']) {
                this.contentCache[element.getAttribute('medium-editor-index')] = element.innerHTML;
            }

            if (this.eventsCache) {
                this.eventsCache.forEach(function (e) {
                    this.attachDOMEvent(element, e['name'], e['handler'].bind(this));
                }, this);
            }
        },

        enableCustomEvent: function (event) {
            if (this.disabledEvents[event] !== undefined) {
                delete this.disabledEvents[event];
            }
        },

        disableCustomEvent: function (event) {
            this.disabledEvents[event] = true;
        },

        // custom events
        attachCustomEvent: function (event, listener) {
            this.setupListener(event);
            if (!this.customEvents[event]) {
                this.customEvents[event] = [];
            }
            this.customEvents[event].push(listener);
        },

        detachCustomEvent: function (event, listener) {
            var index = this.indexOfCustomListener(event, listener);
            if (index !== -1) {
                this.customEvents[event].splice(index, 1);
                // TODO: If array is empty, should detach internal listeners via destroyListener()
            }
        },

        indexOfCustomListener: function (event, listener) {
            if (!this.customEvents[event] || !this.customEvents[event].length) {
                return -1;
            }

            return this.customEvents[event].indexOf(listener);
        },

        detachAllCustomEvents: function () {
            this.customEvents = {};
            // TODO: Should detach internal listeners here via destroyListener()
        },

        triggerCustomEvent: function (name, data, editable) {
            if (this.customEvents[name] && !this.disabledEvents[name]) {
                this.customEvents[name].forEach(function (listener) {
                    listener(data, editable);
                });
            }
        },

        // Cleaning up

        destroy: function () {
            this.detachAllDOMEvents();
            this.detachAllCustomEvents();
            this.detachExecCommand();

            if (this.base.elements) {
                this.base.elements.forEach(function (element) {
                    element.removeAttribute('data-medium-focused');
                });
            }
        },

        // Listening to calls to document.execCommand

        // Attach a listener to be notified when document.execCommand is called
        attachToExecCommand: function () {
            if (this.execCommandListener) {
                return;
            }

            // Store an instance of the listener so:
            // 1) We only attach to execCommand once
            // 2) We can remove the listener later
            this.execCommandListener = function (execInfo) {
                this.handleDocumentExecCommand(execInfo);
            }.bind(this);

            // Ensure that execCommand has been wrapped correctly
            this.wrapExecCommand();

            // Add listener to list of execCommand listeners
            this.options.ownerDocument.execCommand.listeners.push(this.execCommandListener);
        },

        // Remove our listener for calls to document.execCommand
        detachExecCommand: function () {
            var doc = this.options.ownerDocument;
            if (!this.execCommandListener || !doc.execCommand.listeners) {
                return;
            }

            // Find the index of this listener in the array of listeners so it can be removed
            var index = doc.execCommand.listeners.indexOf(this.execCommandListener);
            if (index !== -1) {
                doc.execCommand.listeners.splice(index, 1);
            }

            // If the list of listeners is now empty, put execCommand back to its original state
            if (!doc.execCommand.listeners.length) {
                this.unwrapExecCommand();
            }
        },

        // Wrap document.execCommand in a custom method so we can listen to calls to it
        wrapExecCommand: function () {
            var doc = this.options.ownerDocument;

            // Ensure all instance of MoreEditor only wrap execCommand once
            if (doc.execCommand.listeners) {
                return;
            }

            // Helper method to call all listeners to execCommand
            var callListeners = function (args, result) {
                if (doc.execCommand.listeners) {
                    doc.execCommand.listeners.forEach(function (listener) {
                        listener({
                            command: args[0],
                            value: args[2],
                            args: args,
                            result: result
                        });
                    });
                }
            },

                // Create a wrapper method for execCommand which will:
                // 1) Call document.execCommand with the correct arguments
                // 2) Loop through any listeners and notify them that execCommand was called
                //    passing extra info on the call
                // 3) Return the result
                wrapper = function () {
                    var result = doc.execCommand.orig.apply(this, arguments);

                    if (!doc.execCommand.listeners) {
                        return result;
                    }

                    var args = Array.prototype.slice.call(arguments);
                    callListeners(args, result);

                    return result;
                };

            // Store a reference to the original execCommand
            wrapper.orig = doc.execCommand;

            // Attach an array for storing listeners
            wrapper.listeners = [];

            // Helper for notifying listeners
            wrapper.callListeners = callListeners;

            // Overwrite execCommand
            doc.execCommand = wrapper;
        },

        // Revert document.execCommand back to its original self
        unwrapExecCommand: function () {
            var doc = this.options.ownerDocument;
            if (!doc.execCommand.orig) {
                return;
            }

            // Use the reference to the original execCommand to revert back
            doc.execCommand = doc.execCommand.orig;
        },

        // Listening to browser events to emit events medium-editor cares about
        setupListener: function (name) {
            if (this.listeners[name]) {
                return;
            }

            switch (name) {
                case 'externalInteraction':
                    // Detecting when user has interacted with elements outside of MoreEditor
                    this.attachDOMEvent(this.options.ownerDocument.body, 'mousedown', this.handleBodyMousedown.bind(this), true);
                    this.attachDOMEvent(this.options.ownerDocument.body, 'click', this.handleBodyClick.bind(this), true);
                    this.attachDOMEvent(this.options.ownerDocument.body, 'focus', this.handleBodyFocus.bind(this), true);
                    break;
                case 'blur':
                    // Detecting when focus is lost
                    this.setupListener('externalInteraction');
                    break;
                case 'focus':
                    // Detecting when focus moves into some part of MoreEditor
                    this.setupListener('externalInteraction');
                    break;
                case 'editableInput':
                    // setup cache for knowing when the content has changed
                    this.contentCache = {};
                    this.base.elements.forEach(function (element) {
                        this.contentCache[element.getAttribute('medium-editor-index')] = element.innerHTML;
                    }, this);

                    // Attach to the 'oninput' event, handled correctly by most browsers
                    if (this.InputEventOnContenteditableSupported) {
                        this.attachToEachElement('input', this.handleInput);
                    }

                    // For browsers which don't support the input event on contenteditable (IE)
                    // we'll attach to 'selectionchange' on the document and 'keypress' on the editables
                    if (!this.InputEventOnContenteditableSupported) {
                        this.setupListener('editableKeypress');
                        this.keypressUpdateInput = true;
                        this.attachDOMEvent(document, 'selectionchange', this.handleDocumentSelectionChange.bind(this));
                        // Listen to calls to execCommand
                        this.attachToExecCommand();
                    }
                    break;
                case 'editableClick':
                    // Detecting click in the contenteditables
                    this.attachToEachElement('click', this.handleClick);
                    break;
                case 'editableBlur':
                    // Detecting blur in the contenteditables
                    this.attachToEachElement('blur', this.handleBlur);
                    break;
                case 'editableKeypress':
                    // Detecting keypress in the contenteditables
                    this.attachToEachElement('keypress', this.handleKeypress);
                    break;
                case 'editableKeyup':
                    // Detecting keyup in the contenteditables
                    this.attachToEachElement('keyup', this.handleKeyup);
                    break;
                case 'editableKeydown':
                    // Detecting keydown on the contenteditables
                    this.attachToEachElement('keydown', this.handleKeydown);
                    break;
                case 'editableKeydownSpace':
                    // Detecting keydown for SPACE on the contenteditables
                    this.setupListener('editableKeydown');
                    break;
                case 'editableKeydownEnter':
                    // Detecting keydown for ENTER on the contenteditables
                    this.setupListener('editableKeydown');
                    break;
                case 'editableKeydownTab':
                    // Detecting keydown for TAB on the contenteditable
                    this.setupListener('editableKeydown');
                    break;
                case 'editableKeydownDelete':
                    // Detecting keydown for DELETE/BACKSPACE on the contenteditables
                    this.setupListener('editableKeydown');
                    break;
                case 'editableMouseover':
                    // Detecting mouseover on the contenteditables
                    this.attachToEachElement('mouseover', this.handleMouseover);
                    break;
                case 'editableDrag':
                    // Detecting dragover and dragleave on the contenteditables
                    this.attachToEachElement('dragover', this.handleDragging);
                    this.attachToEachElement('dragleave', this.handleDragging);
                    break;
                case 'editableDrop':
                    // Detecting drop on the contenteditables
                    this.attachToEachElement('drop', this.handleDrop);
                    break;
                // TODO: We need to have a custom 'paste' event separate from 'editablePaste'
                // Need to think about the way to introduce this without breaking folks
                case 'editablePaste':
                    // Detecting paste on the contenteditables
                    this.attachToEachElement('paste', this.handlePaste);
                    break;
            }
            this.listeners[name] = true;
        },

        attachToEachElement: function (name, handler) {
            // build our internal cache to know which element got already what handler attached
            if (!this.eventsCache) {
                this.eventsCache = [];
            }

            this.base.elements.forEach(function (element) {
                this.attachDOMEvent(element, name, handler.bind(this));
            }, this);

            this.eventsCache.push({ 'name': name, 'handler': handler });
        },

        cleanupElement: function (element) {
            var index = element.getAttribute('medium-editor-index');
            if (index) {
                this.detachAllEventsFromElement(element);
                if (this.contentCache) {
                    delete this.contentCache[index];
                }
            }
        },

        focusElement: function (element) {
            element.focus();
            this.updateFocus(element, { target: element, type: 'focus' });
        },

        updateFocus: function (target, eventObj) {
            var hadFocus = this.base.getFocusedElement(),
                toFocus;

            // For clicks, we need to know if the mousedown that caused the click happened inside the existing focused element
            // or one of the extension elements.  If so, we don't want to focus another element
            if (hadFocus &&
                eventObj.type === 'click' &&
                this.lastMousedownTarget &&
                (MoreEditor.util.isDescendant(hadFocus, this.lastMousedownTarget, true) ||
                    isElementDescendantOfExtension(this.base.extensions, this.lastMousedownTarget))) {
                toFocus = hadFocus;
            }

            if (!toFocus) {
                this.base.elements.some(function (element) {
                    // If the target is part of an editor element, this is the element getting focus
                    if (!toFocus && (MoreEditor.util.isDescendant(element, target, true))) {
                        toFocus = element;
                    }

                    // bail if we found an element that's getting focus
                    return !!toFocus;
                }, this);
            }

            // Check if the target is external (not part of the editor, toolbar, or any other extension)
            var externalEvent = !MoreEditor.util.isDescendant(hadFocus, target, true) &&
                !isElementDescendantOfExtension(this.base.extensions, target);

            if (toFocus !== hadFocus) {
                // If element has focus, and focus is going outside of editor
                // Don't blur focused element if clicking on editor, toolbar, or anchorpreview
                if (hadFocus && externalEvent) {
                    // Trigger blur on the editable that has lost focus
                    hadFocus.removeAttribute('data-medium-focused');
                    this.triggerCustomEvent('blur', eventObj, hadFocus);
                }

                // If focus is going into an editor element
                if (toFocus) {
                    // Trigger focus on the editable that now has focus
                    toFocus.setAttribute('data-medium-focused', true);
                    this.triggerCustomEvent('focus', eventObj, toFocus);
                }
            }

            if (externalEvent) {
                this.triggerCustomEvent('externalInteraction', eventObj);
            }
        },

        updateInput: function (target, eventObj) {
            if (!this.contentCache) {
                return;
            }
            // An event triggered which signifies that the user may have changed someting
            // Look in our cache of input for the contenteditables to see if something changed
            var index = target.getAttribute('medium-editor-index'),
                html = target.innerHTML;

            if (html !== this.contentCache[index]) {
                // The content has changed since the last time we checked, fire the event
                this.triggerCustomEvent('editableInput', eventObj, target);
            }
            this.contentCache[index] = html;
        },

        handleDocumentSelectionChange: function (event) {
            // When selectionchange fires, target and current target are set
            // to document, since this is where the event is handled
            // However, currentTarget will have an 'activeElement' property
            // which will point to whatever element has focus.
            if (event.currentTarget && event.currentTarget.activeElement) {
                var activeElement = event.currentTarget.activeElement,
                    currentTarget;
                // We can look at the 'activeElement' to determine if the selectionchange has
                // happened within a contenteditable owned by this instance of MoreEditor
                this.base.elements.some(function (element) {
                    if (MoreEditor.util.isDescendant(element, activeElement, true)) {
                        currentTarget = element;
                        return true;
                    }
                    return false;
                }, this);

                // We know selectionchange fired within one of our contenteditables
                if (currentTarget) {
                    this.updateInput(currentTarget, { target: activeElement, currentTarget: currentTarget });
                }
            }
        },

        handleDocumentExecCommand: function () {
            // document.execCommand has been called
            // If one of our contenteditables currently has focus, we should
            // attempt to trigger the 'editableInput' event
            var target = this.base.getFocusedElement();
            if (target) {
                this.updateInput(target, { target: target, currentTarget: target });
            }
        },

        handleBodyClick: function (event) {
            this.updateFocus(event.target, event);
        },

        handleBodyFocus: function (event) {
            this.updateFocus(event.target, event);
        },

        handleBodyMousedown: function (event) {
            this.lastMousedownTarget = event.target;
        },

        handleInput: function (event) {
            this.updateInput(event.currentTarget, event);
        },

        handleClick: function (event) {
            this.triggerCustomEvent('editableClick', event, event.currentTarget);
        },

        handleBlur: function (event) {
            this.triggerCustomEvent('editableBlur', event, event.currentTarget);
        },

        handleKeypress: function (event) {
            this.triggerCustomEvent('editableKeypress', event, event.currentTarget);

            // If we're doing manual detection of the editableInput event we need
            // to check for input changes during 'keypress'
            if (this.keypressUpdateInput) {
                var eventObj = { target: event.target, currentTarget: event.currentTarget };

                // In IE, we need to let the rest of the event stack complete before we detect
                // changes to input, so using setTimeout here
                setTimeout(function () {
                    this.updateInput(eventObj.currentTarget, eventObj);
                }.bind(this), 0);
            }
        },

        handleKeyup: function (event) {
            this.triggerCustomEvent('editableKeyup', event, event.currentTarget);
        },

        handleMouseover: function (event) {
            this.triggerCustomEvent('editableMouseover', event, event.currentTarget);
        },

        handleDragging: function (event) {
            this.triggerCustomEvent('editableDrag', event, event.currentTarget);
        },

        handleDrop: function (event) {
            this.triggerCustomEvent('editableDrop', event, event.currentTarget);
        },

        handlePaste: function (event) {
            this.triggerCustomEvent('editablePaste', event, event.currentTarget);
        },

        handleKeydown: function (event) {

            this.triggerCustomEvent('editableKeydown', event, event.currentTarget);

            if (MoreEditor.util.isKey(event, MoreEditor.util.keyCode.SPACE)) {
                return this.triggerCustomEvent('editableKeydownSpace', event, event.currentTarget);
            }

            if (MoreEditor.util.isKey(event, MoreEditor.util.keyCode.ENTER) || (event.ctrlKey && MoreEditor.util.isKey(event, MoreEditor.util.keyCode.M))) {
                return this.triggerCustomEvent('editableKeydownEnter', event, event.currentTarget);
            }

            if (MoreEditor.util.isKey(event, MoreEditor.util.keyCode.TAB)) {
                return this.triggerCustomEvent('editableKeydownTab', event, event.currentTarget);
            }

            if (MoreEditor.util.isKey(event, [MoreEditor.util.keyCode.DELETE, MoreEditor.util.keyCode.BACKSPACE])) {
                return this.triggerCustomEvent('editableKeydownDelete', event, event.currentTarget);
            }
        }
    };

    MoreEditor.Events = Events;
}());

/* MoreEditor 的原型属性和原型方法 */

var initialOptions = {
    contentWindow: window,
    ownerDocument: document,
    imageUploadAddress: null,
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
    },
    setup: function() {
        this.events = new MoreEditor.Events(this)
    }
}


    return MoreEditor;
}()));  // eslint-disable-line

