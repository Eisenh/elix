import defaultScrollTarget from './defaultScrollTarget.js';
import symbols from './symbols.js';


/**
 * Mixin which scrolls a container horizontally and/or vertically to ensure that
 * a newly-selected item is visible to the user.
 *
 * When the selected item in a list-like component changes, the selected item
 * should be brought into view so that the user can confirm their selection.
 *
 * This mixin expects a `selectedItem` property to be set when the selection
 * changes. You can supply that yourself, or use
 * [SingleSelectionMixin](SingleSelectionMixin).
 *
 * @module SelectionInViewMixin
 */
export default function SelectionInViewMixin(Base) {

  // The class prototype added by the mixin.
  class SelectionInView extends Base {

    componentDidMount() {
      if (super.componentDidMount) { super.componentDidMount(); }
      this.scrollSelectionIntoView();
    }

    componentDidUpdate(previousState) {
      if (super.componentDidUpdate) { super.componentDidUpdate(previousState); }
      this.scrollSelectionIntoView();
    }

    /**
     * Scroll the selected item element completely into view, minimizing the
     * degree of scrolling performed.
     *
     * Blink has a `scrollIntoViewIfNeeded()` function that does something
     * similar, but unfortunately it's non-standard, and in any event often ends
     * up scrolling more than is absolutely necessary.
     *
     * This scrolls the containing element defined by the `scrollTarget`
     * property. See that property for a discussion of the default value of
     * that property.
     */
    scrollSelectionIntoView() {
      if (super.scrollSelectionIntoView) { super.scrollSelectionIntoView(); }

      const scrollTarget = this[symbols.scrollTarget];
      const selectedIndex = this.state.selectedIndex;
      if (selectedIndex < 0) {
        return;
      }
      
      const selectedItem = this.items && this.items[selectedIndex];
      if (!selectedItem) {
        return;
      }

      // Determine the bounds of the scroll target and item. We use
      // getBoundingClientRect instead of .offsetTop, etc., because the latter
      // round values, and we want to handle fractional values.
      const scrollTargetRect = scrollTarget.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();

      // Determine how far the item is outside the viewport.
      const bottomDelta = itemRect.bottom - scrollTargetRect.bottom;
      const topDelta = itemRect.top - scrollTargetRect.top;
      const leftDelta = itemRect.left - scrollTargetRect.left;
      const rightDelta = itemRect.right - scrollTargetRect.right;

      // Scroll the target as necessary to bring the item into view.
      if (bottomDelta > 0) {
        scrollTarget.scrollTop += bottomDelta;            // Scroll down
      } else if (topDelta < 0) {
        scrollTarget.scrollTop += Math.ceil(topDelta);    // Scroll up
      }
      if (rightDelta > 0) {
        scrollTarget.scrollLeft += rightDelta;            // Scroll right
      } else if (leftDelta < 0) {
        scrollTarget.scrollLeft += Math.ceil(leftDelta);  // Scroll left
      }
    }

    /* Provide a default scrollTarget implementation if none exists. */
    get [symbols.scrollTarget]() {
      /** @type {any} */
      const element = this;
      return super[symbols.scrollTarget] || defaultScrollTarget(element);
    }
  }

  return SelectionInView;
}
