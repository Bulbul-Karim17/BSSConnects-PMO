import React, { useState } from 'react';
import { Sprint, Retrospective } from '../types';
import { 
  Plus, 
  Trash2, 
  Save, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ChevronRight,
  History,
  Target
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RetrospectiveViewProps {
  sprints: Sprint[];
  retrospectives: Retrospective[];
  onSaveRetro: (retro: Partial<Retrospective>) => void;
  onDeleteRetro: (retroId: string) => void;
}

export const RetrospectiveView: React.FC<RetrospectiveViewProps> = ({ 
  sprints, 
  retrospectives, 
  onSaveRetro, 
  onDeleteRetro 
}) => {
  const [selectedSprintId, setSelectedSprintId] = useState<string>(sprints[0]?.id || '');
  const [activeCategory, setActiveCategory] = useState<'START' | 'STOP' | 'KEEP'>('START');
  const [newItemText, setNewItemText] = useState('');

  const currentRetro = retrospectives.find(r => r.sprintId === selectedSprintId);
  const selectedSprint = sprints.find(s => s.id === selectedSprintId);

  const handleAddItem = () => {
    if (!newItemText.trim()) return;

    const updates: Partial<Retrospective> = currentRetro ? { ...currentRetro } : {
      id: crypto.randomUUID(),
      sprintId: selectedSprintId,
      startDoing: [],
      stopDoing: [],
      keepDoing: [],
      summaryAction: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (activeCategory === 'START') updates.startDoing = [...(updates.startDoing || []), newItemText.trim()];
    if (activeCategory === 'STOP') updates.stopDoing = [...(updates.stopDoing || []), newItemText.trim()];
    if (activeCategory === 'KEEP') updates.keepDoing = [...(updates.keepDoing || []), newItemText.trim()];

    onSaveRetro(updates);
    setNewItemText('');
  };

  const handleRemoveItem = (category: 'START' | 'STOP' | 'KEEP', index: number) => {
    if (!currentRetro) return;
    const updates = { ...currentRetro };
    if (category === 'START') updates.startDoing = updates.startDoing.filter((_, i) => i !== index);
    if (category === 'STOP') updates.stopDoing = updates.stopDoing.filter((_, i) => i !== index);
    if (category === 'KEEP') updates.keepDoing = updates.keepDoing.filter((_, i) => i !== index);
    onSaveRetro(updates);
  };

  const handleUpdateSummary = (text: string) => {
    if (!currentRetro && !selectedSprintId) return;
    const updates: Partial<Retrospective> = currentRetro ? { ...currentRetro, summaryAction: text } : {
      id: crypto.randomUUID(),
      sprintId: selectedSprintId,
      startDoing: [],
      stopDoing: [],
      keepDoing: [],
      summaryAction: text,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    onSaveRetro(updates);
  };

  return (
    <div className="space-y-6">
      {/* Sprint Selector */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <History className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Select Sprint</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sprints.map(sprint => (
            <button
              key={sprint.id}
              onClick={() => setSelectedSprintId(sprint.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                selectedSprintId === sprint.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              )}
            >
              {sprint.name}
              {sprint.status === 'COMPLETED' && <span className="ml-2 text-[10px] opacity-60">(Done)</span>}
            </button>
          ))}
        </div>
      </div>

      {!selectedSprintId ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
          <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Select a sprint to view or start a retrospective</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Retro Columns */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Doing */}
              <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Plus className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-wider text-xs">Start Doing</h3>
                </div>
                <div className="space-y-2">
                  {currentRetro?.startDoing.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl text-sm text-slate-600 shadow-sm border border-emerald-100/20 group relative">
                      {item}
                      <button 
                        onClick={() => handleRemoveItem('START', i)}
                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => { setActiveCategory('START'); setNewItemText(''); }}
                    className="w-full py-2 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-400 hover:bg-emerald-100/50 transition-all text-xs font-bold"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Stop Doing */}
              <div className="bg-red-50/50 rounded-3xl p-6 border border-red-100/50 space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-wider text-xs">Stop Doing</h3>
                </div>
                <div className="space-y-2">
                  {currentRetro?.stopDoing.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl text-sm text-slate-600 shadow-sm border border-red-100/20 group relative">
                      {item}
                      <button 
                        onClick={() => handleRemoveItem('STOP', i)}
                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => { setActiveCategory('STOP'); setNewItemText(''); }}
                    className="w-full py-2 border-2 border-dashed border-red-200 rounded-xl text-red-400 hover:bg-red-100/50 transition-all text-xs font-bold"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Keep Doing */}
              <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-wider text-xs">Keep Doing</h3>
                </div>
                <div className="space-y-2">
                  {currentRetro?.keepDoing.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl text-sm text-slate-600 shadow-sm border border-blue-100/20 group relative">
                      {item}
                      <button 
                        onClick={() => handleRemoveItem('KEEP', i)}
                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => { setActiveCategory('KEEP'); setNewItemText(''); }}
                    className="w-full py-2 border-2 border-dashed border-blue-200 rounded-xl text-blue-400 hover:bg-blue-100/50 transition-all text-xs font-bold"
                  >
                    + Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Input Area (Floating/Modal-ish) */}
            <AnimatePresence>
              {activeCategory && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-700">
                      Adding to <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] uppercase",
                        activeCategory === 'START' ? "bg-emerald-100 text-emerald-700" :
                        activeCategory === 'STOP' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      )}>{activeCategory} DOING</span>
                    </h4>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                      placeholder="Type your observation here..."
                      className="flex-grow bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 p-3 text-sm"
                      autoFocus
                    />
                    <button 
                      onClick={handleAddItem}
                      disabled={!newItemText.trim()}
                      className="px-6 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Summary Actions */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 text-slate-900">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Summary Actions</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Key Takeaways</p>
                </div>
              </div>

              <textarea 
                value={currentRetro?.summaryAction || ''}
                onChange={(e) => handleUpdateSummary(e.target.value)}
                placeholder="What are the main actions we will take in the next sprint based on this retro?"
                className="w-full min-h-[200px] bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-600 focus:ring-2 focus:ring-amber-500/20 leading-relaxed"
              />

              <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Last Updated</span>
                  <span>{currentRetro ? new Date(currentRetro.updatedAt).toLocaleDateString() : 'Not started'}</span>
                </div>
              </div>
            </div>

            {/* Sprint Info Card */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sprint Context</h4>
              <div className="space-y-2">
                <p className="text-lg font-bold">{selectedSprint?.name}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{selectedSprint?.goal || 'No goal defined for this sprint.'}</p>
              </div>
              <div className="pt-4 flex items-center gap-2">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  selectedSprint?.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                )}>
                  {selectedSprint?.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
