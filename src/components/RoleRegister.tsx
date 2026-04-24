import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, ProjectMember, Project } from '../types';
import { 
  Users, 
  Shield, 
  UserPlus, 
  Check, 
  X, 
  UserCheck, 
  Trash2, 
  Search,
  Lock,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface RoleRegisterProps {
  currentUser: UserProfile;
  projects: Project[];
}

export const RoleRegister: React.FC<RoleRegisterProps> = ({ currentUser, projects }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roles: UserRole[] = ['ADMIN', 'PM', 'OWNER', 'DEVELOPER', 'STAKEHOLDER'];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PM': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'OWNER': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'DEVELOPER': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <Lock className="w-16 h-16 text-slate-200 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Access Restricted</h3>
        <p className="text-slate-500 max-w-sm">Only system administrators can access the Role Register.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              Role Register
            </h3>
            <p className="text-sm text-slate-500">Manage user permissions and global access levels.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Role</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold">
                        {u.displayName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.displayName || 'Unnamed User'}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold border uppercase",
                      getRoleBadgeColor(u.role)
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      {roles.map(role => (
                        <button
                          key={role}
                          onClick={() => handleUpdateRole(u.uid, role)}
                          disabled={isUpdating || u.uid === currentUser.uid}
                          className={cn(
                            "px-2 py-1 rounded-md text-[9px] font-bold transition-all border",
                            u.role === role 
                              ? "bg-slate-900 text-white border-slate-900" 
                              : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-20 text-center">
                    <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">No users found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl shadow-purple-500/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold">Access Matrix Guide</h4>
            <p className="text-indigo-100 text-sm">Understand what each role permits.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div className="bg-white/10 p-4 rounded-xl border border-white/10">
            <p className="font-bold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> ADMIN / PM
            </p>
            <p className="text-indigo-100 leading-relaxed">Full access to everything: edit, delete, manage roles, and project lifecycle.</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/10">
            <p className="font-bold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> OWNER
            </p>
            <p className="text-indigo-100 leading-relaxed">Access to view all, focus on Data Library and High-Level documentation.</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/10">
            <p className="font-bold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> DEVELOPER
            </p>
            <p className="text-indigo-100 leading-relaxed">Only sees projects they are assigned to. Full edit access within those projects.</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/10">
            <p className="font-bold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> STAKEHOLDER
            </p>
            <p className="text-indigo-100 leading-relaxed">Limited view of Overview only. No edit permissions anywhere.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
