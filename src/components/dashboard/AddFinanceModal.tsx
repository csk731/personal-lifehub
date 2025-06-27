import { useState } from 'react';
import { X } from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';

const categoryIcons = {
  'salary': { emoji: '💰' },
  'freelance': { emoji: '💻' },
  'investment': { emoji: '📈' },
  'food': { emoji: '🍕' },
  'transport': { emoji: '🚗' },
  'entertainment': { emoji: '🎬' },
  'shopping': { emoji: '🛍️' },
  'bills': { emoji: '📄' },
  'health': { emoji: '🏥' },
  'other': { emoji: '📦' }
};

const amountTemplates = [
  { label: 'Coffee', amount: '5.00', type: 'expense', category: 'food' },
  { label: 'Lunch', amount: '15.00', type: 'expense', category: 'food' },
  { label: 'Dinner', amount: '25.00', type: 'expense', category: 'food' },
  { label: 'Uber', amount: '12.00', type: 'expense', category: 'transport' },
  { label: 'Gas', amount: '45.00', type: 'expense', category: 'transport' },
  { label: 'Movie', amount: '18.00', type: 'expense', category: 'entertainment' },
  { label: 'Salary', amount: '2500.00', type: 'income', category: 'salary' },
  { label: 'Freelance', amount: '500.00', type: 'income', category: 'freelance' }
];

function getCategorySuggestions(description: string) {
  const desc = description.toLowerCase();
  const suggestions: string[] = [];
  if (desc.includes('coffee') || desc.includes('lunch') || desc.includes('dinner') || desc.includes('food') || desc.includes('restaurant')) suggestions.push('food');
  if (desc.includes('uber') || desc.includes('taxi') || desc.includes('bus') || desc.includes('train') || desc.includes('transport') || desc.includes('gas')) suggestions.push('transport');
  if (desc.includes('movie') || desc.includes('cinema') || desc.includes('entertainment') || desc.includes('concert')) suggestions.push('entertainment');
  if (desc.includes('shop') || desc.includes('purchase') || desc.includes('order') || desc.includes('shopping')) suggestions.push('shopping');
  if (desc.includes('bill') || desc.includes('electricity') || desc.includes('water') || desc.includes('internet') || desc.includes('phone') || desc.includes('rent') || desc.includes('mortgage')) suggestions.push('bills');
  if (desc.includes('doctor') || desc.includes('medical') || desc.includes('pharmacy') || desc.includes('medicine') || desc.includes('health') || desc.includes('gym') || desc.includes('fitness')) suggestions.push('health');
  if (desc.includes('salary') || desc.includes('paycheck') || desc.includes('income') || desc.includes('payment') || desc.includes('freelance') || desc.includes('consulting')) suggestions.push('salary');
  return suggestions.slice(0, 3);
}

// Props: open (boolean), onClose (function), onSuccess (function)
export function AddFinanceModal({ open, onClose, onSuccess }: { open: boolean, onClose: () => void, onSuccess?: () => void }) {
  const [newEntry, setNewEntry] = useState({
    amount: '',
    type: 'expense' as const,
    category: 'other',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);

  const addFinanceEntry = async () => {
    if (!newEntry.amount || parseFloat(newEntry.amount) <= 0) return;
    setSaving(true);
    const headers = await getAuthHeaders();
    const response = await fetch('/api/finance', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: parseFloat(newEntry.amount),
        type: newEntry.type,
        category: newEntry.category,
        description: newEntry.description.trim() || null,
        date: newEntry.date,
      }),
    });
    setSaving(false);
    if (response.ok) {
      setNewEntry({ amount: '', type: 'expense', category: 'other', description: '', date: new Date().toISOString().split('T')[0] });
      setShowSuggestions(false);
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Quick Add Transaction</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Amount Templates */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Quick Templates</label>
            <div className="grid grid-cols-2 gap-2">
              {amountTemplates
                .filter(template => template.type === newEntry.type)
                .slice(0, 4)
                .map((template, index) => (
                  <button
                    key={index}
                    onClick={() => setNewEntry(prev => ({
                      ...prev,
                      amount: template.amount,
                      category: template.category,
                      description: template.label
                    }))}
                    className="p-2 text-xs border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900">{template.label}</div>
                    <div className="text-gray-600">${template.amount}</div>
                  </button>
                ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newEntry.type}
                onChange={(e) => setNewEntry(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'income' | 'expense',
                  category: 'other' // Reset category when type changes
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 bg-white"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newEntry.category}
                onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 bg-white"
              >
                {newEntry.type === 'income' ? (
                  <>
                    <option value="salary">Salary</option>
                    <option value="freelance">Freelance</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </>
                ) : (
                  <>
                    <option value="food">Food</option>
                    <option value="transport">Transport</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="shopping">Shopping</option>
                    <option value="bills">Bills</option>
                    <option value="health">Health</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
              {/* Category Suggestions */}
              {categorySuggestions.length > 0 && showSuggestions && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                  {categorySuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setNewEntry(prev => ({ ...prev, category: suggestion }));
                        setShowSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <span className="text-lg">{categoryIcons[suggestion as keyof typeof categoryIcons]?.emoji || '📦'}</span>
                      <span className="capitalize">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="What was this for?"
              value={newEntry.description}
              onChange={(e) => {
                const description = e.target.value;
                setNewEntry(prev => ({ ...prev, description }));
                if (description.length > 2) {
                  const suggestions = getCategorySuggestions(description);
                  setCategorySuggestions(suggestions);
                  setShowSuggestions(suggestions.length > 0);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                if (categorySuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400 bg-white"
            />
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={addFinanceEntry}
              disabled={!newEntry.amount || parseFloat(newEntry.amount) <= 0 || saving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Add Transaction</span>
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