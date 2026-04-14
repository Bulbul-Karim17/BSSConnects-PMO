import React, { useState } from 'react';
import { RAIDItem, Resource, Task } from '../types';
import { 
  AlertTriangle, 
  HelpCircle, 
  Link2, 
  AlertCircle, 
  CheckCircle2, 
  MoreVertical, 
  User, 
  ShieldAlert,
  Edit2,
  Trash2,
  Filter,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';

interface RAIDLogProps {
  items: RAIDItem[];
  tasks: Task[];
  resources: Resource[];
  onUpdate?: (id: string, updates: Partial<RAIDItem>) => void;
  onDelete?: (id: string) => void;
  onAdd?: (type: RAIDItem['type']) => void;
  hideTabs?: boolean;
}

const TYPE_CONFIG = {
  RISK: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', border: 'border-amber-100', label: 'Risks' },
  ASSUMPTION: { icon: HelpCircle, color: 'text-blue-600 bg-blue-50', border: 'border-blue-100', label: 'Assumptions' },
  DEPENDENCY: { icon: Link2, color: 'text-purple-600 bg-purple-50', border: 'border-purple-100', label: 'Dependencies' },
  ISSUE: { icon: AlertCircle, color: 'text-red-600 bg-red-50', border: 'border-red-100', label: 'Issues' },
};

export const RAIDLog: React.FC<RAIDLogProps> = ({ items, tasks, resources, onUpdate, onDelete, onAdd, hideTabs }) => {
  const [activeType, setActiveType] = useState<RAIDItem['type'] | 'ALL'>('ALL');

  const filteredItems = activeType === 'ALL' 
    ? items 
    : items.filter(item => item.type === activeType);

  const stats = {
    ALL: items.length,
    RISK: items.filter(i => i.type === 'RISK').length,
    ASSUMPTION: items.filter(i => i.type === 'ASSUMPTION').length,
    DEPENDENCY: items.filter(i => i.type === 'DEPENDENCY').length,
    ISSUE: items.filter(i => i.type === 'ISSUE').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">RAID Log</h3>
          <p className="text-xs text-slate-500">Risks, Assumptions, Dependencies, and Issues management.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onAdd?.(activeType === 'ALL' ? 'RISK' : activeType)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add RAID Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!hideTabs && (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveType('ALL')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeType === 'ALL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            All Items
            <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-[10px]">{stats.ALL}</span>
          </button>
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setActiveType(type as RAIDItem['type'])}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                activeType === type ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <config.icon className={cn("w-3.5 h-3.5", config.color.split(' ')[0])} />
              {config.label}
              <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-[10px]">{stats[type as keyof typeof stats]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Professional Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type / Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description & Mitigation</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked Tasks</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Impact</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner / Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length > 0 ? filteredItems.map((item) => {
                const config = TYPE_CONFIG[item.type];
                const Icon = config.icon;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={item.type}
                          onChange={(e) => onUpdate?.(item.id, { type: e.target.value as RAIDItem['type'] })}
                          className={cn(
                            "flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border-none focus:ring-0 cursor-pointer",
                            config.color
                          )}
                        >
                          {Object.keys(TYPE_CONFIG).map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => onUpdate?.(item.id, { category: e.target.value })}
                          className="text-[10px] text-slate-400 font-medium px-2 uppercase tracking-wide bg-transparent border-none focus:ring-0 p-0 focus:bg-slate-50 rounded"
                          placeholder="Category"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="space-y-2">
                        <textarea
                          value={item.description}
                          onChange={(e) => onUpdate?.(item.id, { description: e.target.value })}
                          className="w-full text-sm font-semibold text-slate-900 bg-transparent border-none focus:ring-0 resize-none p-0 focus:bg-slate-50 rounded transition-all"
                          rows={2}
                          placeholder="Description"
                        />
                        <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <textarea
                            value={item.mitigation}
                            onChange={(e) => onUpdate?.(item.id, { mitigation: e.target.value })}
                            className="w-full text-[10px] text-slate-500 leading-relaxed italic bg-transparent border-none focus:ring-0 resize-none p-0"
                            rows={2}
                            placeholder="Mitigation / Action"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {tasks.filter(t => t.raidDependencyIds?.includes(item.id)).map(t => (
                          <div key={t.id} className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[100px]">{t.title}</span>
                          </div>
                        ))}
                        {tasks.filter(t => t.raidDependencyIds?.includes(item.id)).length === 0 && (
                          <span className="text-[10px] text-slate-300 italic">No links</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={item.impact}
                        onChange={(e) => onUpdate?.(item.id, { impact: e.target.value as RAIDItem['impact'] })}
                        className={cn(
                          "flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none focus:ring-0 cursor-pointer",
                          item.impact === 'HIGH' ? "bg-red-100 text-red-700" :
                          item.impact === 'MEDIUM' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}
                      >
                        <option value="LOW">LOW Impact</option>
                        <option value="MEDIUM">MEDIUM Impact</option>
                        <option value="HIGH">HIGH Impact</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold">
                            {item.owner.charAt(0)}
                          </div>
                          <select
                            value={item.owner}
                            onChange={(e) => onUpdate?.(item.id, { owner: e.target.value })}
                            className="bg-transparent border-none focus:ring-0 p-0 text-xs font-medium text-slate-600 w-24 focus:bg-slate-50 rounded cursor-pointer appearance-none"
                          >
                            <option value="Unassigned">Unassigned</option>
                            {resources.map(resource => (
                              <option key={resource.id} value={resource.name}>
                                {resource.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <select
                          value={item.status}
                          onChange={(e) => onUpdate?.(item.id, { status: e.target.value as RAIDItem['status'] })}
                          className={cn(
                            "flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md transition-all border-none focus:ring-0 cursor-pointer",
                            item.status === 'OPEN' ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : 
                            item.status === 'CLOSED' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" :
                            "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          )}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="CLOSED">CLOSED</option>
                          <option value="MITIGATED">MITIGATED</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete?.(item.id)}
                          className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Filter className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-slate-500">No {activeType !== 'ALL' ? activeType.toLowerCase() + 's' : 'items'} found in this RAID log.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
