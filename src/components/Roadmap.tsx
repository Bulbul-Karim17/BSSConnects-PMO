import React, { useState } from 'react';
import { Task, Milestone, Phase } from '../types';
import { 
  Calendar, 
  Flag, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Plus, 
  Edit2, 
  Trash2, 
  Info,
  Clock,
  Layout
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addWeeks, startOfWeek, parseISO, differenceInDays } from 'date-fns';

interface RoadmapProps {
  tasks: Task[];
  milestones: Milestone[];
  phases: Phase[];
  onTaskClick: (taskId: string) => void;
  onPhaseAdd: () => void;
  onPhaseEdit: (phase: Phase) => void;
  onPhaseDelete: (phaseId: string) => void;
  onMilestoneAdd: (phaseName: string) => void;
  onMilestoneEdit: (milestone: Milestone) => void;
  onMilestoneDelete: (milestoneId: string) => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ 
  tasks, 
  milestones, 
  phases,
  onTaskClick,
  onPhaseAdd,
  onPhaseEdit,
  onPhaseDelete,
  onMilestoneAdd,
  onMilestoneEdit,
  onMilestoneDelete
}) => {
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'LIST'>('TIMELINE');
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  // Get date range for timeline
  const allDates = [
    ...tasks.filter(t => t.startDate).map(t => parseISO(t.startDate!)),
    ...tasks.filter(t => t.endDate).map(t => parseISO(t.endDate!)),
    ...milestones.map(m => parseISO(m.targetDate)),
    ...phases.map(p => parseISO(p.startDate)),
    ...phases.map(p => parseISO(p.endDate))
  ];

  if (allDates.length === 0 && phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Build Your Roadmap</h3>
        <p className="text-slate-500 max-w-xs text-center mb-6">
          Start by defining your project phases and key milestones to visualize your journey.
        </p>
        <button 
          onClick={onPhaseAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add First Phase
        </button>
      </div>
    );
  }

  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();
  
  const start = startOfWeek(minDate);
  const weeksCount = Math.max(12, Math.ceil(differenceInDays(maxDate, start) / 7) + 2);
  const weeks = Array.from({ length: weeksCount }, (_, i) => addWeeks(start, i));

  return (
    <div className="space-y-6">
      {/* Roadmap Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Project Roadmap</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">Strategic timeline and phase-based execution plan</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('TIMELINE')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'TIMELINE' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Timeline View
              </button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'LIST' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Phase Details
              </button>
            </div>
            <button 
              onClick={onPhaseAdd}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              Add Phase
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'TIMELINE' ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[1400px]">
              {/* Timeline Header */}
              <div className="flex border-b border-slate-100 bg-slate-50/50">
                <div className="w-80 flex-shrink-0 p-4 border-r border-slate-100 font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center">
                  Phase / Milestones
                </div>
                {weeks.map((week) => (
                  <div key={week.toISOString()} className="flex-grow p-3 text-center border-r border-slate-100 last:border-r-0">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {format(week, 'MMM')}
                    </div>
                    <div className="text-xs font-black text-slate-800">
                      {format(week, 'd')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline Body */}
              <div className="relative">
                {/* Vertical Grid Lines */}
                <div className="absolute inset-0 pointer-events-none flex">
                  <div className="w-80 flex-shrink-0 border-r border-slate-100" />
                  {weeks.map((week) => (
                    <div key={week.toISOString()} className="flex-grow border-r border-slate-100/30 last:border-r-0" />
                  ))}
                </div>

                {/* Phases and Milestones */}
                {phases.map((phase) => (
                  <div key={phase.id} className="relative border-b border-slate-100 last:border-b-0">
                    <div className="flex min-h-[100px]">
                      {/* Phase Info Sidebar */}
                      <div className="w-80 flex-shrink-0 p-5 border-r border-slate-100 bg-slate-50/20 relative group">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-6 rounded-full", phase.color || "bg-blue-500")} />
                            <h4 className="font-bold text-slate-900 text-sm">{phase.name}</h4>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onPhaseEdit(phase)} className="p-1 hover:bg-white rounded text-slate-400 hover:text-blue-600"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => onPhaseDelete(phase.id)} className="p-1 hover:bg-white rounded text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                          {phase.description || "No description provided."}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(phase.startDate), 'MMM d')} - {format(parseISO(phase.endDate), 'MMM d')}
                          </div>
                        </div>
                        <button 
                          onClick={() => onMilestoneAdd(phase.name)}
                          className="mt-4 w-full py-1.5 border border-dashed border-slate-200 rounded-lg text-[9px] font-bold text-slate-400 uppercase hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Milestone
                        </button>
                      </div>

                      {/* Timeline Area */}
                      <div className="flex-grow relative py-8">
                        {/* Phase Bar Background */}
                        <div 
                          className={cn("absolute h-1.5 top-1/2 -translate-y-1/2 rounded-full opacity-10", phase.color || "bg-blue-500")}
                          style={{
                            left: `${((parseISO(phase.startDate).getTime() - start.getTime()) / (weeks[weeks.length-1].getTime() - start.getTime())) * 100}%`,
                            width: `${((parseISO(phase.endDate).getTime() - parseISO(phase.startDate).getTime()) / (weeks[weeks.length-1].getTime() - start.getTime())) * 100}%`
                          }}
                        />

                        {/* Milestones in this phase */}
                        {milestones
                          .filter(m => m.phase === phase.name)
                          .map(m => {
                            const mDate = parseISO(m.targetDate);
                            const left = ((mDate.getTime() - start.getTime()) / (weeks[weeks.length-1].getTime() - start.getTime())) * 100;
                            
                            return (
                              <div 
                                key={m.id}
                                className="absolute top-0 bottom-0 flex flex-col items-center group/ms"
                                style={{ left: `${left}%` }}
                              >
                                <div className="absolute top-1/2 -translate-y-1/2 w-px h-12 bg-slate-200 group-hover/ms:bg-blue-400 transition-colors" />
                                <button 
                                  onClick={() => onMilestoneEdit(m)}
                                  className={cn(
                                    "relative z-20 mt-4 p-2 rounded-xl shadow-lg ring-4 transition-all hover:scale-110",
                                    m.status === 'ACHIEVED' ? "bg-emerald-500 ring-emerald-500/20" : 
                                    m.status === 'DELAYED' ? "bg-red-500 ring-red-500/20" : "bg-blue-600 ring-blue-500/20"
                                  )}
                                >
                                  <Flag className="w-3 h-3 text-white" />
                                </button>
                                <div className="mt-2 bg-white border border-slate-100 shadow-xl rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-800 whitespace-nowrap opacity-0 group-hover/ms:opacity-100 transition-opacity z-30">
                                  <div className="flex items-center justify-between gap-4 mb-1">
                                    <span>{m.name}</span>
                                    <span className="text-[8px] text-slate-400">{format(mDate, 'MMM d')}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); onMilestoneEdit(m); }} className="text-blue-600 hover:underline">Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); onMilestoneDelete(m.id); }} className="text-red-500 hover:underline">Delete</button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {phases.map((phase) => (
            <div key={phase.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-blue-300 transition-all">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-3 h-8 rounded-full", phase.color || "bg-blue-500")} />
                    <h4 className="text-xl font-bold text-slate-900">{phase.name}</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {phase.description || "No detailed description provided for this phase."}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {format(parseISO(phase.startDate), 'MMM d, yyyy')} - {format(parseISO(phase.endDate), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                      <Layout className="w-4 h-4 text-purple-500" />
                      {milestones.filter(m => m.phase === phase.name).length} Milestones
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-2">
                    <button 
                      onClick={() => onPhaseEdit(phase)}
                      className="flex-grow flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Phase
                    </button>
                    <button 
                      onClick={() => onPhaseDelete(phase.id)}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="font-bold text-slate-900 flex items-center gap-2">
                      <Flag className="w-4 h-4 text-amber-500" />
                      Phase Milestones
                    </h5>
                    <button 
                      onClick={() => onMilestoneAdd(phase.name)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Milestone
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {milestones.filter(m => m.phase === phase.name).length > 0 ? (
                      milestones.filter(m => m.phase === phase.name).map(m => (
                        <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm",
                              m.status === 'ACHIEVED' ? "bg-emerald-500" : 
                              m.status === 'DELAYED' ? "bg-red-500" : "bg-blue-600"
                            )}>
                              <Flag className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{m.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Target: {format(parseISO(m.targetDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onMilestoneEdit(m)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => onMilestoneDelete(m.id)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Flag className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">No milestones for this phase yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
