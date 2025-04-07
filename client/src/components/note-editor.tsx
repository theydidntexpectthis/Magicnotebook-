import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bold, Italic, Underline, Heading, List, ListOrdered, CheckSquare, Palette, Image, Link } from "lucide-react";
import { useMarkdown } from "@/hooks/use-markdown";

const NoteEditor: React.FC = () => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col paper-bg" style={{
      backgroundColor: "#FEFAF4",
      backgroundImage: "url('https://www.transparenttextures.com/patterns/notebook.png')"
    }}>
      {/* Note Toolbar */}
      <div className="note-toolbar bg-white border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
        <div className="flex space-x-1 mr-3">
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Heading 1"
            onClick={() => insertMarkdown("# ", "\n")}
          >
            <Heading size={16} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Bold"
            onClick={() => insertMarkdown("**", "**")}
          >
            <Bold size={16} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Italic"
            onClick={() => insertMarkdown("*", "*")}
          >
            <Italic size={16} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Underline"
            onClick={() => insertMarkdown("__", "__")}
          >
            <Underline size={16} />
          </button>
        </div>
        <div className="flex space-x-1 mr-3">
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Bullet List"
            onClick={() => insertMarkdown("- ")}
          >
            <List size={16} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Numbered List"
            onClick={() => insertMarkdown("1. ")}
          >
            <ListOrdered size={16} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Checklist"
            onClick={() => insertMarkdown("- [ ] ")}
          >
            <CheckSquare size={16} />
          </button>
        </div>
        <div className="flex space-x-1">
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Text Color"
          >
            <Palette size={16} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Insert Image"
            onClick={() => insertMarkdown("![Image](", ")")}
          >
            <Image size={16} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-100"
            title="Insert Link"
            onClick={() => insertMarkdown("[Link](", ")")}
          >
            <Link size={16} />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Markdown Editor */}
        <div className="w-1/2 border-r border-gray-200">
          <textarea
            id="editor"
            className="w-full h-full p-4 md:p-6 bg-transparent resize-none focus:outline-none"
            value={content}
            onChange={handleTextChange}
            placeholder="Start typing your notes here..."
          />
        </div>

        {/* Markdown Preview */}
        <div className="w-1/2 p-4 md:p-6 overflow-auto">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
