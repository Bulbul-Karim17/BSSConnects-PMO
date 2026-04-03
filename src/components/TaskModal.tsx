import React from 'react';
import { Task } from '../types';
import { X, User, Calendar, Flag, CheckCircle2, Layout, Target, ListChecks, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, onUpdate }) => {
  if (!isOpen) return null;

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
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    task.status === 'DONE' ? "bg-emerald-100 text-emerald-700" :
                    task.status === 'IN_PROGRESS' ? "bg-amber-100 text-amber-700" :
                    task.status === 'BLOCKED' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {task.status.replace('_', ' ')}
                  </span>
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
                <input
                  type="text"
                  value={task.owner}
                  onChange={(e) => onUpdate(task.id, { owner: e.target.value })}
                  className="w-full text-sm font-medium text-slate-700 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 p-3 transition-all"
                  placeholder="Assignee name"
                />
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
