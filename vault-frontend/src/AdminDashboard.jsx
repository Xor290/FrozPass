import React, { useState, useEffect } from 'react';
import { LogOut, Users, Key, Shield, Menu, X, Trash2, Search, RefreshCw, UserPlus, Edit } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/admin';

// ========================================
// UTILITY COMPONENTS
// ========================================

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #404040',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{
            color: '#ffffff',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            letterSpacing: '-0.025em',
          }}>
            {title}
          </h2>
          <button onClick={onClose} style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#a0aec0',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

const Alert = ({ alert }) => {
  if (!alert.show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      backgroundColor: alert.type === 'success' ? '#10b981' : alert.type === 'error' ? '#ef4444' : '#2563eb',
      color: '#ffffff',
      padding: '1rem 1.5rem',
      borderRadius: '0.75rem',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      zIndex: 100,
      minWidth: '300px',
      animation: 'slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s',
      fontWeight: '500',
      fontSize: '0.95rem',
    }}>
      {alert.type === 'success' ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" fill="white" fillOpacity="0.2"/>
          <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" fill="white" fillOpacity="0.2"/>
          <path d="M10 6V11M10 14V14.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
      <span>{alert.message}</span>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const ConfirmDialog = ({ dialog, onCancel, onConfirm }) => {
  if (!dialog.show) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #404040',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          opacity: 0.9,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        
        <h2 style={{
          color: '#ffffff',
          margin: '0 0 0.75rem 0',
          fontSize: '1.375rem',
          fontWeight: '700',
          textAlign: 'center',
          letterSpacing: '-0.025em',
        }}>
          {dialog.title}
        </h2>
        
        <p style={{
          color: '#a0aec0',
          margin: '0 0 2rem 0',
          fontSize: '0.95rem',
          textAlign: 'center',
          lineHeight: '1.5',
        }}>
          {dialog.message}
        </p>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} style={{
            flex: 1,
            backgroundColor: 'transparent',
            color: '#a0aec0',
            border: '1px solid #4a5568',
            padding: '0.875rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex: 1,
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            padding: '0.875rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
          }}>
            Confirm
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div style={{ position: 'relative' }}>
    <Search size={20} style={{ 
      position: 'absolute', 
      left: '-2.5rem', 
      top: '50%', 
      transform: 'translateY(-50%)', 
      color: '#a0aec0' 
    }} />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: '100%',
        maxWidth: '400px',
        marginLeft: '-50px',
        padding: '0.75rem 1rem 0.75rem 2.5rem',
        backgroundColor: '#2d3748',
        border: '1px solid #4a5568',
        borderRadius: '0.5rem',
        color: '#ffffff',
        fontSize: '0.95rem',
      }}
    />
  </div>
);

// ========================================
// CREATE GROUP MODAL COMPONENT
// ========================================

