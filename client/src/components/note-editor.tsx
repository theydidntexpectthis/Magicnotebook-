import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bold, Italic, Underline, Heading, List, ListOrdered, CheckSquare, Palette, Image, Link, Save, X, PlusCircle } from "lucide-react";
import { useMarkdown } from "@/hooks/use-markdown";
import { StickyNote } from "@/components/ui/sticky-note";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type StickyNoteColor = "green" | "yellow" | "pink" | "blue" | "purple" | "orange";

interface Note {
  id: number;
  title: string;
  content: string;
  color: StickyNoteColor;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NoteEditorProps {
  note?: Note;
  onUpdate?: (updatedNote: Note) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdate }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(note?.title || "New Note");
  const [content, setContent] = useState(note?.content || "");
  const [color, setColor] = useState<StickyNoteColor>(note?.color || "yellow");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { renderMarkdown } = useMarkdown();
  
  // Using single note query only if we don't have a note passed as prop
  const { data: defaultNote, isLoading } = useQuery<Note>({
    queryKey: ["/api/notes"],
    enabled: !note, // Only run this query if no note is passed as prop
  });

  // Update note content and properties
  const { mutate: saveNote } = useMutation({
    mutationFn: async (noteData: { id?: number; title: string; content: string; color: StickyNoteColor }) => {
      if (note?.id) {
        // Update existing note
        const contentResponse = await apiRequest("POST", "/api/notes", { content: noteData.content });
        await contentResponse.json();
        
        const propsResponse = await apiRequest("PATCH", `/api/notes/${note.id}`, {
          title: noteData.title,
          color: noteData.color
        });
        return propsResponse.json();
      } else {
        // Create new note
        const response = await apiRequest("POST", "/api/notes/new", {
          title: noteData.title,
          content: noteData.content,
          color: noteData.color
        });
        return response.json();
      }
    },
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes/all"] });
      
      if (onUpdate) {
        onUpdate(updatedNote);
      }
      
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });
      
