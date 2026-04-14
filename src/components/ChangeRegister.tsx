import React, { useState } from 'react';
import { ChangeRequest, Resource } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  User,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ChangeRegisterProps {
  requests: ChangeRequest[];
  resources: Resource[];
  onAdd: (request: Partial<ChangeRequest>) => void;
  onUpdate: (id: string, updates: Partial<ChangeRequest>) => void;
  onDelete: (id: string) => void;
}

export const ChangeRegister: React.FC<ChangeRegisterProps> = ({ 
  requests, 
  resources, 
  onAdd, 
  onUpdate, 
  onDelete 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ChangeRequest | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ChangeRequest['status'] | 'ALL'>('ALL');

  const filteredRequests = filterStatus === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      overview: formData.get('overview') as string,
      objective: formData.get('objective') as string,
      acceptanceCriteria: formData.get('acceptanceCriteria') as string,
      status: formData.get('status') as ChangeRequest['status'],
      priority: formData.get('priority') as ChangeRequest['priority'],
      requestedBy: formData.get('requestedBy') as string,
      requestedDate: formData.get('requestedDate') as string,
    };

    if (editingRequest) {
      onUpdate(editingRequest.id, data);
    } else {
      onAdd(data);
    }
    setShowModal(false);
    setEditingRequest(null);
  };

  const getStatusColor = (status: ChangeRequest['status']) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-100';
      case 'IMPLEMENTED': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const getPriorityColor = (priority: ChangeRequest['priority']) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600';
      case 'MEDIUM': return 'text-amber-600';
      default: return 'text-emerald-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Change Register</h3>
          <p className="text-sm text-slate-500">Track and manage all project change requests.</p>
        </div>
        <button 
          onClick={() => {
            setEditingRequest(null);
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['ALL', 'PENDING', 'APPROVED', 'IMPLEMENTED', 'REJECTED'].map((status) => (
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
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title & Overview</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRequests.length > 0 ? filteredRequests.map((request) => (
              <React.Fragment key={request.id}>
                <tr className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                        className="mt-1 p-1 hover:bg-slate-100 rounded transition-colors"
                      >
                        {expandedId === request.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{request.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-md">{request.overview}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                      getStatusColor(request.status)
                    )}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("text-xs font-bold", getPriorityColor(request.priority))}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{request.requestedBy}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{request.requestedDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingRequest(request);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(request.id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === request.id && (
                  <tr className="bg-slate-50/30">
                    <td colSpan={6} className="px-6 py-6 border-t border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Overview</h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-100">
                              {request.overview}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Objective</h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-100">
                              {request.objective}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Acceptance Criteria</h4>
                          <div className="bg-white p-4 rounded-xl border border-slate-100 h-full">
                            <ul className="space-y-2">
                              {request.acceptanceCriteria.split('\n').map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No change requests found.</p>
                  <button 
                    onClick={() => setShowModal(true)}
                    className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    Add your first request
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {editingRequest ? 'Edit Change Request' : 'New Change Request'}
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
                    defaultValue={editingRequest?.title}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Brief title for the change"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select
                    name="status"
                    defaultValue={editingRequest?.status || 'PENDING'}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="IMPLEMENTED">Implemented</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Priority</label>
                  <select
                    name="priority"
                    defaultValue={editingRequest?.priority || 'MEDIUM'}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Requested By</label>
                  <select
                    name="requestedBy"
                    defaultValue={editingRequest?.requestedBy}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select Resource...</option>
                    {resources.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                  <input
                    name="requestedDate"
                    type="date"
                    defaultValue={editingRequest?.requestedDate || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Overview</label>
                  <textarea
                    name="overview"
                    defaultValue={editingRequest?.overview}
                    required
                    rows={3}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    placeholder="What is this change about?"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Objective</label>
                  <textarea
                    name="objective"
                    defaultValue={editingRequest?.objective}
                    required
                    rows={3}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    placeholder="What is the goal of this change?"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Acceptance Criteria</label>
                  <textarea
                    name="acceptanceCriteria"
                    defaultValue={editingRequest?.acceptanceCriteria}
                    required
                    rows={4}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    placeholder="Enter criteria (one per line)..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  {editingRequest ? 'Update Request' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
