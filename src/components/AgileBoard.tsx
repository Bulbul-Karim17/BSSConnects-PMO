import React from 'react';
import { Task } from '../types';
import { Plus, MoreVertical, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface AgileBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, status: Task['status']) => void;
  onAddTask: (status: Task['status']) => void;
}

const COLUMNS: { id: Task['status']; label: string; color: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'bg-slate-100 text-slate-600' },
  { id: 'TODO', label: 'To Do', color: 'bg-blue-50 text-blue-600' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-50 text-amber-600' },
  { id: 'DONE', label: 'Done', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'BLOCKED', label: 'Blocked', color: 'bg-red-50 text-red-600' },
];

export const AgileBoard: React.FC<AgileBoardProps> = ({ tasks, onTaskUpdate, onAddTask }) => {
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
      {COLUMNS.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">{column.label}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", column.color)}>
                {tasks.filter(t => t.status === column.id).length}
              </span>
            </div>
            <button 
              onClick={() => onAddTask(column.id)}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3 min-h-[500px] bg-slate-50/50 p-2 rounded-xl border border-slate-100">
            {tasks
              .filter((task) => task.status === column.id)
              .map((task) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {task.workstream}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 transition-opacity">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">
                    {task.title}
                  </h4>
                  
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                      <User className="w-3 h-3" />
                      <span>{task.owner}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {COLUMNS.map((col) => (
                        col.id !== task.status && (
                          <button
                            key={col.id}
                            onClick={() => onTaskUpdate(task.id, col.id)}
                            className={cn(
                              "w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold transition-all",
                              col.id === 'DONE' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white" :
                              col.id === 'BLOCKED' ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white" :
                              "bg-slate-100 text-slate-600 hover:bg-slate-600 hover:text-white"
                            )}
                            title={`Move to ${col.label}`}
                          >
                            {col.label.charAt(0)}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
