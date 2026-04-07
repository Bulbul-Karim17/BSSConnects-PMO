import React from 'react';
import { Project } from '../types';
import { Calendar, Users, ArrowRight, Briefcase, Zap, Flame, Snowflake } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const isRD = project.type === 'RD';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
            isRD ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
          )}>
            {isRD ? "R&D" : "Delivery"}
          </div>
          {isRD && project.rdCategory && (
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1",
              project.rdCategory === 'HOT' ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-600"
            )}>
              {project.rdCategory === 'HOT' ? <Flame className="w-2.5 h-2.5" /> : <Snowflake className="w-2.5 h-2.5" />}
              {project.rdCategory}
            </div>
          )}
        </div>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          project.status === 'ACTIVE' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
        )} />
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors truncate">
        {project.name}
      </h3>
      <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">
        {project.description}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>{project.startDate || 'No start date'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Briefcase className="w-3 h-3" />
          <span>{project.client || 'Internal'}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {isRD ? (
            <div className="flex items-center gap-1 text-[10px] font-medium text-purple-600">
              <Zap className="w-3 h-3" />
              <span>{project.lifecycle}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-medium text-blue-600">
              <ArrowRight className="w-3 h-3" />
              <span>Waterfall</span>
            </div>
          )}
        </div>
        <div className="text-[10px] font-medium text-slate-400 group-hover:text-blue-500 flex items-center gap-1">
          View <ArrowRight className="w-2.5 h-2.5" />
        </div>
      </div>
    </motion.div>
  );
};
