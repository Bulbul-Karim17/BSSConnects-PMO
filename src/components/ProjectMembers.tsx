import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, ProjectMember, Project } from '../types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Search,
  Shield,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

interface ProjectMembersProps {
  project: Project;
  currentUser: UserProfile;
}

export const ProjectMembers: React.FC<ProjectMembersProps> = ({ project, currentUser }) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('DEVELOPER');

  useEffect(() => {
    const q = query(collection(db, 'projectMembers'), where('projectId', '==', project.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => doc.data() as ProjectMember));
    });
    return () => unsubscribe();
  }, [project.id]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setAllUsers(snap.docs.map(doc => doc.data() as UserProfile));
    };
    fetchUsers();
  }, []);

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setIsAdding(true);
    try {
      const user = allUsers.find(u => u.uid === selectedUserId);
      if (!user) return;

      const memberId = `${selectedUserId}_${project.id}`;
      const newMember: ProjectMember = {
        id: memberId,
        userId: selectedUserId,
        projectId: project.id,
        role: selectedRole,
        email: user.email,
        assignedAt: Date.now()
      };

      await setDoc(doc(db, 'projectMembers', memberId), newMember);
      setSelectedUserId('');
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, 'projectMembers', memberId));
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const availableUsers = allUsers.filter(u => 
    !members.find(m => m.userId === u.uid) && 
    (u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Project Team Members
            </h3>

            <div className="space-y-4">
              {members.length > 0 ? members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold border border-slate-100">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{member.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-100">
                          {member.role}
                        </span>
                        <span className="text-[9px] text-slate-400">Joined {new Date(member.assignedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                  <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-sm text-slate-400">No team members assigned yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              Add Member
            </h4>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Search User</label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Email or Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                
                <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-50 rounded-xl p-1 bg-slate-50/30">
                  {availableUsers.map(u => (
                    <button
                      key={u.uid}
                      onClick={() => setSelectedUserId(u.uid)}
                      className={cn(
                        "w-full text-left p-2 rounded-lg text-xs font-medium transition-all",
                        selectedUserId === u.uid ? "bg-blue-600 text-white" : "hover:bg-white text-slate-600"
                      )}
                    >
                      {u.email}
                    </button>
                  ))}
                  {availableUsers.length === 0 && (
                    <p className="p-3 text-center text-[10px] text-slate-400">No users found</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Project Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {['DEVELOPER', 'OWNER', 'PM', 'STAKEHOLDER'].map(role => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role as UserRole)}
                      className={cn(
                        "py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                        selectedRole === role ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || isAdding}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Assign to Project
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Access Control
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Assigning a user as a <span className="text-white">DEVELOPER</span> gives them project-specific access. <span className="text-white">OWNERS</span> focus on Library data, and <span className="text-white">STAKEHOLDERS</span> have a restricted Overview view.
            </p>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
              <Globe className="w-3 h-3 text-emerald-400" />
              Real-time membership sync
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Globe = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
