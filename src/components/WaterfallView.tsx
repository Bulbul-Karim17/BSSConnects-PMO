import React from 'react';
import { Task } from '../types';
import { Calendar, CheckCircle2, Clock, AlertCircle, ChevronRight, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface WaterfallViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export const WaterfallView: React.FC<WaterfallViewProps> = ({ tasks, onTaskClick }) => {
  // Group tasks by phase
  const phases = Array.from(new Set(tasks.map(t => t.phase || 'Uncategorized')));

  return (
    <div className="space-y-8">
      {phases.map((phase) => (
        <div key={phase} className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{phase}</h3>
            <span className="text-xs text-slate-400 font-medium ml-auto">
              {tasks.filter(t => t.phase === phase).length} Tasks
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {tasks
              .filter((task) => task.phase === phase)
              .map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task.id)}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-6 hover:border-blue-300 transition-all group cursor-pointer"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    task.status === 'DONE' ? "bg-emerald-50 text-emerald-600" : 
                    task.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600" :
                    task.status === 'BLOCKED' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
                  )}>
                    {task.status === 'DONE' ? <CheckCircle2 className="w-5 h-5" /> : 
                     task.status === 'BLOCKED' ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {task.workstream}
                      </span>
                      {task.dependencies && task.dependencies.length > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                          {task.dependencies.length} Deps
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {task.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-8 flex-shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Owner</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        <User className="w-3 h-3" />
                        <span>{task.owner}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end w-32">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Timeline</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        <Calendar className="w-3 h-3" />
                        <span>{task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'} - {task.endDate ? new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
                      </div>
                    </div>

                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      task.status === 'DONE' ? "bg-emerald-100 text-emerald-700" : 
                      task.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                      task.status === 'BLOCKED' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {task.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
