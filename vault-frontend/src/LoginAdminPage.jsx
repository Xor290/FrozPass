import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

const API_BASE_URL = 'http://192.168.1.40:30081/api';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_username: formData.username,
          admin_password: formData.password
        })
      });

      const data = await response.json();
      console.log('📦 Login response:', data); // ✅ Debug
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Vérifier que le token existe
      if (!data.admin_token) {
        throw new Error('No token received from server');
      }

      // Store token
      localStorage.setItem('token', data.admin_token);
      console.log('✅ Token stored:', data.admin_token.substring(0, 20) + '...'); // ✅ Debug
      
      // Vérifier que le token est bien stocké
      const storedToken = localStorage.getItem('token');
      console.log('✅ Token verification:', storedToken ? 'Token found in localStorage' : 'ERROR: Token not in localStorage');

      alert('Login successful!');
      window.location.href = '/dashboard-admin';
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#0f0f0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    },
    card: {
      backgroundColor: '#1a1a1a',
      border: '1px solid #333333',
      borderRadius: '0.5rem',
      padding: '2rem',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 20px 25px rgba(0,0,0,0.5)',
    },
    title: {
      color: '#ffffff',
      fontSize: '1.875rem',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '0.5rem',
    },
    subtitle: {
      color: '#a0aec0',
      textAlign: 'center',
      marginBottom: '2rem',
    },
    inputGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      color: '#a0aec0',
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '0.5rem',
      display: 'block',
    },
    inputContainer: {
      position: 'relative',
    },
    input: {
      width: '100%',
      padding: '0.75rem 2.5rem 0.75rem 2.75rem',
      backgroundColor: '#2d3748',
      border: '1px solid #4a5568',
      borderRadius: '0.375rem',
      color: '#ffffff',
      fontSize: '0.95rem',
      boxSizing: 'border-box',
    },
    icon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#a0aec0',
    },
    passwordToggle: {
      position: 'absolute',
      right: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: 'transparent',
      border: 'none',
      color: '#a0aec0',
      cursor: 'pointer',
      padding: '0.25rem',
    },
    button: {
      width: '100%',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: 'none',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    error: {
      color: '#dc2626',
      fontSize: '0.875rem',
      textAlign: 'center',
      marginTop: '1rem',
      padding: '0.75rem',
      backgroundColor: '#fee2e2',
      border: '1px solid #fecaca',
      borderRadius: '0.375rem',
    },
    registerLink: {
      color: '#2563eb',
      textAlign: 'center',
      marginTop: '1.5rem',
      fontSize: '0.875rem',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>FrozPass</h1>
        <p style={styles.subtitle}>Administration Panel</p>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputContainer}>
              <User size={20} style={styles.icon} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputContainer}>
              <Lock size={20} style={styles.icon} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: loading ? '#4a5568' : '#2563eb',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = '#2563eb';
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

        </form>
      </div>
    </div>
  );
}