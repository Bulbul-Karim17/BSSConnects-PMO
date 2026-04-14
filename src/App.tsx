import React, { useState, useEffect } from 'react';
import { Project, Task, RAIDItem, Milestone, RDPhase, Phase, DesignDoc, ProjectFile, Sprint, Resource, ChangeRequest, IssueLogItem } from './types';
import { ProjectCard } from './components/ProjectCard';
import { FileUpload } from './components/FileUpload';
import { AgileBoard } from './components/AgileBoard';
import { WBSView } from './components/WBSView';
import { WaterfallView } from './components/WaterfallView';
import { RAIDLog } from './components/RAIDLog';
import { IssueLog } from './components/IssueLog';
import { ChangeRegister } from './components/ChangeRegister';
import { Roadmap } from './components/Roadmap';
import { DataStory } from './components/DataStory';
import { ProjectCharter } from './components/ProjectCharter';
import { TaskModal } from './components/TaskModal';
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  Bell, 
  User, 
  Users,
  ChevronRight, 
  ArrowLeft,
  Zap,
  Briefcase,
  RefreshCw,
  Layers,
  BarChart3,
  ShieldAlert,
  Calendar,
  Share2,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Upload,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Paperclip,
  File,
  BookOpen,
  Target,
  ListChecks,
  ChevronDown,
  Layout,
  Flame,
  Snowflake
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import { initializeApp } from 'firebase/app';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, doc, setDoc, updateDoc, deleteDoc, getDocFromServer, writeBatch, deleteField } from 'firebase/firestore';
import { auth, db } from './firebase';
import { OperationType, handleFirestoreError } from './lib/firestore-errors';

