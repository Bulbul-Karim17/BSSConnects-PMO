import React, { useState } from 'react';
import { Task, Resource, RAIDItem, TaskComment } from '../types';
import { X, User, Calendar, Flag, CheckCircle2, Layout, Target, ListChecks, FileText, Link as LinkIcon, Plus, Trash2, ShieldAlert, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { User as FirebaseUser } from 'firebase/auth';

interface TaskModalProps {
  task: Task;
  allTasks: Task[];
  raidItems: RAIDItem[];
  resources: Resource[];
  isOpen: boolean;
  currentUser: FirebaseUser | null;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, allTasks, raidItems, resources, isOpen, currentUser, onClose, onUpdate }) => {
  const [newComment, setNewComment] = useState('');
  if (!isOpen) return null;

  const otherTasks = allTasks.filter(t => t.id !== task.id);
  const dependencies = task.dependencies || [];
  const raidDependencies = task.raidDependencyIds || [];
  const commentsList = task.commentsList || [];

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: TaskComment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      author: currentUser?.displayName || currentUser?.email || 'Unknown User',
      date: Date.now()
    };

    onUpdate(task.id, { 
      commentsList: [...commentsList, comment] 
    });
    setNewComment('');
  };

  const handleRemoveComment = (commentId: string) => {
    onUpdate(task.id, {
      commentsList: commentsList.filter(c => c.id !== commentId)
    });
  };

  const handleAddDependency = (depId: string) => {
    if (!dependencies.includes(depId)) {
      onUpdate(task.id, { dependencies: [...dependencies, depId] });
    }
  };

  const handleRemoveDependency = (depId: string) => {
    onUpdate(task.id, { dependencies: dependencies.filter(id => id !== depId) });
  };

  const handleAddRaidDependency = (raidId: string) => {
    if (!raidDependencies.includes(raidId)) {
      onUpdate(task.id, { raidDependencyIds: [...raidDependencies, raidId] });
    }
  };

  const handleRemoveRaidDependency = (raidId: string) => {
    onUpdate(task.id, { raidDependencyIds: raidDependencies.filter(id => id !== raidId) });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => onUpdate(task.id, { title: e.target.value })}
                  className="text-xl font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-full"
                  placeholder="Task Title"
                />
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={task.status}
                    onChange={(e) => onUpdate(task.id, { status: e.target.value as any })}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none focus:ring-0 cursor-pointer appearance-none",
                      task.status === 'DONE' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                      task.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                      task.status === 'BLOCKED' ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="BACKLOG">Backlog</option>
                  </select>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">•</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.workstream}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-8 space-y-8">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Owner
                </label>
                <select
                  value={task.owner}
                  onChange={(e) => onUpdate(task.id, { owner: e.target.value })}
                  className="w-full text-sm font-medium text-slate-700 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 p-3 transition-all appearance-none cursor-pointer"
                >
                  <option value="Unassigned">Unassigned</option>
                  {resources.map(resource => (
                    <option key={resource.id} value={resource.name}>
                      {resource.name} ({resource.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={task.startDate || ''}
                  onChange={(e) => onUpdate(task.id, { startDate: e.target.value })}
                  className="w-full text-sm font-medium text-slate-700 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 p-3 transition-all"
                />
              </div>
            </div>

            {/* Overview / Description */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Overview
              </label>
              <textarea
                value={task.description}
                onChange={(e) => onUpdate(task.id, { description: e.target.value })}
                className="w-full text-sm text-slate-600 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-4 transition-all min-h-[100px] leading-relaxed"
                placeholder="What is this task about?"
              />
            </div>

            {/* Objective */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3 h-3" />
                Objective
              </label>
              <textarea
                value={task.objective || ''}
                onChange={(e) => onUpdate(task.id, { objective: e.target.value })}
                className="w-full text-sm text-slate-600 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-4 transition-all min-h-[80px] leading-relaxed"
                placeholder="What is the primary goal of this task?"
              />
            </div>

            {/* Acceptance Criteria */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ListChecks className="w-3 h-3" />
                Acceptance Criteria
              </label>
              <textarea
                value={task.acceptanceCriteria || ''}
                onChange={(e) => onUpdate(task.id, { acceptanceCriteria: e.target.value })}
                className="w-full text-sm text-slate-600 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-4 transition-all min-h-[120px] leading-relaxed font-mono"
                placeholder="- Criterion 1&#10;- Criterion 2&#10;- Criterion 3"
              />
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                Comments & Updates
              </label>
              
              <div className="space-y-4">
                {commentsList.map(comment => (
                  <div key={comment.id} className="bg-slate-50 rounded-2xl p-4 space-y-2 group relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {comment.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{comment.author}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.date).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveComment(comment.id)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pl-8">
                      {comment.text}
                    </p>
                  </div>
                ))}

                {commentsList.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                    <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
                  </div>
                )}

                <div className="flex items-start gap-3 pt-2">
                  <div className="flex-grow">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      className="w-full text-sm text-slate-600 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-4 transition-all min-h-[80px] leading-relaxed"
                      placeholder="Add a comment or update..."
                    />
                  </div>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dependencies */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon className="w-3 h-3" />
                Dependencies
              </label>
              
              <div className="space-y-2">
                {dependencies.map(depId => {
                  const depTask = allTasks.find(t => t.id === depId);
                  return (
                    <div key={depId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        <span className="text-sm text-slate-700 truncate font-medium">
                          {depTask ? depTask.title : 'Unknown Task'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveDependency(depId)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                
                {dependencies.length === 0 && (
                  <p className="text-xs text-slate-400 italic px-1">No dependencies linked yet.</p>
                )}
              </div>

              <div className="pt-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddDependency(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full text-sm text-slate-500 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 p-3 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                  defaultValue=""
                >
                  <option value="" disabled>+ Add Dependency...</option>
                  {otherTasks
                    .filter(t => !dependencies.includes(t.id))
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* RAID Log Dependencies */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" />
                RAID Log Dependencies
              </label>
              
              <div className="space-y-2">
                {raidDependencies.map(raidId => {
                  const raidItem = raidItems.find(r => r.id === raidId);
                  return (
                    <div key={raidId} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl group hover:bg-amber-100 transition-all border border-amber-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-sm text-amber-900 truncate font-medium">
                          {raidItem ? raidItem.description : 'Unknown RAID Item'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveRaidDependency(raidId)}
                        className="p-1.5 text-amber-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                
                {raidDependencies.length === 0 && (
                  <p className="text-xs text-slate-400 italic px-1">No RAID dependencies linked yet.</p>
                )}
              </div>

              <div className="pt-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddRaidDependency(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full text-sm text-amber-700 bg-amber-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500/20 p-3 transition-all appearance-none cursor-pointer hover:bg-amber-100"
                  defaultValue=""
                >
                  <option value="" disabled>+ Link RAID Dependency...</option>
                  {raidItems
                    .filter(r => r.type === 'DEPENDENCY' && !raidDependencies.includes(r.id))
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.description} ({r.status})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
