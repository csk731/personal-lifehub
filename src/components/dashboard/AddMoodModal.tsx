import { useState, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';

const moodEmojis = {
  1: '😢', 2: '😞', 3: '😐', 4: '😕', 5: '😊', 6: '😄', 7: '😁', 8: '😆', 9: '🤩', 10: '🥰'
};
const moodLabels = {
  1: 'Terrible', 2: 'Very Bad', 3: 'Bad', 4: 'Not Great', 5: 'Okay', 6: 'Good', 7: 'Great', 8: 'Excellent', 9: 'Amazing', 10: 'Perfect'
};

function isFutureDate(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  return checkDate > today;
}

// Props: open (boolean), onClose (function), onSuccess (function)
export function AddMoodModal({ open, onClose, onSuccess }: { open: boolean, onClose: () => void, onSuccess?: () => void }) {
  const [newEntry, setNewEntry] = useState({
    mood_score: 5,
    mood_emoji: moodEmojis[5],
    mood_label: moodLabels[5],
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const moodGridRef = useRef<HTMLDivElement>(null);

  const addMoodEntry = async () => {
    setSaving(true);
    const headers = await getAuthHeaders();
    const response = await fetch('/api/mood', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mood_score: newEntry.mood_score,
        mood_emoji: newEntry.mood_emoji,
        mood_label: newEntry.mood_label,
        notes: newEntry.notes.trim() || null,
        date: newEntry.date,
      }),
    });
    setSaving(false);
    if (response.ok) {
      setNewEntry({ mood_score: 5, mood_emoji: moodEmojis[5], mood_label: moodLabels[5], notes: '', date: new Date().toISOString().split('T')[0] });
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">How are you feeling?</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Mood</label>
            <div ref={moodGridRef} className="grid grid-cols-5 gap-2">
              {[1,2,3,4,5,6,7,8,9,10].map((score) => (
                <button
                  key={score}
                  aria-pressed={newEntry.mood_score === score}
                  onClick={() => setNewEntry(prev => ({ 
                    ...prev, 
                    mood_score: score,
                    mood_emoji: moodEmojis[score as keyof typeof moodEmojis],
                    mood_label: moodLabels[score as keyof typeof moodLabels]
                  }))}
                  className={`flex flex-col items-center space-y-1 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    newEntry.mood_score === score
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{moodEmojis[score as keyof typeof moodEmojis]}</span>
                  <span className="text-xs font-medium text-gray-700">{score}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {moodLabels[newEntry.mood_score as keyof typeof moodLabels]}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              placeholder="Add notes about your mood..."
              value={newEntry.notes}
              onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={addMoodEntry}
              disabled={isFutureDate(newEntry.date) || saving}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2 ${
                isFutureDate(newEntry.date) || saving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Mood</span>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 