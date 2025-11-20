import { useState, useEffect } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image as ImageIcon,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  Undo,
  Redo,
  Palette,
  TableProperties,
  Columns,
  Rows,
  Maximize2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TiptapEditorProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<string>;
}

export function TiptapEditor({ editor, onImageUpload }: TiptapEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  if (!editor) {
    return null;
  }
  
  const renderEditor = () => (
    <EditorContent editor={editor} className={isFullscreen ? "h-full" : ""} />
  );

  const addImage = async () => {
    if (!onImageUpload) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Image upload failed:', error);
      }
    };
    input.click();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addColumnBefore = () => {
    editor.chain().focus().addColumnBefore().run();
  };

  const addColumnAfter = () => {
    editor.chain().focus().addColumnAfter().run();
  };

  const deleteColumn = () => {
    editor.chain().focus().deleteColumn().run();
  };

  const addRowBefore = () => {
    editor.chain().focus().addRowBefore().run();
  };

  const addRowAfter = () => {
    editor.chain().focus().addRowAfter().run();
  };

  const deleteRow = () => {
    editor.chain().focus().deleteRow().run();
  };

  const deleteTable = () => {
    editor.chain().focus().deleteTable().run();
  };

  const mergeCells = () => {
    editor.chain().focus().mergeCells().run();
  };

  const splitCell = () => {
    editor.chain().focus().splitCell().run();
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    const variable = e.dataTransfer?.getData('text/plain');
    if (variable && variable.startsWith('{') && variable.endsWith('}')) {
      e.preventDefault();
      editor.chain().focus().insertContent(variable).run();
    }
    setIsDragOver(false);
  };

  return (
    <div 
      className={`tiptap-editor ${isDragOver ? 'drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      data-testid="editor-quotation-html"
    >
      <div className="tiptap-toolbar">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="separator" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <div className="separator" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>

        <div className="separator" />

        <div className="flex gap-1">
          <input
            type="color"
            onInput={(e) => setColor((e.target as HTMLInputElement).value)}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-8 h-8 rounded cursor-pointer"
            title="Text Color"
          />
        </div>

        <div className="separator" />

        {!editor.isActive('floatingImage') && (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </>
        )}

        <div className="separator" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="separator" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </Button>

        <div className="separator" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={addImage}
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>

        {editor.isActive('floatingImage') && (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => (editor.chain().focus() as any).setImageAlign('left').run()}
              className={editor.getAttributes('floatingImage').align === 'left' ? 'is-active' : ''}
              title="Căn trái"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => (editor.chain().focus() as any).setImageAlign('center').run()}
              className={editor.getAttributes('floatingImage').align === 'center' ? 'is-active' : ''}
              title="Căn giữa"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => (editor.chain().focus() as any).setImageAlign('right').run()}
              className={editor.getAttributes('floatingImage').align === 'right' ? 'is-active' : ''}
              title="Căn phải"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </>
        )}

        <div className="separator" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={insertTable}
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </Button>

        {editor.isActive('table') && (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addColumnBefore}
              title="Add Column Before"
            >
              <Columns className="w-4 h-4" />➖
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addColumnAfter}
              title="Add Column After"
            >
              <Columns className="w-4 h-4" />➕
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={deleteColumn}
              title="Delete Column"
            >
              <Columns className="w-4 h-4" />❌
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addRowBefore}
              title="Add Row Before"
            >
              <Rows className="w-4 h-4" />➖
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addRowAfter}
              title="Add Row After"
            >
              <Rows className="w-4 h-4" />➕
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={deleteRow}
              title="Delete Row"
            >
              <Rows className="w-4 h-4" />❌
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={mergeCells}
              title="Merge Cells"
              disabled={!editor.can().mergeCells()}
            >
              <TableProperties className="w-4 h-4" />🔗
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={splitCell}
              title="Split Cell"
              disabled={!editor.can().splitCell()}
            >
              <TableProperties className="w-4 h-4" />✂️
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={deleteTable}
              title="Delete Table"
            >
              ❌ Table
            </Button>
          </>
        )}

        <div className="separator" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setIsFullscreen(true)}
          title="Phóng to trình soạn thảo"
          data-testid="button-fullscreen-editor"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
      {!isFullscreen && renderEditor()}

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Trình soạn thảo - Chế độ phóng to</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6">
            <div className="h-full tiptap-editor">
              <div className="tiptap-toolbar">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </Button>

                <div className="separator" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                  title="Heading 3"
                >
                  <Heading3 className="w-4 h-4" />
                </Button>

                <div className="separator" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={editor.isActive('bold') ? 'is-active' : ''}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={editor.isActive('italic') ? 'is-active' : ''}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={editor.isActive('underline') ? 'is-active' : ''}
                  title="Underline"
                >
                  <UnderlineIcon className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={editor.isActive('strike') ? 'is-active' : ''}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </Button>

                <div className="separator" />

                <div className="flex gap-1">
                  <input
                    type="color"
                    onInput={(e) => setColor((e.target as HTMLInputElement).value)}
                    value={editor.getAttributes('textStyle').color || '#000000'}
                    className="w-8 h-8 rounded cursor-pointer"
                    title="Text Color"
                  />
                </div>

                <div className="separator" />

                {!editor.isActive('floatingImage') && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => editor.chain().focus().setTextAlign('left').run()}
                      className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
                      title="Align Left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => editor.chain().focus().setTextAlign('center').run()}
                      className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
                      title="Align Center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => editor.chain().focus().setTextAlign('right').run()}
                      className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
                      title="Align Right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </>
                )}

                <div className="separator" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={editor.isActive('bulletList') ? 'is-active' : ''}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={editor.isActive('orderedList') ? 'is-active' : ''}
                  title="Ordered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>

                <div className="separator" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={editor.isActive('blockquote') ? 'is-active' : ''}
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={editor.isActive('codeBlock') ? 'is-active' : ''}
                  title="Code Block"
                >
                  <Code className="w-4 h-4" />
                </Button>

                <div className="separator" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={addImage}
                  title="Insert Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>

                {editor.isActive('floatingImage') && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => (editor.chain().focus() as any).setImageAlign('left').run()}
                      className={editor.getAttributes('floatingImage').align === 'left' ? 'is-active' : ''}
                      title="Căn trái"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => (editor.chain().focus() as any).setImageAlign('center').run()}
                      className={editor.getAttributes('floatingImage').align === 'center' ? 'is-active' : ''}
                      title="Căn giữa"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => (editor.chain().focus() as any).setImageAlign('right').run()}
                      className={editor.getAttributes('floatingImage').align === 'right' ? 'is-active' : ''}
                      title="Căn phải"
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </>
                )}

                <div className="separator" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={insertTable}
                  title="Insert Table"
                >
                  <TableIcon className="w-4 h-4" />
                </Button>

                {editor.isActive('table') && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={addColumnBefore}
                      title="Add Column Before"
                    >
                      <Columns className="w-4 h-4" />➖
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={addColumnAfter}
                      title="Add Column After"
                    >
                      <Columns className="w-4 h-4" />➕
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={deleteColumn}
                      title="Delete Column"
                    >
                      <Columns className="w-4 h-4" />❌
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={addRowBefore}
                      title="Add Row Before"
                    >
                      <Rows className="w-4 h-4" />➖
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={addRowAfter}
                      title="Add Row After"
                    >
                      <Rows className="w-4 h-4" />➕
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={deleteRow}
                      title="Delete Row"
                    >
                      <Rows className="w-4 h-4" />❌
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={mergeCells}
                      title="Merge Cells"
                      disabled={!editor.can().mergeCells()}
                    >
                      <TableProperties className="w-4 h-4" />🔗
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={splitCell}
                      title="Split Cell"
                      disabled={!editor.can().splitCell()}
                    >
                      <TableProperties className="w-4 h-4" />✂️
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={deleteTable}
                      title="Delete Table"
                    >
                      ❌ Table
                    </Button>
                  </>
                )}
              </div>
              <div className="h-[calc(100%-3rem)] overflow-y-auto">
                {isFullscreen && renderEditor()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
