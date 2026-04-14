import React, { useState } from 'react';
import { IssueLogItem, Resource } from '../types';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  User,
  Calendar,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';

interface IssueLogProps {
  items: IssueLogItem[];
  resources: Resource[];
  onAdd: (item: Partial<IssueLogItem>) => void;
  onUpdate: (id: string, updates: Partial<IssueLogItem>) => void;
  onDelete: (id: string) => void;
}

export const IssueLog: React.FC<IssueLogProps> = ({ items, resources, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<IssueLogItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<IssueLogItem['status'] | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item => {
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as IssueLogItem['priority'],
      status: formData.get('status') as IssueLogItem['status'],
      owner: formData.get('owner') as string,
      reportedBy: formData.get('reportedBy') as string,
      reportedDate: formData.get('reportedDate') as string,
      resolution: formData.get('resolution') as string,
    };

    if (editingItem) {
      onUpdate(editingItem.id, data);
    } else {
      onAdd(data);
    }
    setShowModal(false);
    setEditingItem(null);
  };

  const getPriorityColor = (priority: IssueLogItem['priority']) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = (status: IssueLogItem['status']) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'RESOLVED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'CLOSED': return <XCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Issue Tracker</h3>
          <p className="text-xs text-slate-500">Manage and track issues arising during the project execution.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/5 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border",
                filterStatus === status 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue Details</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredItems.length > 0 ? filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 max-w-md">{item.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        By {item.reportedBy}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.reportedDate}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-xs font-bold text-slate-700">
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    getPriorityColor(item.priority)
                  )}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {item.owner.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-600">{item.owner}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingItem(item);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-slate-500">No issues found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Issue' : 'Report New Issue'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                  <input
                    name="title"
                    defaultValue={editingItem?.title}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all"
                    placeholder="Brief summary of the issue"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select
                    name="status"
                    defaultValue={editingItem?.status || 'OPEN'}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all cursor-pointer"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Priority</label>
                  <select
                    name="priority"
                    defaultValue={editingItem?.priority || 'MEDIUM'}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Owner</label>
                  <select
                    name="owner"
                    defaultValue={editingItem?.owner}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select Owner...</option>
                    {resources.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reported By</label>
                  <input
                    name="reportedBy"
                    defaultValue={editingItem?.reportedBy}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reported Date</label>
                  <input
                    name="reportedDate"
                    type="date"
                    defaultValue={editingItem?.reportedDate || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingItem?.description}
                    required
                    rows={3}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all resize-none"
                    placeholder="Describe the issue in detail..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Resolution (Optional)</label>
                  <textarea
                    name="resolution"
                    defaultValue={editingItem?.resolution}
                    rows={2}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all resize-none"
                    placeholder="How was this issue resolved?"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  {editingItem ? 'Update Issue' : 'Report Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