      setIsSaving(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to save note",
        description: (error as Error).message,
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  useEffect(() => {
    if (defaultNote && !isLoading && !note) {
      setTitle(defaultNote.title || "New Note");
      setContent(defaultNote.content || "");
      setColor(defaultNote.color || "yellow");
    }
  }, [defaultNote, isLoading, note]);

  // Auto-save note when content changes (only for the main editor, not for the modal)
  useEffect(() => {
    if (!note) { // Only auto-save for the main editor
      const timer = setTimeout(() => {
        if (content && defaultNote && (
          content !== defaultNote.content || 
          title !== defaultNote.title || 
          color !== defaultNote.color
        )) {
          setIsSaving(true);
          saveNote({ 
            id: defaultNote.id, 
            title, 
            content, 
            color 
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [content, title, color, defaultNote, note, saveNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleColorChange = (newColor: StickyNoteColor) => {
    setColor(newColor);
  };

  const handleManualSave = () => {
    setIsSaving(true);
    saveNote({
      id: note?.id || defaultNote?.id,
      title,
      content,
      color
    });
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById(note ? `editor-${note.id}` : "editor") as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);
    
    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setContent(newText);
    
    // Focus back on textarea after button click
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const renderColorSelection = () => (
    <Select 
      value={color} 
      onValueChange={(value) => handleColorChange(value as StickyNoteColor)}
    >
      <SelectTrigger className="w-[100px]">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${color === 'pink' ? 'red' : color}-300`}></div>
          <span className="capitalize">{color}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="yellow">Yellow</SelectItem>
        <SelectItem value="green">Green</SelectItem>
        <SelectItem value="pink">Pink</SelectItem>
        <SelectItem value="blue">Blue</SelectItem>
        <SelectItem value="purple">Purple</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Title and Color Selection */}
      <div className="mb-3 flex items-center justify-between">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Note Title"
          className="font-semibold text-lg bg-transparent border-none shadow-none focus-visible:ring-0 p-0 h-auto"
        />
        <div className="flex items-center gap-2">
          {renderColorSelection()}
          {note && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
          {!note && isSaving && (
            <div className="text-xs text-muted-foreground animate-pulse">
              Saving...
            </div>
          )}
        </div>
      </div>
      
      {/* Note Toolbar */}
      <div className="mb-3">
        <StickyNote color="orange" className="p-2 flex flex-wrap items-center gap-1 transform -rotate-1">
          <div className="flex space-x-1 mr-3">
            <button
              className="p-1.5 rounded hover:bg-amber-300/50 text-gray-800"
              title="Heading 1"
              onClick={() => insertMarkdown("# ", "\n")}
            >
              <Heading size={16} />
            </button>
            <button
              className="p-1.5 rounded hover:bg-amber-300/50 text-gray-800"
              title="Bold"
              onClick={() => insertMarkdown("**", "**")}
            >
              <Bold size={16} />
            </button>
            <button
              className="p-1.5 rounded hover:bg-amber-300/50 text-gray-800"
              title="Italic"
              onClick={() => insertMarkdown("*", "*")}
            >
              <Italic size={16} />
            </button>
            <button
              className="p-1.5 rounded hover:bg-amber-300/50 text-gray-800"
              title="Underline"
              onClick={() => insertMarkdown("__", "__")}
            >
              <Underline size={16} />
            </button>
          </div>
          <div className="flex space-x-1 mr-3">
            <button
              className="p-1.5 rounded hover:bg-amber-300/50 text-gray-800"
              title="Bullet List"
              onClick={() => insertMarkdown("- ")}
            >
              <List size={16} />
            </button>
            <button
              className="p-1.5 rounded hover:bg-amber-300/50 text-gray-800"
              title="Numbered List"
              onClick={() => insertMarkdown("1. ")}
            >
              <ListOrdered size={16} />
            </button>
            <button
              className="p-1.5 rounded hover:bg-amber-300/50 text-gray-800"
              title="Checklist"
              onClick={() => insertMarkdown("- [ ] ")}
            >
              <CheckSquare size={16} />
            </button>
          </div>
          <div className="flex space-x-1">
            <button
              className="p-1.5 rounded hover:bg-amber-300/50 text-gray-800"
              title="Insert Image"
              onClick={() => insertMarkdown("![Image](", ")")}
            >
              <Image size={16} />
            </button>
            <button
              className="p-1.5 rounded hover:bg-amber-300/50 text-gray-800"
              title="Insert Link"
              onClick={() => insertMarkdown("[Link](", ")")}
            >
              <Link size={16} />
            </button>
          </div>
        </StickyNote>
      </div>

      {/* Mobile Tab Controls */}
      <div className="flex mb-3 md:hidden">
        <StickyNote color="yellow" className="p-0 w-full">
          <div className="flex w-full">
            <button 
              className={`py-2 px-4 text-sm font-medium flex-1 ${
                isPreviewMode ? 'bg-transparent text-gray-700' : 'bg-amber-300/50 text-gray-800'
              }`}
              onClick={() => setIsPreviewMode(false)}
            >
              Editor
            </button>
            <button 
              className={`py-2 px-4 text-sm font-medium flex-1 ${
                isPreviewMode ? 'bg-amber-300/50 text-gray-800' : 'bg-transparent text-gray-700'
              }`}
              onClick={() => setIsPreviewMode(true)}
            >
              Preview
            </button>
          </div>
        </StickyNote>
      </div>

      {/* Editor Content */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Markdown Editor */}
        <div className={`md:w-1/2 w-full ${isPreviewMode ? 'hidden md:block' : 'block'}`}>
          <StickyNote color={color} className="h-full flex flex-col transform rotate-1 relative">
            <textarea
              id={note ? `editor-${note.id}` : "editor"}
              className="w-full h-full p-4 bg-transparent resize-none focus:outline-none text-gray-800"
              value={content}
              onChange={handleTextChange}
              placeholder="Start typing your magical notes here... ✨"
              style={{ minHeight: isPreviewMode ? '0' : '300px' }}
            />
          </StickyNote>
        </div>

        {/* Markdown Preview */}
        <div className={`md:w-1/2 w-full ${isPreviewMode ? 'block' : 'hidden md:block'}`}>
          <StickyNote color="blue" className="h-full p-4 overflow-auto transform -rotate-1 relative">
            <div 
              className="prose prose-sm md:prose max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </StickyNote>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
