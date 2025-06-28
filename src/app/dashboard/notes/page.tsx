'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Star, 
  StarOff,
  Calendar,
  Clock,
  Tag,
  Folder,
  Archive,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Share2,
  Copy,
  Download,
  Settings,
  Grid,
  List,
  SortAsc,
  SortDesc,
  X,
  Check,
  Save,
  RotateCcw,
  Palette,
  Type,
  Bold,
  Italic,
  List as ListIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image,
  Paperclip,
  Smile,
  Hash,
  Bookmark,
  BookmarkPlus,
  ArrowLeft,
  FileText,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Circle,
  MinusCircle,
  ChevronRight,
  FolderOpen,
  FolderPlus,
  Trash,
  Settings as SettingsIcon,
  Edit
} from 'lucide-react';
import { TopBar } from '@/components/dashboard/TopBar';
import { getAuthHeaders } from '@/lib/utils';
import Link from 'next/link';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderId?: string;
  folderName?: string;
  folderColor?: string;
  folderEmoji?: string;
  isPinned: boolean;
  isStarred: boolean;
  isArchived: boolean;
  color: string;
  created_at: string;
  updated_at: string;
  wordCount: number;
  characterCount: number;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  emoji: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface NoteCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const noteColors = [
  { name: 'default', bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-800' },
  { name: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  { name: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  { name: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
  { name: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800' },
  { name: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
];

const categoryIcons = {
  'personal': { emoji: '📝', color: 'text-blue-600', bg: 'bg-blue-100' },
  'work': { emoji: '💼', color: 'text-green-600', bg: 'bg-green-100' },
  'ideas': { emoji: '💡', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  'todo': { emoji: '✅', color: 'text-pink-600', bg: 'bg-pink-100' },
  'study': { emoji: '📚', color: 'text-purple-600', bg: 'bg-purple-100' },
  'other': { emoji: '📋', color: 'text-gray-600', bg: 'bg-gray-100' }
};

const priorityColors = {
  low: { text: 'text-gray-500', bg: 'bg-gray-100', icon: MinusCircle, emoji: '🟢' },
  medium: { text: 'text-blue-600', bg: 'bg-blue-100', icon: Circle, emoji: '🟡' },
  high: { text: 'text-orange-600', bg: 'bg-orange-100', icon: AlertCircle, emoji: '🟠' },
  urgent: { text: 'text-red-600', bg: 'bg-red-100', icon: Zap, emoji: '🔴' }
}

export default function NotesDashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [noteFilter, setNoteFilter] = useState<'all' | 'archived' | 'starred'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingNotes, setDeletingNotes] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁');
  const [newFolderColor, setNewFolderColor] = useState('blue');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
  const [showFolderColorPicker, setShowFolderColorPicker] = useState<string | null>(null);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isReorderingFolders, setIsReorderingFolders] = useState(false);
  // Add tag management state
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  // Add color picker state
  // const [showNoteColorPicker, setShowNoteColorPicker] = useState(false);
  // Add folder selector state
  const [openFolderSelectorId, setOpenFolderSelectorId] = useState<string | null>(null);
  // Add confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);
  // Add state to track editing folder name
  const [editingFolderName, setEditingFolderName] = useState<string>('');
  // Add state to track folder name saving
  const [savingFolderName, setSavingFolderName] = useState<string | null>(null);
  // Tag filtering state
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);

  // New note template
  const newNoteTemplate: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'wordCount' | 'characterCount'> = {
    title: '',
    content: '',
    tags: [],
    folderId: undefined,
    folderName: undefined,
    folderColor: undefined,
    folderEmoji: undefined,
    isPinned: false,
    isStarred: false,
    isArchived: false,
    color: 'default',
  };

  const colorOptions = [
    { name: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
    { name: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
    { name: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
    { name: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' },
    { name: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' },
    { name: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900' },
    { name: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900' },
    { name: 'gray', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
    { name: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' },
    { name: 'teal', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900' },
    { name: 'cyan', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900' },
    { name: 'lime', bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-900' }
  ];

  // Add note color options (same as folder colors)
  const noteColorOptions = [
    { name: 'default', bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-900' },
    { name: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
    { name: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
    { name: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
    { name: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' },
    { name: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' },
    { name: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900' },
    { name: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900' },
    { name: 'gray', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
    { name: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' },
    { name: 'teal', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900' },
    { name: 'cyan', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900' },
  ];

  // Folder emoji options
  const folderEmojiOptions = [
    '📁', '📂', '🗂️', '📋', '📝', '📄', '📜', '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📔', '📒',
    '💼', '💻', '📱', '📞', '📟', '📠', '🔋', '💡', '🔍', '🔎', '🔐', '🔑', '🔒', '🔓', '🔏', '🔐',
    '📌', '📍', '📎', '🖇️', '📐', '📏', '✂️', '🔧', '🔨', '🔩', '🔪', '💉', '💊', '🔬', '🔭', '📡',
    '🎯', '🎲', '🎮', '🎸', '🎹', '🎺', '🎻', '🎼', '🎤', '🎧', '🎨', '🎭', '🎪', '🎟️', '🎫', '🎬',
    '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒',
    '⛪', '🕌', '🕍', '🛕', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉',
    '🎪', '🎟️', '🎫', '🎬', '🎭', '🎨', '🎤', '🎧', '🎼', '🎹', '🎸', '🎺', '🎻', '🎲', '🎯', '🎮',
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
    '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷️', '⛸️', '🥌', '🎿', '⛷️',
    '🏂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏊', '🏄', '🏊', '🚣', '🏊', '⛹️', '🏋️', '🚴', '🚵'
  ];

  // Add loading states for note actions
  const [updatingNotes, setUpdatingNotes] = useState<Set<string>>(new Set());
  // Add loading state for moving notes
  const [movingNotes, setMovingNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNotes();
    fetchFolders();
  }, []);

  useEffect(() => {
    filterAndSortNotes();
  }, [notes, searchQuery, selectedFolderId, selectedTag, noteFilter, sortBy, sortOrder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle global shortcuts when editing in the editor
      if (document.activeElement?.tagName === 'TEXTAREA' ||
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'SELECT') {
        return;
      }

      if (showSuccess) return;
      
      // Save on Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditing && (selectedNote || isCreating)) {
          handleSaveNote();
        }
      }
      
      // Escape to close editor
      if (e.key === 'Escape') {
        if (selectedNote || isCreating) {
          setSelectedNote(null);
          setIsCreating(false);
          setIsEditing(false);
        }
      }

      // Ctrl+N to create new note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateNote();
      }

      // Note action shortcuts (only when a note is selected)
      if (selectedNote && selectedNote.id !== 'new') {
        // Pin/Unpin: Ctrl+P or Cmd+P
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
          e.preventDefault();
          togglePin(selectedNote.id);
        }
        
        // Star/Unstar: Ctrl+Shift+S or Cmd+Shift+S
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
          e.preventDefault();
          toggleStar(selectedNote.id);
        }
        
        // Archive/Unarchive: Ctrl+Shift+A or Cmd+Shift+A
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
          e.preventDefault();
          toggleArchive(selectedNote.id);
        }
        
        // Delete: Delete key or Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDeleteNote(selectedNote.id);
        }
        
        // Move to folder: Ctrl+M or Cmd+M
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
          e.preventDefault();
          // This could open a folder selector for the selected note
          console.log('Move to folder shortcut pressed for note:', selectedNote.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, selectedNote, isCreating, showSuccess]);

  // Focus editor when note is selected
  useEffect(() => {
    if (selectedNote && editorRef.current) {
      // Handle new notes - focus the textarea
      if (selectedNote.id === 'new') {
        editorRef.current.focus();
        return;
      }
      
      // Handle existing notes - focus the textarea
      editorRef.current.focus();
    }
  }, [selectedNote?.id]);



  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const headers = await getAuthHeaders();
      const response = await fetch('/api/notes', { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Ensure all notes have proper default values
      const processedNotes = (data.notes || []).map((note: any) => ({
        id: note.id,
        title: note.title || '',
        content: note.content || '',
        tags: Array.isArray(note.tags) ? note.tags : [],
        folderId: note.folderId || note.folder_id || undefined,
        folderName: note.folderName || note.folder_name || undefined,
        folderColor: note.folderColor || note.folder_color || undefined,
        folderEmoji: note.folderEmoji || note.folder_emoji || undefined,
        isPinned: Boolean(note.isPinned),
        isStarred: Boolean(note.isStarred),
        isArchived: Boolean(note.isArchived),
        color: note.color || 'default',
        created_at: note.created_at,
        updated_at: note.updated_at,
        wordCount: note.wordCount || 0,
        characterCount: note.characterCount || 0,
      }));
      
      setNotes(processedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/folders', { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setFolders(data.folders || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch folders');
    }
  };

  const filterAndSortNotes = () => {
    let filtered = [...notes];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by noteFilter first (this is the primary filter)
    if (noteFilter === 'archived') {
      // Show only archived notes, regardless of folder
      filtered = filtered.filter(note => note.isArchived);
    } else if (noteFilter === 'starred') {
      // Show only starred notes, regardless of folder and archive status
      filtered = filtered.filter(note => note.isStarred);
    } else {
      // 'all' - show only non-archived notes
      filtered = filtered.filter(note => !note.isArchived);
    }

    // Filter by folder (only apply if not in archived/starred view)
    if (selectedFolderId !== 'all' && noteFilter === 'all') {
      filtered = filtered.filter(note => note.folderId === selectedFolderId);
    }

    // Filter by tags (only apply if not in archived/starred view)
    if (selectedTag && noteFilter === 'all') {
      filtered = filtered.filter(note => note.tags.includes(selectedTag));
    }

    // Sort notes
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated':
        default:
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Prioritize pinned notes
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    setFilteredNotes(filtered);
  };

  const createNote = async (noteData: Partial<Note>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newNote = await response.json();
      
      if (newNote.error) {
        throw new Error(newNote.error);
      }

      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      console.error('Error creating note:', err);
      throw err;
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedNote = await response.json();
      
      if (updatedNote.error) {
        throw new Error(updatedNote.error);
      }

      // Update notes list with the updated note
      setNotes(prev => prev.map(note => 
        note.id === noteId ? updatedNote : note
      ));
      
      return updatedNote;
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      setDeletingNotes(prev => new Set(prev).add(noteId));
      
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setNotes(prev => prev.filter(note => note.id !== noteId));
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      throw err;
    } finally {
      setDeletingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      ...newNoteTemplate,
      id: 'new',
      folderId: undefined,
      folderName: undefined,
      folderColor: undefined,
      folderEmoji: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      wordCount: 0,
      characterCount: 0
    };
    
    setSelectedNote(newNote);
    setIsCreating(true);
    setIsEditing(true);
    setTagsInput('');
    
    // Focus the editor after a short delay to ensure state is updated
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 50);
  };

  const handleCreateNoteInFolder = (folderId: string) => {
    const selectedFolder = folders.find(f => f.id === folderId);
    
    const newNote: Note = {
      ...newNoteTemplate,
      id: 'new',
      folderId: selectedFolder?.id,
      folderName: selectedFolder?.name,
      folderColor: selectedFolder?.color,
      folderEmoji: selectedFolder?.emoji,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      wordCount: 0,
      characterCount: 0
    };
    
    setSelectedNote(newNote);
    setIsCreating(true);
    setIsEditing(true);
    setTagsInput('');
    
    // Focus the editor after a short delay to ensure state is updated
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 50);
  };

  const handleSaveNote = async () => {
    if (!selectedNote && !isCreating) return;

    try {
      setIsSaving(true);
      setError(null);

      const currentNote = selectedNote || { ...newNoteTemplate, id: 'new', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), wordCount: 0, characterCount: 0 };
      
      // Calculate word and character counts
      const wordCount = currentNote.content ? 
        currentNote.content.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
      const characterCount = currentNote.content ? currentNote.content.length : 0;

      const noteData = {
        ...currentNote,
        wordCount,
        characterCount,
        // Ensure folderId is properly set for the API
        folderId: currentNote.folderId || undefined,
      };

      let savedNote;

      if (isCreating) {
        savedNote = await createNote(noteData);
        setIsCreating(false);
      } else {
        savedNote = await updateNote(currentNote.id, noteData);
      }

      setSelectedNote(savedNote);
      setIsEditing(false);
      setShowSuccess(true);
      setSuccessMessage('Note saved successfully!');
      
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving note:', err);
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    showConfirmation({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setError(null);
          await deleteNote(noteId);
          setShowSuccess(true);
          setSuccessMessage('Note deleted successfully!');
          setTimeout(() => setShowSuccess(false), 2000);
        } catch (err) {
          console.error('Error deleting note:', err);
          setError(err instanceof Error ? err.message : 'Failed to delete note');
        }
      },
      isDestructive: true,
    });
  };

  const togglePin = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || updatingNotes.has(noteId)) return;
    
    try {
      setUpdatingNotes(prev => new Set(prev).add(noteId));
      setError(null);
      
      const updatedNote = await updateNote(noteId, { isPinned: !note.isPinned });
      
      // Update selected note if it's the one being modified
      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNote);
      }
      
      setShowSuccess(true);
      setSuccessMessage(`Note ${updatedNote.isPinned ? 'pinned' : 'unpinned'} successfully!`);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Error toggling pin:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle pin');
    } finally {
      setUpdatingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }
  };

  const toggleStar = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || updatingNotes.has(noteId)) return;
    
    try {
      setUpdatingNotes(prev => new Set(prev).add(noteId));
      setError(null);
      
      const updatedNote = await updateNote(noteId, { isStarred: !note.isStarred });
      
      // Update selected note if it's the one being modified
      if (selectedNote?.id === noteId) {
        // Preserve the current content and title from selectedNote to avoid losing unsaved changes
        setSelectedNote({
          ...updatedNote,
          title: selectedNote.title,
          content: selectedNote.content,
          tags: selectedNote.tags
        });
      }
      
      setShowSuccess(true);
      setSuccessMessage(`Note ${updatedNote.isStarred ? 'starred' : 'unstarred'} successfully!`);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Error toggling star:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle star');
    } finally {
      setUpdatingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }
  };

  const toggleArchive = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || updatingNotes.has(noteId)) return;
    
    try {
      setUpdatingNotes(prev => new Set(prev).add(noteId));
      setError(null);
      
      const updatedNote = await updateNote(noteId, { isArchived: !note.isArchived });
      
      // Update selected note if it's the one being modified
      if (selectedNote?.id === noteId) {
        // Preserve the current content and title from selectedNote to avoid losing unsaved changes
        setSelectedNote({
          ...updatedNote,
          title: selectedNote.title,
          content: selectedNote.content,
          tags: selectedNote.tags
        });
      }
      
      setShowSuccess(true);
      setSuccessMessage(`Note ${updatedNote.isArchived ? 'archived' : 'unarchived'} successfully!`);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Error toggling archive:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle archive');
    } finally {
      setUpdatingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: new Date(dateString).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return categoryIcons[categoryId as keyof typeof categoryIcons] || categoryIcons.other;
  };

  const getColorInfo = (colorName: string) => {
    const color = colorOptions.find(c => c.name === colorName) || colorOptions[0];
    return color;
  };

  const getNoteStats = () => {
    return {
      total: notes.length,
      pinned: notes.filter(note => note.isPinned).length,
      starred: notes.filter(note => note.isStarred).length,
      archived: notes.filter(note => note.isArchived).length,
    };
  };

  // Confirmation dialog functions
  const showConfirmation = (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }) => {
    setConfirmationDialog({
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      onConfirm: config.onConfirm,
      isDestructive: config.isDestructive || false,
    });
  };

  const hideConfirmation = () => {
    setConfirmationDialog(null);
  };

  const handleConfirm = () => {
    if (confirmationDialog) {
      confirmationDialog.onConfirm();
      hideConfirmation();
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    // Check for duplicate folder names
    if (folders.some(f => f.name.toLowerCase() === newFolderName.trim().toLowerCase())) {
      setError('A folder with this name already exists');
      return;
    }

    try {
      setIsCreatingFolder(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: newFolderColor,
          emoji: newFolderEmoji
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newFolder = await response.json();
      
      if (newFolder.error) {
        throw new Error(newFolder.error);
      }

      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setNewFolderEmoji('📁');
      setNewFolderColor('blue');
      setShowCreateFolder(false);
      setShowSuccess(true);
      setSuccessMessage(`Folder "${newFolder.name}" created successfully!`);
      
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleEditFolder = async (folderId: string, newName: string, newColor: string, newEmoji: string) => {
    console.log('handleEditFolder called with:', { folderId, newName, newColor, newEmoji });
    
    if (!newName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      console.error('Folder not found:', folderId);
      return;
    }

    // Check for duplicate folder names (excluding current folder)
    if (folders.some(f => f.id !== folderId && f.name.toLowerCase() === newName.trim().toLowerCase())) {
      setError('A folder with this name already exists');
      return;
    }

    try {
      setError(null);
      setSavingFolderName(folderId);
      console.log('Sending folder update request...');

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
          color: newColor,
          emoji: newEmoji
        }),
      });

      console.log('Folder update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Folder update failed:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedFolder = await response.json();
      console.log('Updated folder response:', updatedFolder);
      
      if (updatedFolder.error) {
        throw new Error(updatedFolder.error);
      }

      // Update folders list
      setFolders(prev => prev.map(f => f.id === folderId ? updatedFolder : f));
      
      // Update notes that belong to this folder
      setNotes(prev => prev.map(note => 
        note.folderId === folderId 
          ? { ...note, folderName: newName.trim(), folderColor: newColor, folderEmoji: newEmoji }
          : note
      ));

      setEditingFolder(null);
      setEditingFolderName('');
      setShowSuccess(true);
      setSuccessMessage(`Folder "${newName.trim()}" updated successfully!`);
      
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Error updating folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to update folder');
    } finally {
      setSavingFolderName(null);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    const noteCount = notes.filter(note => note.folderId === folderId).length;
    
    const message = noteCount > 0 
      ? `Are you sure you want to delete the folder "${folder?.name}"? This will unassign ${noteCount} notes from this folder (notes will not be deleted). This action cannot be undone.`
      : `Are you sure you want to delete the folder "${folder?.name}"? This action cannot be undone.`;

    showConfirmation({
      title: 'Delete Folder',
      message,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setDeletingFolder(folderId);
          setError(null);

          const headers = await getAuthHeaders();
          const response = await fetch(`/api/folders/${folderId}`, {
            method: 'DELETE',
            headers,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.error) {
            throw new Error(result.error);
          }

          // Remove folder from list
          setFolders(prev => prev.filter(f => f.id !== folderId));
          
          // Unassign notes from this folder (set folderId to null)
          setNotes(prev => prev.map(note => 
            note.folderId === folderId 
              ? { ...note, folderId: undefined, folderName: undefined, folderColor: undefined, folderEmoji: undefined }
              : note
          ));
          
          // If we're currently viewing this folder, switch to "All Notes"
          if (selectedFolderId === folderId) {
            setSelectedFolderId('all');
          }

          setDeletingFolder(null);
          setShowSuccess(true);
          setSuccessMessage(`Folder "${folder?.name}" deleted successfully! ${noteCount > 0 ? `${noteCount} notes have been unassigned.` : ''}`);
          
          setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
          console.error('Error deleting folder:', err);
          setError(err instanceof Error ? err.message : 'Failed to delete folder');
        } finally {
          setDeletingFolder(null);
        }
      },
      isDestructive: true,
    });
  };

  const handleUpdateFolderColor = async (folderId: string, newColor: string) => {
    try {
      const folder = folders.find(f => f.id === folderId);
      if (!folder) return;

      await handleEditFolder(folderId, folder.name, newColor, folder.emoji);
      setShowFolderColorPicker(null);
    } catch (err) {
      console.error('Error updating folder color:', err);
      setError(err instanceof Error ? err.message : 'Failed to update folder color');
    }
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId);
    setNoteFilter('all'); // Reset to 'all' view when clicking folders
    setSelectedTag(null); // Clear tag filter when switching folders
    // Clear any selected note when switching folders
    setSelectedNote(null);
    setIsEditing(false);
    setIsCreating(false);
  };

  const renderSidebar = () => {
    const stats = getNoteStats();

    return (
      <div className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 h-screen overflow-y-auto ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-gray-900">Notes</h1>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${
                sidebarCollapsed ? 'rotate-180' : ''
              }`} />
            </button>
          </div>
        </div>

        {/* Folders */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Folders</span>
            <button
                  onClick={() => setShowCreateFolder(true)}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                >
                  <FolderPlus className="w-3 h-3 text-gray-400" />
            </button>
              </div>
              <div className="space-y-1 mt-2">
                <button
                  onClick={() => {
                    setSelectedFolderId('all');
                    setNoteFilter('all');
                    setSelectedTag(null);
                  }}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    selectedFolderId === 'all' && noteFilter === 'all' && !selectedTag ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  <span>All Notes</span>
                  <span className="ml-auto text-xs text-gray-400">{stats.total}</span>
                </button>
                {folders
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((folder) => {
                    const folderColorInfo = colorOptions.find(c => c.name === folder.color) || colorOptions[0];
                    return (
                    <div 
                      key={folder.id} 
                      className={`group relative ${
                        draggedFolderId === folder.id ? 'opacity-50' : ''
                      } ${
                        dragOverFolderId === folder.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      } ${
                        editingFolder === folder.id ? 'z-[9998]' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, folder.id)}
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folder.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <button
                        onClick={() => handleFolderClick(folder.id)}
                        className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors ${
                          selectedFolderId === folder.id && noteFilter === 'all' ? `${folderColorInfo.bg} ${folderColorInfo.text} border-l-2 ${folderColorInfo.border}` : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="text-base cursor-move">⋮⋮</span>
                        <span className="text-base">{folder.emoji}</span>
                        <span className="flex-1 text-left truncate">{folder.name}</span>
                        <span className="flex-shrink-0 w-8"></span>
                      </button>
                      
                      {/* Folder Actions Menu */}
                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Menu button clicked for note:', folder.id);
                              setEditingFolder(editingFolder === folder.id ? null : folder.id);
                              setEditingFolderName(editingFolder === folder.id ? '' : folder.name);
                            }}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="w-3 h-3 text-gray-400" />
                          </button>
                          
                          {editingFolder === folder.id && (
                            <div className="absolute right-0 top-6 bg-white !bg-white bg-opacity-100 opacity-100 !opacity-100 backdrop-filter-none !backdrop-filter-none border border-gray-200 rounded-lg shadow-xl z-[9999] py-1 w-56">
                              <div className="p-3 bg-white !bg-white bg-opacity-100 opacity-100 !opacity-100 backdrop-filter-none !backdrop-filter-none">
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Folder Name</label>
                                  <div className="flex space-x-2">
                                    <input
                                      type="text"
                                      value={editingFolderName}
                                      onChange={(e) => setEditingFolderName(e.target.value)}
                                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                                      placeholder="Folder name"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && savingFolderName !== folder.id) {
                                          handleEditFolder(folder.id, editingFolderName, folder.color, folder.emoji);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleEditFolder(folder.id, editingFolderName, folder.color, folder.emoji)}
                                      disabled={savingFolderName === folder.id}
                                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Save folder name"
                                    >
                                      {savingFolderName === folder.id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                      ) : (
                                        <Check className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">Color Theme</label>
                                  <div className="grid grid-cols-4 gap-2">
                                    {colorOptions.map((color) => (
                                      <button
                                        key={color.name}
                                        onClick={() => handleUpdateFolderColor(folder.id, color.name)}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                          folder.color === color.name 
                                            ? 'border-gray-600 scale-110' 
                                            : 'border-gray-200 hover:border-gray-400'
                                        } ${color.bg}`}
                                        title={color.name}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id);
                          }}
                          disabled={deletingFolder === folder.id}
                          className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {deletingFolder === folder.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-red-500"></div>
                          ) : (
                            <Trash2 className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick Actions</span>
              <div className="space-y-1 mt-2">
                <button
                  onClick={() => {
                    setNoteFilter(noteFilter === 'archived' ? 'all' : 'archived');
                    setSelectedTag(null);
                  }}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    noteFilter === 'archived' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>Archived</span>
                  <span className="ml-auto text-xs text-gray-400">{stats.archived}</span>
                </button>
                <button
                  onClick={() => {
                    setNoteFilter(noteFilter === 'starred' ? 'all' : 'starred');
                    setSelectedTag(null);
                  }}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    noteFilter === 'starred' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                  <span className="ml-auto text-xs text-gray-400">{stats.starred}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tags Section */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</span>
                {selectedTag && (
                  <button
                    onClick={clearTagFilters}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1 mt-2">
                {getAllTags().map((tag) => {
                  const count = getTagCounts()[tag];
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
                        isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <Hash className="w-3 h-3" />
                        <span className="truncate">#{tag}</span>
                      </span>
                      <span className="text-xs text-gray-400">{count}</span>
                    </button>
                  );
                })}
                {getAllTags().length === 0 && (
                  <p className="text-xs text-gray-500 italic">No tags yet</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderNoteEditor = () => {
    if (!selectedNote && !isCreating) return null;

    const currentNote = selectedNote || { ...newNoteTemplate, id: 'new', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), wordCount: 0, characterCount: 0 };

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex-1 flex flex-col bg-white"
      >
        {/* Editor Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSelectedNote(null);
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                {currentNote.isPinned && <Pin className="w-4 h-4 text-gray-400" />}
                {currentNote.isStarred && <Star className="w-4 h-4 text-yellow-500" />}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {isCreating ? 'New Note' : formatDate(currentNote.updated_at)}
                </span>
                {!isCreating && (
                  <span className="text-sm text-gray-400">
                    {formatTime(currentNote.updated_at)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Note Actions */}
              {selectedNote && selectedNote.id !== 'new' && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => togglePin(selectedNote.id)}
                    disabled={updatingNotes.has(selectedNote.id)}
                    className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                    title={`${selectedNote.isPinned ? 'Unpin' : 'Pin'} note (Ctrl+P)`}
                  >
                    {updatingNotes.has(selectedNote.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-500"></div>
                    ) : selectedNote.isPinned ? (
                      <PinOff className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Pin className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleStar(selectedNote.id)}
                    disabled={updatingNotes.has(selectedNote.id)}
                    className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                    title={`${selectedNote.isStarred ? 'Unstar' : 'Star'} note (Ctrl+Shift+S)`}
                  >
                    {updatingNotes.has(selectedNote.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-500"></div>
                    ) : selectedNote.isStarred ? (
                      <StarOff className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Star className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleArchive(selectedNote.id)}
                    disabled={updatingNotes.has(selectedNote.id)}
                    className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                    title={`${selectedNote.isArchived ? 'Unarchive' : 'Archive'} note (Ctrl+Shift+A)`}
                  >
                    {updatingNotes.has(selectedNote.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-500"></div>
                    ) : (
                      <Archive className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    disabled={deletingNotes.has(selectedNote.id)}
                    className="p-2 rounded hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Delete note (Delete)"
                  >
                    {deletingNotes.has(selectedNote.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-red-500"></div>
                    ) : (
                      <Trash2 className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              )}
              
              {isSaving && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500"></div>
                  <span>Saving...</span>
                </div>
              )}
              <button
                onClick={handleSaveNote}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Title Input */}
              <input
                type="text"
              placeholder="Title"
              value={currentNote.title}
              onChange={(e) => {
                if (selectedNote) {
                  setSelectedNote({ ...selectedNote, title: e.target.value });
                } else if (isCreating) {
                  // For new notes, we need to create a temporary note
                  const tempNote: Note = { 
                    ...newNoteTemplate, 
                    id: 'new', 
                    title: e.target.value,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    wordCount: 0,
                    characterCount: 0
                  };
                  setSelectedNote(tempNote);
                }
              }}
              className="w-full text-2xl font-semibold text-gray-900 placeholder-gray-500 border-none outline-none mb-6 bg-transparent"
            />

            {/* Content Editor */}
            <textarea
              ref={editorRef}
              value={currentNote.content}
              onChange={(e) => {
                if (selectedNote) {
                  setSelectedNote({ ...selectedNote, content: e.target.value });
                } else if (isCreating) {
                  // For new notes, update the temporary note
                  const tempNote: Note = { 
                    ...newNoteTemplate, 
                    id: 'new', 
                    content: e.target.value,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    wordCount: 0,
                    characterCount: 0
                  };
                  setSelectedNote(tempNote);
                }
              }}
              placeholder="Start writing..."
              className="w-full min-h-[400px] text-gray-900 leading-relaxed outline-none border-none resize-none bg-transparent"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            />
              
            {/* Tags */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Tags:</span>
                <div className="flex items-center space-x-2 flex-wrap">
                  {currentNote.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center space-x-1"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => removeTagFromNote(currentNote, tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="relative">
                    <input
                      ref={tagsInputRef}
                      type="text"
                      placeholder="Add tag..."
                      value={tagsInput}
                      onChange={(e) => handleTagInputChange(e.target.value)}
                      onKeyDown={(e) => handleTagInputKeyDown(e, currentNote)}
                      onFocus={() => {
                        if (tagsInput.trim()) {
                          const suggestions = getTagSuggestions(tagsInput);
                          setTagSuggestions(suggestions);
                          setShowTagSuggestions(suggestions.length > 0);
                        }
                      }}
                      className="text-sm border-none outline-none placeholder-gray-400 bg-transparent text-gray-900 min-w-[100px]"
                    />
                    {showTagSuggestions && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                        {tagSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => selectTagSuggestion(suggestion, currentNote)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Hash className="w-3 h-3 text-gray-400" />
                            <span>#{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderNotesGrid = () => {
    if (filteredNotes.length === 0 && noteFilter === 'all' && selectedFolderId === 'all') {
      return (
        <div className="text-center py-16">
          <Type className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">All Notes</h2>
          <p className="text-gray-500 mb-6">Create your first note to get started</p>
          <button
            onClick={handleCreateNote}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create New Note
          </button>
        </div>
      );
    }

    if (filteredNotes.length === 0) {
      return (
        <div className="text-center py-16">
          <Type className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">
            {noteFilter === 'archived' ? 'No Archived Notes' : 
             noteFilter === 'starred' ? 'No Starred Notes' :
             selectedTag ? `No Notes tagged "${selectedTag}"` :
             selectedFolderId === 'all' ? 'No Notes Found' : 
             `No Notes in ${folders.find(f => f.id === selectedFolderId)?.name || 'this folder'}`}
          </h2>
          <p className="text-gray-500 mb-6">
            {noteFilter === 'archived' ? 'Notes you archive will appear here' : 
             noteFilter === 'starred' ? 'Notes you star will appear here' :
             selectedTag ? 'Try adding this tag to some notes' :
             selectedFolderId === 'all' ? 'Try adjusting your search or filters' :
             `Create your first note in ${folders.find(f => f.id === selectedFolderId)?.name || 'this folder'}`}
          </p>
          {noteFilter === 'all' && !selectedTag && (
            <button
              onClick={() => selectedFolderId === 'all' ? handleCreateNote() : handleCreateNoteInFolder(selectedFolderId)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create New Note
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
        {/* Create New Note Tile - show only in 'all' view without tag filtering */}
        {noteFilter === 'all' && !selectedTag && (
          <div
            className={`border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group note-tile ${
              selectedFolderId !== 'all' 
                ? `${getColorInfo(folders.find(f => f.id === selectedFolderId)?.color || 'blue').border} hover:${getColorInfo(folders.find(f => f.id === selectedFolderId)?.color || 'blue').bg}` 
                : 'border-gray-300'
            }`}
            onClick={() => selectedFolderId === 'all' ? handleCreateNote() : handleCreateNoteInFolder(selectedFolderId)}
          >
            <div className="note-tile-content">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-2" />
                <h3 className="text-sm font-medium text-gray-600 group-hover:text-blue-700">
                  Create New Note
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedFolderId === 'all' ? 'unassigned' : `in ${folders.find(f => f.id === selectedFolderId)?.name || 'unknown folder'}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Existing Notes */}
        {filteredNotes.map((note) => {
          const noteColor = note.folderColor || note.color;
          const colorInfo = getColorInfo(noteColor);
          const categoryInfo = getCategoryInfo(note.folderId || '');
          
          return (
            <div
              key={note.id}
              className={`${colorInfo.bg} ${colorInfo.border} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all group relative note-tile ${
                isNoteUpdating(note.id) ? 'opacity-75 pointer-events-none' : ''
              }`}
              onClick={() => {
                if (!isNoteUpdating(note.id)) {
                  setSelectedNote(note);
                  setIsEditing(true);
                  setIsCreating(false);
                }
              }}
            >
              {/* Loading overlay */}
              {isNoteUpdating(note.id) && (
                <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              <div className="note-tile-content">
                {/* Note Header */}
                <div className="note-tile-header flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 min-w-0">
                    {note.isPinned && <Pin className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                    {note.isStarred && <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                    <span className={`${categoryInfo.bg} ${categoryInfo.color} text-xs px-2 py-1 rounded-full truncate`}>
                      {note.folderEmoji || categoryInfo.emoji} {note.folderName}
                    </span>
                  </div>

                  <div className="relative flex-shrink-0" data-menu>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Menu button clicked for note:', note.id);
                        setOpenMenuId(openMenuId === note.id ? null : note.id);
                      }}
                      className="opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {openMenuId === note.id && (
                      <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 w-40" data-menu>
                        <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100">
                          Note Actions
                        </div>
                        
                        {/* Move to Folder */}
                        <div className="relative group">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Toggle folder submenu
                              setOpenFolderSelectorId(openFolderSelectorId === note.id ? null : note.id);
                            }}
                            disabled={isNoteUpdating(note.id)}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 text-left text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move to folder (Ctrl+M)"
                          >
                            {isNoteUpdating(note.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-500"></div>
                            ) : (
                              <Folder className="w-4 h-4" />
                            )}
                            <span>Move to Folder</span>
                            <ChevronRight className="w-3 h-3 ml-auto" />
                          </button>
                          
                          {openFolderSelectorId === note.id && (
                            <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]">
                              <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100">
                                Select Folder
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveNoteToFolderFromMenu(note.id, undefined);
                                  setOpenFolderSelectorId(null);
                                  setOpenMenuId(null);
                                }}
                                disabled={movingNotes.has(note.id)}
                                className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                                  !note.folderId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                {movingNotes.has(note.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-500"></div>
                                ) : (
                                  <span>📁</span>
                                )}
                                <span>Unassigned</span>
                              </button>
                              {folders.map((folder) => (
                                <button
                                  key={folder.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveNoteToFolderFromMenu(note.id, folder.id);
                                    setOpenFolderSelectorId(null);
                                    setOpenMenuId(null);
                                  }}
                                  disabled={movingNotes.has(note.id)}
                                  className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                                    note.folderId === folder.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                  }`}
                                >
                                  {movingNotes.has(note.id) ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-500"></div>
                                  ) : (
                                    <span>{folder.emoji}</span>
                                  )}
                                  <span>{folder.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Pin button clicked for note:', note.id);
                            togglePin(note.id);
                            setOpenMenuId(null);
                          }}
                          disabled={updatingNotes.has(note.id)}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 text-left text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingNotes.has(note.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-500"></div>
                          ) : note.isPinned ? (
                            <PinOff className="w-4 h-4" />
                          ) : (
                            <Pin className="w-4 h-4" />
                          )}
                          <span>{note.isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Star button clicked for note:', note.id);
                            toggleStar(note.id);
                            setOpenMenuId(null);
                          }}
                          disabled={updatingNotes.has(note.id)}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 text-left text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingNotes.has(note.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-500"></div>
                          ) : note.isStarred ? (
                            <StarOff className="w-4 h-4" />
                          ) : (
                            <Star className="w-4 h-4" />
                          )}
                          <span>{note.isStarred ? 'Unstar' : 'Star'}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Archive button clicked for note:', note.id);
                            toggleArchive(note.id);
                            setOpenMenuId(null);
                          }}
                          disabled={updatingNotes.has(note.id)}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 text-left text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingNotes.has(note.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-500"></div>
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                          <span>{note.isArchived ? 'Unarchive' : 'Archive'}</span>
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Delete button clicked for note:', note.id);
                            handleDeleteNote(note.id);
                            setOpenMenuId(null);
                          }}
                          disabled={deletingNotes.has(note.id)}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 text-left text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingNotes.has(note.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b border-red-500"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Note Content Area - Flexible */}
                <div className="note-tile-body">
                  {/* Note Title */}
                  <h3 className={`${colorInfo.text} font-medium text-sm mb-2 line-clamp-2 leading-tight`}>
                    {note.title || 'Untitled Note'}
                  </h3>

                  {/* Note Content Preview */}
                  <p className="text-gray-600 text-sm line-clamp-1 leading-relaxed mb-3">
                    {note.content || 'No content'}
                  </p>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-white/50 text-gray-700 px-1.5 py-0.5 rounded-full flex items-center space-x-1"
                        >
                          <Hash className="w-2 h-2" />
                          <span>{tag}</span>
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Note Footer - Fixed at bottom */}
                <div className="note-tile-footer flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="truncate">{formatDate(note.updated_at)}</span>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span>{note.wordCount} words</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(note.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      console.log('Click outside detected, target:', target);
      console.log('Current openMenuId:', openMenuId);
      console.log('Current openFolderSelectorId:', openFolderSelectorId);
      
      // Check if click is outside any menu
      if (!target.closest('[data-menu]')) {
        console.log('Click is outside menu, closing menu');
        setOpenMenuId(null);
        setOpenFolderSelectorId(null);
      } else {
        console.log('Click is inside menu, keeping menu open');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId, openFolderSelectorId]);

  // Close menus when clicking outside
  /*
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-menu]')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  */

  // Add drag event handlers
  const handleDragStart = (e: React.DragEvent, folderId: string) => {
    setDraggedFolderId(folderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (draggedFolderId && draggedFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    if (!draggedFolderId || draggedFolderId === targetFolderId) {
      setDraggedFolderId(null);
      setDragOverFolderId(null);
      return;
    }

    try {
      setIsReorderingFolders(true);
      setError(null);
      
      // Reorder folders in state
      const draggedFolder = folders.find(f => f.id === draggedFolderId);
      const targetFolder = folders.find(f => f.id === targetFolderId);
      
      if (!draggedFolder || !targetFolder) return;

      // Create new order
      const newFolders = [...folders];
      const draggedIndex = newFolders.findIndex(f => f.id === draggedFolderId);
      const targetIndex = newFolders.findIndex(f => f.id === targetFolderId);
      
      // Remove dragged folder and insert at target position
      const [draggedItem] = newFolders.splice(draggedIndex, 1);
      newFolders.splice(targetIndex, 0, draggedItem);
      
      // Update sort_order for all folders
      const updatedFolders = newFolders.map((folder, index) => ({
        ...folder,
        sort_order: index + 1
      }));
      
      setFolders(updatedFolders);
      
      // Persist new order to backend
      await updateFolderOrder(updatedFolders);
      
      setShowSuccess(true);
      setSuccessMessage('Folder order updated successfully!');
      setTimeout(() => setShowSuccess(false), 2000);
      
    } catch (error) {
      console.error('Error reordering folders:', error);
      setError('Failed to reorder folders. Please try again.');
      // Revert to original order on error
      fetchFolders();
    } finally {
      setIsReorderingFolders(false);
      setDraggedFolderId(null);
      setDragOverFolderId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedFolderId(null);
    setDragOverFolderId(null);
  };

  // Function to update folder order in backend
  const updateFolderOrder = async (updatedFolders: Folder[]) => {
    try {
      setIsReorderingFolders(true);
      const headers = await getAuthHeaders();
      
      console.log('Updating folder order:', updatedFolders);
      
      const response = await fetch('/api/folders', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folders: updatedFolders }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Folder order update failed:', response.status, errorText);
        throw new Error(`Failed to update folder order: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Folder order update response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Only update local state if the API call was successful
      setFolders(updatedFolders);
      console.log('Folder order updated successfully');
    } catch (error) {
      console.error('Error updating folder order:', error);
      setError(`Failed to update folder order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Revert to original order on error
      await fetchFolders();
    } finally {
      setIsReorderingFolders(false);
    }
  };

  // Get all unique tags from notes
  const getAllTags = () => {
    const allTags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  // Get tag counts
  const getTagCounts = () => {
    const counts: Record<string, number> = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  };

  // Filter notes by selected tags
  const filterNotesByTags = (notes: Note[]) => {
    if (selectedTags.size === 0) return notes;
    return notes.filter(note => 
      note.tags.some(tag => selectedTags.has(tag))
    );
  };

  // Tag management functions
  const toggleTagFilter = (tag: string) => {
    if (selectedTag === tag) {
      // If clicking the same tag, clear the filter
      setSelectedTag(null);
    } else {
      // Set this tag as the current filter and clear other filters
      setSelectedTag(tag);
      setNoteFilter('all'); // Clear starred/archived filters
      setSelectedFolderId('all'); // Clear folder filter
    }
  };

  const clearTagFilters = () => {
    setSelectedTag(null);
    setSelectedTags(new Set());
  };

  const addTagToNote = (note: Note, tag: string) => {
    if (!tag.trim() || note.tags.includes(tag.trim())) return;
    
    const newTags = [...note.tags, tag.trim()];
    if (selectedNote) {
      setSelectedNote({ ...selectedNote, tags: newTags });
    }
  };

  const removeTagFromNote = (note: Note, tagToRemove: string) => {
    const newTags = note.tags.filter(tag => tag !== tagToRemove);
    if (selectedNote) {
      setSelectedNote({ ...selectedNote, tags: newTags });
    }
  };

  const getTagSuggestions = (input: string) => {
    if (!input.trim()) return [];
    const allTags = getAllTags();
    return allTags.filter(tag => 
      tag.toLowerCase().includes(input.toLowerCase()) && 
      !input.toLowerCase().includes(tag.toLowerCase())
    );
  };

  // Update tag input handling
  const handleTagInputChange = (value: string) => {
    setTagsInput(value);
    const suggestions = getTagSuggestions(value);
    setTagSuggestions(suggestions);
    setShowTagSuggestions(suggestions.length > 0 && value.trim().length > 0);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent, currentNote: Note) => {
    if (e.key === 'Enter' && tagsInput.trim()) {
      e.preventDefault();
      addTagToNote(currentNote, tagsInput.trim());
      setTagsInput('');
      setShowTagSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  const selectTagSuggestion = (suggestion: string, currentNote: Note) => {
    addTagToNote(currentNote, suggestion);
    setTagsInput('');
    setShowTagSuggestions(false);
  };

  // Function to update note color
  const updateNoteColor = (color: string) => {
    if (selectedNote) {
      setSelectedNote({ ...selectedNote, color });
    }
  };

  // Get current note color info
  const getCurrentNoteColorInfo = () => {
    const currentNote = selectedNote || { ...newNoteTemplate, id: 'new', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), wordCount: 0, characterCount: 0 };
    return noteColorOptions.find(c => c.name === currentNote.color) || noteColorOptions[0];
  };

  // Function to move note to folder
  const moveNoteToFolder = async (folderId: string | undefined) => {
    if (!selectedNote) return;

    const targetFolder = folderId ? folders.find(f => f.id === folderId) : null;
    const folderName = targetFolder?.name || 'unassigned';

    try {
      setError(null);
      
      // Only send folderId to the API - let the API handle the folder relationship
      const updates = {
        folderId: folderId || undefined, // Use undefined for unassigned
      };

      const updatedNote = await updateNote(selectedNote.id, updates);
      setSelectedNote(updatedNote);
      
      setShowSuccess(true);
      setSuccessMessage(`Note moved to "${folderName}" successfully!`);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error moving note:', error);
      setError('Failed to move note. Please try again.');
    }
  };

  // Get current folder info
  const getCurrentFolderInfo = () => {
    if (!selectedNote?.folderId) return null;
    return folders.find(f => f.id === selectedNote.folderId);
  };

  // Helper function to check if a note is being updated
  const isNoteUpdating = (noteId: string) => {
    return updatingNotes.has(noteId) || deletingNotes.has(noteId) || movingNotes.has(noteId);
  };

  // Function to move note to folder from 3-dot menu
  const moveNoteToFolderFromMenu = async (noteId: string, folderId: string | undefined) => {
    console.log('Moving note:', noteId, 'to folder:', folderId);
    
    const targetFolder = folderId ? folders.find(f => f.id === folderId) : null;
    const folderName = targetFolder?.name || 'unassigned';
    
    console.log('Target folder:', targetFolder);
    console.log('Folder name:', folderName);

    try {
      setError(null);
      setMovingNotes(prev => new Set(prev).add(noteId));
      
      // Only send folderId to the API - let the API handle the folder relationship
      const updates = {
        folderId: folderId || undefined, // Use undefined for unassigned
      };
      
      console.log('Updates to apply:', updates);

      const updatedNote = await updateNote(noteId, updates);
      console.log('Updated note:', updatedNote);
      
      // Update the note in the notes list
      setNotes(prev => prev.map(note => 
        note.id === noteId ? updatedNote : note
      ));
      
      // If this note is currently selected, update it too
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(updatedNote);
      }
      
      setShowSuccess(true);
      setSuccessMessage(`Note moved to "${folderName}" successfully!`);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error moving note:', error);
      setError('Failed to move note. Please try again.');
    } finally {
      setMovingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }
  };

  // 1. Set sidebarCollapsed to true by default on small screens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
  return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
              <button
            onClick={fetchNotes}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
              </button>
            </div>
            </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar isLoggedIn={true} />
      
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>{successMessage || 'Note saved successfully!'}</span>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug Info - Remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
          Open Menu: {openMenuId || 'none'}
        </div>
      )}

      {/* Create Folder Modal */}
      <AnimatePresence>
        {showCreateFolder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setShowCreateFolder(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-2 mb-6">
                <FolderPlus className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Create New Folder</h3>
              </div>

              {/* Folder Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreatingFolder && newFolderName.trim()) {
                      handleCreateFolder();
                    }
                  }}
                  disabled={isCreatingFolder}
                  autoFocus
                />
              </div>

              {/* Emoji Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Emoji
                </label>
                <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {folderEmojiOptions.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => setNewFolderEmoji(emoji)}
                      className={`w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-gray-100 transition-colors ${
                        newFolderEmoji === emoji ? 'bg-blue-100 border-2 border-blue-300' : ''
                      }`}
                      title={`Select ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setNewFolderColor(color.name)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        newFolderColor === color.name 
                          ? 'border-gray-600 scale-110' 
                          : 'border-gray-200 hover:border-gray-400'
                      } ${color.bg}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getColorInfo(newFolderColor).bg} ${getColorInfo(newFolderColor).border} border`}>
                  <span className="text-lg">{newFolderEmoji}</span>
                  <span className={`font-medium ${getColorInfo(newFolderColor).text}`}>
                    {newFolderName || 'Folder Name'}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                    setNewFolderEmoji('📁');
                    setNewFolderColor('blue');
                  }}
                  disabled={isCreatingFolder}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isCreatingFolder && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                  )}
                  <span>{isCreatingFolder ? 'Creating...' : 'Create Folder'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Layout */}
      <div className="relative flex min-h-screen h-screen pt-16">
        {/* Sidebar */}
        <div className={`hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-80'}`}>{!sidebarCollapsed && renderSidebar()}</div>
        {/* On mobile, show sidebar as overlay if open */}
        { !sidebarCollapsed && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 md:hidden" onClick={() => setSidebarCollapsed(true)}>
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-gray-50 border-r border-gray-200 shadow-lg" onClick={e => e.stopPropagation()}>
              {renderSidebar()}
            </div>
          </div>
        )}
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-screen h-full">
          {selectedNote ? (
            renderNoteEditor()
          ) : (
            <div className="flex-1 overflow-y-auto bg-white p-8">
              {/* Header */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {noteFilter === 'archived' ? 'Archived Notes' : 
                       noteFilter === 'starred' ? 'Starred Notes' :
                       selectedTag ? `Notes tagged "${selectedTag}"` :
                       selectedFolderId === 'all' ? 'All Notes' : 
                       folders.find(f => f.id === selectedFolderId)?.name || 'Unknown Folder'}
                    </h1>
                    <p className="text-gray-600">
                      {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                      {noteFilter === 'all' && selectedFolderId !== 'all' && !selectedTag && ` in ${folders.find(f => f.id === selectedFolderId)?.name}`}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCreateNote}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Note</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes Grid */}
              {renderNotesGrid()}
            </div>
          )}
        </div>
        {/* Floating open sidebar button on mobile */}
        {sidebarCollapsed && (
          <button
            className="fixed bottom-6 left-6 z-50 bg-blue-500 text-white rounded-full shadow-lg p-4 flex items-center justify-center"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      {confirmationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {confirmationDialog.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {confirmationDialog.message}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={hideConfirmation}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {confirmationDialog.cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    confirmationDialog.isDestructive
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {confirmationDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 