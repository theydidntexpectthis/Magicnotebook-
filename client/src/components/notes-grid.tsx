import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter, Pin, Archive, Trash, Edit, ArchiveRestore } from "lucide-react";
import { StickyNote } from "@/components/ui/sticky-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkdown } from "@/hooks/use-markdown";
import NoteEditor from "@/components/note-editor";

type StickyNoteColor = "green" | "yellow" | "pink" | "blue" | "purple" | "orange";

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

const NotesGrid: React.FC = () => {
  const { toast } = useToast();
  const { renderMarkdown } = useMarkdown();
  const [filter, setFilter] = useState<"all" | "pinned" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [colorFilter, setColorFilter] = useState<StickyNoteColor | "all">("all");

  // Fetch all notes
  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes/all"],
  });

  // Create new note
  const { mutate: createNote } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/notes/new", {
        title: "New Note",
        content: "# New Note\n\nStart typing here...",
        color: getRandomColor(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/all"] });
      toast({
        title: "Note created",
        description: "Your new note has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create note",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Update note properties
  const { mutate: updateNoteProps } = useMutation({
    mutationFn: async ({ id, props }: { id: number; props: Partial<Note> }) => {
      const response = await apiRequest("PATCH", `/api/notes/${id}`, props);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/all"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update note",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const getRandomColor = (): StickyNoteColor => {
    const colors: StickyNoteColor[] = ["yellow", "green", "pink", "blue", "purple", "orange"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const togglePin = (note: Note) => {
    updateNoteProps({
      id: note.id,
      props: { isPinned: !note.isPinned },
    });
  };

  const toggleArchive = (note: Note) => {
    updateNoteProps({
      id: note.id,
      props: { isArchived: !note.isArchived },
    });
  };

  const changeColor = (note: Note, color: StickyNoteColor) => {
    updateNoteProps({
      id: note.id,
      props: { color },
    });
  };

  const openNoteEditor = (note: Note) => {
    setSelectedNote(note);
    setEditMode(true);
  };

  const openNoteView = (note: Note) => {
    setSelectedNote(note);
    setEditMode(false);
  };

  const closeNote = () => {
    setSelectedNote(null);
  };

  // Filter and search notes
  const filteredNotes = React.useMemo(() => {
    if (!notes) return [];
    
    return notes.filter(note => {
      // Filter by tab
      const matchesFilter = 
        (filter === "all" && !note.isArchived) ||
        (filter === "pinned" && note.isPinned && !note.isArchived) ||
        (filter === "archived" && note.isArchived);
      
      // Filter by color
      const matchesColor = colorFilter === "all" || note.color === colorFilter;
      
      // Filter by search
      const matchesSearch = 
        searchQuery === "" || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesColor && matchesSearch;
    });
  }, [notes, filter, colorFilter, searchQuery]);

  // Sort notes - pinned first, then by updatedAt
  const sortedNotes = React.useMemo(() => {
    if (!filteredNotes) return [];
    
    return [...filteredNotes].sort((a, b) => {
      // Always sort pinned notes first (when not in archived view)
      if (filter !== "archived" && a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      
      // Then sort by date, newest first
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [filteredNotes, filter]);

  // Get display date
  const getDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex gap-2">
          <Button 
            onClick={() => createNote()} 
            className="flex items-center gap-1"
            variant="outline"
          >
            <Plus size={16} />
            <span>New Note</span>
          </Button>
          
          <Select 
            value={colorFilter} 
            onValueChange={(value) => setColorFilter(value as StickyNoteColor | "all")}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter by color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="pink">Pink</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="purple">Purple</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-auto relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8 w-full sm:w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" value={filter} onValueChange={(value) => setFilter(value as "all" | "pinned" | "archived")}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notes Grid */}
      {sortedNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNotes.map((note) => (
            <StickyNote
              key={note.id}
              color={note.color}
              pinned={note.isPinned}
              className="h-[200px] cursor-pointer relative group overflow-hidden"
              onClick={() => openNoteView(note)}
            >
              {/* Note title */}
              <h3 className="text-lg font-semibold mb-1 truncate">{note.title}</h3>
              
              {/* Note content preview */}
              <div className="prose prose-sm max-w-none h-[100px] overflow-hidden mb-2">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(truncateContent(note.content)) 
                  }}
                />
              </div>
              
              {/* Note info footer */}
              <div className="text-xs text-gray-600 absolute bottom-2 left-2 right-2">
                {getDisplayDate(note.updatedAt)}
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(note);
                  }}
                  title={note.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openNoteEditor(note);
                  }}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleArchive(note);
                  }}
                  title={note.isArchived ? "Restore" : "Archive"}
                >
                  {note.isArchived ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </StickyNote>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No notes found</p>
          <Button onClick={() => createNote()}>Create Your First Note</Button>
        </div>
      )}

      {/* Note Editor/Viewer Sheet */}
      {selectedNote && (
        <Sheet open={!!selectedNote} onOpenChange={(open) => !open && closeNote()}>
          <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl overflow-y-auto pb-0" side="right">
            <SheetHeader>
              {editMode ? (
                <div className="flex justify-between items-center mb-4">
                  <SheetTitle>Edit Note</SheetTitle>
                  <div className="flex space-x-2">
                    <Select
                      value={selectedNote.color}
                      onValueChange={(value) => {
                        changeColor(selectedNote, value as StickyNoteColor);
                        setSelectedNote({...selectedNote, color: value as StickyNoteColor});
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-${selectedNote.color === 'pink' ? 'red' : selectedNote.color}-300`}></div>
                          <span className="capitalize">{selectedNote.color}</span>
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
                    
                    <Button 
                      variant="outline"
                      onClick={() => setEditMode(false)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-4">
                  <SheetTitle>{selectedNote.title}</SheetTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </Button>
                    
                    <Button
                      variant={selectedNote.isPinned ? "secondary" : "outline"}
                      onClick={() => togglePin(selectedNote)}
                    >
                      <Pin className={`h-4 w-4 mr-2 ${selectedNote.isPinned ? 'fill-current' : ''}`} />
                      {selectedNote.isPinned ? "Pinned" : "Pin"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => toggleArchive(selectedNote)}
                    >
                      {selectedNote.isArchived ? (
                        <>
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Restore
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </SheetHeader>
            
            <div className="pt-2 h-[calc(100vh-100px)]">
              {editMode ? (
                <NoteEditor 
                  note={selectedNote} 
                  onUpdate={(updatedNote) => {
                    setSelectedNote(updatedNote);
                    queryClient.invalidateQueries({ queryKey: ["/api/notes/all"] });
                  }}
                />
              ) : (
                <div className="overflow-y-auto h-full p-1">
                  <StickyNote color={selectedNote.color} className="prose prose-sm md:prose max-w-none p-4 min-h-[300px]">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.content) }} />
                  </StickyNote>
                  <div className="text-xs text-muted-foreground mt-4">
                    Last updated: {getDisplayDate(selectedNote.updatedAt)}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default NotesGrid;