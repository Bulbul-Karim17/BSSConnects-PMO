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
  rdCategory?: 'COLD' | 'HOT'; // Only for RD
  client?: string;
  startDate?: string;
  targetGoLive?: string;
  ownerId: string;
  meetingAttendance?: string;
  meetingDate?: string;
  meetingOwner?: string;
  meetingSummary?: string;
  requirementData?: string;
  scopeOfWork?: string;
  useCases?: string;
  // Project Charter Fields
  customer?: string;
  projectManager?: string;
  sponsor?: string;
  purpose?: string;
  objectives?: string;
  inScope?: string;
  outScope?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalDate?: string;
  approverName?: string;
}

export interface TaskComment {
  id: string;
  text: string;
  author: string;
  date: number;
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
  raidDependencyIds?: string[]; // IDs of RAID log dependencies
  phase?: string; // For Waterfall
  objective?: string;
  acceptanceCriteria?: string;
  sprintId?: string; // For Agile
  parentId?: string; // For WBS hierarchy (3 layers)
  comments?: string;
  commentsList?: TaskComment[];
  momDetails?: string; // Minutes of Meeting details
  createdAt?: number;
  updatedAt?: number;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  goal?: string;
  retrospectiveId?: string;
}

export interface Retrospective {
  id: string;
  projectId: string;
  sprintId: string;
  startDoing: string[];
  stopDoing: string[];
  keepDoing: string[];
  summaryAction: string;
  createdAt: number;
  updatedAt: number;
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

export interface IssueLogItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  owner: string;
  reportedBy: string;
  reportedDate: string;
  resolution?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  phase: string;
  targetDate: string;
  status: 'PLANNED' | 'ACHIEVED' | 'DELAYED';
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  order: number;
  color?: string;
}

export interface DesignDoc {
  id: string; // 'hld' or 'lld'
  projectId: string;
  content: string;
  updatedAt: number;
  updatedBy: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  docId: string; // 'hld' or 'lld'
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: number;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  skills: string[];
  availability: number; // 0-100%
  projectIds: string[]; // Linked projects
  ownerId: string; // The user who created this resource
  createdAt: number;
  updatedAt: number;
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  title: string;
  overview: string;
  objective: string;
  acceptanceCriteria: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  requestedBy: string;
  requestedDate: string;
  createdAt: number;
  updatedAt: number;
}
