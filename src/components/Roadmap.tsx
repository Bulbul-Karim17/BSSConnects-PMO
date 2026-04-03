import React from 'react';
import { Task, Milestone } from '../types';
import { Calendar, Flag, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addWeeks, startOfWeek, isWithinInterval, parseISO } from 'date-fns';

interface RoadmapProps {
  tasks: Task[];
  milestones: Milestone[];
  onTaskClick: (taskId: string) => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ tasks, milestones, onTaskClick }) => {
  // Get date range
  const dates = tasks.filter(t => t.startDate && t.endDate).map(t => ({
    start: parseISO(t.startDate!),
    end: parseISO(t.endDate!)
  }));

  if (dates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <Calendar className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium">No timeline data available for roadmap.</p>
      </div>
    );
  }

  const minDate = new Date(Math.min(...dates.map(d => d.start.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.end.getTime())));
  
  const start = startOfWeek(minDate);
  const weeks = Array.from({ length: 12 }, (_, i) => addWeeks(start, i));

  // Group tasks by phase
  const phases = Array.from(new Set(tasks.filter(t => t.startDate && t.endDate).map(t => t.phase || 'Uncategorized')));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/30">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Project Roadmap</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Visual timeline organized by project phases</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 mr-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Milestone</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-bold text-slate-700 px-2">Q1 - Q2 2026</span>
            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1400px]">
          {/* Timeline Header */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <div className="w-72 flex-shrink-0 p-4 border-r border-slate-100 font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center">
              Phase / Workstream
            </div>
            {weeks.map((week) => (
              <div key={week.toISOString()} className="flex-grow p-3 text-center border-r border-slate-100 last:border-r-0">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {format(week, 'MMM')}
                </div>
                <div className="text-xs font-black text-slate-800">
                  W{format(week, 'w')}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Body */}
          <div className="relative">
            {/* Vertical Grid Lines */}
            <div className="absolute inset-0 pointer-events-none flex">
              <div className="w-72 flex-shrink-0 border-r border-slate-100" />
              {weeks.map((week) => (
                <div key={week.toISOString()} className="flex-grow border-r border-slate-100/50 last:border-r-0" />
              ))}
            </div>

            {/* Milestones Overlay */}
            <div className="absolute inset-0 pointer-events-none flex">
              <div className="w-72 flex-shrink-0" />
              {weeks.map((week) => {
                const weekEnd = addWeeks(week, 1);
                const weekMilestones = milestones.filter(m => {
                  const mDate = parseISO(m.targetDate);
                  return mDate >= week && mDate < weekEnd;
                });

                return (
                  <div key={week.toISOString()} className="flex-grow relative">
                    {weekMilestones.map((m) => (
                      <div 
                        key={m.id} 
                        className="absolute top-0 bottom-0 w-px bg-amber-400/40 flex flex-col items-center z-20"
                        style={{ left: '50%' }}
                      >
                        <div className="mt-4 bg-amber-500 text-white p-1.5 rounded-full shadow-lg ring-4 ring-amber-500/20">
                          <Flag className="w-3 h-3" />
                        </div>
                        <div className="mt-2 bg-white text-amber-700 px-2.5 py-1 rounded-lg text-[9px] font-black whitespace-nowrap shadow-xl border border-amber-100 uppercase tracking-tight">
                          {m.name}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Phases and Tasks */}
            {phases.map((phase) => (
              <div key={phase} className="relative">
                {/* Phase Header Row */}
                <div className="flex bg-slate-50/80 border-b border-slate-100">
                  <div className="w-72 flex-shrink-0 p-3 px-4 border-r border-slate-100 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{phase}</span>
                  </div>
                  <div className="flex-grow" />
                </div>

                {/* Tasks in Phase */}
                {tasks
                  .filter(t => (t.phase || 'Uncategorized') === phase && t.startDate && t.endDate)
                  .map((task) => (
                    <div 
                      key={task.id} 
                      className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors cursor-pointer group relative z-10"
                      onClick={() => onTaskClick(task.id)}
                    >
                      <div className="w-72 flex-shrink-0 p-4 border-r border-slate-100 flex flex-col justify-center bg-white/50 backdrop-blur-sm">
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1 opacity-70">{task.workstream}</span>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{task.title}</span>
                      </div>
                      <div className="flex-grow flex relative py-5">
                        {/* Task Bar */}
                        <div 
                          className={cn(
                            "absolute h-7 top-4 rounded-xl shadow-sm flex items-center px-4 hover:scale-[1.01] transition-all duration-200 group/bar ring-1 ring-black/5",
                            task.status === 'DONE' ? "bg-emerald-500" : "bg-blue-600"
                          )}
                          style={{
                            left: `${((parseISO(task.startDate!).getTime() - start.getTime()) / (weeks[weeks.length-1].getTime() - start.getTime())) * 100}%`,
                            width: `${((parseISO(task.endDate!).getTime() - parseISO(task.startDate!).getTime()) / (weeks[weeks.length-1].getTime() - start.getTime())) * 100}%`
                          }}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {task.status === 'DONE' && <CheckCircle2 className="w-3 h-3 text-white/80 flex-shrink-0" />}
                            <span className="text-[10px] font-black text-white truncate uppercase tracking-tight">{task.title}</span>
                          </div>
                          
                          {/* Tooltip-like info on hover */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 font-bold uppercase tracking-widest">
                            {format(parseISO(task.startDate!), 'MMM d')} - {format(parseISO(task.endDate!), 'MMM d')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
