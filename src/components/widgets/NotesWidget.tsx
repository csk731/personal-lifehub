'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Star, 
  StarOff,
  Pin,
  PinOff,
  Calendar,
  Clock,
  Tag,
  MoreVertical,
  Eye,
  EyeOff,
  Archive,
  RotateCcw,
  Type,
  BookOpen,
  FileText,
  Hash,
  ChevronRight
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  isPinned: boolean;
  isStarred: boolean;
  isArchived: boolean;
  color: string;
  created_at: string;
  updated_at: string;
  wordCount: number;
  characterCount: number;
}

interface NotesWidgetProps {
  config: any;
  onConfigChange: (config: any) => void;
  isPreview?: boolean;
}

const noteColors = [
  { name: 'default', bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-800' },
  { name: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  { name: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  { name: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
  { name: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800' },
  { name: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
];

const categories = [
  { id: 'personal', name: 'Personal', color: 'blue', icon: '📝' },
  { id: 'work', name: 'Work', color: 'green', icon: '💼' },
  { id: 'ideas', name: 'Ideas', color: 'yellow', icon: '💡' },
  { id: 'todo', name: 'To-Do', color: 'pink', icon: '✅' },
  { id: 'study', name: 'Study', color: 'purple', icon: '📚' },
];

export default function NotesWidget({ config, onConfigChange, isPreview = false }: NotesWidgetProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  // Widget settings
  const maxNotes = config?.maxNotes || 5;
  const showSearch = config?.showSearch !== false;
  const showCategories = config?.showCategories !== false;
  const showStats = config?.showStats !== false;
  const compactMode = config?.compactMode || false;

  useEffect(() => {
    if (!isPreview) {
      fetchNotes();
    }
  }, [isPreview]);

  useEffect(() => {
    filterAndSortNotes();
  }, [notes, searchQuery, selectedCategory, showArchived]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/notes', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      } else {
        console.error('Failed to fetch notes:', response.status);
        setError('Failed to load notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortNotes = () => {
    let filtered = notes.filter(note => {
      const matchesSearch = searchQuery === '' || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
      const matchesArchived = showArchived ? note.isArchived : !note.isArchived;
      
      return matchesSearch && matchesCategory && matchesArchived;
    });

    // Sort by updated date (newest first) and pinned notes first
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    // Limit to maxNotes
    filtered = filtered.slice(0, maxNotes);
    setFilteredNotes(filtered);
  };

  const createNote = async (noteData: Partial<Note>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers,
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes(prev => [newNote, ...prev]);
        setSelectedNote(newNote);
        setIsCreating(false);
        return newNote;
      } else {
        throw new Error('Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
        setSelectedNote(updatedNote);
        return updatedNote;
      } else {
        throw new Error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  const handleCreateNote = () => {
    setIsCreating(true);
    setSelectedNote(null);
    setIsEditing(false);
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;

    try {
      const wordCount = selectedNote.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = selectedNote.content.length;

      await updateNote(selectedNote.id, {
        ...selectedNote,
        wordCount,
        characterCount,
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const togglePin = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      try {
        await updateNote(noteId, { isPinned: !note.isPinned });
      } catch (error) {
        console.error('Error toggling pin:', error);
      }
    }
  };

  const toggleStar = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      try {
        await updateNote(noteId, { isStarred: !note.isStarred });
      } catch (error) {
        console.error('Error toggling star:', error);
      }
    }
  };

  const toggleArchive = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      try {
        await updateNote(noteId, { isArchived: !note.isArchived });
      } catch (error) {
        console.error('Error toggling archive:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const getColorInfo = (colorName: string) => {
    return noteColors.find(color => color.name === colorName) || noteColors[0];
  };

  const renderNoteItem = (note: Note) => {
    const categoryInfo = getCategoryInfo(note.category);
    const colorInfo = getColorInfo(note.color);
    
    return (
      <motion.div
        key={note.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`group cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md ${
          colorInfo.bg
        } ${colorInfo.border} ${note.isPinned ? 'ring-1 ring-blue-500' : ''}`}
        onClick={() => {
          setSelectedNote(note);
          setIsEditing(false);
          setIsCreating(false);
        }}
      >
        <div className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <span className="text-sm">{categoryInfo.icon}</span>
              <span className="text-xs font-medium text-gray-700 bg-white/50 px-2 py-1 rounded-full truncate">
                {categoryInfo.name}
              </span>
              {note.isPinned && <Pin className="w-3 h-3 text-blue-500 flex-shrink-0" />}
              {note.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />}
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(note.id);
                }}
                className="p-1 hover:bg-white/50 rounded transition-colors"
              >
                {note.isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(note.id);
                }}
                className="p-1 hover:bg-white/50 rounded transition-colors"
              >
                {note.isStarred ? <Star className="w-3 h-3 fill-current" /> : <StarOff className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Title */}
          <h4 className={`font-medium mb-1 line-clamp-1 ${colorInfo.text}`}>
            {note.title || 'Untitled Note'}
          </h4>
          
          {/* Content */}
          <p className={`text-sm mb-2 line-clamp-2 ${colorInfo.text} opacity-80`}>
            {note.content || 'No content'}
          </p>

          {/* Tags */}
          {note.tags.length > 0 && !compactMode && (
            <div className="flex flex-wrap gap-1 mb-2">
              {note.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-white/50 text-gray-700 px-1.5 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {note.tags.length > 2 && (
                <span className="text-xs text-gray-700">+{note.tags.length - 2}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-700">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(note.updated_at)}</span>
            </div>
            {showStats && (
              <div className="flex items-center space-x-1">
                <span>{note.wordCount}w</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderNoteEditor = () => {
    if (!selectedNote && !isCreating) return null;

    const note = selectedNote || { 
      id: 'new', 
      title: '', 
      content: '', 
      tags: [], 
      category: 'personal', 
      color: 'default',
      isPinned: false,
      isStarred: false,
      isArchived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      wordCount: 0,
      characterCount: 0,
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute inset-0 bg-white rounded-xl shadow-xl z-10 flex flex-col"
      >
        {/* Editor Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedNote(null);
                setIsCreating(false);
                setIsEditing(false);
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
            <span className="text-sm font-medium text-gray-900">
              {isCreating ? 'New Note' : selectedNote?.title || 'Untitled Note'}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSaveNote}
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                <Type className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDeleteNote(note.id)}
              className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-3">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={note.title}
                onChange={(e) => setSelectedNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Note title..."
                className="w-full text-sm font-medium border-none outline-none bg-transparent text-gray-900"
              />
              <textarea
                value={note.content}
                onChange={(e) => setSelectedNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                placeholder="Start writing your note..."
                className="w-full h-32 resize-none border-none outline-none bg-transparent text-sm text-gray-900"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">{note.title || 'Untitled Note'}</h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {note.content || 'No content'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Preview mode
  if (isPreview) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Quick Notes</h3>
              <p className="text-xs text-gray-600">Capture your thoughts</p>
            </div>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Notes widget</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-xl p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-white rounded-xl p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <button
            onClick={fetchNotes}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            <RotateCcw className="w-3 h-3 inline mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col relative overflow-hidden">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">Quick Notes</h3>
          {showStats && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {notes.length}
            </span>
          )}
        </div>
        
        <button
          onClick={handleCreateNote}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <Plus className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Search and Filters */}
      {showSearch && (
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {showCategories && (
        <div className="px-3 py-2 border-b border-gray-100">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-3">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNote}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          filteredNotes.map(renderNoteItem)
        )}
      </div>

      {/* Note Editor Overlay */}
      {(selectedNote || isCreating) && renderNoteEditor()}
    </div>
  );
} 