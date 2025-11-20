import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export const FloatingImage = Image.extend({
  name: 'floatingImage',

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('src'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      alt: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('alt'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.alt) return {};
          return { alt: attributes.alt };
        },
      },
      title: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('title'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      
      // Add class attribute for float positioning
      class: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('class'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
      
      // Preserve inline styles from Word
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
      
      // Width for sizing
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const width = element.getAttribute('width') || (element as HTMLImageElement).style.width;
          return width;
        },
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      
      // Height for sizing
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const height = element.getAttribute('height') || (element as HTMLImageElement).style.height;
          return height;
        },
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      
      // Alignment attribute
      align: {
        default: 'left',
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute('data-align') || 'left';
        },
        renderHTML: (attributes: Record<string, any>) => {
          return { 'data-align': attributes.align };
        },
      },
    };
  },

  // Enable inline images (required for text wrapping)
  inline: true,
  group: 'inline',
  
  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['img', mergeAttributes(HTMLAttributes, { class: 'resizable-image' })];
  },

  addCommands() {
    return {
      setImageAlign: (align: string) => ({ commands }) => {
        return commands.updateAttributes('floatingImage', { align });
      },
    };
  },
});