// Mock Data for Initial View (fallback)
const MOCK_PROJECTS: Project[] = [];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [mainView, setMainView] = useState<'DASHBOARD' | 'PROJECTS' | 'CALENDAR' | 'REPORTS' | 'RESOURCES'>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHARTER' | 'BACKLOG' | 'TASKS' | 'RAID' | 'ROADMAP' | 'WBS' | 'ACTIVITY' | 'DATA_STORY' | 'LIBRARY' | 'ISSUE_TRACKER' | 'CHANGES'>('OVERVIEW');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTypeForCreation, setSelectedTypeForCreation] = useState<'RD' | 'DELIVERY' | null>(null);
  const [selectedRDCategory, setSelectedRDCategory] = useState<'COLD' | 'HOT' | null>(null);
  const [selectingRDPhase, setSelectingRDPhase] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<'RD' | 'DELIVERY' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Phase & Milestone Management
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [targetPhaseNameForMilestone, setTargetPhaseNameForMilestone] = useState<string | null>(null);

  // WBS File Upload
  const [showWBSFileUpload, setShowWBSFileUpload] = useState(false);
  const [targetTaskIdForFile, setTargetTaskIdForFile] = useState<string | null>(null);
  const [showWorkstreamModal, setShowWorkstreamModal] = useState(false);
  const [newWorkstreamName, setNewWorkstreamName] = useState('');

  // Sprint Management
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  // Generic Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Project data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [raidItems, setRaidItems] = useState<RAIDItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [designDocs, setDesignDocs] = useState<DesignDoc[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [issueLogItems, setIssueLogItems] = useState<IssueLogItem[]>([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    if (isAuthReady) testConnection();
  }, [isAuthReady]);

  // Projects Listener
  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    const q = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => doc.data() as Project);
      setProjects(projectsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'projects');
    });

    return () => unsubscribe();
  }, [user]);

  // Resources Listener
  useEffect(() => {
    if (!user) {
      setResources([]);
      return;
    }

    const q = query(collection(db, 'resources'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResources(snapshot.docs.map(doc => doc.data() as Resource));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'resources'));

    return () => unsubscribe();
  }, [user]);

  // Selected Project Data Listener
  useEffect(() => {
    setActiveTab('OVERVIEW');
    if (!selectedProjectId || !user) {
      setTasks([]);
      setRaidItems([]);
      setMilestones([]);
      setPhases([]);
      setDesignDocs([]);
      setProjectFiles([]);
      setChangeRequests([]);
      setIssueLogItems([]);
      return;
    }

    const tasksUnsubscribe = onSnapshot(collection(db, 'projects', selectedProjectId, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => doc.data() as Task));
    }, (error) => handleFirestoreError(error, OperationType.GET, `projects/${selectedProjectId}/tasks`));

    const raidUnsubscribe = onSnapshot(collection(db, 'projects', selectedProjectId, 'raidItems'), (snapshot) => {
      setRaidItems(snapshot.docs.map(doc => doc.data() as RAIDItem));
    }, (error) => handleFirestoreError(error, OperationType.GET, `projects/${selectedProjectId}/raidItems`));

    const milestonesUnsubscribe = onSnapshot(collection(db, 'projects', selectedProjectId, 'milestones'), (snapshot) => {
      setMilestones(snapshot.docs.map(doc => doc.data() as Milestone));
    }, (error) => handleFirestoreError(error, OperationType.GET, `projects/${selectedProjectId}/milestones`));

    const phasesUnsubscribe = onSnapshot(collection(db, 'projects', selectedProjectId, 'phases'), (snapshot) => {
      setPhases(snapshot.docs.map(doc => doc.data() as Phase).sort((a, b) => a.order - b.order));
    }, (error) => handleFirestoreError(error, OperationType.GET, `projects/${selectedProjectId}/phases`));

    const sprintsUnsubscribe = onSnapshot(collection(db, 'projects', selectedProjectId, 'sprints'), (snapshot) => {
      setSprints(snapshot.docs.map(doc => doc.data() as Sprint).sort((a, b) => a.startDate.localeCompare(b.startDate)));
    }, (error) => handleFirestoreError(error, OperationType.GET, `projects/${selectedProjectId}/sprints`));

    const designDocsUnsubscribe = onSnapshot(collection(db, 'projects', selectedProjectId, 'designDocs'), (snapshot) => {
      setDesignDocs(snapshot.docs.map(doc => doc.data() as DesignDoc));
    }, (error) => handleFirestoreError(error, OperationType.GET, `projects/${selectedProjectId}/designDocs`));

    const filesUnsubscribe = onSnapshot(collection(db, 'projects', selectedProjectId, 'files'), (snapshot) => {
      setProjectFiles(snapshot.docs.map(doc => doc.data() as ProjectFile));
    }, (error) => handleFirestoreError(error, OperationType.GET, `projects/${selectedProjectId}/files`));

    const changesUnsubscribe = onSnapshot(collection(db, 'projects', selectedProjectId, 'changeRequests'), (snapshot) => {
      setChangeRequests(snapshot.docs.map(doc => doc.data() as ChangeRequest).sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => handleFirestoreError(error, OperationType.GET, `projects/${selectedProjectId}/changeRequests`));

    const issuesUnsubscribe = onSnapshot(collection(db, 'projects', selectedProjectId, 'issueLogItems'), (snapshot) => {
      setIssueLogItems(snapshot.docs.map(doc => doc.data() as IssueLogItem).sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => handleFirestoreError(error, OperationType.GET, `projects/${selectedProjectId}/issueLogItems`));

    return () => {
      tasksUnsubscribe();
      raidUnsubscribe();
      milestonesUnsubscribe();
      phasesUnsubscribe();
      sprintsUnsubscribe();
      designDocsUnsubscribe();
      filesUnsubscribe();
      changesUnsubscribe();
      issuesUnsubscribe();
    };
  }, [selectedProjectId, user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleUpdateProjectName = async () => {
    if (!selectedProjectId || !editingNameValue.trim()) return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'projects', selectedProjectId), {
        name: editingNameValue.trim(),
        updatedAt: Date.now()
      });
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating project name:", error);
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProjectId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      
      // Delete subcollections
      tasks.forEach(t => batch.delete(doc(db, 'projects', selectedProjectId, 'tasks', t.id)));
      raidItems.forEach(r => batch.delete(doc(db, 'projects', selectedProjectId, 'raidItems', r.id)));
      milestones.forEach(m => batch.delete(doc(db, 'projects', selectedProjectId, 'milestones', m.id)));
      
      // Delete project doc
      batch.delete(doc(db, 'projects', selectedProjectId));
      
      await batch.commit();
      setSelectedProjectId(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting project:", error);
      handleFirestoreError(error, OperationType.DELETE, `projects/${selectedProjectId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProjectDetails = async (details: Partial<Project>) => {
    if (!selectedProjectId || !user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'projects', selectedProjectId), {
        ...details,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error updating project details:", error);
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProjectId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResourceSave = async (resourceData: Partial<Resource>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      if (editingResource) {
        await updateDoc(doc(db, 'resources', editingResource.id), {
          ...resourceData,
          updatedAt: Date.now()
        });
      } else {
        const resourceId = Math.random().toString(36).substr(2, 9);
        const newResource: Resource = {
          id: resourceId,
          name: resourceData.name || 'New Resource',
          role: resourceData.role || 'Team Member',
          email: resourceData.email || '',
          department: resourceData.department || '',
          skills: resourceData.skills || [],
          availability: resourceData.availability || 100,
          projectIds: resourceData.projectIds || [],
          ownerId: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await setDoc(doc(db, 'resources', resourceId), newResource);
      }
      setShowResourceModal(false);
      setEditingResource(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'resources');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResourceDelete = async (resourceId: string) => {
    if (!user) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Resource?',
      message: 'Are you sure you want to delete this resource? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'resources', resourceId));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `resources/${resourceId}`);
        }
      }
    });
  };

  // Change Request Handlers
  const handleAddChangeRequest = async (data: Partial<ChangeRequest>) => {
    if (!selectedProjectId || !user) return;
    setIsSaving(true);
    try {
      const requestId = Math.random().toString(36).substr(2, 9);
      const newRequest: ChangeRequest = {
        id: requestId,
        projectId: selectedProjectId,
        title: data.title || '',
        overview: data.overview || '',
        objective: data.objective || '',
        acceptanceCriteria: data.acceptanceCriteria || '',
        status: data.status || 'PENDING',
        priority: data.priority || 'MEDIUM',
        requestedBy: data.requestedBy || '',
        requestedDate: data.requestedDate || new Date().toISOString().split('T')[0],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'projects', selectedProjectId, 'changeRequests', requestId), newRequest);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/changeRequests`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateChangeRequest = async (id: string, updates: Partial<ChangeRequest>) => {
    if (!selectedProjectId) return;
    try {
      await updateDoc(doc(db, 'projects', selectedProjectId, 'changeRequests', id), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProjectId}/changeRequests/${id}`);
    }
  };

  const handleDeleteChangeRequest = (id: string) => {
    const request = changeRequests.find(r => r.id === id);
    if (!request) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Change Request?',
      message: `Are you sure you want to delete "${request.title}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Request',
      onConfirm: async () => {
        if (!selectedProjectId) return;
        try {
          await deleteDoc(doc(db, 'projects', selectedProjectId, 'changeRequests', id));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `projects/${selectedProjectId}/changeRequests/${id}`);
        }
      }
    });
  };

  // Issue Log Handlers
  const handleAddIssueLogItem = async (data: Partial<IssueLogItem>) => {
    if (!selectedProjectId || !user) return;
    setIsSaving(true);
    try {
      const itemId = Math.random().toString(36).substr(2, 9);
      const newItem: IssueLogItem = {
        id: itemId,
        projectId: selectedProjectId,
        title: data.title || '',
        description: data.description || '',
        priority: data.priority || 'MEDIUM',
        status: data.status || 'OPEN',
        owner: data.owner || 'Unassigned',
        reportedBy: data.reportedBy || user.displayName || 'Unknown',
        reportedDate: data.reportedDate || new Date().toISOString().split('T')[0],
        resolution: data.resolution || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'projects', selectedProjectId, 'issueLogItems', itemId), newItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/issueLogItems`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateIssueLogItem = async (id: string, updates: Partial<IssueLogItem>) => {
    if (!selectedProjectId) return;
    try {
      await updateDoc(doc(db, 'projects', selectedProjectId, 'issueLogItems', id), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/issueLogItems/${id}`);
    }
  };

  const handleDeleteIssueLogItem = (id: string) => {
    const item = issueLogItems.find(i => i.id === id);
    if (!item) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Issue?',
      message: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Issue',
      onConfirm: async () => {
        if (!selectedProjectId) return;
        try {
          await deleteDoc(doc(db, 'projects', selectedProjectId, 'issueLogItems', id));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `projects/${selectedProjectId}/issueLogItems/${id}`);
        }
      }
    });
  };

  const handleFileAnalyzed = async (data: any, existingProjectId?: string) => {
    if (!user) return;
    setIsSaving(true);

    const projectId = existingProjectId || Math.random().toString(36).substr(2, 9);
    const projectType = existingProjectId ? (projects.find(p => p.id === existingProjectId)?.type || 'RD') : (selectedTypeForCreation || data.project?.type || 'RD');
    
    const projectDoc: Partial<Project> = {
      updatedAt: Date.now(),
      ...(existingProjectId ? {} : {
        name: newProjectName || data.project?.name || 'New Project',
        description: data.project?.description || '',
        type: projectType,
        client: data.project?.client || '',
        startDate: data.project?.startDate || new Date().toISOString().split('T')[0],
        targetGoLive: data.project?.targetGoLive || '',
        id: projectId,
        ownerId: user.uid,
        status: 'ACTIVE',
        createdAt: Date.now(),
        ...(projectType === 'RD' ? { lifecycle: data.project?.lifecycle || 'IDEA' } : {})
      })
    };

    try {
      const batch = writeBatch(db);
      
      // Project doc
      if (existingProjectId) {
        batch.update(doc(db, 'projects', projectId), projectDoc);
      } else {
        batch.set(doc(db, 'projects', projectId), projectDoc as Project);
      }

      // Tasks
      if (Array.isArray(data.tasks)) {
        data.tasks.forEach((t: any) => {
          const taskId = Math.random().toString(36).substr(2, 9);
          batch.set(doc(db, 'projects', projectId, 'tasks', taskId), {
            title: t.title || 'Untitled Task',
            description: t.description || '',
            status: t.status || 'TODO',
            workstream: t.workstream || 'General',
            owner: t.owner || user.displayName || 'Unassigned',
            startDate: t.startDate || '',
            endDate: t.endDate || '',
            phase: t.phase || '',
            id: taskId,
            projectId
          });
        });
      }

      // RAID
      if (Array.isArray(data.raid)) {
        data.raid.forEach((r: any) => {
          const raidId = Math.random().toString(36).substr(2, 9);
          batch.set(doc(db, 'projects', projectId, 'raidItems', raidId), {
            type: r.type || 'RISK',
            category: r.category || 'General',
            description: r.description || '',
            impact: r.impact || 'MEDIUM',
            owner: r.owner || user.displayName || 'Unassigned',
            status: r.status || 'OPEN',
            mitigation: r.mitigation || '',
            id: raidId,
            projectId
          });
        });
      }

      // Milestones
      if (Array.isArray(data.milestones)) {
        data.milestones.forEach((m: any) => {
          const milestoneId = Math.random().toString(36).substr(2, 9);
          batch.set(doc(db, 'projects', projectId, 'milestones', milestoneId), {
            name: m.name || 'Untitled Milestone',
            phase: m.phase || 'Initial',
            targetDate: m.targetDate || '',
            status: 'PLANNED',
            id: milestoneId,
            projectId
          });
        });
      }

      await batch.commit();
      setSelectedProjectId(projectId);
      setShowNewProjectModal(false);
      setSelectingRDPhase(false);
      setSelectedTypeForCreation(null);
      setNewProjectName('');
    } catch (error) {
      console.error("Error saving project:", error);
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateManualProject = async (type: 'RD' | 'DELIVERY', lifecycle: RDPhase = 'IDEA', rdCategory?: 'COLD' | 'HOT') => {
    if (!user) return;
    setIsSaving(true);

    const projectId = Math.random().toString(36).substr(2, 9);
    const newProject: any = {
      name: newProjectName || `New ${type === 'RD' ? 'R&D' : 'Delivery'} Project`,
      description: 'Manually created project. Add details here.',
      type,
      id: projectId,
      ownerId: user.uid,
      status: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startDate: new Date().toISOString().split('T')[0]
    };

    if (type === 'RD') {
      if (lifecycle) newProject.lifecycle = lifecycle;
      if (rdCategory) newProject.rdCategory = rdCategory;
    }

    try {
      await setDoc(doc(db, 'projects', projectId), newProject);
      
      // Create initial phases for RD projects
      if (type === 'RD') {
        const batch = writeBatch(db);
        const initialPhases = [
          { name: 'Discovery', order: 0, color: 'bg-blue-500' },
          { name: 'POC', order: 1, color: 'bg-indigo-500' },
          { name: 'MVP', order: 2, color: 'bg-purple-500' },
          { name: 'Delivery', order: 3, color: 'bg-emerald-500' }
        ];
        
        initialPhases.forEach((p, idx) => {
          const phaseId = Math.random().toString(36).substr(2, 9);
          batch.set(doc(db, 'projects', projectId, 'phases', phaseId), {
            id: phaseId,
            projectId,
            name: p.name,
            description: `Initial ${p.name} phase.`,
            startDate: new Date(Date.now() + idx * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(Date.now() + (idx + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            order: p.order,
            color: p.color
          });
        });
        await batch.commit();
      }

      setSelectedProjectId(projectId);
      setShowNewProjectModal(false);
      setSelectingRDPhase(false);
      setSelectedTypeForCreation(null);
      setNewProjectName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    } finally {
      setIsSaving(false);
    }
  };

  // Phase Handlers
  const handlePhaseAdd = () => {
    setEditingPhase(null);
    setShowPhaseModal(true);
  };

  const handlePhaseEdit = (phase: Phase) => {
    setEditingPhase(phase);
    setShowPhaseModal(true);
  };

  const handlePhaseDelete = (phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Phase?',
      message: `Are you sure you want to delete "${phase.name}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Phase',
      onConfirm: async () => {
        if (!selectedProjectId) return;
        try {
          await deleteDoc(doc(db, 'projects', selectedProjectId, 'phases', phaseId));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `projects/${selectedProjectId}/phases/${phaseId}`);
        }
      }
    });
  };

  const handlePhaseSave = async (phaseData: Partial<Phase>) => {
    if (!selectedProjectId || !user) return;
    setIsSaving(true);
    try {
      if (editingPhase) {
        await updateDoc(doc(db, 'projects', selectedProjectId, 'phases', editingPhase.id), {
          ...phaseData,
          updatedAt: Date.now()
        });
      } else {
        const phaseId = Math.random().toString(36).substr(2, 9);
        const newPhase: Phase = {
          id: phaseId,
          projectId: selectedProjectId,
          name: phaseData.name || 'New Phase',
          description: phaseData.description || '',
          startDate: phaseData.startDate || new Date().toISOString().split('T')[0],
          endDate: phaseData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          order: phases.length,
          color: phaseData.color || 'bg-blue-500'
        };
        await setDoc(doc(db, 'projects', selectedProjectId, 'phases', phaseId), newPhase);
      }
      setShowPhaseModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/phases`);
    } finally {
      setIsSaving(false);
    }
  };

  // Sprint Handlers
  const handleSprintAdd = () => {
    setEditingSprint(null);
    setShowSprintModal(true);
  };

  const handleSprintEdit = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setShowSprintModal(true);
  };

  const handleSprintDelete = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Sprint?',
      message: `Are you sure you want to delete "${sprint.name}"? This will unassign all tasks from this sprint.`,
      type: 'danger',
      confirmText: 'Delete Sprint',
      onConfirm: async () => {
        if (!selectedProjectId) return;
        try {
          await deleteDoc(doc(db, 'projects', selectedProjectId, 'sprints', sprintId));
          // Also clear sprintId from tasks
          const tasksToUpdate = tasks.filter(t => t.sprintId === sprintId);
          const batch = writeBatch(db);
          tasksToUpdate.forEach(t => {
            batch.update(doc(db, 'projects', selectedProjectId, 'tasks', t.id), { sprintId: deleteField() });
          });
          await batch.commit();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `projects/${selectedProjectId}/sprints/${sprintId}`);
        }
      }
    });
  };

  const handleSprintSave = async (sprintData: Partial<Sprint>) => {
    if (!selectedProjectId || !user) return;
    setIsSaving(true);
    try {
      if (editingSprint) {
        await updateDoc(doc(db, 'projects', selectedProjectId, 'sprints', editingSprint.id), {
          ...sprintData,
        });
      } else {
        const sprintId = Math.random().toString(36).substr(2, 9);
        const newSprint: Sprint = {
          id: sprintId,
          projectId: selectedProjectId,
          name: sprintData.name || `Sprint ${sprints.length + 1}`,
          startDate: sprintData.startDate || new Date().toISOString().split('T')[0],
          endDate: sprintData.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: sprintData.status || 'PLANNED',
          goal: sprintData.goal || ''
        };
        await setDoc(doc(db, 'projects', selectedProjectId, 'sprints', sprintId), newSprint);
      }
      setShowSprintModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/sprints`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWBSFileUpload = (taskId: string) => {
    setTargetTaskIdForFile(taskId);
    setShowWBSFileUpload(true);
  };

  const handleWBSFileSave = async (file: File) => {
    if (!selectedProjectId || !targetTaskIdForFile || !user) return;
    setIsSaving(true);
    try {
      // In a real app, we would upload to Firebase Storage.
      // For this demo, we'll simulate a URL.
      const fileId = Math.random().toString(36).substr(2, 9);
      const newFile: ProjectFile = {
        id: fileId,
        projectId: selectedProjectId,
        docId: targetTaskIdForFile, // Using docId to store the taskId
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file), // Temporary URL
        uploadedAt: Date.now()
      };
      await setDoc(doc(db, 'projects', selectedProjectId, 'files', fileId), newFile);
      setShowWBSFileUpload(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/files`);
    } finally {
      setIsSaving(false);
    }
  };

  // Milestone Handlers
  const handleMilestoneAdd = (phaseName: string) => {
    setEditingMilestone(null);
    setTargetPhaseNameForMilestone(phaseName);
    setShowMilestoneModal(true);
  };

  const handleMilestoneEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setTargetPhaseNameForMilestone(milestone.phase);
    setShowMilestoneModal(true);
  };

  const handleMilestoneDelete = (milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Milestone?',
      message: `Are you sure you want to delete "${milestone.name}"?`,
      type: 'danger',
      confirmText: 'Delete Milestone',
      onConfirm: async () => {
        if (!selectedProjectId) return;
        try {
          await deleteDoc(doc(db, 'projects', selectedProjectId, 'milestones', milestoneId));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `projects/${selectedProjectId}/milestones/${milestoneId}`);
        }
      }
    });
  };

  const handleMilestoneSave = async (milestoneData: Partial<Milestone>) => {
    if (!selectedProjectId || !user) return;
    setIsSaving(true);
    try {
      if (editingMilestone) {
        await updateDoc(doc(db, 'projects', selectedProjectId, 'milestones', editingMilestone.id), {
          ...milestoneData,
          updatedAt: Date.now()
        });
      } else {
        const milestoneId = Math.random().toString(36).substr(2, 9);
        const newMilestone: Milestone = {
          id: milestoneId,
          projectId: selectedProjectId,
          name: milestoneData.name || 'New Milestone',
          phase: targetPhaseNameForMilestone || 'General',
          targetDate: milestoneData.targetDate || new Date().toISOString().split('T')[0],
          status: 'PLANNED'
        };
        await setDoc(doc(db, 'projects', selectedProjectId, 'milestones', milestoneId), newMilestone);
      }
      setShowMilestoneModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/milestones`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDesignDoc = async (docId: 'hld' | 'lld', content: string) => {
    if (!selectedProjectId || !user) return;
    try {
      await setDoc(doc(db, 'projects', selectedProjectId, 'designDocs', docId), {
        id: docId,
        projectId: selectedProjectId,
        content,
        updatedAt: Date.now(),
        updatedBy: user.displayName || user.email || 'Unknown'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/designDocs/${docId}`);
    }
  };

  const handleUploadProjectFile = async (docId: string, file: File) => {
    if (!selectedProjectId || !user) return;
    
    // Simulate upload by getting a data URL if small, or just a placeholder
    let fileUrl = 'https://example.com/placeholder-file';
    
    if (file.size < 500000) { // < 500KB
      fileUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const fileId = Math.random().toString(36).substr(2, 9);
    const newFile: ProjectFile = {
      id: fileId,
      projectId: selectedProjectId,
      docId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: fileUrl,
      uploadedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'projects', selectedProjectId, 'files', fileId), newFile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/files/${fileId}`);
    }
  };

  const handleDeleteProjectFile = (fileId: string) => {
    const file = projectFiles.find(f => f.id === fileId);
    if (!file) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete File?',
      message: `Are you sure you want to delete "${file.name}"?`,
      type: 'danger',
      confirmText: 'Delete File',
      onConfirm: async () => {
        if (!selectedProjectId) return;
        try {
          await deleteDoc(doc(db, 'projects', selectedProjectId, 'files', fileId));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `projects/${selectedProjectId}/files/${fileId}`);
        }
      }
    });
  };

  const handleAdvanceLifecycle = async () => {
    if (!selectedProjectId || !user) return;
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject || selectedProject.type !== 'RD') return;
    
    const phases: RDPhase[] = ['IDEA', 'POC', 'MVP', 'DELIVERY'];
    const currentIndex = phases.indexOf(selectedProject.lifecycle || 'IDEA');
    
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      setIsSaving(true);
      try {
        await updateDoc(doc(db, 'projects', selectedProjectId), {
          lifecycle: nextPhase,
          updatedAt: Date.now()
        });
      } catch (error) {
        console.error("Error advancing lifecycle:", error);
        handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProjectId}`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleToggleRDCategory = async () => {
    if (!selectedProjectId || !user) return;
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject || selectedProject.type !== 'RD') return;

    const nextCategory = selectedProject.rdCategory === 'HOT' ? 'COLD' : 'HOT';
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'projects', selectedProjectId), {
        rdCategory: nextCategory,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error toggling RD category:", error);
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProjectId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTask = async (projectId: string, status: Task['status'] = 'BACKLOG', parentId?: string, phase?: string, workstream?: string) => {
    if (!user || !projectId) return;
    const taskId = Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      id: taskId,
      projectId,
      title: parentId ? 'New Sub-activity' : 'New Activity',
      description: 'Click to edit description',
      status,
      workstream: workstream || 'General',
      owner: user.displayName || 'Unassigned',
      startDate: new Date().toISOString().split('T')[0],
      phase: phase || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (parentId) {
      newTask.parentId = parentId;
    }

    try {
      await setDoc(doc(db, 'projects', projectId, 'tasks', taskId), newTask);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${projectId}/tasks/${taskId}`);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Activity?',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Activity',
      onConfirm: async () => {
        const pId = selectedProjectId || task.projectId;
        if (!pId || !user) return;
        try {
          await deleteDoc(doc(db, 'projects', pId, 'tasks', taskId));
          if (selectedTaskId === taskId) setSelectedTaskId(null);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `projects/${pId}/tasks/${taskId}`);
        }
      }
    });
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    const pId = selectedProjectId || (tasks.find(t => t.id === taskId)?.projectId);
    if (!pId || !user) return;

    // Sanitize updates to remove undefined values
    const sanitizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {} as any);

    try {
      await updateDoc(doc(db, 'projects', pId, 'tasks', taskId), {
        ...sanitizedUpdates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${pId}/tasks/${taskId}`);
    }
  };

  const handleRAIDUpdate = async (raidId: string, updates: Partial<RAIDItem>) => {
    if (!selectedProjectId || !user) return;

    // Sanitize updates to remove undefined values
    const sanitizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {} as any);

    try {
      await updateDoc(doc(db, 'projects', selectedProjectId, 'raidItems', raidId), {
        ...sanitizedUpdates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProjectId}/raidItems/${raidId}`);
    }
  };

  const handleRAIDDelete = (raidId: string) => {
    const item = raidItems.find(r => r.id === raidId);
    if (!item) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete RAID Item?',
      message: `Are you sure you want to delete this ${item.type.toLowerCase()}?`,
      type: 'danger',
      confirmText: 'Delete Item',
      onConfirm: async () => {
        if (!selectedProjectId || !user) return;
        try {
          await deleteDoc(doc(db, 'projects', selectedProjectId, 'raidItems', raidId));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `projects/${selectedProjectId}/raidItems/${raidId}`);
        }
      }
    });
  };

  const handleAddRAIDItem = async (type: RAIDItem['type'] = 'RISK') => {
    if (!selectedProjectId || !user) return;
    const raidId = Math.random().toString(36).substr(2, 9);
    const newItem: RAIDItem = {
      id: raidId,
      projectId: selectedProjectId,
      type,
      category: 'General',
      description: 'New RAID item description',
      impact: 'MEDIUM',
      status: 'OPEN',
      owner: user.displayName || 'Unassigned',
      mitigation: 'Define mitigation plan here',
    };

    try {
      await setDoc(doc(db, 'projects', selectedProjectId, 'raidItems', raidId), newItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${selectedProjectId}/raidItems/${raidId}`);
    }
  };

  const handleImportFileAnalyzed = async (data: any) => {
    if (!selectedProjectId || !user) return;
    setIsImporting(true);
    try {
      const batch = writeBatch(db);

      // Import Tasks
      if (data.tasks && Array.isArray(data.tasks)) {
        data.tasks.forEach((taskData: any) => {
          const taskId = Math.random().toString(36).substr(2, 9);
          const taskRef = doc(db, 'projects', selectedProjectId, 'tasks', taskId);
          batch.set(taskRef, {
            ...taskData,
            id: taskId,
            projectId: selectedProjectId,
            status: taskData.status || 'BACKLOG',
            owner: taskData.owner || user.displayName || 'Unassigned',
          });
        });
      }

      // Import RAID items
      if (data.raid && Array.isArray(data.raid)) {
        data.raid.forEach((raidData: any) => {
          const raidId = Math.random().toString(36).substr(2, 9);
          const raidRef = doc(db, 'projects', selectedProjectId, 'raidItems', raidId);
          batch.set(raidRef, {
            ...raidData,
            id: raidId,
            projectId: selectedProjectId,
            status: raidData.status || 'OPEN',
            owner: raidData.owner || user.displayName || 'Unassigned',
          });
        });
      }

      // Import Milestones
      if (data.milestones && Array.isArray(data.milestones)) {
        data.milestones.forEach((milestoneData: any) => {
          const milestoneId = Math.random().toString(36).substr(2, 9);
          const milestoneRef = doc(db, 'projects', selectedProjectId, 'milestones', milestoneId);
          batch.set(milestoneRef, {
            ...milestoneData,
            id: milestoneId,
            projectId: selectedProjectId,
            status: milestoneData.status || 'PLANNED',
          });
        });
      }

      await batch.commit();
      setShowImportModal(false);
    } catch (error) {
      console.error("Error importing data:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleLogout = () => auth.signOut();

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 max-w-md w-full shadow-xl text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">MPP Smart Manager</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Sign in to manage your R&D and Delivery projects with AI-powered analysis.
          </p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'R&D', value: projects.filter(p => p.type === 'RD').length, color: '#9333ea' },
    { name: 'Delivery', value: projects.filter(p => p.type === 'DELIVERY').length, color: '#2563eb' },
  ];

  const statusChartData = [
    { name: 'Done', count: tasks.filter(t => t.status === 'DONE').length, color: '#10b981' },
    { name: 'Active', count: tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO').length, color: '#3b82f6' },
    { name: 'Blocked', count: tasks.filter(t => t.status === 'BLOCKED').length, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-20">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">M</div>
          <span className="font-bold text-white tracking-tight text-sm">MPP Smart Manager</span>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-1">
          <button 
            onClick={() => {
              setSelectedProjectId(null);
              setMainView('DASHBOARD');
              setProjectCategoryFilter(null);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              (!selectedProjectId && mainView === 'DASHBOARD') ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => {
              setSelectedProjectId(null);
              setMainView('PROJECTS');
              setProjectCategoryFilter(null);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              (!selectedProjectId && mainView === 'PROJECTS') ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <Briefcase className="w-4 h-4" />
            All Projects
          </button>
          <button 
            onClick={() => {
              setSelectedProjectId(null);
              setMainView('CALENDAR');
              setProjectCategoryFilter(null);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              (!selectedProjectId && mainView === 'CALENDAR') ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button 
            onClick={() => {
              setSelectedProjectId(null);
              setMainView('REPORTS');
              setProjectCategoryFilter(null);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              (!selectedProjectId && mainView === 'REPORTS') ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </button>
          <button 
            onClick={() => {
              setSelectedProjectId(null);
              setMainView('RESOURCES');
              setProjectCategoryFilter(null);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              (!selectedProjectId && mainView === 'RESOURCES') ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <Users className="w-4 h-4" />
            Resources
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors group">
            {user.photoURL ? (
              <img src={user.photoURL} className="w-8 h-8 rounded-full border border-slate-700" alt={user.displayName || ''} />
            ) : (
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {user.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-grow min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.displayName || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors text-slate-500"
              title="Logout"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-60 p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            {selectedProject ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <button onClick={() => {
                  setSelectedProjectId(null);
                  setMainView('DASHBOARD');
                }} className="hover:text-blue-600 transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-900 font-medium">{selectedProject.name}</span>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-slate-900">
                {mainView === 'DASHBOARD' && 'Project Dashboard'}
                {mainView === 'PROJECTS' && 'All Projects'}
                {mainView === 'CALENDAR' && 'Project Calendar'}
                {mainView === 'REPORTS' && 'Project Reports'}
                {mainView === 'RESOURCES' && 'Resource Management'}
              </h1>
            )}
            <p className="text-sm text-slate-500">
              {selectedProject ? `Managing ${selectedProject.type} lifecycle` : (
                <>
                  {mainView === 'DASHBOARD' && 'Overview of all your active projects and initiatives.'}
                  {mainView === 'PROJECTS' && 'A complete list of all your managed projects.'}
                  {mainView === 'CALENDAR' && 'Visual timeline of tasks and milestones across all projects.'}
                  {mainView === 'REPORTS' && 'Detailed analytics and performance metrics.'}
                  {mainView === 'RESOURCES' && 'Team allocation and workload management.'}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {!selectedProject && (
              <button 
                onClick={() => setShowNewProjectModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!selectedProjectId ? (
            <motion.div 
              key={mainView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {mainView === 'DASHBOARD' && (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Projects', value: projects.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Active Tasks', value: tasks.length || 24, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Open Risks', value: raidItems.filter(i => i.type === 'RISK').length || 8, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Completion Rate', value: '68%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Active Projects</h2>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 border border-slate-200"><Filter className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects
                      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(project => (
                      <ProjectCard 
                        key={project.id} 
                        project={project} 
                        onClick={() => setSelectedProjectId(project.id)} 
                      />
                    ))}
                    
                    <button 
                      onClick={() => setShowNewProjectModal(true)}
                      className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all group min-h-[160px]"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs">Create New Project</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="font-bold text-slate-900 mb-6">Methodology Split</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      {chartData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs font-bold text-slate-600">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="font-bold text-slate-900 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                      {[
                        { user: 'Ahmed', action: 'updated tasks in', project: 'SHAP Mobile', time: '2h ago', icon: Clock },
                        { user: 'Sarah', action: 'added a new risk to', project: 'NextGen AI', time: '4h ago', icon: AlertCircle },
                        { user: 'System', action: 'completed milestone for', project: 'SHAP Mobile', time: '1d ago', icon: CheckCircle2 },
                      ].map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <activity.icon className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">
                              <span className="font-bold text-slate-900">{activity.user}</span> {activity.action} <span className="font-bold text-blue-600">{activity.project}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

              {mainView === 'PROJECTS' && (
                <div className="space-y-6">
                  {!projectCategoryFilter ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Project Categories</h2>
                        <button 
                          onClick={() => setShowNewProjectModal(true)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          New Project
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                          { 
                            id: 'RD', 
                            name: 'R&D Projects', 
                            description: 'Research and development initiatives, POCs, and MVPs.',
                            icon: Zap,
                            color: 'bg-purple-500',
                            count: projects.filter(p => p.type === 'RD').length
                          },
                          { 
                            id: 'DELIVERY', 
                            name: 'Delivery Projects', 
                            description: 'Client delivery, implementation, and production projects.',
                            icon: Briefcase,
                            color: 'bg-blue-500',
                            count: projects.filter(p => p.type === 'DELIVERY').length
                          }
                        ].map(category => (
                          <button
                            key={category.id}
                            onClick={() => setProjectCategoryFilter(category.id as any)}
                            className="group bg-white border border-slate-200 rounded-2xl p-8 text-left hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all"
                          >
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg", category.color)}>
                              <category.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{category.name}</h3>
                            <p className="text-slate-500 mb-6">{category.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{category.count} Projects</span>
                              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setProjectCategoryFilter(null)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <h2 className="text-xl font-bold text-slate-900">
                            {projectCategoryFilter === 'RD' ? 'R&D Projects' : 'Delivery Projects'}
                          </h2>
                        </div>
                        <button 
                          onClick={() => setShowNewProjectModal(true)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          New Project
                        </button>
                      </div>

                      {projects.filter(p => p.type === projectCategoryFilter).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {projects
                            .filter(p => p.type === projectCategoryFilter)
                            .map(project => (
                              <ProjectCard 
                                key={project.id} 
                                project={project} 
                                onClick={() => setSelectedProjectId(project.id)} 
                              />
                            ))}
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-slate-300" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">No Projects in this Category</h3>
                          <p className="text-slate-500 max-w-xs mx-auto mb-6">
                            Start by creating a new {projectCategoryFilter === 'RD' ? 'R&D' : 'Delivery'} project.
                          </p>
                          <button 
                            onClick={() => setShowNewProjectModal(true)}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                          >
                            <Plus className="w-4 h-4" />
                            Create Project
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {mainView === 'CALENDAR' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-slate-900">Project Timeline</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Tasks
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        Milestones
                      </div>
                    </div>
                  </div>
                  <Roadmap 
                    tasks={tasks} 
                    milestones={milestones} 
                    phases={phases}
                    onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                    onPhaseAdd={handlePhaseAdd}
                    onPhaseEdit={handlePhaseEdit}
                    onPhaseDelete={handlePhaseDelete}
                    onMilestoneAdd={handleMilestoneAdd}
                    onMilestoneEdit={handleMilestoneEdit}
                    onMilestoneDelete={handleMilestoneDelete}
                  />
                </div>
              )}

              {mainView === 'REPORTS' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <h3 className="font-bold text-slate-900 mb-6">Methodology Split</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <h3 className="font-bold text-slate-900 mb-6">Task Status Distribution</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statusChartData}>
                            <XAxis dataKey="name" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {statusChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="font-bold text-slate-900 mb-6">Project Progress Overview</h3>
                    <div className="space-y-6">
                      {projects.map(project => (
                        <div key={project.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">{project.name}</span>
                            <span className="text-xs font-bold text-slate-400">65%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {mainView === 'RESOURCES' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Resource Management</h2>
                      <p className="text-slate-500">Manage your team members and their project assignments.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingResource(null);
                        setShowResourceModal(true);
                      }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      Add Resource
                    </button>
                  </div>

                  {resources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {resources.map((resource) => (
                        <div key={resource.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 transition-all group relative">
                          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingResource(resource);
                                setShowResourceModal(true);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleResourceDelete(resource.id)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              {resource.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{resource.name}</h3>
                              <p className="text-xs text-slate-500">{resource.role}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Department</span>
                              <span className="font-bold text-slate-700">{resource.department || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Availability</span>
                              <span className={cn(
                                "font-bold",
                                resource.availability > 70 ? "text-emerald-600" : 
                                resource.availability > 30 ? "text-amber-600" : "text-red-600"
                              )}>{resource.availability}%</span>
                            </div>
                            
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {resource.skills?.length > 0 ? resource.skills.map((skill, sIdx) => (
                                  <span key={sIdx} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[10px] font-medium">
                                    {skill}
                                  </span>
                                )) : <span className="text-[10px] text-slate-400 italic">No skills listed</span>}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Projects</p>
                              <div className="space-y-1">
                                {resource.projectIds?.length > 0 ? resource.projectIds.map(pid => {
                                  const p = projects.find(proj => proj.id === pid);
                                  return (
                                    <div key={pid} className="flex items-center gap-2 text-xs text-slate-700">
                                      <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        p?.type === 'RD' ? "bg-purple-500" : "bg-blue-500"
                                      )} />
                                      <span className="truncate font-medium">{p?.name || 'Unknown Project'}</span>
                                    </div>
                                  );
                                }) : <p className="text-[10px] text-slate-400 italic">No projects assigned</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">No Resources Found</h3>
                      <p className="text-slate-500 max-w-xs mx-auto mb-6">
                        Start by adding your team members and assigning them to projects.
                      </p>
                      <button 
                        onClick={() => {
                          setEditingResource(null);
                          setShowResourceModal(true);
                        }}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Resource
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="project-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Project Header Tabs */}
              <div className="flex flex-col gap-2">
                {/* Row 1 */}
                <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 w-fit overflow-x-auto max-w-full">
                  {[
                    { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
                    { id: 'CHARTER', label: 'Project Charter', icon: FileText },
                    ...(selectedProject?.type === 'RD' ? [
                      { id: 'BACKLOG', label: 'Backlog', icon: Layers },
                      { id: 'TASKS', label: 'Scrum Board', icon: Layers },
                    ] : [
                      { id: 'LIBRARY', label: 'Library Data', icon: BookOpen },
                      { id: 'ROADMAP', label: 'Roadmap', icon: Calendar },
                      { id: 'WBS', label: 'WBS', icon: Layers },
                    ]),
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Row 2 */}
                <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 w-fit overflow-x-auto max-w-full">
                  {[
                    { id: 'RAID', label: 'RAID Log', icon: ShieldAlert },
                    ...(selectedProject?.type === 'DELIVERY' ? [
                      { id: 'ISSUE_TRACKER', label: 'Issue tracker', icon: AlertCircle },
                      { id: 'CHANGES', label: 'Change Register', icon: RefreshCw },
                      { id: 'ACTIVITY', label: 'Action Point', icon: CheckCircle2 },
                    ] : []),
                    ...(selectedProject?.type === 'RD' ? [
                      { id: 'ROADMAP', label: 'Roadmap', icon: Calendar },
                      { id: 'DATA_STORY', label: 'Data Story', icon: FileText }
                    ] : []),
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'CHARTER' && selectedProject && (
                  <ProjectCharter 
                    project={selectedProject} 
                    onUpdate={handleUpdateProjectDetails}
                    isSaving={isSaving}
                  />
                )}

                {activeTab === 'OVERVIEW' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white border border-slate-200 rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                          {isEditingName ? (
                            <div className="flex items-center gap-2 flex-grow mr-4">
                              <input
                                type="text"
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                className="text-2xl font-bold text-slate-900 bg-slate-50 border-b-2 border-blue-500 outline-none px-2 py-1 w-full"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateProjectName();
                                  if (e.key === 'Escape') setIsEditingName(false);
                                }}
                              />
                              <button 
                                onClick={handleUpdateProjectName}
                                className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setIsEditingName(false)}
                                className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 group">
                              {selectedProject?.name}
                              <button 
                                onClick={() => {
                                  setEditingNameValue(selectedProject?.name || '');
                                  setIsEditingName(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 rounded-md text-slate-400 transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </h2>
                          )}
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 border border-slate-200"><Share2 className="w-4 h-4" /></button>
                            <button 
                              onClick={() => setShowDeleteConfirm(true)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-400 border border-slate-200 hover:border-red-200 transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 border border-slate-200"><Settings className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed mb-8">
                          {selectedProject?.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                            <p className="text-sm font-bold text-emerald-600">{selectedProject?.status}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Methodology</p>
                            <p className="text-sm font-bold text-blue-600">{selectedProject?.type === 'RD' ? 'Agile / R&D' : 'Waterfall / Delivery'}</p>
                          </div>
                          {selectedProject?.type === 'RD' && (
                            <>
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group/cat relative">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">R&D Category</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    {selectedProject.rdCategory === 'HOT' ? (
                                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                                    ) : (
                                      <Snowflake className="w-3.5 h-3.5 text-blue-400" />
                                    )}
                                    <p className={cn(
                                      "text-sm font-bold",
                                      selectedProject.rdCategory === 'HOT' ? "text-orange-600" : "text-blue-600"
                                    )}>
                                      {selectedProject.rdCategory || 'NOT SET'}
                                    </p>
                                  </div>
                                  <button 
                                    onClick={handleToggleRDCategory}
                                    disabled={isSaving}
                                    className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 text-[10px] font-bold text-blue-600 transition-all opacity-0 group-hover/cat:opacity-100"
                                  >
                                    Switch
                                  </button>
                                </div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Phase</p>
                                <div className="flex items-center gap-1.5 text-purple-600">
                                  <Zap className="w-3.5 h-3.5" />
                                  <p className="text-sm font-bold">{selectedProject.lifecycle}</p>
                                </div>
                              </div>
                            </>
                          )}
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</p>
                            <p className="text-sm font-bold text-slate-900">{selectedProject?.startDate}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Go-Live</p>
                            <p className="text-sm font-bold text-slate-900">{selectedProject?.targetGoLive || 'TBD'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Smart Import Section */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-50" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Zap className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">Smart Import</h3>
                              <p className="text-xs text-slate-500">Populate your project with AI analysis</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 mb-6 max-w-xl">
                            Upload your project plan, brief, or spreadsheet. Our AI will analyze the document and automatically extract tasks, RAID items, and milestones directly into this project.
                          </p>
                          <FileUpload onFileAnalyzed={(data) => handleFileAnalyzed(data, selectedProject?.id)} />
                        </div>
                      </div>

                      {selectedProject?.type === 'RD' && (
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl shadow-purple-500/20">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <Zap className="w-6 h-6" />
                              <h3 className="text-xl font-bold">R&D Lifecycle</h3>
                            </div>
                            {selectedProject.lifecycle !== 'DELIVERY' && (
                              <button 
                                onClick={handleAdvanceLifecycle}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-white/20 flex items-center gap-2"
                              >
                                <Zap className="w-4 h-4" />
                                Advance Phase
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between relative px-4">
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 -translate-y-1/2 z-0" />
                            {['IDEA', 'POC', 'MVP', 'DELIVERY'].map((phase, idx) => (
                              <div key={phase} className="relative z-10 flex flex-col items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 border-indigo-700",
                                  selectedProject.lifecycle === phase ? "bg-white text-indigo-700" : "bg-indigo-400 text-white"
                                )}>
                                  {idx + 1}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider opacity-80">{phase}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Flag className="w-4 h-4 text-blue-500" />
                          Key Milestones
                        </h3>
                        <div className="space-y-4">
                          {milestones.length > 0 ? milestones.map(m => (
                            <div key={m.id} className="flex items-start gap-3">
                              <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                              <div>
                                <p className="text-sm font-bold text-slate-900">{m.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase">{m.phase} • {m.targetDate}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-sm text-slate-400 italic">No milestones defined yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                          Critical Risks
                        </h3>
                        <div className="space-y-4">
                          {raidItems.filter(i => i.type === 'RISK' && i.impact === 'HIGH').length > 0 ? 
                            raidItems.filter(i => i.type === 'RISK' && i.impact === 'HIGH').map(r => (
                            <div key={r.id} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                              <p className="text-xs font-bold text-red-700 mb-1">{r.description}</p>
                              <p className="text-[10px] text-red-500 font-medium uppercase">Owner: {r.owner}</p>
                            </div>
                          )) : (
                            <p className="text-sm text-slate-400 italic">No critical risks identified.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'BACKLOG' && selectedProject?.type === 'RD' && (
                  <div className="space-y-8">
                    {/* Sprints Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-500" />
                          <h3 className="text-lg font-bold text-slate-900">Sprints</h3>
                        </div>
                        <button 
                          onClick={handleSprintAdd}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                        >
                          <Plus className="w-4 h-4" />
                          Create Sprint
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {sprints.length > 0 ? sprints.map(sprint => (
                          <div key={sprint.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  sprint.status === 'ACTIVE' ? "bg-emerald-500 animate-pulse" : 
                                  sprint.status === 'COMPLETED' ? "bg-slate-400" : "bg-blue-500"
                                )} />
                                <div>
                                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                    {sprint.name}
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 uppercase">
                                      {sprint.status}
                                    </span>
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    {sprint.startDate} — {sprint.endDate}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleSprintEdit(sprint)}
                                  className="p-2 hover:bg-white rounded-lg text-slate-400 transition-colors"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleSprintDelete(sprint.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <Plus className="w-4 h-4 rotate-45" />
                                </button>
                              </div>
                            </div>
                            <div className="divide-y divide-slate-50">
                              {tasks.filter(t => t.sprintId === sprint.id).length > 0 ? (
                                tasks.filter(t => t.sprintId === sprint.id).map(task => (
                                  <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                                    <div className="flex items-center gap-4 flex-grow">
                                      <div className={cn(
                                        "w-8 h-8 rounded flex items-center justify-center",
                                        task.status === 'DONE' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                                      )}>
                                        {task.status === 'DONE' ? <CheckCircle2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                      </div>
                                      <div className="flex-grow">
                                        <p className={cn("text-sm font-semibold text-slate-900", task.status === 'DONE' && "line-through opacity-50")}>{task.title}</p>
                                        <p className="text-xs text-slate-500 line-clamp-1">{task.description || 'No description'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                          {task.owner.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-400">{task.owner}</span>
                                      </div>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTaskUpdate(task.id, { sprintId: deleteField() });
                                        }}
                                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold hover:bg-slate-200 transition-all opacity-0 group-hover:opacity-100"
                                      >
                                        Back to Backlog
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center">
                                  <p className="text-sm text-slate-400 italic">No tasks assigned to this sprint.</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Drag tasks here or use the "Move to Sprint" button below.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )) : (
                          <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                            <Zap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-500">No sprints created yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Start by creating your first sprint to organize your work.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Backlog Section */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                          <h3 className="font-bold text-slate-900">Product Backlog</h3>
                          <p className="text-xs text-slate-500">Unassigned items waiting to be planned into sprints.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Import
                          </button>
                          <button 
                            onClick={() => selectedProjectId && handleAddTask(selectedProjectId, 'BACKLOG')}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Item
                          </button>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {tasks.filter(t => !t.sprintId).length > 0 ? (
                          tasks.filter(t => !t.sprintId).map(task => (
                            <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                              <div className="flex items-center gap-4 flex-grow">
                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div className="flex-grow space-y-1">
                                  <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => handleTaskUpdate(task.id, { title: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full text-sm font-semibold text-slate-900 bg-transparent border-none focus:ring-0 p-0 hover:bg-slate-100/50 rounded transition-colors"
                                    placeholder="Task title"
                                  />
                                  <textarea
                                    value={task.description}
                                    onChange={(e) => handleTaskUpdate(task.id, { description: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full text-xs text-slate-500 bg-transparent border-none focus:ring-0 p-0 hover:bg-slate-100/50 rounded transition-colors resize-none"
                                    placeholder="Add description..."
                                    rows={1}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <input
                                    type="text"
                                    value={task.owner}
                                    onChange={(e) => handleTaskUpdate(task.id, { owner: e.target.value })}
                                    className="text-[10px] font-medium text-slate-400 bg-transparent border-none focus:ring-0 p-0 hover:bg-slate-100/50 rounded transition-colors w-24"
                                    placeholder="Owner"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {sprints.length > 0 && (
                                  <div className="relative group/menu">
                                    <button 
                                      onClick={(e) => e.stopPropagation()}
                                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      Move to Sprint
                                    </button>
                                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden group-hover/menu:block z-20">
                                      <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Sprint</p>
                                      {sprints.filter(s => s.status !== 'COMPLETED').map(s => (
                                        <button
                                          key={s.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleTaskUpdate(task.id, { sprintId: s.id, status: 'TODO' });
                                          }}
                                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                        >
                                          {s.name}
                                          {s.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                              <Layers className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-slate-500">Your backlog is empty. Start adding items to plan your project.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'TASKS' && selectedProject?.type === 'RD' && (
                  <AgileBoard 
                    tasks={tasks} 
                    resources={resources}
                    onTaskUpdate={handleTaskUpdate} 
                    onAddTask={(status) => selectedProjectId && handleAddTask(selectedProjectId, status)} 
                    onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                  />
                )}

                {activeTab === 'WBS' && selectedProject?.type === 'DELIVERY' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Work Breakdown Structure (WBS)</h3>
                          <p className="text-xs text-slate-500">Hierarchical decomposition of project deliverables by Workstream.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setShowWorkstreamModal(true)}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Workstream
                          </button>
                        </div>
                      </div>
                      <WBSView 
                        tasks={tasks} 
                        raidItems={raidItems}
                        projectFiles={projectFiles}
                        projectId={selectedProjectId || ''}
                        onTaskUpdate={handleTaskUpdate}
                        onAddTask={handleAddTask}
                        onTaskDelete={handleTaskDelete}
                        onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                        onFileUpload={handleWBSFileUpload}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'ACTIVITY' && selectedProject?.type === 'DELIVERY' && (
                  <div className="space-y-6">
                    {/* Meeting Summary Section */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Meeting Minutes</h3>
                          <p className="text-xs text-slate-500">Capture the details of the latest project meeting.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Meeting Date</label>
                            <input 
                              type="date" 
                              value={selectedProject?.meetingDate || ''} 
                              onChange={(e) => handleUpdateProjectDetails({ meetingDate: e.target.value })}
                              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Meeting Owner</label>
                            <select 
                              value={selectedProject?.meetingOwner || ''} 
                              onChange={(e) => handleUpdateProjectDetails({ meetingOwner: e.target.value })}
                              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                              <option value="">Select Owner...</option>
                              {resources.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Attendance</label>
                            <textarea 
                              value={selectedProject?.meetingAttendance || ''} 
                              onChange={(e) => handleUpdateProjectDetails({ meetingAttendance: e.target.value })}
                              placeholder="List of attendees..."
                              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 min-h-[100px]"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Action Points Summary</label>
                        <textarea 
                          value={selectedProject?.meetingSummary || ''} 
                          onChange={(e) => handleUpdateProjectDetails({ meetingSummary: e.target.value })}
                          placeholder="Summary of key action points discussed..."
                          className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 min-h-[120px]"
                        />
                      </div>
                    </div>

                    {/* Action Points Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Action Points Tracking</h3>
                          <p className="text-xs text-slate-500">Detailed tracking of all action items.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAddTask(selectedProjectId!, 'TODO')}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Action Point
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                              <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Point</th>
                              <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workstream</th>
                              <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner</th>
                              <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {tasks.map(task => (
                              <tr 
                                key={task.id} 
                                className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                                onClick={() => setSelectedTaskId(task.id)}
                              >
                                <td className="py-4">
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    task.status === 'DONE' ? "bg-emerald-50 text-emerald-600" : 
                                    task.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
                                  )}>
                                    {task.status === 'DONE' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                  </div>
                                </td>
                                <td className="py-4">
                                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{task.title}</p>
                                </td>
                                <td className="py-4">
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                    {task.workstream}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <select
                                    value={task.owner}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleTaskUpdate(task.id, { owner: e.target.value });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  >
                                    <option value="Unassigned">Unassigned</option>
                                    {resources.map(r => (
                                      <option key={r.id} value={r.name}>{r.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-4">
                                  <p className="text-xs font-bold text-slate-700">{task.endDate || 'TBD'}</p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'LIBRARY' && selectedProject?.type === 'DELIVERY' && (
                  <div className="space-y-8">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Library Data</h3>
                          <p className="text-sm text-slate-500">Core project documentation and requirements.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-8">
                        {/* Requirement Data */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              Requirement Data
                            </label>
                            <label className="cursor-pointer group flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                              <Paperclip className="w-3 h-3" />
                              Attach File
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadProjectFile('requirementData', file);
                                }}
                                accept=".pdf,.docx,.xlsx"
                              />
                            </label>
                          </div>
                          <textarea
                            value={selectedProject?.requirementData || ''}
                            onChange={(e) => handleUpdateProjectDetails({ requirementData: e.target.value })}
                            className="w-full text-sm text-slate-600 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-4 transition-all min-h-[120px] leading-relaxed"
                            placeholder="Detail the project requirements here..."
                          />
                          {projectFiles.filter(f => f.docId === 'requirementData').length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {projectFiles.filter(f => f.docId === 'requirementData').map(file => (
                                <div key={file.id} className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm group">
                                  <File className="w-3 h-3 text-blue-500" />
                                  <span className="text-[10px] font-medium text-slate-600 truncate max-w-[200px]">{file.name}</span>
                                  <button 
                                    onClick={() => handleDeleteProjectFile(file.id)}
                                    className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Scope of Work */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Target className="w-3 h-3" />
                              Scope of Work
                            </label>
                            <label className="cursor-pointer group flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                              <Paperclip className="w-3 h-3" />
                              Attach File
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadProjectFile('scopeOfWork', file);
                                }}
                                accept=".pdf,.docx,.xlsx"
                              />
                            </label>
                          </div>
                          <textarea
                            value={selectedProject?.scopeOfWork || ''}
                            onChange={(e) => handleUpdateProjectDetails({ scopeOfWork: e.target.value })}
                            className="w-full text-sm text-slate-600 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-4 transition-all min-h-[120px] leading-relaxed"
                            placeholder="Define the scope of work..."
                          />
                          {projectFiles.filter(f => f.docId === 'scopeOfWork').length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {projectFiles.filter(f => f.docId === 'scopeOfWork').map(file => (
                                <div key={file.id} className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm group">
                                  <File className="w-3 h-3 text-blue-500" />
                                  <span className="text-[10px] font-medium text-slate-600 truncate max-w-[200px]">{file.name}</span>
                                  <button 
                                    onClick={() => handleDeleteProjectFile(file.id)}
                                    className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Use Cases */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <ListChecks className="w-3 h-3" />
                              Use Cases
                            </label>
                            <label className="cursor-pointer group flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                              <Paperclip className="w-3 h-3" />
                              Attach File
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadProjectFile('useCases', file);
                                }}
                                accept=".pdf,.docx,.xlsx"
                              />
                            </label>
                          </div>
                          <textarea
                            value={selectedProject?.useCases || ''}
                            onChange={(e) => handleUpdateProjectDetails({ useCases: e.target.value })}
                            className="w-full text-sm text-slate-600 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-4 transition-all min-h-[120px] leading-relaxed"
                            placeholder="List the primary use cases..."
                          />
                          {projectFiles.filter(f => f.docId === 'useCases').length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {projectFiles.filter(f => f.docId === 'useCases').map(file => (
                                <div key={file.id} className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm group">
                                  <File className="w-3 h-3 text-blue-500" />
                                  <span className="text-[10px] font-medium text-slate-600 truncate max-w-[200px]">{file.name}</span>
                                  <button 
                                    onClick={() => handleDeleteProjectFile(file.id)}
                                    className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'RAID' && (
                  <RAIDLog 
                    items={raidItems.filter(i => i.type !== 'ISSUE')} 
                    tasks={tasks}
                    resources={resources}
                    onUpdate={handleRAIDUpdate}
                    onDelete={handleRAIDDelete}
                    onAdd={(type) => handleAddRAIDItem(type)}
                  />
                )}

                {activeTab === 'ISSUE_TRACKER' && (
                  <IssueLog 
                    items={issueLogItems} 
                    resources={resources}
                    onAdd={handleAddIssueLogItem}
                    onUpdate={handleUpdateIssueLogItem}
                    onDelete={handleDeleteIssueLogItem}
                  />
                )}

                {activeTab === 'CHANGES' && (
                  <ChangeRegister 
                    requests={changeRequests}
                    resources={resources}
                    onAdd={handleAddChangeRequest}
                    onUpdate={handleUpdateChangeRequest}
                    onDelete={handleDeleteChangeRequest}
                  />
                )}

                {activeTab === 'ROADMAP' && (
                  <Roadmap 
                    tasks={tasks} 
                    milestones={milestones} 
                    phases={phases}
                    onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                    onPhaseAdd={handlePhaseAdd}
                    onPhaseEdit={handlePhaseEdit}
                    onPhaseDelete={handlePhaseDelete}
                    onMilestoneAdd={handleMilestoneAdd}
                    onMilestoneEdit={handleMilestoneEdit}
                    onMilestoneDelete={handleMilestoneDelete}
                  />
                )}

                {activeTab === 'DATA_STORY' && (
                  <DataStory 
                    hld={designDocs.find(d => d.id === 'hld') || null}
                    lld={designDocs.find(d => d.id === 'lld') || null}
                    files={projectFiles}
                    onSaveDoc={handleSaveDesignDoc}
                    onUploadFile={handleUploadProjectFile}
                    onDeleteFile={handleDeleteProjectFile}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Import Project Data</h2>
                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              <div className="p-8">
                <FileUpload onFileAnalyzed={handleImportFileAnalyzed} />
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-900 mb-1">How it works</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Upload your project plan (Word, Excel, or PDF). Our AI will analyze the document and automatically extract tasks for your backlog, RAID items, and milestones.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Create New Project</h2>
                <button onClick={() => {
                  setShowNewProjectModal(false);
                  setSelectingRDPhase(false);
                  setSelectedRDCategory(null);
                  setSelectedTypeForCreation(null);
                  setNewProjectName('');
                }} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-8">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Project Name</span>
                    {newProjectName.trim().length > 0 && (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Valid
                      </span>
                    )}
                  </label>
                  <input 
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., Q2 Marketing Campaign, New Product Launch..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    autoFocus
                  />
                  {!newProjectName.trim() && (
                    <p className="mt-2 text-[10px] text-slate-400 italic">Please enter a name to continue...</p>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {newProjectName.trim().length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {!selectedTypeForCreation ? (
                        <div className="space-y-4">
                          <div className="relative flex items-center gap-3 py-2">
                            <div className="flex-grow h-px bg-slate-100" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Step 2: Choose Methodology</span>
                            <div className="flex-grow h-px bg-slate-100" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <button 
                              onClick={() => setSelectedTypeForCreation('RD')}
                              className="p-6 border-2 border-slate-100 rounded-2xl text-left hover:border-purple-400 hover:bg-purple-50 transition-all group"
                            >
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                                <Zap className="w-6 h-6 text-purple-600" />
                              </div>
                              <h4 className="font-bold text-slate-900 mb-1">R&D Project</h4>
                              <p className="text-xs text-slate-500">Agile methodology, Scrum boards, and rapid prototyping.</p>
                            </button>
                            <button 
                              onClick={() => setSelectedTypeForCreation('DELIVERY')}
                              className="p-6 border-2 border-slate-100 rounded-2xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all group"
                            >
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                              </div>
                              <h4 className="font-bold text-slate-900 mb-1">Delivery Project</h4>
                              <p className="text-xs text-slate-500">Waterfall methodology, WBS, and milestone tracking.</p>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                selectedTypeForCreation === 'RD' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                              )}>
                                {selectedTypeForCreation === 'RD' ? <Zap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                              </div>
                              <div>
                                <h3 className="text-xs font-bold text-slate-900">
                                  {selectedTypeForCreation === 'RD' ? 'R&D Project' : 'Delivery Project'}
                                </h3>
                                <p className="text-[10px] text-slate-500">Methodology selected</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setSelectedTypeForCreation(null);
                                setSelectedRDCategory(null);
                                setSelectingRDPhase(false);
                              }} 
                              className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              Change
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="relative flex items-center gap-3 py-2">
                              <div className="flex-grow h-px bg-slate-100" />
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Final Step: Create Project</span>
                              <div className="flex-grow h-px bg-slate-100" />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              {selectedTypeForCreation === 'RD' && !selectedRDCategory ? (
                                <div className="space-y-4 p-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Step 3: Select Project Category</h4>
                                    <button onClick={() => setSelectedTypeForCreation(null)} className="text-[10px] font-bold text-blue-600 hover:underline">Back</button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <button 
                                      onClick={() => setSelectedRDCategory('HOT')}
                                      className="p-6 border-2 border-slate-100 rounded-2xl text-left hover:border-orange-400 hover:bg-orange-50 transition-all group"
                                    >
                                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                                        <Flame className="w-5 h-5 text-orange-600" />
                                      </div>
                                      <h4 className="font-bold text-slate-900 mb-1">Hot Project</h4>
                                      <p className="text-[10px] text-slate-500">Active, high-priority exploration.</p>
                                    </button>
                                    <button 
                                      onClick={() => setSelectedRDCategory('COLD')}
                                      className="p-6 border-2 border-slate-100 rounded-2xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all group"
                                    >
                                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                                        <Snowflake className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <h4 className="font-bold text-slate-900 mb-1">Cold Project</h4>
                                      <p className="text-[10px] text-slate-500">Backlog, low-priority or on-hold exploration.</p>
                                    </button>
                                  </div>
                                </div>
                              ) : selectedTypeForCreation === 'RD' && selectedRDCategory && !selectingRDPhase ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between px-2">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Step 4: Configure Phase</h4>
                                    <button onClick={() => setSelectedRDCategory(null)} className="text-[10px] font-bold text-blue-600 hover:underline">Back</button>
                                  </div>
                                  <button 
                                    onClick={() => setSelectingRDPhase(true)}
                                    className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl text-left hover:border-purple-400 hover:bg-purple-50 transition-all group"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                          <Layers className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-slate-900">Configure R&D Phase</h4>
                                          <p className="text-xs text-slate-500">Choose your starting point in the lifecycle.</p>
                                        </div>
                                      </div>
                                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                  </button>
                                </div>
                              ) : selectedTypeForCreation === 'RD' && selectedRDCategory && selectingRDPhase ? (
                                <div className="space-y-4 p-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Step 4: Select Initial Phase</h4>
                                    <button onClick={() => setSelectingRDPhase(false)} className="text-[10px] font-bold text-blue-600 hover:underline">Back</button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    {(['IDEA', 'POC', 'MVP', 'DELIVERY'] as RDPhase[]).map((phase) => (
                                      <button
                                        key={phase}
                                        onClick={() => handleCreateManualProject('RD', phase, selectedRDCategory)}
                                        className="p-4 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 hover:bg-purple-50 hover:border-purple-200 transition-all text-center bg-white"
                                      >
                                        {phase}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleCreateManualProject('DELIVERY')}
                                  className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all group"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <Plus className="w-6 h-6 text-blue-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-900">Create Empty Project</h4>
                                        <p className="text-xs text-slate-500">Start with a blank slate and add details later.</p>
                                      </div>
                                    </div>
                                    <Plus className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Project?</h3>
            <p className="text-slate-500 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-700">"{selectedProject?.name}"</span>? 
              This will permanently remove all tasks, RAID items, and milestones. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteProject}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Project"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {selectedTaskId && tasks.find(t => t.id === selectedTaskId) && (
        <TaskModal
          task={tasks.find(t => t.id === selectedTaskId)!}
          allTasks={tasks}
          raidItems={raidItems}
          resources={resources}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
        />
      )}

      {/* Phase Modal */}
      {showPhaseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">{editingPhase ? 'Edit Phase' : 'Add New Phase'}</h3>
              <button onClick={() => setShowPhaseModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handlePhaseSave({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                startDate: formData.get('startDate') as string,
                endDate: formData.get('endDate') as string,
                color: formData.get('color') as string
              });
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phase Name</label>
                <input name="name" defaultValue={editingPhase?.name} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea name="description" defaultValue={editingPhase?.description} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input type="date" name="startDate" defaultValue={editingPhase?.startDate || new Date().toISOString().split('T')[0]} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                  <input type="date" name="endDate" defaultValue={editingPhase?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Theme Color</label>
                <select name="color" defaultValue={editingPhase?.color || 'bg-blue-500'} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-emerald-500">Emerald</option>
                  <option value="bg-indigo-500">Indigo</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-amber-500">Amber</option>
                  <option value="bg-rose-500">Rose</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowPhaseModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingPhase ? 'Update Phase' : 'Create Phase')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">{editingMilestone ? 'Edit Milestone' : 'Add Milestone'}</h3>
              <button onClick={() => setShowMilestoneModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleMilestoneSave({
                name: formData.get('name') as string,
                targetDate: formData.get('targetDate') as string,
                status: formData.get('status') as Milestone['status']
              });
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Milestone Name</label>
                <input name="name" defaultValue={editingMilestone?.name} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Date</label>
                <input type="date" name="targetDate" defaultValue={editingMilestone?.targetDate || new Date().toISOString().split('T')[0]} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                <select name="status" defaultValue={editingMilestone?.status || 'PLANNED'} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="PLANNED">Planned</option>
                  <option value="ACHIEVED">Achieved</option>
                  <option value="DELAYED">Delayed</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingMilestone ? 'Update Milestone' : 'Add Milestone')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* WBS File Upload Modal */}
      {showWBSFileUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Upload File</h3>
              <button onClick={() => setShowWBSFileUpload(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">Attach a file (Excel, Word, PDF) to this activity.</p>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-slate-50 transition-all cursor-pointer relative">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleWBSFileSave(file);
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-slate-900">Click to upload</p>
                <p className="text-xs text-slate-400 mt-1">PDF, Word, or Excel files</p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => setShowWBSFileUpload(false)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">{editingResource ? 'Edit Resource' : 'Add New Resource'}</h3>
              <button onClick={() => setShowResourceModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const skills = (formData.get('skills') as string).split(',').map(s => s.trim()).filter(Boolean);
              const selectedProjectIds = Array.from(formData.getAll('projectIds')) as string[];
              
              handleResourceSave({
                name: formData.get('name') as string,
                role: formData.get('role') as string,
                email: formData.get('email') as string,
                department: formData.get('department') as string,
                availability: parseInt(formData.get('availability') as string),
                skills,
                projectIds: selectedProjectIds
              });
            }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input name="name" defaultValue={editingResource?.name} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Role / Title</label>
                  <input name="role" defaultValue={editingResource?.role} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Senior Developer" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
                  <input name="department" defaultValue={editingResource?.department} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Engineering" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input type="email" name="email" defaultValue={editingResource?.email} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="john@example.com" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Skills (comma separated)</label>
                  <input name="skills" defaultValue={editingResource?.skills?.join(', ')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="React, TypeScript, Node.js" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Availability (%)</label>
                  <input type="range" name="availability" min="0" max="100" defaultValue={editingResource?.availability || 100} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assign to Projects</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {projects.map(p => (
                      <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          name="projectIds" 
                          value={p.id} 
                          defaultChecked={editingResource?.projectIds?.includes(p.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" 
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{p.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{p.type === 'RD' ? 'R&D' : 'Delivery'}</span>
                        </div>
                      </label>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No projects available to assign.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowResourceModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingResource ? 'Update Resource' : 'Add Resource')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Sprint Modal */}
      {showSprintModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">{editingSprint ? 'Edit Sprint' : 'Create Sprint'}</h3>
              <button onClick={() => setShowSprintModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSprintSave({
                name: formData.get('name') as string,
                startDate: formData.get('startDate') as string,
                endDate: formData.get('endDate') as string,
                status: formData.get('status') as Sprint['status'],
                goal: formData.get('goal') as string
              });
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sprint Name</label>
                <input name="name" defaultValue={editingSprint?.name} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="e.g. Sprint 1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input type="date" name="startDate" defaultValue={editingSprint?.startDate || new Date().toISOString().split('T')[0]} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                  <input type="date" name="endDate" defaultValue={editingSprint?.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                <select name="status" defaultValue={editingSprint?.status || 'PLANNED'} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="PLANNED">Planned</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sprint Goal</label>
                <textarea name="goal" defaultValue={editingSprint?.goal} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" placeholder="What do we want to achieve?" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowSprintModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingSprint ? 'Update Sprint' : 'Create Sprint')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Workstream Modal */}
      {showWorkstreamModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Add Workstream</h3>
              <button onClick={() => setShowWorkstreamModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newWorkstreamName.trim() && selectedProjectId) {
                handleAddTask(selectedProjectId, 'TODO', undefined, '', newWorkstreamName.trim());
                setNewWorkstreamName('');
                setShowWorkstreamModal(false);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Workstream Name</label>
                <input 
                  value={newWorkstreamName}
                  onChange={(e) => setNewWorkstreamName(e.target.value)}
                  required 
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" 
                  placeholder="e.g. Design, Development, Marketing" 
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowWorkstreamModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                  Add Workstream
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Generic Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          >
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto",
              confirmModal.type === 'danger' ? "bg-red-100" : "bg-blue-100"
            )}>
              {confirmModal.type === 'danger' ? (
                <Trash2 className="w-8 h-8 text-red-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 text-center mb-8">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm} 
                className={cn(
                  "flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors",
                  confirmModal.type === 'danger' ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const Flag = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" x2="4" y1="22" y2="15" />
  </svg>
);

