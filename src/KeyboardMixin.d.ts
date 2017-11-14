// Elix is a JavaScript project, but we use TypeScript as an internal tool to
// confirm our code is type safe.

/// <reference path="../src/shared.d.ts"/>

declare const KeyboardMixin: StateMixin<{
  connectedCallback?(): void;
},
{},
{
  connectedCallback(): void;
},
{
  tabindex: string
}>;

export default KeyboardMixin;