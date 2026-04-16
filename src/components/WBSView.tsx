import React, { useState } from 'react';
import { Task, Phase, ProjectFile, RAIDItem, Resource } from '../types';
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  Plus, 
  MoreVertical,
  Upload,
  FileText,
  Trash2,
  Link2,
  AlertCircle,
  Search,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';

interface WBSViewProps {
  tasks: Task[];
  raidItems: RAIDItem[];
  projectFiles: ProjectFile[];
  resources: Resource[];
  onTaskUpdate: (taskId: string, updates: any) => void;
  onAddTask: (projectId: string, status: string, parentId?: string, phase?: string, workstream?: string) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
  onFileUpload: (taskId: string) => void;
  projectId: string;
}

export const WBSView: React.FC<WBSViewProps> = ({ 
  tasks, 
  raidItems,
  projectFiles,
  resources,
  onTaskUpdate, 
  onAddTask,
  onTaskDelete,
  onTaskClick,
  onFileUpload,
  projectId
}) => {
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<Record<string, boolean>>({});
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const calculateProgress = (taskIds: string[]) => {
    if (taskIds.length === 0) return 0;
    const completed = tasks.filter(t => taskIds.includes(t.id) && t.status === 'DONE').length;
    return Math.round((completed / taskIds.length) * 100);
  };

  const getWorkstreamProgress = (wsName: string) => {
    const wsTasks = tasks.filter(t => (t.workstream || 'General') === wsName);
    return calculateProgress(wsTasks.map(t => t.id));
  };

  const getActivityProgress = (activityId: string) => {
    const subTasks = tasks.filter(t => t.parentId === activityId);
    if (subTasks.length === 0) {
      const activity = tasks.find(t => t.id === activityId);
      return activity?.status === 'DONE' ? 100 : 0;
    }
    return calculateProgress(subTasks.map(t => t.id));
  };

  const expandWorkstream = (wsName: string) => {
    setExpandedWorkstreams(prev => ({ ...prev, [wsName]: true }));
  };

  const toggleWorkstream = (wsName: string) => {
    setExpandedWorkstreams(prev => ({ ...prev, [wsName]: !prev[wsName] }));
  };

  const expandActivity = (activityId: string) => {
    setExpandedActivities(prev => ({ ...prev, [activityId]: true }));
  };

  const toggleActivity = (activityId: string) => {
    setExpandedActivities(prev => ({ ...prev, [activityId]: !prev[activityId] }));
  };

  const getDependencyStatus = (task: Task) => {
    if (!task.dependencies || task.dependencies.length === 0) return { isBlocked: false, blockedBy: [] };
    
    const blockedBy = tasks.filter(t => task.dependencies?.includes(t.id) && t.status !== 'DONE');
    return {
      isBlocked: blockedBy.length > 0,
      blockedBy
    };
  };

  // Get activities for a workstream
  const getActivities = (wsName: string) => {
    return tasks.filter(t => (t.workstream || 'General') === wsName && !t.parentId);
  };

  const workstreams = Array.from(new Set(tasks.map(t => t.workstream || 'General')))
    .filter(ws => ws.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a === 'General') return -1;
      if (b === 'General') return 1;
      return a.localeCompare(b);
    });

  const toggleAll = (expand: boolean) => {
    const newWs: Record<string, boolean> = {};
    const newAct: Record<string, boolean> = {};
    workstreams.forEach(ws => newWs[ws] = expand);
    tasks.forEach(t => { if (!t.parentId) newAct[t.id] = expand; });
    setExpandedWorkstreams(newWs);
    setExpandedActivities(newAct);
  };

  // Expand new workstreams automatically
  React.useEffect(() => {
    workstreams.forEach(ws => {
      if (ws !== 'General' && expandedWorkstreams[ws] === undefined) {
        setExpandedWorkstreams(prev => ({ ...prev, [ws]: true }));
      }
    });
  }, [workstreams.length]);

  // Get sub-activities for an activity
  const getSubActivities = (activityId: string) => {
    return tasks.filter(t => t.parentId === activityId);
  };

  // Get files for a task
  const getTaskFiles = (taskId: string) => {
    return projectFiles.filter(f => f.docId === taskId);
  };

  const handleWorkstreamRename = (oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim()) return;
    tasks.forEach(t => {
      if ((t.workstream || 'General') === oldName) {
        onTaskUpdate(t.id, { workstream: newName });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* WBS Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-grow max-w-md">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search WBS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => toggleAll(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg transition-all"
          >
            Expand All
          </button>
          <button 
            onClick={() => toggleAll(false)}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg transition-all"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse text-left table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[200px]">Workstream</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[250px]">Activity</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[250px]">Sub-activity</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[120px]">Status</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[140px]">Owner</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[120px]">Deadline</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[150px]">Dependencies</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[200px]">Comments</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[100px]">Files</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {workstreams.map(wsName => {
              const activities = getActivities(wsName);
              const isExpanded = expandedWorkstreams[wsName];
              const progress = getWorkstreamProgress(wsName);

              return (
                <React.Fragment key={wsName}>
                  {/* Workstream Row */}
                  <tr className="bg-slate-50/80 group hover:bg-slate-100/80 transition-colors sticky top-0 z-10">
                    <td className="p-4 cursor-pointer" onClick={() => toggleWorkstream(wsName)}>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkstream(wsName);
                          }}
                          className="p-1 hover:bg-white rounded transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                        </button>
                        <div className="w-1.5 h-4 rounded-full bg-blue-500" />
                        <input 
                          type="text"
                          defaultValue={wsName}
                          onBlur={(e) => handleWorkstreamRename(wsName, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleWorkstreamRename(wsName, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-full truncate"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>
                    <td className="p-4" colSpan={2}>
                      <div className="flex items-center gap-3">
                        <div className="flex-grow h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{progress}%</span>
                      </div>
                    </td>
                    <td className="p-4 border-r border-slate-200/50"></td>
                    <td className="p-4 border-r border-slate-200/50"></td>
                    <td className="p-4 border-r border-slate-200/50"></td>
                    <td className="p-4 border-r border-slate-200/50"></td>
                    <td className="p-4 border-r border-slate-200/50"></td>
                    <td className="p-4 border-r border-slate-200/50"></td>
                    <td className="p-4">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!projectId) return;
                          onAddTask(projectId, 'TODO', undefined, '', wsName);
                          expandWorkstream(wsName);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Add Activity
                      </button>
                    </td>
                  </tr>

                {/* Activities under this workstream */}
                {isExpanded && (
                  activities.length > 0 ? (
                    activities.map(activity => {
                      const subActivities = getSubActivities(activity.id);
                      const isActivityExpanded = expandedActivities[activity.id];
                      const files = getTaskFiles(activity.id);
                      const depStatus = getDependencyStatus(activity);
                      const activityProgress = getActivityProgress(activity.id);

                      return (
                        <React.Fragment key={activity.id}>
                          <tr className={cn(
                            "group hover:bg-slate-50 transition-colors border-l-4",
                            depStatus.isBlocked ? "border-l-red-500 bg-red-50/10" : "border-l-blue-500",
                            activity.status === 'DONE' && "bg-emerald-50/20"
                          )}>
                            <td className="p-4 text-slate-400 font-medium border-r border-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-8 rounded-full bg-slate-200" />
                                <input 
                                  type="text"
                                  value={activity.workstream || 'General'}
                                  onChange={(e) => onTaskUpdate(activity.id, { workstream: e.target.value })}
                                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-400"
                                />
                              </div>
                            </td>
                            <td className="p-4 cursor-pointer border-r border-slate-100" onClick={() => toggleActivity(activity.id)}>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleActivity(activity.id);
                                    }}
                                    className="p-1.5 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200"
                                  >
                                    {isActivityExpanded ? 
                                      <ChevronDown className="w-4 h-4 text-blue-600" /> : 
                                      <ChevronRight className="w-4 h-4 text-slate-400" />
                                    }
                                  </button>
                                  <div className="flex-grow flex items-center gap-2">
                                    <input 
                                      type="text"
                                      value={activity.title}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => onTaskUpdate(activity.id, { title: e.target.value })}
                                      className={cn(
                                        "w-full bg-transparent border-none focus:ring-0 p-0 font-semibold text-slate-700",
                                        depStatus.isBlocked && "text-red-700",
                                        activity.status === 'DONE' && "text-emerald-700 line-through opacity-60"
                                      )}
                                    />
                                    {depStatus.isBlocked && (
                                      <span title={`Blocked by: ${depStatus.blockedBy.map(t => t.title).join(', ')}`}>
                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="pl-9 pr-4">
                                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full transition-all duration-500",
                                        activityProgress === 100 ? "bg-emerald-500" : "bg-blue-400"
                                      )}
                                      style={{ width: `${activityProgress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 border-r border-slate-100"></td>
                            <td className="p-4 border-r border-slate-100">
                              <select
                                value={activity.status}
                                onChange={(e) => onTaskUpdate(activity.id, { status: e.target.value })}
                                className={cn(
                                  "w-full text-[10px] font-bold px-2 py-1 rounded-lg border outline-none transition-all",
                                  activity.status === 'DONE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  activity.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                  activity.status === 'BLOCKED' ? "bg-red-50 text-red-600 border-red-100" :
                                  "bg-slate-50 text-slate-500 border-slate-200"
                                )}
                              >
                                <option value="TODO">TODO</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                <option value="DONE">DONE</option>
                                <option value="BLOCKED">BLOCKED</option>
                              </select>
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-500">
                                  {(activity.owner || 'U').charAt(0)}
                                </div>
                                <select 
                                  value={activity.owner || ''}
                                  onChange={(e) => onTaskUpdate(activity.id, { owner: e.target.value })}
                                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600 cursor-pointer"
                                >
                                  <option value="">Unassigned</option>
                                  {resources.map(res => (
                                    <option key={res.id} value={res.name}>{res.name}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <input 
                                type="date"
                                value={activity.endDate || ''}
                                onChange={(e) => onTaskUpdate(activity.id, { endDate: e.target.value })}
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600"
                              />
                            </td>
                            <td className="p-4 border-r border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => onTaskClick(activity.id)}>
                              <div className="flex flex-wrap gap-1">
                                {activity.dependencies?.map(depId => {
                                  const depTask = tasks.find(t => t.id === depId);
                                  const isUnmet = depTask && depTask.status !== 'DONE';
                                  return (
                                    <div 
                                      key={depId} 
                                      className={cn(
                                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border",
                                        isUnmet ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                      )}
                                      title={depTask?.title || 'Unknown Task'}
                                    >
                                      <Link2 className="w-2.5 h-2.5" />
                                      <span className="truncate max-w-[60px]">{depTask?.title || '...'}</span>
                                    </div>
                                  );
                                })}
                                {activity.raidDependencyIds?.map(raidId => {
                                  const raidItem = raidItems.find(r => r.id === raidId);
                                  return (
                                    <div 
                                      key={raidId} 
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border bg-amber-50 text-amber-600 border-amber-100"
                                      title={`RAID: ${raidItem?.description || 'Unknown'}`}
                                    >
                                      <ShieldAlert className="w-2 h-2" />
                                      <span className="truncate max-w-[60px]">RAID</span>
                                    </div>
                                  );
                                })}
                                {(!activity.dependencies || activity.dependencies.length === 0) && (!activity.raidDependencyIds || activity.raidDependencyIds.length === 0) && (
                                  <span className="text-[10px] text-slate-300 italic">None</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <div className="flex items-center gap-2 group/comment">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                                <input 
                                  type="text"
                                  value={activity.comments || ''}
                                  onChange={(e) => onTaskUpdate(activity.id, { comments: e.target.value })}
                                  placeholder="Add comment..."
                                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500 placeholder:text-slate-300"
                                />
                              </div>
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <div className="flex items-center gap-1 min-h-[24px]">
                                {files.length > 0 ? (
                                  <div className="flex -space-x-2 overflow-hidden">
                                    {files.slice(0, 3).map(f => (
                                      <div key={f.id} className="w-5 h-5 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm" title={f.name}>
                                        <FileText className="w-3 h-3 text-blue-500" />
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                <button 
                                  type="button"
                                  onClick={() => onFileUpload(activity.id)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                                  title="Upload File"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddTask(projectId, 'TODO', activity.id, '', activity.workstream);
                                    expandActivity(activity.id);
                                  }}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition-all shadow-sm border border-blue-100"
                                  title="Add Sub-activity"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskClick(activity.id);
                                  }}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition-all shadow-sm border border-slate-100"
                                  title="View Details"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskDelete(activity.id);
                                  }}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition-all shadow-sm border border-red-100"
                                  title="Delete Activity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Sub-activities */}
                          {isActivityExpanded && (
                            subActivities.length > 0 ? (
                              subActivities.map(sub => {
                                const subFiles = getTaskFiles(sub.id);
                                const subDepStatus = getDependencyStatus(sub);
                                return (
                                  <tr key={sub.id} className={cn(
                                    "bg-slate-50/30 group hover:bg-slate-50 transition-colors border-l-4 border-l-slate-200",
                                    subDepStatus.isBlocked && "bg-red-50/50 border-l-red-300",
                                    sub.status === 'DONE' && "bg-emerald-50/10"
                                  )}>
                                    <td className="p-4 text-slate-300 border-r border-slate-100/50 italic">{wsName}</td>
                                    <td className="p-4 text-slate-400 border-r border-slate-100/50 italic">{activity.title}</td>
                                    <td className="p-4 border-r border-slate-100/50">
                                      <div className="flex items-center gap-2 pl-4">
                                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                                        <input 
                                          type="text"
                                          value={sub.title}
                                          onChange={(e) => onTaskUpdate(sub.id, { title: e.target.value })}
                                          className={cn(
                                            "w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600",
                                            subDepStatus.isBlocked && "text-red-700 font-medium",
                                            sub.status === 'DONE' && "text-emerald-700 line-through opacity-60"
                                          )}
                                        />
                                        {subDepStatus.isBlocked && (
                                          <span title={`Blocked by: ${subDepStatus.blockedBy.map(t => t.title).join(', ')}`}>
                                            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-4 border-r border-slate-100/50">
                                      <select
                                        value={sub.status}
                                        onChange={(e) => onTaskUpdate(sub.id, { status: e.target.value })}
                                        className={cn(
                                          "w-full text-[9px] font-bold px-1.5 py-0.5 rounded border outline-none transition-all",
                                          sub.status === 'DONE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                          sub.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                          sub.status === 'BLOCKED' ? "bg-red-50 text-red-600 border-red-100" :
                                          "bg-slate-50 text-slate-500 border-slate-200"
                                        )}
                                      >
                                        <option value="TODO">TODO</option>
                                        <option value="IN_PROGRESS">IN PROGRESS</option>
                                        <option value="DONE">DONE</option>
                                        <option value="BLOCKED">BLOCKED</option>
                                      </select>
                                    </td>
                                    <td className="p-4 border-r border-slate-100/50">
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-500">
                                          {sub.owner.charAt(0)}
                                        </div>
                                        <select 
                                          value={sub.owner || ''}
                                          onChange={(e) => onTaskUpdate(sub.id, { owner: e.target.value })}
                                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500 cursor-pointer"
                                        >
                                          <option value="">Unassigned</option>
                                          {resources.map(res => (
                                            <option key={res.id} value={res.name}>{res.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </td>
                                    <td className="p-4 border-r border-slate-100/50">
                                      <input 
                                        type="date"
                                        value={sub.endDate || ''}
                                        onChange={(e) => onTaskUpdate(sub.id, { endDate: e.target.value })}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500"
                                      />
                                    </td>
                                    <td className="p-4 border-r border-slate-100/50 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => onTaskClick(sub.id)}>
                                      <div className="flex flex-wrap gap-1">
                                        {sub.dependencies?.map(depId => {
                                          const depTask = tasks.find(t => t.id === depId);
                                          const isUnmet = depTask && depTask.status !== 'DONE';
                                          return (
                                            <div 
                                              key={depId} 
                                              className={cn(
                                                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border",
                                                isUnmet ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                              )}
                                              title={depTask?.title || 'Unknown Task'}
                                            >
                                              <Link2 className="w-2 h-2" />
                                              <span className="truncate max-w-[50px]">{depTask?.title || '...'}</span>
                                            </div>
                                          );
                                        })}
                                        {sub.raidDependencyIds?.map(raidId => {
                                          const raidItem = raidItems.find(r => r.id === raidId);
                                          return (
                                            <div 
                                              key={raidId} 
                                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border bg-amber-50 text-amber-600 border-amber-100"
                                              title={`RAID: ${raidItem?.description || 'Unknown'}`}
                                            >
                                              <ShieldAlert className="w-2 h-2" />
                                              <span className="truncate max-w-[50px]">RAID</span>
                                            </div>
                                          );
                                        })}
                                        {(!sub.dependencies || sub.dependencies.length === 0) && (!sub.raidDependencyIds || sub.raidDependencyIds.length === 0) && (
                                          <span className="text-[10px] text-slate-300 italic">None</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-4 border-r border-slate-100/50">
                                      <div className="flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3 text-slate-200" />
                                        <input 
                                          type="text"
                                          value={sub.comments || ''}
                                          onChange={(e) => onTaskUpdate(sub.id, { comments: e.target.value })}
                                          placeholder="Add comment..."
                                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-400 placeholder:text-slate-200"
                                        />
                                      </div>
                                    </td>
                                    <td className="p-4 border-r border-slate-100/50">
                                      <div className="flex items-center gap-1 min-h-[20px]">
                                        {subFiles.length > 0 ? (
                                          <div className="flex -space-x-2 overflow-hidden">
                                            {subFiles.slice(0, 3).map(f => (
                                              <div key={f.id} className="w-4 h-4 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-sm" title={f.name}>
                                                <FileText className="w-2.5 h-2.5 text-blue-400" />
                                              </div>
                                            ))}
                                          </div>
                                        ) : null}
                                        <button 
                                          type="button"
                                          onClick={() => onFileUpload(sub.id)}
                                          className="p-1 hover:bg-blue-50 rounded-md text-slate-300 hover:text-blue-500 transition-all"
                                          title="Upload File"
                                        >
                                          <Upload className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-1">
                                        <button 
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onTaskClick(sub.id);
                                          }}
                                          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition-all shadow-sm border border-slate-100"
                                          title="View Details"
                                        >
                                          <FileText className="w-3 h-3" />
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onTaskDelete(sub.id);
                                          }}
                                          className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition-all shadow-sm border border-red-100"
                                          title="Delete Sub-activity"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr className="bg-slate-50/10">
                                <td className="p-4 text-slate-300">{wsName}</td>
                                <td className="p-4 text-slate-400">{activity.title}</td>
                                <td colSpan={6} className="p-4 text-slate-400 italic text-[10px]">
                                  No sub-activities yet. Click the "+" button on the activity row to add one.
                                </td>
                              </tr>
                            )
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr className="bg-slate-50/10">
                      <td className="p-4 text-slate-300">{wsName}</td>
                      <td colSpan={7} className="p-4 text-slate-400 italic text-[10px]">
                        No activities yet. Click the "+" button on the workstream row to add one.
                      </td>
                    </tr>
                  )
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {workstreams.length === 0 && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-300" />
          </div>
          <h4 className="text-slate-900 font-bold mb-1">No Workstreams Defined</h4>
          <p className="text-sm text-slate-500">Click "Add Workstream" above to start building your WBS.</p>
        </div>
      )}
    </div>
  </div>
  );
};
