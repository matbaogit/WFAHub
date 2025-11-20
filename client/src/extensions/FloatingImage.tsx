import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

// React component for the resizable image node view
const ResizableImageComponent = ({ node, updateAttributes, selected }: any) => {
  const { src, alt, width, height, align } = node.attrs;
  
  console.log('ResizableImageComponent render - align:', align, 'selected:', selected);
  
  const handleResize = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = e.currentTarget.parentElement as HTMLElement;
    if (!container) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = container.offsetWidth;
    const startHeight = container.offsetHeight;
    const aspectRatio = startWidth / startHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (corner.includes('right')) {
        newWidth = startWidth + (moveEvent.clientX - startX);
      } else if (corner.includes('left')) {
        newWidth = startWidth - (moveEvent.clientX - startX);
      }

      if (corner.includes('bottom')) {
        newHeight = startHeight + (moveEvent.clientY - startY);
      } else if (corner.includes('top')) {
        newHeight = startHeight - (moveEvent.clientY - startY);
      }

      // Maintain aspect ratio
      if (corner === 'top-left' || corner === 'top-right' || 
          corner === 'bottom-left' || corner === 'bottom-right') {
        newHeight = newWidth / aspectRatio;
      }

      // Minimum size
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(50, newHeight);

      // Update container size directly for smooth resize
      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Only update attributes once when mouse is released
      const finalWidth = container.offsetWidth;
      const finalHeight = container.offsetHeight;
      
      // Clear inline styles and use attributes instead
      container.style.width = '';
      container.style.height = '';
      
      updateAttributes({
        width: `${finalWidth}px`,
        height: `${finalHeight}px`,
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const alignClass = align === 'center' ? 'image-align-center' : 
                     align === 'right' ? 'image-align-right' : 'image-align-left';

  return (
    <NodeViewWrapper 
      className={`resizable-image-wrapper ${alignClass} ${selected ? 'selected' : ''}`}
      draggable={false}
      data-drag-handle
    >
      <div className="image-container" style={{ width: width || 'auto', height: height || 'auto' }}>
        <img 
          src={src} 
          alt={alt || ''} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
        {selected && (
          <>
            <div 
              className="resize-handle resize-handle-tl" 
              onMouseDown={(e) => handleResize(e, 'top-left')}
              draggable={false}
            />
            <div 
              className="resize-handle resize-handle-tr" 
              onMouseDown={(e) => handleResize(e, 'top-right')}
              draggable={false}
            />
            <div 
              className="resize-handle resize-handle-bl" 
              onMouseDown={(e) => handleResize(e, 'bottom-left')}
              draggable={false}
            />
            <div 
              className="resize-handle resize-handle-br" 
              onMouseDown={(e) => handleResize(e, 'bottom-right')}
              draggable={false}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

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

  // Keep as block-level for better control
  inline: false,
  group: 'block',
  
  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }: { HTMLAttributes: Record<string, any>; node: any }) {
    const { align, width, height } = node.attrs;
    return [
      'div',
      { 
        class: `resizable-image-wrapper image-align-${align || 'left'}`,
        style: width ? `width: ${width}; height: ${height || 'auto'};` : undefined
      },
      [
        'div',
        { class: 'image-container' },
        ['img', mergeAttributes(HTMLAttributes, { 'data-align': align })]
      ]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setImageAlign: (align: string) => ({ commands }: any) => {
        console.log('setImageAlign called with:', align);
        const result = commands.updateAttributes('floatingImage', { align });
        console.log('updateAttributes result:', result);
        return result;
      },
    };
  },
});
