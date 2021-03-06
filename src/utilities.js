/**
 * Miscellaneous utility functions for web components
 * 
 * @module utilities
 */

const mousedownListenerKey = Symbol('mousedownListener');


// Return the closest focusable ancestor in the *composed* tree.
// If no focusable ancestor is found, returns null.
export function closestFocusableAncestor(element) {
  // We want an element that has a tabIndex of 0 or more. We ignore disabled
  // elements, and slot elements (which oddly have a tabIndex of 0).
  if (element.tabIndex >= 0 && !element.disabled
    && !isSlot(element)) {
    // Found an enabled component that wants the focus.
    return element;
  }
  // Not focusable; look higher in composed tree.
  const parent = element.assignedSlot ?
    element.assignedSlot :
    // @ts-ignore
    element.parentNode instanceof ShadowRoot ?
      element.parentNode.host :
      element.parentNode;
  return parent ?
    closestFocusableAncestor(parent) :
    null;
}


 /**
 * Returns true if the first node contains the second, even if the second node
 * is in a shadow tree.
 *
 * The standard Node.contains() function does not account for Shadow DOM, and
 * returns false if the supplied target node is sitting inside a shadow tree
 * within the container.
 * 
 * @param {Node} container - The container to search within.
 * @param {Node} target - The node that may be inside the container.
 * @returns {boolean} - True if the container contains the target node.
 */
export function deepContains(container, target) {
  /** @type {any} */
  let current = target;
  while (current) {
    const parent = current.assignedSlot || current.parentNode || current.host;
    if (parent === container) {
      return true;
    }
    current = parent;
  }
  return false;
}


/**
 * Polyfill for shadowRoot.elementsFromPoint, which (as of 6 June 2018) is
 * not available in the webcomponents polyfill.
 * See https://github.com/webcomponents/shadydom/issues/141.
 * 
 * @param {Element} element - element whose shadow root may contain elements
 * at the specified point
 * @param {number} x - x-coordinate of the indicated point
 * @param {number} y - y-coordinate of the indicated point
 * @returns {Element[]}
 */
export function elementsFromPoint(element, x, y) {
  if (element.shadowRoot && element.shadowRoot.elementsFromPoint) {
    return element.shadowRoot.elementsFromPoint(x, y);
  //@ts-ignore
  } else if (document.elementsFromPoint) {
    //@ts-ignore
    return document.elementsFromPoint(x, y);
  } else {
    // Microsoft Edge

    /** @type {any} */
    const cast = document;
    const elements = cast.msElementsFromPoint(x, y);
    return elements ?
      [...elements] :
      [];
  }
}


/**
 * Return the first focusable element in the composed tree below the given root.
 * The composed tree includes nodes assigned to slots.
 *
 * This heuristic considers only the document order of the elements below the
 * root and whether a given element is focusable. It currently does not respect
 * the tab sort order defined by tabindex values greater than zero.
 * 
 * @param {HTMLElement} root - the root of the tree in which to search
 * @returns {HTMLElement|null} - the first focusable element, or null if none
 * was found
 */
export function firstFocusableElement(root) {
  // CSS selectors for focusable elements from
  // https://stackoverflow.com/a/30753870/76472
  const focusableQuery = 'a[href],area[href],button:not([disabled]),details,iframe,input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contentEditable="true"],[tabindex]';
  // Walk the tree looking for nodes that match the above selectors.
  const walker = walkComposedTree(root, node =>
    node instanceof HTMLElement && 
    node.matches(focusableQuery) &&
    node.tabIndex >= 0
  );
  // We only actually need the first matching value.
  const { value } = walker.next();
  // value, if defined, will always be an HTMLElement, but we do the following
  // check to pass static type checking.
  return value instanceof HTMLElement ?
    value :
    null;
}


/**
 * Trap any `mousedown` events on the `origin` element and prevent the default
 * behavior from setting the focus on that element. Instead, put the focus on
 * the `target` element (or, if the `target` is not focusable, on the target's
 * closest focusable ancestor).
 * 
 * If this method is called again with the same `origin` element, the old
 * forwarding is overridden, and focus will now go to the new `target` element.
 * 
 * If the `target` parameter is `null`, focus handling will be removed from the
 * indicated `origin`.
 * 
 * @param {HTMLElement} origin
 * @param {HTMLElement|null} target
 */
export function forwardFocus(origin, target) {
  if (origin[mousedownListenerKey]) {
    // Origin was previously forwarding focus, probably to a different target.
    // Remove the previous event listener.
    origin.removeEventListener('mousedown', origin[mousedownListenerKey]);
  }
  if (target) {
    origin[mousedownListenerKey] = (event) => {
      // Only process events for the main (usually left) button.
      if (event.button !== 0) {
        return;
      }
      const focusableTarget = closestFocusableAncestor(target);
      focusableTarget.focus();
      event.preventDefault();  
    };
    origin.addEventListener('mousedown', origin[mousedownListenerKey]);
  }
}


/**
 * Search a list element for the item that contains the specified target.
 * 
 * When dealing with UI events (e.g., mouse clicks) that may occur in
 * subelements inside a list item, you can use this routine to obtain the
 * containing list item.
 * 
 * @param {NodeList|Node[]} items - A list element containing a set of items
 * @param {Node} target - A target element that may or may not be an item in the
 * list.
 * @returns {number} - The index of the list child that is or contains the
 * indicated target node. Returns -1 if not found.
 */
export function indexOfItemContainingTarget(items, target) {
  return Array.prototype.findIndex.call(items, item =>
    item === target || deepContains(item, target)
  );
}


// For polyfill
function isSlot(node) {
  return 'HTMLSlotElement' in window ?
    node instanceof HTMLSlotElement :
    node.localName === 'slot';  // Polyfill
}


/**
 * Return true if the event came from within the node (or from the node itself);
 * false otherwise.
 * 
 * @param {Node} node - The node to consider in relation to the event
 * @param {Event} event - The event which may have been raised within/by the
 * node
 * @returns {boolean} - True if the event was raised within or by the node
 */
export function ownEvent(node, event) {
  /** @type {any} */
  const cast = event;
  const eventSource = cast.composedPath()[0];
  return node === eventSource || deepContains(node, eventSource);
}


// Walk the composed tree at the root for elements that pass the given filter.
function* walkComposedTree(node, filter) {
  if (filter(node)) {
    yield node;
  }
  let children;
  if (node.shadowRoot) {
    // Walk the shadow instead of the light DOM.
    children = node.shadowRoot.children;
  } else {
    const assignedNodes = isSlot(node) ?
      node.assignedNodes({ flatten: true }) :
      [];
    children = assignedNodes.length > 0 ?
      // Walk light DOM nodes assigned to this slot.
      assignedNodes :
      // Walk light DOM children.
      node.children;
  }
  if (children) {
    for (let i = 0; i < children.length; i++) {
      yield* walkComposedTree(children[i], filter);
    }
  }
}
