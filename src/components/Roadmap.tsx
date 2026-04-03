import React from 'react';
import { Task, Milestone } from '../types';
import { Calendar, Flag, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addWeeks, startOfWeek, isWithinInterval, parseISO } from 'date-fns';

interface RoadmapProps {
  tasks: Task[];
  milestones: Milestone[];
}

export const Roadmap: React.FC<RoadmapProps> = ({ tasks, milestones }) => {
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

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">Project Roadmap</h3>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium text-slate-600">Q1 - Q2 2026</span>
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header */}
          <div className="flex border-b border-slate-100">
            <div className="w-64 flex-shrink-0 p-4 border-r border-slate-100 bg-slate-50/50 font-bold text-xs text-slate-400 uppercase tracking-wider">
              Workstream / Task
            </div>
            {weeks.map((week) => (
              <div key={week.toISOString()} className="flex-grow p-4 text-center border-r border-slate-100 last:border-r-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {format(week, 'MMM')}
                </div>
                <div className="text-xs font-bold text-slate-900">
                  W{format(week, 'w')}
                </div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="relative">
            {/* Milestones Overlay */}
            <div className="absolute inset-0 pointer-events-none flex">
              <div className="w-64 flex-shrink-0 border-r border-slate-100" />
              {weeks.map((week) => {
                const weekEnd = addWeeks(week, 1);
                const weekMilestones = milestones.filter(m => {
                  const mDate = parseISO(m.targetDate);
                  return mDate >= week && mDate < weekEnd;
                });

                return (
                  <div key={week.toISOString()} className="flex-grow relative border-r border-slate-100 last:border-r-0">
                    {weekMilestones.map((m, idx) => (
                      <div 
                        key={m.id} 
                        className="absolute top-0 bottom-0 w-px bg-amber-400/30 flex flex-col items-center"
                        style={{ left: '50%' }}
                      >
                        <div className="mt-2 bg-amber-500 text-white p-1 rounded-full shadow-lg z-10">
                          <Flag className="w-3 h-3" />
                        </div>
                        <div className="mt-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[8px] font-bold whitespace-nowrap shadow-sm border border-amber-200">
                          {m.name}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Tasks */}
            {tasks.slice(0, 10).map((task) => (
              <div key={task.id} className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                <div className="w-64 flex-shrink-0 p-4 border-r border-slate-100 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">{task.workstream}</span>
                  <span className="text-xs font-semibold text-slate-900 truncate">{task.title}</span>
                </div>
                <div className="flex-grow flex relative py-4">
                  {weeks.map((week) => (
                    <div key={week.toISOString()} className="flex-grow border-r border-slate-100 last:border-r-0" />
                  ))}
                  
                  {/* Task Bar */}
                  {task.startDate && task.endDate && (
                    <div 
                      className={cn(
                        "absolute h-6 top-5 rounded-full shadow-sm flex items-center px-3",
                        task.status === 'DONE' ? "bg-emerald-500" : "bg-blue-500"
                      )}
                      style={{
                        left: `${((parseISO(task.startDate).getTime() - start.getTime()) / (weeks[weeks.length-1].getTime() - start.getTime())) * 100}%`,
                        width: `${((parseISO(task.endDate).getTime() - parseISO(task.startDate).getTime()) / (weeks[weeks.length-1].getTime() - start.getTime())) * 100}%`
                      }}
                    >
                      <span className="text-[9px] font-bold text-white truncate">{task.title}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
