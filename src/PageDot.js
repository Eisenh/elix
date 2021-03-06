import { getSuperProperty } from './workarounds.js';
import { merge } from './updates.js';
import * as symbols from './symbols.js';
import * as template from './template.js';
import DarkModeMixin from './DarkModeMixin.js';
import SeamlessButton from './SeamlessButton.js';


const Base =
  DarkModeMixin(
    SeamlessButton
  );


/**
 * A small dot used to represent the items in a carousel-like element.
 * 
 * This is used as the default proxy element in [Carousel](Carousel).
 * 
 * @inherits SeamlessButton
 * @mixes DarkModeMixin
 */
class PageDot extends Base {

  get [symbols.template]() {
    // Next line is same as: const base = super[symbols.template]
    const base = getSuperProperty(this, PageDot, symbols.template);
    return template.concat(base, template.html`
      <style>
        :host {
          border-radius: 7px;
          box-shadow: 0 0 1px 1px rgba(0, 0, 0, 0.5);
          box-sizing: border-box;
          cursor: pointer;
          height: 8px;
          margin: 7px 5px;
          padding: 0;
          transition: opacity 0.2s;
          width: 8px;
        }
      </style>
    `);
  }

  get updates() {
    const base = super.updates || {};
    const desktop = matchMedia('(min-width: 768px)').matches;
    const size = desktop ? '12px' : null;
    const darkMode = this.state.darkMode;
    const backgroundColor = darkMode === null ?
      null : // Wait for knowledge of dark mode
      darkMode ?
      `rgb(255, 255, 255)` :
      `rgb(0, 0, 0)`;
    return merge(super.updates, {
      attributes: {
        role: 'none'
      },
      style: {
        'background-color': backgroundColor,
        'height': size || base.style && base.style.height,
        'width': size || base.style && base.style.width
      }
    });
  }

}

customElements.define('elix-page-dot', PageDot);
export default PageDot;
