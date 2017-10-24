// Elix is a JavaScript project, but we use TypeScript as an internal tool to
// confirm our code is type safe.

/// <reference path="../utilities/shared.d.ts"/>

declare const ContentItemsMixin: StateMixin<{
  items?: Element[];
},
{},
{
  itemProps(item: Element, index: number, original: any): any;
  items: Element[];
},
{
  items: Element[];
}>;

export default ContentItemsMixin;