const CreateGroupModal = ({ isOpen, onClose, onSubmit, users }) => {
  const [formData, setFormData] = useState({
    group_name: '',
    usernames: []
  });
  const [searchUser, setSearchUser] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.group_name.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);
    
    if (success) {
      setFormData({ group_name: '', usernames: [] });
      setSearchUser('');
    }
  };

  const handleAddUser = (username) => {
    if (!formData.usernames.includes(username)) {
      setFormData(prev => ({
        ...prev,
        usernames: [...prev.usernames, username]
      }));
    }
  };

  const handleRemoveUser = (username) => {
    setFormData(prev => ({
      ...prev,
      usernames: prev.usernames.filter(u => u !== username)
    }));
  };
  const availableUsers = users.filter(user => 
    !formData.usernames.includes(user.username) &&
    user.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            color: '#a0aec0', 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            marginBottom: '0.5rem' 
          }}>
            Group Name *
          </label>
          <input
            type="text"
            value={formData.group_name}
            onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
            placeholder="Enter group name"
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#2d3748',
              border: '1px solid #4a5568',
              borderRadius: '0.5rem',
              color: '#ffffff',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            color: '#a0aec0', 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            marginBottom: '0.5rem' 
          }}>
            Add Users (Optional)
          </label>
          
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="Search users..."
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#2d3748',
              border: '1px solid #4a5568',
              borderRadius: '0.5rem',
              color: '#ffffff',
              fontSize: '0.95rem',
              marginBottom: '0.75rem',
              boxSizing: 'border-box',
            }}
          />

          {formData.usernames.length > 0 && (
            <div style={{ 
              marginBottom: '0.75rem', 
              padding: '0.75rem', 
              backgroundColor: '#2d3748', 
              borderRadius: '0.5rem',
              border: '1px solid #4a5568'
            }}>
              <p style={{ color: '#a0aec0', fontSize: '0.75rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                Selected Users ({formData.usernames.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {formData.usernames.map(username => (
                  <div key={username} style={{
                    backgroundColor: '#2563eb20',
                    color: '#2563eb',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <span>{username}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(username)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#2563eb',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchUser && availableUsers.length > 0 && (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              backgroundColor: '#2d3748',
              border: '1px solid #4a5568',
              borderRadius: '0.5rem',
              padding: '0.5rem',
            }}>
              {availableUsers.slice(0, 5).map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    handleAddUser(user.username);
                    setSearchUser('');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a5568'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ fontWeight: '500' }}>{user.username}</div>
                  {user.email && (
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.25rem' }}>
                      {user.email}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: '#a0aec0',
              border: '1px solid #4a5568',
              padding: '0.875rem',
              borderRadius: '0.5rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting || !formData.group_name.trim()}
            style={{
              flex: 1,
              backgroundColor: isSubmitting || !formData.group_name.trim() ? '#4a5568' : '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '0.875rem',
              borderRadius: '0.5rem',
              cursor: isSubmitting || !formData.group_name.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              boxShadow: isSubmitting || !formData.group_name.trim() ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Creating...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Create Group
              </>
            )}
          </button>
        </div>
      </form>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
};

// ========================================
// STAT CARD COMPONENT
// ========================================

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div style={{
    backgroundColor: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    flex: 1,
    minWidth: '200px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
      <div style={{ 
        width: '48px', 
        height: '48px', 
        borderRadius: '0.75rem', 
        backgroundColor: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <p style={{ color: '#a0aec0', fontSize: '0.875rem', margin: 0 }}>{title}</p>
        <h3 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
          {value}
        </h3>
      </div>
    </div>
  </div>
);

// ========================================
// USER CARD COMPONENT
// ========================================

const UserCard = ({ user, onDelete, getGroupName }) => (
  <div style={{
    backgroundColor: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '0.5rem',
    padding: '1.25rem',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
            {user.username}
          </h3>
          {user.role === 'admin' && (
            <span style={{ 
              backgroundColor: '#dc262620', 
              color: '#dc2626', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '9999px', 
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              ADMIN
            </span>
          )}
        </div>
        {user.email && (
          <p style={{ color: '#a0aec0', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
            {user.email}
          </p>
        )}
        {user.group_id && (
          <p style={{ color: '#2563eb', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
            Group: {getGroupName(user.group_id)}
          </p>
        )}
        <p style={{ color: '#718096', fontSize: '0.75rem', margin: 0 }}>
          Joined: {new Date(user.created_at).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={() => onDelete(user.id)}
        style={{
          backgroundColor: '#dc2626',
          color: '#ffffff',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  </div>
);

// ========================================
// GROUP CARD COMPONENT
// ========================================

const GroupCard = ({ group, onDelete, onEdit }) => (
  <div style={{
    backgroundColor: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '0.5rem',
    padding: '1.25rem',
  }}>
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
        <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
          {group.name}
        </h3>
        <span style={{
          backgroundColor: '#2563eb20',
          color: '#2563eb',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          {group.member_count} members
        </span>
      </div>
    </div>

    <p style={{ color: '#718096', fontSize: '0.75rem', marginBottom: '1rem' }}>
      Created: {new Date(group.created_at).toLocaleDateString()}
    </p>

    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        onClick={() => onEdit(group)}
        style={{
          flex: 1,
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <Edit size={16} />
        Edit
      </button>
      <button
        onClick={() => onDelete(group.id)}
        style={{
          flex: 1,
          backgroundColor: '#dc2626',
          color: '#ffffff',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  </div>
);

// ========================================
// MAIN DASHBOARD COMPONENT
// ========================================

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGroups: 0,
  });
  
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [loading, setLoading] = useState({ users: false, groups: false });
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };

  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({ show: true, title, message, onConfirm });
  };

  const updateStats = (newStats) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'No Group';
  };

  const getAuthToken = () => {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const fetchUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    const token = getAuthToken();
    
    if (!token) {
      showAlert('error', 'Authentication required');
      setLoading(prev => ({ ...prev, users: false }));
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/secure/get/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
      });
      
      if (response.status === 401) {
        showAlert('error', 'Session expired');
        localStorage.removeItem('token');
        setTimeout(() => window.location.href = '/login-admin', 2000);
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
      updateStats({ totalUsers: data.length });
      
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showAlert('error', `Failed to fetch users: ${error.message}`);
      
      const mockUsers = [
        { id: 1, username: 'john_doe', email: 'john@example.com', created_at: '2024-01-15T10:30:00Z', role: 'user', group_id: 1 },
        { id: 2, username: 'jane_smith', email: 'jane@example.com', created_at: '2024-02-20T14:20:00Z', role: 'user', group_id: 2 },
        { id: 3, username: 'admin_user', email: 'admin@example.com', created_at: '2024-01-01T08:00:00Z', role: 'admin', group_id: null },
      ];
      setUsers(mockUsers);
      updateStats({ totalUsers: mockUsers.length });
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchGroups = async () => {
    setLoading(prev => ({ ...prev, groups: true }));
    const token = getAuthToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/secure/get/groups`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      console.log(data);
      setGroups(Array.isArray(data) ? data : []);
      updateStats({ totalGroups: data.length });
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      const mockGroups = [
        { 
          id: 1, 
          name: 'Developers', 
          description: 'Development team members with full access',
          member_count: 5,
          created_at: '2024-01-10T09:00:00Z' 
        },
        { 
          id: 2, 
          name: 'Managers', 
          description: 'Management and oversight team',
          member_count: 3,
          created_at: '2024-01-12T10:00:00Z' 
        },
        { 
          id: 3, 
          name: 'Support Team', 
          description: 'Customer support representatives',
          member_count: 8,
          created_at: '2024-01-15T11:00:00Z' 
        },
      ];
      setGroups(mockGroups);
      updateStats({ totalGroups: mockGroups.length });
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const refreshData = () => {
    if (activeTab === 'users' || activeTab === 'stats') fetchUsers();
    if (activeTab === 'groups' || activeTab === 'stats') fetchGroups();
    showAlert('success', 'Data refreshed successfully!');
  };

  const createGroup = async (groupData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        showAlert('error', 'Authentication required');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/secure/create/groups`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          group_name: groupData.group_name,
          usernames: groupData.usernames || []
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group');
      }

      const result = await response.json();
      showAlert('success', result.message || 'Group created successfully!');
      
      await fetchGroups();
      setShowCreateGroupModal(false);
      return true;
    } catch (error) {
      console.error('Failed to create group:', error);
      showAlert('error', `Failed to create group: ${error.message}`);
      return false;
    }
  };

  const handleLogout = () => {
    showConfirmDialog(
      'Confirm Logout',
      'Are you sure you want to logout?',
      () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showAlert('success', 'Logged out successfully');
        setTimeout(() => window.location.href = '/login-admin', 1000);
      }
    );
  };

  const deleteUser = (userId) => {
    showConfirmDialog(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
          });

          if (!response.ok) throw new Error('Failed to delete user');

          setUsers(prev => prev.filter(u => u.id !== userId));
          showAlert('success', 'User deleted successfully!');
          updateStats({ totalUsers: users.length - 1 });
        } catch (error) {
          console.error('Failed to delete user:', error);
          showAlert('error', 'Failed to delete user');
        }
      }
    );
  };

  const deleteGroup = (groupId) => {
    showConfirmDialog(
      'Delete Group',
      'Are you sure you want to delete this group? Users in this group will be unassigned.',
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/admin/groups/${groupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
          });

          if (!response.ok) throw new Error('Failed to delete group');

          setGroups(prev => prev.filter(g => g.id !== groupId));
          setUsers(prev => prev.map(u => u.group_id === groupId ? { ...u, group_id: null } : u));
          showAlert('success', 'Group deleted successfully!');
          updateStats({ totalGroups: groups.length - 1 });
        } catch (error) {
          console.error('Failed to delete group:', error);
          showAlert('error', 'Failed to delete group');
        }
      }
    );
  };

  const editGroup = (group) => {
    showAlert('info', 'Edit functionality coming soon!');
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      showAlert('error', 'Please login as admin first');
      setTimeout(() => window.location.href = '/login-admin', 1500);
      return;
    }
    fetchUsers();
    fetchGroups();
  }, []);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderNavButton = (tab, icon, label) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setSearchTerm('');
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        backgroundColor: activeTab === tab ? '#dc2626' : 'transparent',
        color: activeTab === tab ? '#ffffff' : '#a0aec0',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '0.95rem',
        fontWeight: '500',
        justifyContent: 'flex-start',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const renderStatsTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
          Dashboard Overview
        </h2>
        <button onClick={refreshData} style={{
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          padding: '0.625rem 1.25rem',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard icon={Users} title="Total Users" value={stats.totalUsers} color="#2563eb" />
        <StatCard icon={Shield} title="User Groups" value={stats.totalGroups} color="#10b981" />
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
          User Management
        </h2>
        <SearchBar 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
        />
      </div>

      {loading.users ? (
        <p style={{ color: '#718096', textAlign: 'center', marginTop: '2rem' }}>Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p style={{ color: '#718096', textAlign: 'center', marginTop: '2rem' }}>No users found</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredUsers.map(user => (
            <UserCard 
              key={user.id} 
              user={user} 
              onDelete={deleteUser}
              getGroupName={getGroupName}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderGroupsTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
          User Groups
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <SearchBar 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups..."
          />
          <button 
            onClick={() => setShowCreateGroupModal(true)}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            <UserPlus size={18} />
            New Group
          </button>
        </div>
      </div>

      {loading.groups ? (
        <p style={{ color: '#718096', textAlign: 'center', marginTop: '2rem' }}>Loading groups...</p>
      ) : filteredGroups.length === 0 ? (
        <p style={{ color: '#718096', textAlign: 'center', marginTop: '2rem' }}>No groups found</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredGroups.map(group => (
            <GroupCard 
              key={group.id} 
              group={group} 
              onDelete={deleteGroup}
              onEdit={editGroup}
            />
          ))}
        </div>
      )}
    </div>
  );

  const getPageTitle = () => {
    switch (activeTab) {
      case 'users': return 'User Management';
      case 'groups': return 'User Groups';
      case 'stats': return 'Dashboard Overview';
      default: return 'Admin Dashboard';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
      <div style={{
        width: sidebarOpen ? '260px' : '0px',
        backgroundColor: '#1a1a1a',
        borderRight: '1px solid #333333',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid #333333',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '0.5rem',
            backgroundColor: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shield size={24} color="#ffffff" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            Admin Panel
          </h2>
        </div>

        <nav style={{
          flex: 1,
          padding: '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {renderNavButton('stats', <Shield size={20} style={{ flexShrink: 0 }} />, 'Dashboard')}
          {renderNavButton('users', <Users size={20} style={{ flexShrink: 0 }} />, 'Users')}
          {renderNavButton('groups', <Key size={20} style={{ flexShrink: 0 }} />, 'Groups')}
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid #333333' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.95rem',
              fontWeight: '500',
              justifyContent: 'flex-start',
            }}
          >
            <LogOut size={20} style={{ flexShrink: 0 }} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.3rem 1.5rem',
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #333333',
          color: '#ffffff',
          height: '70px',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              borderRadius: '0.375rem',
            }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
            {getPageTitle()}
          </h1>
          <div style={{ width: '44px' }} />
        </div>

        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', backgroundColor: '#0f0f0f' }}>
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'groups' && renderGroupsTab()}
        </div>
      </div>

      <Alert alert={alert} />

      <ConfirmDialog 
        dialog={confirmDialog}
        onCancel={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
        }}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSubmit={createGroup}
        users={users}
      />
    </div>
  );
}