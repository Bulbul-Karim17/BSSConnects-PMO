import React, { useState, useEffect } from 'react';
import { Project, Task, RAIDItem, Milestone } from './types';
import { ProjectCard } from './components/ProjectCard';
import { FileUpload } from './components/FileUpload';
import { AgileBoard } from './components/AgileBoard';
import { WaterfallView } from './components/WaterfallView';
import { RAIDLog } from './components/RAIDLog';
import { Roadmap } from './components/Roadmap';
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  Bell, 
  User, 
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
  Loader2
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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BACKLOG' | 'TASKS' | 'RAID' | 'ROADMAP'>('OVERVIEW');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleFileAnalyzed = async (data: any) => {
    if (!user) return;
    setIsSaving(true);

    const projectId = Math.random().toString(36).substr(2, 9);
    const newProject: Project = {
      name: data.project?.name || 'New Project',
      description: data.project?.description || '',
      type: data.project?.type || 'RD',
      lifecycle: data.project?.type === 'RD' ? (data.project?.lifecycle || 'IDEA') : undefined,
      client: data.project?.client || '',
      startDate: data.project?.startDate || new Date().toISOString().split('T')[0],
      targetGoLive: data.project?.targetGoLive || '',
      id: projectId,
      ownerId: user.uid,
      status: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const batch = writeBatch(db);
      
      // Project doc
      batch.set(doc(db, 'projects', projectId), newProject);

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
    } catch (error) {
      console.error("Error saving project:", error);
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateManualProject = async (type: 'RD' | 'DELIVERY') => {
    if (!user) return;
    setIsSaving(true);

    const projectId = Math.random().toString(36).substr(2, 9);
    const newProject: Project = {
      name: `New ${type === 'RD' ? 'R&D' : 'Delivery'} Project`,
      description: 'Manually created project. Add details here.',
      type,
      lifecycle: type === 'RD' ? 'IDEA' : undefined,
      id: projectId,
      ownerId: user.uid,
      status: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startDate: new Date().toISOString().split('T')[0],
    };

    try {
      await setDoc(doc(db, 'projects', projectId), newProject);
      setSelectedProjectId(projectId);
      setShowNewProjectModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromoteToDelivery = async () => {
    if (!selectedProject || selectedProject.type !== 'RD' || !user) return;
    
    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        type: 'DELIVERY',
        updatedAt: Date.now()
      });
      setActiveTab('OVERVIEW');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProject.id}`);
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

  const handleTaskUpdate = async (taskId: string, newStatus: Task['status']) => {
    if (!selectedProjectId || !user) return;
    try {
      await updateDoc(doc(db, 'projects', selectedProjectId, 'tasks', taskId), {
        status: newStatus,
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

  const taskStats = [
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
            onClick={() => setSelectedProjectId(null)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              !selectedProjectId ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <Briefcase className="w-4 h-4" />
            All Projects
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <BarChart3 className="w-4 h-4" />
            Reports
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
                <button onClick={() => setSelectedProjectId(null)} className="hover:text-blue-600 transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-900 font-medium">{selectedProject.name}</span>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-slate-900">Project Dashboard</h1>
            )}
            <p className="text-sm text-slate-500">
              {selectedProject ? `Managing ${selectedProject.type} lifecycle` : 'Overview of all your active projects and initiatives.'}
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
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
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
              <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 w-fit">
                {[
                  { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
                  ...(selectedProject?.type === 'RD' ? [{ id: 'BACKLOG', label: 'Backlog', icon: Layers }] : []),
                  { id: 'TASKS', label: selectedProject?.type === 'RD' ? 'Scrum Board' : 'WBS / Tasks', icon: Layers },
                  { id: 'RAID', label: 'RAID Log', icon: ShieldAlert },
                  { id: 'ROADMAP', label: 'Roadmap', icon: Calendar },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
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
                          <h2 className="text-2xl font-bold text-slate-900">{selectedProject?.name}</h2>
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 border border-slate-200"><Share2 className="w-4 h-4" /></button>
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

                      {selectedProject?.type === 'RD' && (
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl shadow-purple-500/20">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <Zap className="w-6 h-6" />
                              <h3 className="text-xl font-bold">R&D Lifecycle</h3>
                            </div>
                            <button 
                              onClick={handlePromoteToDelivery}
                              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-white/20"
                            >
                              Promote to Delivery
                            </button>
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
                      <button 
                        onClick={() => selectedProjectId && handleAddTask(selectedProjectId, 'BACKLOG')}
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Item
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {tasks.filter(t => t.status === 'BACKLOG').length > 0 ? (
                        tasks.filter(t => t.status === 'BACKLOG').map(task => (
                          <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4 flex-grow">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                <Layers className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
                                <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                                <User className="w-3 h-3" />
                                <span>{task.owner}</span>
                              </div>
                              <button 
                                onClick={() => handleTaskUpdate(task.id, 'TODO')}
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

                {activeTab === 'TASKS' && (
                  selectedProject?.type === 'RD' ? (
                    <AgileBoard 
                      tasks={tasks} 
                      onTaskUpdate={handleTaskUpdate} 
                      onAddTask={(status) => selectedProjectId && handleAddTask(selectedProjectId, status)} 
                    />
                  ) : (
                    <WaterfallView tasks={tasks} />
                  )
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
                  <Roadmap tasks={tasks} milestones={milestones} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Create New Project</h2>
                <button onClick={() => setShowNewProjectModal(false)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Smart Import</h3>
                  <FileUpload onFileAnalyzed={handleFileAnalyzed} />
                </div>

                <div className="relative flex items-center gap-3 mb-6">
                  <div className="flex-grow h-px bg-slate-100" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">OR START MANUALLY</span>
                  <div className="flex-grow h-px bg-slate-100" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleCreateManualProject('RD')}
                    disabled={isSaving}
                    className="p-4 border-2 border-slate-100 rounded-xl text-left hover:border-purple-400 hover:bg-purple-50 transition-all group disabled:opacity-50"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                      {isSaving ? <Loader2 className="w-4 h-4 text-purple-600 animate-spin" /> : <Zap className="w-4 h-4 text-purple-600" />}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-0.5">R&D Project</h4>
                    <p className="text-[10px] text-slate-500 leading-tight">Agile methodology with Scrum boards.</p>
                  </button>
                  <button 
                    onClick={() => handleCreateManualProject('DELIVERY')}
                    disabled={isSaving}
                    className="p-4 border-2 border-slate-100 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all group disabled:opacity-50"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                      {isSaving ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> : <ArrowLeft className="w-4 h-4 text-blue-600 rotate-180" />}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-0.5">Delivery Project</h4>
                    <p className="text-[10px] text-slate-500 leading-tight">Waterfall methodology with WBS.</p>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

const Flag = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" x2="4" y1="22" y2="15" />
  </svg>
);

