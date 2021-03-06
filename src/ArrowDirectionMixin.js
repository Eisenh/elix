import { forwardFocus } from './utilities.js';
import { merge } from './updates.js';
import * as symbols from './symbols.js';
import * as template from './template.js';
import ArrowDirectionButton from './ArrowDirectionButton.js';


const wrap = Symbol('wrap');


/**
 * Adds left and right arrow buttons to a carousel-like component.
 * 
 * @module ArrowDirectionMixin
 * @elementrole {ArrowDirectionButton} arrowButton
 */
function ArrowDirectionMixin(Base) {

  // The class prototype added by the mixin.
  class ArrowDirection extends Base {

    /**
     * True if the arrow buttons should overlap the component contents;
     * false if they should appear to the side of the contents.
     * 
     * @type {boolean}
     * @default true
     */
    get arrowButtonOverlap() {
      return this.state.arrowButtonOverlap;
    }
    set arrowButtonOverlap(arrowButtonOverlap) {
      const parsed = String(arrowButtonOverlap) === 'true';
      this.setState({
        arrowButtonOverlap: parsed
      });
    }
  
    /**
     * The class, tag, or template used to create the left and right arrow
     * buttons.
     * 
     * @type {function|string|HTMLTemplateElement}
     * @default ArrowDirectionButton
     */
    get arrowButtonRole() {
      return this.state.arrowButtonRole;
    }
    set arrowButtonRole(arrowButtonRole) {
      this.setState({ arrowButtonRole });
    }

    // TODO: Symbols
    arrowButtonLeft() {
      if (super.arrowButtonLeft) {
        return super.arrowButtonLeft();
      } else {
        return this[symbols.goLeft]();
      }
    }

    arrowButtonRight() {
      if (super.arrowButtonRight) {
        return super.arrowButtonRight();
      } else {
        return this[symbols.goRight]();
      }
    }

    [symbols.beforeUpdate]() {
      const arrowButtonChanged = this[symbols.renderedRoles].arrowButtonRole
        !== this.state.arrowButtonRole;
      if (arrowButtonChanged && this.$.arrowButtonLeft) {
        // Turn off focus handling for old left button.
        forwardFocus(this.$.arrowButtonLeft, null);
      }
      if (arrowButtonChanged && this.$.arrowButtonRight) {
        // Turn off focus handling for old right button.
        forwardFocus(this.$.arrowButtonRight, null);
      }
      if (super[symbols.beforeUpdate]) { super[symbols.beforeUpdate](); }
      if (arrowButtonChanged) {
        const arrowButtons = this.shadowRoot.querySelectorAll('.arrowButton');
        template.transmute(arrowButtons, this.state.arrowButtonRole);

        /** @type {any} */
        const cast = this;

        forwardFocus(this.$.arrowButtonLeft, cast);
        this.$.arrowButtonLeft.addEventListener('mousedown', async (event) => {
          // Only process events for the main (usually left) button.
          if (event.button !== 0) {
            return;
          }
          this[symbols.raiseChangeEvents] = true;
          const handled = this.arrowButtonLeft();
          if (handled) {
            event.stopPropagation();
          }
          await Promise.resolve();
          this[symbols.raiseChangeEvents] = false;
        });
        
        forwardFocus(this.$.arrowButtonRight, cast);
        this.$.arrowButtonRight.addEventListener('mousedown', async (event) => {
          // Only process events for the main (usually left) button.
          if (event.button !== 0) {
            return;
          }
          this[symbols.raiseChangeEvents] = true;
          const handled = this.arrowButtonRight();
          if (handled) {
            event.stopPropagation();
          }
          await Promise.resolve();
          this[symbols.raiseChangeEvents] = false;
        });

        this[symbols.renderedRoles].arrowButtonRole = this.state.arrowButtonRole;
      }
    }
  
    get defaultState() {
      return Object.assign(super.defaultState, {
        arrowButtonOverlap: true,
        arrowButtonRole: ArrowDirectionButton,
        orientation: 'horizontal',
        showArrowButtons: true
      });
    }

    get showArrowButtons() {
      return this.state.showArrowButtons;
    }
    set showArrowButtons(showArrowButtons) {
      const parsed = String(showArrowButtons) === 'true';
      this.setState({
        showArrowButtons: parsed
      });
    }

    get updates() {
      const base = super.updates;

      const arrowButtonOverlap = this.state.arrowButtonOverlap;
      const buttonUpdates = arrowButtonOverlap ?
        {
          style: {
            'bottom': 0,
            'position': 'absolute',
            'top': 0,
            'z-index': 1
          }
        } :
        {};

      const canGoLeft = this[symbols.canGoLeft];
      const canGoRight = this[symbols.canGoRight];

      const arrowDisplay = this.state.showArrowButtons ?
        base.style && base.style.display || '' :
        'none';

      const arrowButtonLeftUpdates = merge(buttonUpdates, {
        attributes: {
          disabled: !canGoLeft
        },
        style: {
          display: arrowDisplay,
          left: arrowButtonOverlap ? 0 : ''
        }
      });

      const arrowButtonRightUpdates = merge(buttonUpdates, {
        attributes: {
          disabled: !canGoRight
        },
        style: {
          display: arrowDisplay,
          right: arrowButtonOverlap ? 0 : ''
        }
      });

      return merge(base, {
        $: Object.assign(
          {
            arrowButtonLeft: arrowButtonLeftUpdates,
            arrowButtonRight: arrowButtonRightUpdates,
            arrowDirection: {
              style: {
                'flex-direction': this[symbols.rightToLeft] ? 'row-reverse' : 'row'
              }
            }
          }
        )
      });
    }

    /**
     * Destructively wrap a node with elements to show arrow buttons.
     * 
     * @param {Node} original - the node that should be wrapped by buttons
     */
    [wrap](original) {
      const arrowDirectionTemplate = template.html`
        <div id="arrowDirection" role="none" style="display: flex; flex: 1; overflow: hidden; position: relative;">
          <div
            id="arrowButtonLeft"
            class="arrowButton"
            aria-hidden="true"
            tabindex="-1"
            >
            <slot name="arrowButtonLeft">
              <svg id="arrowIconLeft" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" style="height: 1em; width: 1em;">
                <g>
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
                </g>
              </svg>
            </slot>
          </div>
          <div id="arrowDirectionContainer" role="none" style="flex: 1; overflow: hidden; position: relative;"></div>
          <div
            id="arrowButtonRight"
            class="arrowButton"
            aria-hidden="true"
            tabindex="-1"
            >
            <slot name="arrowButtonRight">
              <svg id="arrowIconRight" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" style="height: 1em; width: 1em;">
                <g>
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
                </g>
              </svg>
            </slot>
          </div>
        </div>
      `;
      template.wrap(original, arrowDirectionTemplate.content, '#arrowDirectionContainer');
    }
  }

  return ArrowDirection;
}


ArrowDirectionMixin.wrap = wrap;


export default ArrowDirectionMixin;
