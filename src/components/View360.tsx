import React, { useState } from 'react';
import { Project } from '../types';
import { 
  Package, 
  User, 
  ChevronRight, 
  Zap, 
  Target, 
  Calendar, 
  Activity,
  ArrowUpRight,
  Database,
  Building2,
  Box,
  TrendingUp,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface View360Props {
  projects: Project[];
}

export const View360: React.FC<View360Props> = ({ projects }) => {
  const [activeSegment, setActiveSegment] = useState<'PRODUCT' | 'CLIENT'>('PRODUCT');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const rdProjects = projects.filter(p => p.type === 'RD');
  const deliveryProjects = projects.filter(p => p.type === 'DELIVERY');

  const clientGroups = deliveryProjects.reduce((acc, p) => {
    const client = p.customer || 'Internal / General';
    if (!acc[client]) acc[client] = [];
    acc[client].push(p);
    return acc;
  }, {} as Record<string, Project[]>);

  const toggleClient = (clientName: string) => {
    const next = new Set(expandedClients);
    if (next.has(clientName)) {
      next.delete(clientName);
    } else {
      next.add(clientName);
    }
    setExpandedClients(next);
  };

  return (
    <div className="space-y-6">
      {/* Segment Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveSegment('PRODUCT')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeSegment === 'PRODUCT' 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Box className="w-4 h-4" />
          Products (R&D)
        </button>
        <button
          onClick={() => setActiveSegment('CLIENT')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeSegment === 'CLIENT' 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Building2 className="w-4 h-4" />
          Clients (Delivery)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSegment === 'PRODUCT' ? (
          <motion.div
            key="product-segment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-6"
          >
            {rdProjects.length > 0 ? rdProjects.map(project => (
              <div key={project.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shadow-inner">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors uppercase tracking-tight">{project.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            project.rdCategory === 'HOT' ? "bg-orange-100 text-orange-600" : "bg-cyan-100 text-cyan-600"
                          )}>
                            {project.rdCategory || 'General'} Project
                          </span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[10px] text-slate-500 font-medium">Stage: {project.lifecycle || 'Concept'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={cn(
                         "px-3 py-1 rounded-full text-xs font-bold",
                         project.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" :
                         project.status === 'COMPLETED' ? "bg-blue-100 text-blue-600" :
                         "bg-slate-100 text-slate-600"
                       )}>
                         {project.status}
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Value Proposition
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {project.purpose || "Identifying and building breakthrough technological capabilities for the enterprise market."}
                        </p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          Core Objectives
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {project.objectives || "Design and develop scalable data architecture to support future product lines."}
                        </p>
                     </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        <span>Sponsor</span>
                      </div>
                      <span className="font-bold text-slate-700">{project.sponsor || 'Not Assigned'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Start Date</span>
                      </div>
                      <span className="font-bold text-slate-700">{project.startDate || 'TBD'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Last Update</span>
                      </div>
                      <span className="font-medium text-slate-500">{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-white border border-slate-200 rounded-3xl">
                <Box className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h4 className="text-slate-400 font-medium">No R&D Products Found</h4>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="client-segment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {Object.keys(clientGroups).length > 0 ? (
              Object.entries(clientGroups).map(([clientName, clientProjects]) => {
                const isExpanded = expandedClients.has(clientName);
                const activeCount = clientProjects.filter(p => p.status === 'ACTIVE').length;
                
                return (
                  <div key={clientName} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-blue-200 transition-colors">
                    {/* Customer Header - Drill down trigger */}
                    <button 
                      onClick={() => toggleClient(clientName)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg tracking-tight">{clientName}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              <Box className="w-3 h-3" />
                              {clientProjects.length} {clientProjects.length === 1 ? 'Project' : 'Projects'}
                            </span>
                            {activeCount > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <Activity className="w-2.5 h-2.5" />
                                {activeCount} ACTIVE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Health</p>
                            <div className="flex gap-0.5 mt-1">
                               {[1,2,3,4,5].map(i => (
                                 <div key={i} className={cn("w-3 h-1 rounded-full", i <= 4 ? "bg-emerald-400" : "bg-slate-200")} />
                               ))}
                            </div>
                         </div>
                         <div className={cn(
                           "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                           isExpanded ? "bg-blue-600 text-white rotate-90" : "bg-slate-100 text-slate-400 rotate-0"
                         )}>
                           <ChevronRight className="w-4 h-4" />
                         </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0 border-t border-slate-100">
                            <div className="overflow-x-auto mt-4 rounded-xl border border-slate-100">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Portfolio</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Lead</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Go-Live</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Trend</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {clientProjects.map(project => (
                                    <tr key={project.id} className="hover:bg-slate-50/30 transition-colors group">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-800 text-sm">{project.name}</span>
                                          <ArrowUpRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            {project.projectManager?.charAt(0) || 'U'}
                                          </div>
                                          <span className="text-xs text-slate-600 truncate max-w-[120px]">{project.projectManager || 'Not Assigned'}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                           <Calendar className="w-3.5 h-3.5" />
                                           <span>{project.targetGoLive || 'TBD'}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                          "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                          project.status === 'ACTIVE' ? "bg-blue-100 text-blue-600" :
                                          project.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-600" :
                                          "bg-slate-100 text-slate-600"
                                        )}>
                                          {project.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                         <TrendingUp className="w-4 h-4 text-emerald-500 inline-block" />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl">
                <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h4 className="text-slate-400 font-medium">No Client Accounts Found</h4>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
