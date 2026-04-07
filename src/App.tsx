import React, { useState, useEffect } from 'react';
import { Project, Task, RAIDItem, Milestone, RDPhase } from './types';
import { ProjectCard } from './components/ProjectCard';
import { FileUpload } from './components/FileUpload';
import { AgileBoard } from './components/AgileBoard';
import { WaterfallView } from './components/WaterfallView';
import { RAIDLog } from './components/RAIDLog';
import { Roadmap } from './components/Roadmap';
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
  X
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import { initializeApp } from 'firebase/app';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, doc, setDoc, updateDoc, deleteDoc, getDocFromServer, writeBatch } from 'firebase/firestore';
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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BACKLOG' | 'TASKS' | 'RAID' | 'ROADMAP' | 'WBS' | 'ACTIVITY' | 'TIMEPLAN'>('OVERVIEW');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTypeForCreation, setSelectedTypeForCreation] = useState<'RD' | 'DELIVERY' | null>(null);
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

  // Project data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [raidItems, setRaidItems] = useState<RAIDItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

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

  // Selected Project Data Listener
  useEffect(() => {
    setActiveTab('OVERVIEW');
    if (!selectedProjectId || !user) {
      setTasks([]);
      setRaidItems([]);
      setMilestones([]);
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

    return () => {
      tasksUnsubscribe();
      raidUnsubscribe();
      milestonesUnsubscribe();
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

  const handleCreateManualProject = async (type: 'RD' | 'DELIVERY', lifecycle: RDPhase = 'IDEA') => {
    if (!user) return;
    setIsSaving(true);

    const projectId = Math.random().toString(36).substr(2, 9);
    const newProject: Project = {
      name: newProjectName || `New ${type === 'RD' ? 'R&D' : 'Delivery'} Project`,
      description: 'Manually created project. Add details here.',
      type,
      id: projectId,
      ownerId: user.uid,
      status: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startDate: new Date().toISOString().split('T')[0],
      ...(type === 'RD' ? { lifecycle } : {})
    };

    try {
      await setDoc(doc(db, 'projects', projectId), newProject);
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

  const handleAddTask = async (projectId: string, status: Task['status'] = 'BACKLOG') => {
    if (!user) return;
    const taskId = Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      id: taskId,
      projectId,
      title: 'New Task',
      description: 'Click to edit task description',
      status,
      workstream: 'General',
      owner: user.displayName || 'Unassigned',
      startDate: new Date().toISOString().split('T')[0],
    };

    try {
      await setDoc(doc(db, 'projects', projectId, 'tasks', taskId), newTask);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${projectId}/tasks/${taskId}`);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    if (!selectedProjectId || !user) return;
    try {
      await updateDoc(doc(db, 'projects', selectedProjectId, 'tasks', taskId), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProjectId}/tasks/${taskId}`);
    }
  };

  const handleRAIDUpdate = async (raidId: string, updates: Partial<RAIDItem>) => {
    if (!selectedProjectId || !user) return;
    try {
      await updateDoc(doc(db, 'projects', selectedProjectId, 'raidItems', raidId), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProjectId}/raidItems/${raidId}`);
    }
  };

  const handleRAIDDelete = async (raidId: string) => {
    if (!selectedProjectId || !user) return;
    try {
      await deleteDoc(doc(db, 'projects', selectedProjectId, 'raidItems', raidId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${selectedProjectId}/raidItems/${raidId}`);
    }
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
                  <Roadmap tasks={tasks} milestones={milestones} onTaskClick={(taskId) => setSelectedTaskId(taskId)} />
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
                  {tasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from(new Set(tasks.map(t => t.owner))).map((owner, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 transition-all group">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              {owner.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{owner}</h3>
                              <p className="text-xs text-slate-500">Team Member</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Active Tasks</span>
                              <span className="font-bold text-slate-900">{tasks.filter(t => t.owner === owner).length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Workload</span>
                              <span className="font-bold text-emerald-600">Optimal</span>
                            </div>
                            <div className="pt-4 border-t border-slate-50">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Focus</p>
                              <p className="text-xs text-slate-700 truncate font-medium">
                                {tasks.find(t => t.owner === owner)?.title || 'No active tasks'}
                              </p>
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
                      <p className="text-slate-500 max-w-xs mx-auto">
                        Once you add tasks to your projects and assign owners, they will appear here for workload management.
                      </p>
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
              <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 w-fit overflow-x-auto max-w-full">
                {[
                  { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
                  ...(selectedProject?.type === 'RD' ? [
                    { id: 'BACKLOG', label: 'Backlog', icon: Layers },
                    { id: 'TASKS', label: 'Scrum Board', icon: Layers },
                  ] : [
                    { id: 'WBS', label: 'WBS', icon: Layers },
                    { id: 'ACTIVITY', label: 'Activity Task', icon: CheckCircle2 },
                    { id: 'ROADMAP', label: 'Roadmap', icon: Calendar },
                    { id: 'TIMEPLAN', label: 'Timeplan', icon: Clock },
                  ]),
                  { id: 'RAID', label: 'RAID Log', icon: ShieldAlert },
                  ...(selectedProject?.type === 'RD' ? [{ id: 'ROADMAP', label: 'Roadmap', icon: Calendar }] : []),
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

              {/* Tab Content */}
              <div className="mt-6">
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
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="font-bold text-slate-900">Product Backlog</h3>
                        <p className="text-xs text-slate-500">Prioritize and manage your product backlog items.</p>
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
                      {tasks.filter(t => t.status === 'BACKLOG').length > 0 ? (
                        tasks.filter(t => t.status === 'BACKLOG').map(task => (
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
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskUpdate(task.id, { status: 'TODO' });
                                }}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              >
                                Move to Sprint
                              </button>
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
                )}

                {activeTab === 'TASKS' && selectedProject?.type === 'RD' && (
                  <AgileBoard 
                    tasks={tasks} 
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
                          <p className="text-xs text-slate-500">Hierarchical decomposition of the total scope of work.</p>
                        </div>
                        <button 
                          onClick={() => selectedProjectId && handleAddTask(selectedProjectId, 'TODO')}
                          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Activity
                        </button>
                      </div>
                      <WaterfallView tasks={tasks} onTaskClick={(taskId) => setSelectedTaskId(taskId)} />
                    </div>
                  </div>
                )}

                {activeTab === 'ACTIVITY' && selectedProject?.type === 'DELIVERY' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Activity Tasks</h3>
                          <p className="text-xs text-slate-500">Detailed list of all project activities and their status.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Filter activities..." className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group" onClick={() => setSelectedTaskId(task.id)}>
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                task.status === 'DONE' ? "bg-emerald-50 text-emerald-600" : 
                                task.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
                              )}>
                                {task.status === 'DONE' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{task.workstream}</span>
                                  <span className="text-[10px] text-slate-300">•</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.phase}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{task.title}</h4>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Owner</p>
                                <p className="text-xs font-bold text-slate-700">{task.owner}</p>
                              </div>
                              <div className="text-right w-24">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">End Date</p>
                                <p className="text-xs font-bold text-slate-700">{task.endDate || 'TBD'}</p>
                              </div>
                              <div className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                                task.status === 'DONE' ? "bg-emerald-100 text-emerald-700" : 
                                task.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                              )}>
                                {task.status.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'TIMEPLAN' && selectedProject?.type === 'DELIVERY' && (
                  <div className="space-y-6">
                    <Roadmap tasks={tasks} milestones={milestones} onTaskClick={(taskId) => setSelectedTaskId(taskId)} />
                  </div>
                )}

                {activeTab === 'RAID' && (
                  <RAIDLog 
                    items={raidItems} 
                    onUpdate={handleRAIDUpdate}
                    onDelete={handleRAIDDelete}
                    onAdd={(type) => handleAddRAIDItem(type)}
                  />
                )}

                {activeTab === 'ROADMAP' && (
                  <Roadmap 
                    tasks={tasks} 
                    milestones={milestones} 
                    onTaskClick={(taskId) => setSelectedTaskId(taskId)}
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
                              {selectedTypeForCreation === 'RD' && !selectingRDPhase ? (
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
                              ) : selectedTypeForCreation === 'RD' && selectingRDPhase ? (
                                <div className="space-y-4 p-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Initial Phase</h4>
                                    <button onClick={() => setSelectingRDPhase(false)} className="text-[10px] font-bold text-blue-600 hover:underline">Back</button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    {(['IDEA', 'POC', 'MVP', 'DELIVERY'] as RDPhase[]).map((phase) => (
                                      <button
                                        key={phase}
                                        onClick={() => handleCreateManualProject('RD', phase)}
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
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
        />
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

