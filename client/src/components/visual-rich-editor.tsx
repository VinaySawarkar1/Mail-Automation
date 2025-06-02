import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Sparkles,
  CheckCircle,
  Loader2,
  Type
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VisualRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  enableAI?: boolean;
}

export default function VisualRichEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your email content...",
  className,
  enableAI = true 
}: VisualRichEditorProps) {
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSource, setShowSource] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const insertAtCursor = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    // Move cursor after inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update value
    onChange(editor.innerText || editor.textContent || '');
  }, [onChange]);

  const formatText = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    
    try {
      if (command === 'createLink') {
        const url = prompt("Enter URL:");
        if (url) {
          document.execCommand(command, false, url);
        }
      } else {
        document.execCommand(command, false, value);
      }
      
      // Update the text value
      onChange(editor.innerText || editor.textContent || '');
    } catch (error) {
      console.error('Format command failed:', error);
    }
  };

  const handleInput = () => {
    const editor = editorRef.current;
    if (editor) {
      onChange(editor.innerText || editor.textContent || '');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiRequest("POST", "/api/upload/image", formData);
      const data = await response.json();
      
      // Insert image at cursor position
      const editor = editorRef.current;
      if (editor) {
        editor.focus();
        document.execCommand('insertImage', false, data.url);
        onChange(editor.innerText || editor.textContent || '');
      }
      
      toast({
        title: "Image uploaded",
        description: "Image inserted at cursor position"
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getAISuggestions = async () => {
    if (!value.trim()) {
      toast({
        title: "No content",
        description: "Please enter some text to get AI suggestions",
        variant: "destructive"
      });
      return;
    }

    setIsAISuggesting(true);
    try {
      const response = await apiRequest("POST", "/api/ai/suggestions", {
        content: value,
        type: "email_body"
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      
      toast({
        title: "AI suggestions generated",
        description: `Generated ${data.suggestions?.length || 0} suggestions`
      });
    } catch (error: any) {
      toast({
        title: "AI suggestions failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAISuggesting(false);
    }
  };

  const correctGrammar = async () => {
    if (!value.trim()) {
      toast({
        title: "No content",
        description: "Please enter some text to correct",
        variant: "destructive"
      });
      return;
    }

    setIsCorrecting(true);
    try {
      const response = await apiRequest("POST", "/api/ai/correct", {
        content: value
      });
      const data = await response.json();
      
      if (data.correctedText && data.correctedText !== value) {
        const editor = editorRef.current;
        if (editor) {
          editor.innerText = data.correctedText;
          onChange(data.correctedText);
        }
        toast({
          title: "Grammar corrected",
          description: "Text has been improved and corrected"
        });
      } else {
        toast({
          title: "No corrections needed",
          description: "Your text looks good!"
        });
      }
    } catch (error: any) {
      toast({
        title: "Grammar correction failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCorrecting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyLeft')}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyCenter')}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyRight')}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertUnorderedList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertOrderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('createLink')}
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Insert Image"
          >
            <Image className="w-4 h-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {enableAI && (
          <>
            <div className="w-px bg-gray-300 dark:bg-gray-600" />
            
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={getAISuggestions}
                disabled={isAISuggesting}
                title="AI Suggestions"
              >
                {isAISuggesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={correctGrammar}
                disabled={isCorrecting}
                title="Grammar Check"
              >
                {isCorrecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
              </Button>
            </div>
          </>
        )}

        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSource(!showSource)}
          >
            <Type className="w-4 h-4 mr-1" />
            {showSource ? 'Visual' : 'Source'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      {showSource ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("w-full min-h-[200px] p-3 border rounded-md font-mono text-sm", className)}
          placeholder={placeholder}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className={cn(
            "w-full min-h-[200px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 prose max-w-none",
            className
          )}
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: value || `<p style="color: #999;">${placeholder}</p>` }}
        />
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
            AI Suggestions
          </h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                onClick={() => {
                  const editor = editorRef.current;
                  if (editor) {
                    editor.innerHTML = suggestion;
                    onChange(suggestion);
                  }
                  setSuggestions([]);
                  toast({
                    title: "Suggestion applied",
                    description: "AI suggestion has been applied to your text"
                  });
                }}
              >
                <p className="text-sm">{suggestion}</p>
                <Badge variant="secondary" className="mt-2">
                  Click to apply
                </Badge>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuggestions([])}
            className="mt-2"
          >
            Clear suggestions
          </Button>
        </Card>
      )}
    </div>
  );
}