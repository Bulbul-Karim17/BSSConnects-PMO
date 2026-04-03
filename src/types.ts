export type ProjectType = 'RD' | 'DELIVERY';

export type RDPhase = 'IDEA' | 'POC' | 'MVP' | 'DELIVERY';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  createdAt: number;
  updatedAt: number;
  lifecycle?: RDPhase; // Only for RD
  client?: string;
  startDate?: string;
  targetGoLive?: string;
  ownerId: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  workstream: string;
  owner: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  dependencies?: string[]; // IDs of other tasks
  phase?: string; // For Waterfall
  objective?: string;
  acceptanceCriteria?: string;
}

export interface RAIDItem {
  id: string;
  projectId: string;
  type: 'RISK' | 'ASSUMPTION' | 'DEPENDENCY' | 'ISSUE';
  category: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  probability?: 'LOW' | 'MEDIUM' | 'HIGH';
  owner: string;
  status: 'OPEN' | 'CLOSED' | 'MITIGATED';
  mitigation: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  phase: string;
  targetDate: string;
  status: 'PLANNED' | 'ACHIEVED' | 'DELAYED';
}
