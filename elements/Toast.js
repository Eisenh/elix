import * as props from '../utilities/props.js';
import ElementBase from './ElementBase.js';
import KeyboardMixin from '../mixins/KeyboardMixin.js';
import LanguageDirectionMixin from '../mixins/LanguageDirectionMixin.js';
import OpenCloseTransitionMixin from '../mixins/OpenCloseTransitionMixin.js';
import OverlayMixin from '../mixins/OverlayMixin.js';
import PopupModalityMixin from '../mixins/PopupModalityMixin.js';
import symbols from '../utilities/symbols.js';


const timeoutKey = Symbol('timeout');


const Base =
  KeyboardMixin(
  LanguageDirectionMixin(
  OpenCloseTransitionMixin(
  OverlayMixin(
  PopupModalityMixin(
    ElementBase
  )))));


/**
 * A lightweight popup intended to display a short, non-critical message until a
 * specified `duration` elapses or the user dismisses it.
 * 
 * @mixes AttributeMarshallingMixin
 * @mixes OpenCloseMixin
 * @mixes OverlayMixin
 * @mixes ShadowTemplateMixin
 * @mixes TransitionEffectMixin
 */
class Toast extends Base {

  constructor() {
    super();
    this.addEventListener('mouseout', () => {
      startTimerIfOpened(this);
    });
    this.addEventListener('mouseover', () => {
      clearTimer(this);
    });
  }

  async close() {
    await this.startClose();
  }

  async componentDidMount() {
    if (super.componentDidMount) { await super.componentDidMount(); }
    startTimerIfOpened(this);
  }

  async componentDidUpdate() {
    if (super.componentDidUpdate) { await super.componentDidUpdate(); }
    startTimerIfOpened(this);
  }

  get defaultState() {
    return Object.assign({}, super.defaultState, {
      duration: null,
      fromEdge: 'bottom'
    });
  }

  get duration() {
    return this.state.duration;
  }
  set duration(duration) {
    this.setState({ duration });
  }

  /* eslint-disable no-unused-vars */
  [symbols.elementsWithTransitions](visualState) {
    return [this.$.content];
  }

  get fromEdge() {
    return this.state.fromEdge;
  }
  set fromEdge(fromEdge) {
    this.setState({ fromEdge });
  }

  get props() {
    const base = super.props || {};

    // Host
    const hostEdgeStyles = {
      'bottom': {
        'align-items': 'center',
        'justify-content': 'flex-end',
      },
      'bottom-left': {
        'align-items': 'flex-start',
        'justify-content': 'flex-end',
      },
      'bottom-right': {
        'align-items': 'flex-end',
        'justify-content': 'flex-end',
      },
      'top': {
        'align-items': 'center',
        'justify-content': null
      },
      'top-left': {
        'align-items': 'flex-start',
        'justify-content': null
      },
      'top-right': {
        'align-items': 'flex-end',
        'justify-content': null
      }
    };
    const hostEdgeStyle = hostEdgeStyles[this.state.fromEdge];
    const display = this.closed ?
      null :
      base.style && base.style.display || 'flex';

    // Content
    const oppositeEdge = {
      'bottom-left': 'bottom-right',
      'bottom-right': 'bottom-left',
      'top-left': 'top-right',
      'top-right': 'top-left'
    };
    const fromEdge = this.state.fromEdge;
    const languageAdjustedEdge = this.rightToLeft ?
      (oppositeEdge[fromEdge] || fromEdge) :
      fromEdge;

    const edgeTransforms = {
      'bottom': 'translateY(100%)',
      'bottom-left': 'translateX(-100%)',
      'bottom-right': 'translateX(100%)',
      'top': 'translateY(-100%)',
      'top-left': 'translateX(-100%)',
      'top-right': 'translateX(100%)'
    };
    const openEdgeTransforms = {
      'bottom': 'translateY(0)',
      'bottom-left': 'translateX(0)',
      'bottom-right': 'translateX(0)',
      'top': 'translateY(0)',
      'top-left': 'translateX(0)',
      'top-right': 'translateX(0)'
    };

    const opacity = this.opened ? 1 : 0;
    const transform = this.opened ?
      openEdgeTransforms[languageAdjustedEdge] :
      edgeTransforms[languageAdjustedEdge];

    const contentProps = {
      style: {
        opacity,
        transform
      }
    };
    
    return props.merge(base, {
      style: {
        'align-items': hostEdgeStyle['align-items'],
        display,
        'justify-content': hostEdgeStyle['justify-content'],
      },
      $: {
        content: contentProps
      }
    });
  }

  async open() {
    await this.startOpen();
  }

  get [symbols.template]() {
    return `
      <style>
        :host {
          flex-direction: column;
          height: 100%;
          left: 0;
          outline: none;
          pointer-events: none;
          position: fixed;
          top: 0;
          -webkit-tap-highlight-color: transparent;
          width: 100%;
        }

        #content {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.2);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
          margin: 1em;
          pointer-events: initial;
          position: relative;
          transition-duration: 0.25s;
          transition-property: opacity, transform;
          will-change: opacity, transform;
        }
      </style>
      <div id="content">
        <slot></slot>
      </div>
    `;
  }

}


function clearTimer(element) {
  if (element[timeoutKey]) {
    clearTimeout(element[timeoutKey]);
    element[timeoutKey] = null;
  }
}

function startTimer(element) {
  clearTimer(element);
  const duration = element.state.duration;
  if (duration !== null && duration > 0) {
    element[timeoutKey] = setTimeout(() => {
      element.close();
    }, duration);
  }
}

function startTimerIfOpened(element) {
  if (element.opened) {
    startTimer(element);
  }
}


customElements.define('elix-toast', Toast);
export default Toast;
