import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bold, Italic, Underline, Heading, List, ListOrdered, CheckSquare, Palette, Image, Link } from "lucide-react";
import { useMarkdown } from "@/hooks/use-markdown";
import { StickyNote } from "@/components/ui/sticky-note";

const NoteEditor: React.FC = () => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { renderMarkdown } = useMarkdown();

  // Fetch note content
  const { data: note, isLoading } = useQuery<{ content: string }>({
    queryKey: ["/api/notes"],
  });

  // Save note content
  const { mutate: saveNote } = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/notes", { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save note",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (note && !isLoading) {
      setContent(note.content || "");
    }
  }, [note, isLoading]);

  // Auto-save note when content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && note && content !== note.content) {
        saveNote(content);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, note, saveNote]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("editor") as HTMLTextAreaElement;
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

  return (
    <div className="flex flex-col h-full">
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
              title="Text Color"
            >
              <Palette size={16} />
            </button>
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
          <StickyNote color="yellow" className="h-full flex flex-col transform rotate-1 relative">
            <textarea
              id="editor"
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
