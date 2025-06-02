
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bold, 
  Italic, 
  Underline, 
  Type, 
  Palette, 
  Highlighter, 
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Trash2
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageInsert?: (file: File) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  onImageInsert, 
  placeholder = "Enter your text here...", 
  rows = 6,
  id 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState('14');
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffff00');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeData, setResizeData] = useState({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    aspectRatio: 1
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && !isUpdating) {
      const editor = editorRef.current;
      if (editor.innerHTML !== value) {
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        
        editor.innerHTML = value || '';
        setupImageHandlers();
        
        // Restore cursor position if possible
        if (range && editor.contains(range.commonAncestorContainer)) {
          try {
            selection?.removeAllRanges();
            selection?.addRange(range);
          } catch (e) {
            // If restoring fails, place cursor at end
            placeCursorAtEnd();
          }
        }
      }
    }
  }, [value, isUpdating]);

  const placeCursorAtEnd = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    const range = document.createRange();
    
    // Place cursor at the end of content
    if (editor.lastChild) {
      if (editor.lastChild.nodeType === Node.TEXT_NODE) {
        range.setStart(editor.lastChild, editor.lastChild.textContent?.length || 0);
      } else {
        range.setStartAfter(editor.lastChild);
      }
    } else {
      range.setStart(editor, 0);
    }
    
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  // Setup image click handlers and resize handles
  const setupImageHandlers = () => {
    if (!editorRef.current) return;

    const images = editorRef.current.querySelectorAll('img');
    images.forEach(img => {
      img.style.cursor = 'pointer';
      img.onclick = (e) => {
        e.preventDefault();
        selectImage(img);
      };

      // Make images resizable
      if (!img.style.position) {
        img.style.position = 'relative';
        img.style.display = 'inline-block';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    });
  };

  const selectImage = (img: HTMLImageElement) => {
    clearImageSelection();
    setSelectedImage(img);
    img.style.border = '2px solid #007acc';
    img.style.outline = 'none';
    addResizeHandles(img);
  };

  const clearImageSelection = () => {
    if (selectedImage) {
      selectedImage.style.border = '';
      selectedImage.style.outline = '';
      removeResizeHandles();
    }
    setSelectedImage(null);
  };

  const addResizeHandles = (img: HTMLImageElement) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.className = 'image-resize-wrapper';

    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    const handles = ['nw', 'ne', 'sw', 'se'];
    handles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${position}`;
      handle.style.position = 'absolute';
      handle.style.width = '8px';
      handle.style.height = '8px';
      handle.style.backgroundColor = '#007acc';
      handle.style.cursor = `${position}-resize`;
      handle.style.zIndex = '1000';

      switch (position) {
        case 'nw':
          handle.style.top = '-4px';
          handle.style.left = '-4px';
          break;
        case 'ne':
          handle.style.top = '-4px';
          handle.style.right = '-4px';
          break;
        case 'sw':
          handle.style.bottom = '-4px';
          handle.style.left = '-4px';
          break;
        case 'se':
          handle.style.bottom = '-4px';
          handle.style.right = '-4px';
          break;
      }

      handle.addEventListener('mousedown', (e) => startResize(e, img, position));
      wrapper.appendChild(handle);
    });
  };

  const removeResizeHandles = () => {
    const wrapper = editorRef.current?.querySelector('.image-resize-wrapper');
    if (wrapper && selectedImage) {
      wrapper.parentNode?.insertBefore(selectedImage, wrapper);
      wrapper.remove();
    }
  };

  const startResize = (e: MouseEvent, img: HTMLImageElement, position: string) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    const rect = img.getBoundingClientRect();
    const aspectRatio = rect.width / rect.height;

    setResizeData({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      aspectRatio
    });

    const handleMouseMove = (e: MouseEvent) => {
      resizeImage(e, img, position);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      updateContent();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const resizeImage = (e: MouseEvent, img: HTMLImageElement, position: string) => {
    const deltaX = e.clientX - resizeData.startX;
    const deltaY = e.clientY - resizeData.startY;

    let newWidth = resizeData.startWidth;
    let newHeight = resizeData.startHeight;

    switch (position) {
      case 'se':
        newWidth = Math.max(50, resizeData.startWidth + deltaX);
        newHeight = newWidth / resizeData.aspectRatio;
        break;
      case 'sw':
        newWidth = Math.max(50, resizeData.startWidth - deltaX);
        newHeight = newWidth / resizeData.aspectRatio;
        break;
      case 'ne':
        newWidth = Math.max(50, resizeData.startWidth + deltaX);
        newHeight = newWidth / resizeData.aspectRatio;
        break;
      case 'nw':
        newWidth = Math.max(50, resizeData.startWidth - deltaX);
        newHeight = newWidth / resizeData.aspectRatio;
        break;
    }

    img.style.width = `${newWidth}px`;
    img.style.height = `${newHeight}px`;
  };

  const executeCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection) return;

    clearImageSelection();

    try {
      if (command === 'formatBlock') {
        document.execCommand(command, false, value);
      } else if (command === 'foreColor' || command === 'hiliteColor' || command === 'backColor') {
        document.execCommand(command, false, value);
      } else if (command === 'fontSize') {
        document.execCommand(command, false, value);
      } else {
        // For bold, italic, underline, etc.
        document.execCommand(command, false);
      }
      
      // Force update after command
      setTimeout(() => {
        updateContent();
      }, 10);
    } catch (error) {
      console.warn('execCommand failed for:', command, error);
    }
  };

  const updateContent = () => {
    if (editorRef.current) {
      setIsUpdating(true);
      const content = editorRef.current.innerHTML;
      onChange(content);
      setTimeout(() => {
        setIsUpdating(false);
        setupImageHandlers();
      }, 0);
    }
  };

  const handleInput = (e: React.FormEvent) => {
    clearImageSelection();
    updateContent();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      // Split text by line breaks and insert as separate elements
      const lines = text.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (index > 0) {
          const br = document.createElement('br');
          range.insertNode(br);
          range.setStartAfter(br);
        }
        const textNode = document.createTextNode(line);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
      });

      selection.removeAllRanges();
      selection.addRange(range);
      updateContent();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedImage) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const wrapper = selectedImage.closest('.image-resize-wrapper');
        if (wrapper) {
          wrapper.remove();
        } else {
          selectedImage.remove();
        }
        setSelectedImage(null);
        updateContent();
        return;
      }
      clearImageSelection();
    }

    // Handle Enter key for proper line breaks
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Insert a line break
        const br = document.createElement('br');
        range.deleteContents();
        range.insertNode(br);
        
        // Create another br for the new line
        const br2 = document.createElement('br');
        range.setStartAfter(br);
        range.insertNode(br2);
        
        // Position cursor after the second br
        range.setStartAfter(br2);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        updateContent();
      }
      return;
    }

    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'IMG') {
      clearImageSelection();
    }
  };

  const insertImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageInsert) {
      onImageInsert(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const imgSrc = e.target?.result as string;
        const img = document.createElement('img');
        img.src = imgSrc;
        img.style.maxWidth = '300px';
        img.style.height = 'auto';
        img.style.display = 'inline-block';
        img.style.cursor = 'pointer';

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          range.setStartAfter(img);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          editorRef.current?.appendChild(img);
        }

        updateContent();
      };
      reader.readAsDataURL(file);
    }
  };

  const applyFontSize = () => {
    executeCommand('fontSize', fontSize);
  };

  const applyTextColor = () => {
    executeCommand('foreColor', textColor);
  };

  const applyBackgroundColor = () => {
    executeCommand('hiliteColor', backgroundColor);
  };

  const clearContent = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      onChange('');
      editorRef.current.focus();
    }
  };

  const formatButtons = [
    { icon: Bold, action: () => executeCommand('bold'), title: 'Bold (Ctrl+B)' },
    { icon: Italic, action: () => executeCommand('italic'), title: 'Italic (Ctrl+I)' },
    { icon: Underline, action: () => executeCommand('underline'), title: 'Underline (Ctrl+U)' },
    { icon: List, action: () => executeCommand('insertUnorderedList'), title: 'Bullet List' },
    { icon: ListOrdered, action: () => executeCommand('insertOrderedList'), title: 'Numbered List' },
    { icon: AlignLeft, action: () => executeCommand('justifyLeft'), title: 'Align Left' },
    { icon: AlignCenter, action: () => executeCommand('justifyCenter'), title: 'Align Center' },
    { icon: AlignRight, action: () => executeCommand('justifyRight'), title: 'Align Right' },
  ];

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border rounded-lg bg-gray-50">
        {formatButtons.map((button, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            onClick={button.action}
            title={button.title}
            className="h-8 w-8 p-0 hover:bg-gray-200"
          >
            <button.icon className="h-4 w-4" />
          </Button>
        ))}

        {/* Font Size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" title="Font Size">
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <div className="flex gap-2">
              <Input
                id="fontSize"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="flex-1"
                min="8"
                max="72"
              />
              <Button 
                type="button"
                size="sm" 
                onClick={applyFontSize}
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Color">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <Label htmlFor="textColor">Text Color</Label>
            <div className="flex gap-2">
              <input
                id="textColor"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-8 rounded border"
              />
              <Button 
                type="button"
                size="sm" 
                onClick={applyTextColor}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Highlight">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <Label htmlFor="backgroundColor">Highlight Color</Label>
            <div className="flex gap-2">
              <input
                id="backgroundColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-8 rounded border"
              />
              <Button 
                type="button"
                size="sm" 
                onClick={applyBackgroundColor}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Insert Image */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertImage}
          className="h-8 w-8 p-0"
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </Button>

        {/* Clear Content */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearContent}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Clear Content"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={imageInputRef}
          className="hidden"
        />
      </div>

      {/* WYSIWYG Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onClick={handleClick}
        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
        style={{ 
          minHeight: `${rows * 1.5}rem`,
          lineHeight: '1.5',
          overflowY: 'auto'
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        [contenteditable] div {
          margin: 0;
          line-height: 1.5;
        }
        [contenteditable] br {
          line-height: 1.5;
        }
        [contenteditable] span {
          display: inline;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          display: inline-block;
          vertical-align: baseline;
        }
        .image-resize-wrapper {
          display: inline-block;
          position: relative;
        }
        .resize-handle {
          border: 1px solid #fff;
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
        }
        .resize-handle:hover {
          background-color: #005fa3 !important;
        }
      `}</style>
    </div>
  );
}
