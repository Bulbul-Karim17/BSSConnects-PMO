import React, { useState } from 'react';
import { Project } from '../types';
import { 
  FileText, 
  User, 
  Users, 
  Target, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Save,
  Shield,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ProjectCharterProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  isSaving?: boolean;
}

export const ProjectCharter: React.FC<ProjectCharterProps> = ({ project, onUpdate, isSaving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({});

  const startEditing = () => {
    setFormData({
      customer: project.customer || '',
      projectManager: project.projectManager || '',
      sponsor: project.sponsor || '',
      purpose: project.purpose || '',
      objectives: project.objectives || '',
      inScope: project.inScope || '',
      outScope: project.outScope || '',
      approvalStatus: project.approvalStatus || 'PENDING',
      approvalDate: project.approvalDate || '',
      approverName: project.approverName || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Project Charter</h3>
          <p className="text-sm text-slate-500">The formal document that defines the project's identity and scope.</p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Charter
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <FileText className="w-4 h-4" />
              Edit Charter
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Identity & Stakeholders */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Project Identity
            </h4>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Project Name & ID</label>
                <p className="text-sm font-bold text-slate-900">{project.name}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {project.id}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Customer / Client</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => handleChange('customer', e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter customer name"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{project.customer || 'Not defined'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Project Manager</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.projectManager}
                    onChange={(e) => handleChange('projectManager', e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter PM name"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{project.projectManager || 'Not assigned'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Project Sponsor</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.sponsor}
                    onChange={(e) => handleChange('sponsor', e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter sponsor name"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{project.sponsor || 'Not assigned'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              Approval Status
            </h4>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Status</label>
                {isEditing ? (
                  <select
                    value={formData.approvalStatus}
                    onChange={(e) => handleChange('approvalStatus', e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="PENDING">Pending Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                ) : (
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border",
                    getStatusColor(project.approvalStatus)
                  )}>
                    {getStatusIcon(project.approvalStatus)}
                    {project.approvalStatus || 'PENDING'}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Approver Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.approverName}
                    onChange={(e) => handleChange('approverName', e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Who approved this?"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700">{project.approverName || '—'}</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Approval Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.approvalDate}
                    onChange={(e) => handleChange('approvalDate', e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700">{project.approvalDate || '—'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Purpose, Objectives, Scope */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Info className="w-3 h-3 text-blue-500" />
                  Project Purpose
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-4 transition-all min-h-[100px] leading-relaxed"
                    placeholder="Why are we doing this project? What is the business case?"
                  />
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-50 italic">
                    {project.purpose || 'No purpose defined yet.'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Target className="w-3 h-3 text-blue-500" />
                  Project Objectives
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.objectives}
                    onChange={(e) => handleChange('objectives', e.target.value)}
                    className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-4 transition-all min-h-[120px] leading-relaxed"
                    placeholder="What are the key measurable goals of this project?"
                  />
                ) : (
                  <div className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-50 whitespace-pre-wrap">
                    {project.objectives || 'No objectives defined yet.'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-3 h-3" />
                    In-Scope
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.inScope}
                      onChange={(e) => handleChange('inScope', e.target.value)}
                      className="w-full text-sm text-slate-600 bg-emerald-50/30 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 p-4 transition-all min-h-[150px] leading-relaxed"
                      placeholder="What is included in the project?"
                    />
                  ) : (
                    <div className="text-sm text-slate-600 leading-relaxed bg-emerald-50/20 p-4 rounded-2xl border border-emerald-50 whitespace-pre-wrap min-h-[150px]">
                      {project.inScope || 'In-scope items not defined.'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <XCircle className="w-3 h-3" />
                    Out-of-Scope
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.outScope}
                      onChange={(e) => handleChange('outScope', e.target.value)}
                      className="w-full text-sm text-slate-600 bg-red-50/30 border border-red-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 p-4 transition-all min-h-[150px] leading-relaxed"
                      placeholder="What is explicitly excluded from the project?"
                    />
                  ) : (
                    <div className="text-sm text-slate-600 leading-relaxed bg-red-50/20 p-4 rounded-2xl border border-red-50 whitespace-pre-wrap min-h-[150px]">
                      {project.outScope || 'Out-of-scope items not defined.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
