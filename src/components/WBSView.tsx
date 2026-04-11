import React, { useState } from 'react';
import { Task, Phase, ProjectFile } from '../types';
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
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface WBSViewProps {
  tasks: Task[];
  projectFiles: ProjectFile[];
  onTaskUpdate: (taskId: string, updates: any) => void;
  onAddTask: (projectId: string, status: string, parentId?: string, phase?: string, workstream?: string) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
  onFileUpload: (taskId: string) => void;
  projectId: string;
}

export const WBSView: React.FC<WBSViewProps> = ({ 
  tasks, 
  projectFiles,
  onTaskUpdate, 
  onAddTask,
  onTaskDelete,
  onTaskClick,
  onFileUpload,
  projectId
}) => {
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<Record<string, boolean>>({});
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});

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

  // Get activities for a workstream
  const getActivities = (wsName: string) => {
    return tasks.filter(t => (t.workstream || 'General') === wsName && !t.parentId);
  };

  const workstreams = Array.from(new Set(tasks.map(t => t.workstream || 'General'))).sort((a, b) => {
    if (a === 'General') return -1;
    if (b === 'General') return 1;
    return a.localeCompare(b);
  });

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

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-48">Workstream</th>
            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-48">Activity</th>
            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-48">Sub-activity</th>
            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Owner</th>
            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Deadline</th>
            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comments</th>
            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Files</th>
            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {workstreams.map(wsName => {
            const activities = getActivities(wsName);
            const isExpanded = expandedWorkstreams[wsName];

            return (
              <React.Fragment key={wsName}>
                {/* Workstream Row */}
                <tr className="bg-slate-50/50 group hover:bg-slate-100/50 transition-colors">
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
                      <div className="w-1.5 h-4 rounded-full bg-slate-400" />
                      <span className="font-bold text-slate-900">{wsName}</span>
                    </div>
                  </td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!projectId) return;
                        onAddTask(projectId, 'TODO', undefined, '', wsName);
                        expandWorkstream(wsName);
                      }}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition-all shadow-sm border border-blue-100"
                      title="Add Activity"
                    >
                      <Plus className="w-4 h-4" />
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

                      return (
                        <React.Fragment key={activity.id}>
                          <tr className="group hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-slate-400 font-medium">
                              <input 
                                type="text"
                                value={activity.workstream || 'General'}
                                onChange={(e) => onTaskUpdate(activity.id, { workstream: e.target.value })}
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-400"
                              />
                            </td>
                            <td className="p-4 cursor-pointer" onClick={() => toggleActivity(activity.id)}>
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
                                <input 
                                  type="text"
                                  value={activity.title}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => onTaskUpdate(activity.id, { title: e.target.value })}
                                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-semibold text-slate-700"
                                />
                              </div>
                            </td>
                            <td className="p-4"></td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                  {activity.owner.charAt(0)}
                                </div>
                                <input 
                                  type="text"
                                  value={activity.owner}
                                  onChange={(e) => onTaskUpdate(activity.id, { owner: e.target.value })}
                                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600"
                                />
                              </div>
                            </td>
                            <td className="p-4">
                              <input 
                                type="date"
                                value={activity.endDate || ''}
                                onChange={(e) => onTaskUpdate(activity.id, { endDate: e.target.value })}
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600"
                              />
                            </td>
                            <td className="p-4">
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
                            <td className="p-4">
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
                                return (
                                  <tr key={sub.id} className="bg-slate-50/30 group hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-300">{wsName}</td>
                                    <td className="p-4 text-slate-400">{activity.title}</td>
                                    <td className="p-4">
                                      <input 
                                        type="text"
                                        value={sub.title}
                                        onChange={(e) => onTaskUpdate(sub.id, { title: e.target.value })}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600"
                                      />
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-500">
                                          {sub.owner.charAt(0)}
                                        </div>
                                        <input 
                                          type="text"
                                          value={sub.owner}
                                          onChange={(e) => onTaskUpdate(sub.id, { owner: e.target.value })}
                                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500"
                                        />
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <input 
                                        type="date"
                                        value={sub.endDate || ''}
                                        onChange={(e) => onTaskUpdate(sub.id, { endDate: e.target.value })}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500"
                                      />
                                    </td>
                                    <td className="p-4">
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
                                    <td className="p-4">
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
  );
};
