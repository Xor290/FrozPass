import React, { useState, useEffect } from 'react';
import { LogOut, Key, Menu, X, User, Settings, Eye, EyeOff, Copy, ExternalLink, Users } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = 'http://192.168.1.40:30081/api';

export default function Dashboard() {
  // ========== STATE MANAGEMENT ==========
  const [activeTab, setActiveTab] = useState('accounts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data states
  const [apiKeys, setApiKeys] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [groups, setGroups] = useState([]);
  
  // Modal states
  const [showApiKeyModalToGroup, setShowApiKeyModalToGroup] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAccountModalToGroup, setShowAccountModalToGroup] = useState(false);

  // Form states
  const [newAccountToGroup, setNewAccountToGroup] = useState({ group_name: '', title: '', userAccount: '', passwordAccount: '', urlAccount: '' });
  const [newApiKeyToGroup, setNewApiKeyToGroup] = useState({ group_name: '', title: '', key: ''});
  const [newApiKey, setNewApiKey] = useState({ title: '', key: '' });
  const [newAccount, setNewAccount] = useState({ title: '', userAccount: '', passwordAccount: '', urlAccount: '' });

  // View states
  const [showApiKey, setShowApiKey] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [groupPasswords, setGroupPasswords] = useState({});
  const [showGroupPasswords, setShowGroupPasswords] = useState({});
  const [groupApiKeys, setGroupApiKeys] = useState({});
  
  // User states
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentGroup, setCurrentGroup] = useState('');
  const [userProfile, setUserProfile] = useState({ name: '', avatar: null });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ ...userProfile });

  // Alert & Confirm states
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });

  // Loading states
  const [loading, setLoading] = useState({ apiKeys: false, accounts: false, groups: false });

  // ========== ALERT & CONFIRM HELPERS ==========
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };

  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({ show: true, title, message, onConfirm });
  };

  // ========== AUTH HELPERS ==========
  const getAuthToken = () => localStorage.getItem('token');

  const getMe = async () => {
    if (!getAuthToken()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/secure/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      setCurrentUsername(data.username);
      setUserProfile({ name: data.username, avatar: null });
      return data.username;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  const handleApiError = (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      showAlert('error', 'Session expired. Please login again.');
      handleLogout();
    }
  };

  // ========== DATA FETCHING ==========
  const fetchApiKeys = async (username) => {
    if (!getAuthToken() || !username) return;
    setLoading(prev => ({ ...prev, apiKeys: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/secure/get/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ username }),
      });
      
      if (response.status === 404) {
        setApiKeys([]);
        return;
      }
      
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      setApiKeys(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setApiKeys([]);
    } finally {
      setLoading(prev => ({ ...prev, apiKeys: false }));
    }
  };

  const fetchAccounts = async (username) => {
    if (!getAuthToken() || !username) return;
    setLoading(prev => ({ ...prev, accounts: true }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/secure/get/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ username }),
      });
      
      if (response.status === 404) {
        setAccounts([]);
        return;
      }
      
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(prev => ({ ...prev, accounts: false }));
    }
  };

  const fetchGroups = async (username) => {
    if (!getAuthToken() || !username) return;
    setLoading(prev => ({ ...prev, groups: true }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/secure/get/groups-by-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ username }),
      });
      
      if (response.status === 404) {
        setGroups([]);
        return;
      }
      
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      setGroups(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  // ========== FETCH ACCOUNTS & API KEYS FOR GROUPS ==========

  const fetchAccountsForGroup = async (groupName) => {
    if (!getAuthToken() || !groupName) return;
    setLoading(prev => ({ ...prev, accounts: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/secure/get/account/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ group_name: groupName }),
      });

      if (response.status === 404) {
        console.warn(`Aucun compte trouvé pour le groupe ${groupName}`);
        setGroupPasswords(prev => ({ ...prev, [groupName]: [] }));
        return;
      }

      if (!response.ok) throw new Error(`Erreur ${response.status}`);

      const data = await response.json();
      setGroupPasswords(prev => ({ ...prev, [groupName]: Array.isArray(data) ? data : [data] }));

    } catch (error) {
      console.error(`Failed to fetch accounts for group ${groupName}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, accounts: false }));
    }
  };

  const fetchApiKeysForGroup = async (groupName) => {
    if (!getAuthToken() || !groupName) return;
    setLoading(prev => ({ ...prev, apiKeys: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/secure/get/api-key/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ group_name: groupName }),
      });

      if (response.status === 404) {
        console.warn(`Aucune clé API trouvée pour le groupe ${groupName}`);
        setGroupApiKeys(prev => ({ ...prev, [groupName]: [] }));
        return;
      }

      if (!response.ok) throw new Error(`Erreur ${response.status}`);

      const data = await response.json();
      setGroupApiKeys(prev => ({ ...prev, [groupName]: Array.isArray(data) ? data : [data] }));
      console.log('API Keys fetched:', data);

    } catch (error) {
      console.error(`Failed to fetch API keys for group ${groupName}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, apiKeys: false }));
    }
  };

  const fetchAllData = async () => {
    const username = await getMe();
    if (username) {
      await Promise.all([
        fetchApiKeys(username), 
        fetchAccounts(username),
        fetchGroups(username)
      ]);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      showAlert('error', 'Please login first');
      setTimeout(() => window.location.href = '/login', 1500);
      return;
    }
    fetchAllData();
  }, []);

  // ========== UTILITY FUNCTIONS ==========
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showAlert('success', 'Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      showAlert('error', 'Failed to copy');
    });
  };

  const openUrl = (url) => {
    if (url && !url.startsWith('http')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  };

  const toggleShowApiKey = (id) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleShowPassword = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ========== HANDLERS ==========
  const handleLogout = () => {
    showConfirmDialog(
      'Confirm Logout',
      'Are you sure you want to logout?',
      () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showAlert('success', 'Logged out successfully');
        setTimeout(() => window.location.href = '/login', 1000);
      }
    );
  };

  const addAccountToGroup = async () => {
    if (!newAccountToGroup.title || !newAccountToGroup.urlAccount || !newAccountToGroup.passwordAccount || !newAccountToGroup.userAccount) {
      showAlert('error', 'Please fill all fields');
      return;        
    }

    try {
      const response = await fetch(`${API_BASE_URL}/secure/add/account/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          group_name: currentGroup,
          user_account: newAccountToGroup.userAccount,
          password_account: newAccountToGroup.passwordAccount,
          title: newAccountToGroup.title,
          url: newAccountToGroup.urlAccount
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add account');
      }

      await fetchAccountsForGroup(currentGroup);
      setNewAccountToGroup({ group_name: '', title: '', userAccount: '', passwordAccount: '', urlAccount: '' });
      setShowAccountModalToGroup(false);
      showAlert('success', 'Account added successfully!');
    } catch (error) {
      console.error('Failed to add account:', error);
      showAlert('error', error.message || 'Failed to add account');
    }
  };

  const addApiKeyToGroup = async () => {
    if (!newApiKeyToGroup.title || !newApiKeyToGroup.key) {
      showAlert('error', 'Please fill all fields');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/secure/add/api-key/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          group_name: currentGroup,
          api_key: newApiKeyToGroup.key,
          title: newApiKeyToGroup.title
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add API key');
      }
      
      await fetchApiKeysForGroup(currentGroup);
      setNewApiKeyToGroup({ group_name: '', title: '', key: '' });
      setShowApiKeyModalToGroup(false);
      showAlert('success', 'API key added successfully!');
    } catch (error) {
      console.error('Failed to add API key:', error);
      showAlert('error', error.message || 'Failed to add API key');
    }
  };

  const addApiKey = async () => {
    if (!newApiKey.title || !newApiKey.key) {
      showAlert('error', 'Please fill all fields');
      return;
    }
    
    let username = currentUsername;
    if (!username) {
      username = await getMe();
      if (!username) {
        showAlert('error', 'Unable to get user information');
        return;
      }
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/secure/add/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          username: username,
          api_key: newApiKey.key,
          title: newApiKey.title
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add API key');
      }
      
      await fetchApiKeys(username);
      setNewApiKey({ title: '', key: '' });
      setShowApiKeyModal(false);
      showAlert('success', 'API key added successfully!');
    } catch (error) {
      console.error('Failed to add API key:', error);
      showAlert('error', error.message || 'Failed to add API key');
    }
  };

  const addAccount = async () => {
    if (!newAccount.title || !newAccount.userAccount || !newAccount.passwordAccount) {
      showAlert('error', 'Please fill all required fields');
      return;
    }
    
    let username = currentUsername;
    if (!username) {
      username = await getMe();
      if (!username) {
        showAlert('error', 'Unable to get user information');
        return;
      }
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/secure/add/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          username: username,
          user_account: newAccount.userAccount,
          password_account: newAccount.passwordAccount,
          title: newAccount.title,
          url: newAccount.urlAccount
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add account');
      }
      
      await fetchAccounts(username);
      setNewAccount({ title: '', userAccount: '', passwordAccount: '', urlAccount: '' });
      setShowAccountModal(false);
      showAlert('success', 'Account added successfully!');
    } catch (error) {
      console.error('Failed to add account:', error);
      showAlert('error', error.message || 'Failed to add account');
    }
  };

  const deleteApiKey = (apiKeyId) => {
    const token = getAuthToken();
    
    showConfirmDialog(
      'Delete API Key',
      'Are you sure you want to delete this API key? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/secure/delete/api-key`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id: apiKeyId }),
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error('Delete failed:', errorData);
            throw new Error('Failed to delete API key');
          }

          setApiKeys(prev => prev.filter(k => k.id !== apiKeyId));
          setShowApiKey(prev => {
            const newState = { ...prev };
            delete newState[apiKeyId];
            return newState;
          });
          showAlert('success', 'API key deleted successfully!');
        } catch (error) {
          handleApiError(error);
          showAlert('error', 'Failed to delete API key');
        }
      }
    );
  };

  const deleteAccount = (accountId) => {
    showConfirmDialog(
      'Delete Account',
      'Are you sure you want to delete this account? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/secure/delete/account`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ id: accountId })
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error('Delete failed:', errorData);
            throw new Error('Failed to delete account');
          }

          setAccounts(prev => prev.filter(a => a.id !== accountId));
          setShowPassword(prev => {
            const newState = { ...prev };
            delete newState[accountId];
            return newState;
          });
          showAlert('success', 'Account deleted successfully!');
        } catch (error) {
          handleApiError(error);
          showAlert('error', 'Failed to delete account');
        }
      }
    );
  };

  // Profile handlers
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditProfileData({ ...userProfile });
  };

  const handleSaveProfile = () => {
    setUserProfile({ ...editProfileData });
    setIsEditingProfile(false);
    showAlert('success', 'Profile updated successfully!');
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditProfileData({ ...userProfile });
  };

  const handleAddAccountToGroup = (groupName) => {
    setCurrentGroup(groupName);
    setShowAccountModalToGroup(true);
  };

  const handleAddApiKeyToGroup = (groupName) => {
    setCurrentGroup(groupName);
    setShowApiKeyModalToGroup(true);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditProfileData({ ...editProfileData, avatar: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // ========== STYLES ==========
  const styles = {
    navButton: (isActive) => ({
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.875rem 1rem',
      backgroundColor: isActive ? '#2563eb' : 'transparent',
      color: isActive ? '#ffffff' : '#a0aec0',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.95rem',
      fontWeight: '500',
      justifyContent: 'flex-start',
    }),
    actionButton: {
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: 'none',
      padding: '0.625rem 1.25rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
    },
    secondaryButton: {
      backgroundColor: '#4a5568',
      color: '#ffffff',
      border: 'none',
      padding: '0.625rem 1.25rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
    },
    iconButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#a0aec0',
      cursor: 'pointer',
      padding: '0.25rem',
      borderRadius: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    deleteButton: {
      width: '100%',
      backgroundColor: '#dc2626',
      color: '#ffffff',
      border: 'none',
      padding: '0.625rem',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    card: {
      backgroundColor: '#1a1a1a',
      border: '1px solid #333333',
      borderRadius: '0.5rem',
      padding: '1.25rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      marginBottom: '1rem',
      backgroundColor: '#2d3748',
      border: '1px solid #4a5568',
      borderRadius: '0.375rem',
      color: '#ffffff',
      boxSizing: 'border-box',
      fontSize: '0.95rem',
    },
    sensitiveField: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: '#2d3748',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      margin: '0.5rem 0',
    },
    sensitiveText: {
      flex: 1,
      color: '#ffffff',
      fontSize: '0.875rem',
      fontFamily: 'monospace',
      wordBreak: 'break-all',
    },
  };

  // ========== RENDER FUNCTIONS ==========
  const renderNavButton = (tab, icon, label) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={styles.navButton(activeTab === tab)}
      onMouseEnter={(e) => {
        if (activeTab !== tab) e.target.style.backgroundColor = '#2d3748';
      }}
      onMouseLeave={(e) => {
        if (activeTab !== tab) e.target.style.backgroundColor = 'transparent';
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const renderProfileTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>My Profile</h2>
        {!isEditingProfile && (
          <button
            onClick={handleEditProfile}
            style={styles.actionButton}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            <Settings size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
            Edit Profile
          </button>
        )}
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {isEditingProfile ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#2d3748',
                margin: '0 auto 1rem',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {editProfileData.avatar ? (
                  <img 
                    src={editProfileData.avatar} 
                    alt="Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#4a5568',
                    color: '#a0aec0',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                  }}>
                    {currentUsername ? currentUsername.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
              </div>
              <button
                onClick={() => document.querySelector('input[type="file"]').click()}
                style={styles.secondaryButton}
              >
                Change Avatar
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={editProfileData.name}
                  onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  style={styles.input}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={handleCancelEdit}
                  style={{ ...styles.secondaryButton, flex: 1 }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6578'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#4a5568'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  style={{ ...styles.actionButton, flex: 1 }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#2d3748',
                margin: '0 auto 1rem',
                overflow: 'hidden',
              }}>
                {userProfile.avatar ? (
                  <img 
                    src={userProfile.avatar} 
                    alt="Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#4a5568',
                    color: '#a0aec0',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                  }}>
                    {currentUsername ? currentUsername.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <h3 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                {currentUsername}
              </h3>
              <p style={{ color: '#a0aec0', margin: '0 0 1.5rem 0' }}>VaultPass User</p>
              <div style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
                <p style={{ color: '#a0aec0', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <FontAwesomeIcon icon={faUser} />
                  {currentUsername}
                </p>
                <p style={{ color: '#a0aec0', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FontAwesomeIcon icon={faLock} />
                  ************
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderApiKeysTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>My API Keys</h2>
        <button
          onClick={() => setShowApiKeyModal(true)}
          style={styles.actionButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          + Add API Key
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <p style={{ color: '#718096', textAlign: 'center', marginTop: '2rem', fontSize: '1rem' }}>
          No API keys yet. Add your first API key to get started!
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {apiKeys.map((api) => (
            <div key={api.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                  {api.title}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => toggleShowApiKey(api.id)}
                    style={styles.iconButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title={showApiKey[api.id] ? 'Hide API Key' : 'Show API Key'}
                  >
                    {showApiKey[api.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(api.apiKey)}
                    style={styles.iconButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Copy API Key"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div style={styles.sensitiveField}>
                <span style={styles.sensitiveText}>
                  {showApiKey[api.id] ? api.apiKey : '•'.repeat(api.apiKey.length)}
                </span>
              </div>

              <p style={{ color: '#a0aec0', fontSize: '0.75rem', margin: '0.5rem 0 1rem 0' }}>
                Created: {new Date(api.created_at).toLocaleDateString()}
              </p>

              <button
                onClick={() => deleteApiKey(api.id)}
                style={styles.deleteButton}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAccountsTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>My Accounts</h2>
        <button
          onClick={() => setShowAccountModal(true)}
          style={styles.actionButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          + Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <p style={{ color: '#718096', textAlign: 'center', marginTop: '2rem', fontSize: '1rem' }}>
          No accounts yet. Add your first account to get started!
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {accounts.map((acc) => (
            <div key={acc.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                  {acc.title}
                </h3>
                {acc.url && (
                  <button
                    onClick={() => openUrl(acc.url)}
                    style={styles.iconButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Open Website"
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#a0aec0', fontSize: '0.875rem' }}>Password:</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleShowPassword(acc.id)}
                      style={styles.iconButton}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title={showPassword[acc.id] ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword[acc.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(acc.password_account)}
                      style={styles.iconButton}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="Copy Password"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div style={styles.sensitiveField}>
                  <span style={styles.sensitiveText}>
                    {showPassword[acc.id] ? acc.password_account : '•'.repeat(acc.password_account.length)}
                  </span>
                </div>
              </div>

              {acc.url && (
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ color: '#a0aec0', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Website:</span>
                  <div style={{ 
                    color: '#2563eb', 
                    fontSize: '0.875rem', 
                    wordBreak: 'break-all',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => openUrl(acc.url)}
                  onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.color = '#2563eb'}
                  >
                    {acc.url}
                  </div>
                </div>
              )}

              <p style={{ color: '#a0aec0', fontSize: '0.75rem', margin: '0.5rem 0 1rem 0' }}>
                Created: {new Date(acc.created_at).toLocaleDateString()}
              </p>

              <button
                onClick={() => deleteAccount(acc.id)}
                style={styles.deleteButton}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGroupsTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>My Groups</h2>
      </div>

      {groups.length === 0 ? (
        <p style={{ color: '#718096', textAlign: 'center', marginTop: '2rem', fontSize: '1rem' }}>
          No groups yet. Create your first group to get started!
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {groups.map((group) => (
            <div key={group.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                  {group.name}
                </h3>
              </div>

              <p style={{ color: '#a0aec0', fontSize: '0.75rem', margin: '0.5rem 0 1rem 0' }}>
                Created: {new Date(group.created_at).toLocaleDateString()}
              </p>

              {/* Show Account / API Key button */}
              <button
                onClick={() =>
                  setShowGroupPasswords((prev) => {
                    const isOpen = !prev[group.id];
                    if (isOpen) {
                      fetchAccountsForGroup(group.name);
                      fetchApiKeysForGroup(group.name);
                    }
                    return { ...prev, [group.id]: isOpen };
                  })
                }
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.625rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
              >
                {showGroupPasswords[group.id] ? 'Hide ACCOUNT / API-KEY' : 'Show ACCOUNT / API-KEY'}
              </button>

              {/* Add ACCOUNT button */}
              <button
                onClick={() => handleAddAccountToGroup(group.name)}
                style={{
                  width: '100%',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.625rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#15803d')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#16a34a')}
              >
                Add ACCOUNT
              </button>

              {/* Add API KEY button */}
              <button
                onClick={() => handleAddApiKeyToGroup(group.name)}
                style={{
                  width: '100%',
                  backgroundColor: '#0ea5e9',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.625rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#0284c7')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#0ea5e9')}
              >
                Add API KEY
              </button>

              {/* Group details section */}
              {showGroupPasswords[group.id] && (
                <div style={{
                  marginTop: '0rem',
                  padding: '1rem',
                  backgroundColor: '#0f0f0f',
                  borderRadius: '0.375rem',
                  border: '1px solid #333333',
                  marginBottom: '1rem',
                }}>
                  {/* 🔹 Comptes */}
                  {groupPasswords[group.name] && groupPasswords[group.name].length > 0 ? (
                    groupPasswords[group.name].map((account, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: '1rem',
                          borderBottom: idx < groupPasswords[group.name].length - 1 ? '1px solid #333333' : 'none',
                          paddingBottom: '1rem',
                        }}
                      >
                        <p style={{ color: '#ffffff', fontWeight: '600', marginBottom: '0.5rem' }}>
                          {account.title}
                        </p>
                        <p style={{ color: '#a0aec0', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                          User: {account.user_account}
                        </p>
                        <p style={{ color: '#a0aec0', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                          Pass: {account.password_account}
                        </p>
                        {account.url && (
                          <a
                            href={account.url.startsWith('http') ? account.url : `https://${account.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#2563eb',
                              textDecoration: 'underline',
                              fontSize: '0.8rem',
                            }}
                          >
                            {account.url}
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#718096', fontSize: '0.875rem', textAlign: 'center', margin: '0 0 1rem 0' }}>
                      No accounts in this group
                    </p>
                  )}

                  {/* 🔹 API KEYS */}
                  {groupApiKeys[group.name] && groupApiKeys[group.name].length > 0 ? (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #333333' }}>
                      <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.75rem' }}>
                        API Keys
                      </h4>
                      {groupApiKeys[group.name].map((api, i) => (
                        <div
                          key={i}
                          style={{
                            backgroundColor: '#1a1a1a',
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <p style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: '600', margin: 0, marginBottom: '0.25rem' }}>
                            {api.title}
                          </p>
                          <p style={{ color: '#a0aec0', fontSize: '0.8rem', margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {api.api_key}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#718096', fontSize: '0.875rem', textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #333333' }}>
                      No API keys in this group
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderModal = (show, title, fields, onClose, onSubmit) => {
    if (!show) return null;

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #404040',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          animation: 'slideUp 0.3s ease',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #333333',
          }}>
            <h2 style={{ 
              color: '#ffffff', 
              margin: 0, 
              fontSize: '1.375rem', 
              fontWeight: '700',
              letterSpacing: '-0.025em',
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#a0aec0',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2d3748';
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#a0aec0';
              }}
            >
              <X size={20} />
            </button>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            {fields}
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
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
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2d3748';
                e.target.style.borderColor = '#5a6578';
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = '#4a5568';
                e.target.style.color = '#a0aec0';
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              style={{
                flex: 1,
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1d4ed8';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.4)';
              }}
            >
              Add
            </button>
          </div>
        </div>
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    );
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'apikeys': return 'API Keys';
      case 'accounts': return 'Accounts';
      case 'groups': return 'Groups';
      case 'profile': return 'My Profile';
      default: return 'Dashboard';
    }
  };

  // ========== MAIN RENDER ==========
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
      {/* ========== SIDEBAR ========== */}
      <div
        style={{
          width: sidebarOpen ? '260px' : '0px',
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid #333333',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid #333333',
          display: 'flex',
          alignItems: 'center',
        }}>
          <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            FrozPass
          </h2>
        </div>

        <nav style={{
          flex: 1,
          padding: '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {renderNavButton('accounts', <User size={20} style={{ flexShrink: 0 }} />, 'Accounts')}
          {renderNavButton('apikeys', <Key size={20} style={{ flexShrink: 0 }} />, 'API Keys')}
          {renderNavButton('groups', <Users size={20} style={{ flexShrink: 0 }} />, 'Groups')}
          {renderNavButton('profile', <Settings size={20} style={{ flexShrink: 0 }} />, 'Profile')}
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
            onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            <LogOut size={20} style={{ flexShrink: 0 }} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.3rem 1.5rem',
            backgroundColor: '#1a1a1a',
            borderBottom: '1px solid #333333',
            color: '#ffffff',
            height: '70px',
            flexShrink: 0,
          }}
        >
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
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
            {getPageTitle()}
          </h1>
          <div style={{ width: '44px' }} />
        </div>

        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', backgroundColor: '#0f0f0f' }}>
          {activeTab === 'apikeys' && renderApiKeysTab()}
          {activeTab === 'accounts' && renderAccountsTab()}
          {activeTab === 'groups' && renderGroupsTab()}
          {activeTab === 'profile' && renderProfileTab()}
        </div>
      </div>


      {/* ========== MODALS ========== */}
        {renderModal(
        showApiKeyModalToGroup,
        'Add New API Key To Group',
        <>
          <input
            type="text"
            placeholder="Title"
            value={newApiKeyToGroup.title}
            onChange={(e) => setNewApiKeyToGroup({ ...newApiKeyToGroup, title: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="API Key"
            value={newApiKeyToGroup.key}
            onChange={(e) => setNewApiKeyToGroup({ ...newApiKeyToGroup, key: e.target.value })}
            style={{ ...styles.input, marginBottom: '1.5rem' }}
          />
        </>,
        () => setShowApiKeyModalToGroup(false),
        addApiKeyToGroup
      )}
      {renderModal(
        showApiKeyModalToGroup,
        'Add New API Key',
        <>
          <input
            type="text"
            placeholder="Title"
            value={newApiKeyToGroup.title}
            onChange={(e) => setNewApiKeyToGroup({ ...newApiKeyToGroup, title: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="API Key"
            value={newApiKeyToGroup.key}
            onChange={(e) => setNewApiKeyToGroup({ ...newApiKeyToGroup, key: e.target.value })}
            style={{ ...styles.input, marginBottom: '1.5rem' }}
          />
        </>,
        () => setShowApiKeyModalToGroup(false),
        addApiKeyToGroup
      )}


      {renderModal(
        showApiKeyModal,
        'Add New API Key',
        <>
          <input
            type="text"
            placeholder="Title"
            value={newApiKey.title}
            onChange={(e) => setNewApiKey({ ...newApiKey, title: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="API Key"
            value={newApiKey.key}
            onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
            style={{ ...styles.input, marginBottom: '1.5rem' }}
          />
        </>,
        () => setShowApiKeyModal(false),
        addApiKey
      )}

      {renderModal(
        showAccountModalToGroup,
        'Add New Account To Group',
        <>
          <input
            type="text"
            placeholder="Title"
            value={newAccountToGroup.title}
            onChange={(e) => setNewAccountToGroup({ ...newAccountToGroup, title: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Account Username"
            value={newAccountToGroup.userAccount}
            onChange={(e) => setNewAccountToGroup({ ...newAccountToGroup, userAccount: e.target.value })}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Account Password"
            value={newAccountToGroup.passwordAccount}
            onChange={(e) => setNewAccountToGroup({ ...newAccountToGroup, passwordAccount: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Website URL (optional)"
            value={newAccountToGroup.urlAccount}
            onChange={(e) => setNewAccountToGroup({ ...newAccountToGroup, urlAccount: e.target.value })}
            style={{ ...styles.input, marginBottom: '1.5rem' }}
          />
        </>,
        () => setShowAccountModalToGroup(false),
        addAccountToGroup
      )}

      {renderModal(
        showAccountModal,
        'Add New Account',
        <>
          <input
            type="text"
            placeholder="Title"
            value={newAccount.title}
            onChange={(e) => setNewAccount({ ...newAccount, title: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Account Username"
            value={newAccount.userAccount}
            onChange={(e) => setNewAccount({ ...newAccount, userAccount: e.target.value })}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Account Password"
            value={newAccount.passwordAccount}
            onChange={(e) => setNewAccount({ ...newAccount, passwordAccount: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Website URL (optional)"
            value={newAccount.urlAccount}
            onChange={(e) => setNewAccount({ ...newAccount, urlAccount: e.target.value })}
            style={{ ...styles.input, marginBottom: '1.5rem' }}
          />
        </>,
        () => setShowAccountModal(false),
        addAccount
      )}

      {/* ========== ALERT NOTIFICATION ========== */}
      {alert.show && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          backgroundColor: alert.type === 'success' ? '#10b981' : '#ef4444',
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
              from {
                transform: translateX(400px);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes slideOutRight {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(400px);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}

      {/* ========== CONFIRM DIALOG ========== */}
      {confirmDialog.show && (
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
              {confirmDialog.title}
            </h2>
            
            <p style={{
              color: '#a0aec0',
              margin: '0 0 2rem 0',
              fontSize: '0.95rem',
              textAlign: 'center',
              lineHeight: '1.5',
            }}>
              {confirmDialog.message}
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
                style={{
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
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2d3748';
                  e.target.style.borderColor = '#5a6578';
                  e.target.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = '#4a5568';
                  e.target.style.color = '#a0aec0';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
                }}
                style={{
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
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#b91c1c';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 14px rgba(220, 38, 38, 0.4)';
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}