import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, CheckCircle, XCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
      
      <div style={styles.card}>
        <h1 style={styles.title}>FrozPass</h1>
        <p style={styles.subtitle}>Create your secure account</p>
        
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
                placeholder="Choose a username"
                style={styles.input}
                required
                disabled={loading || success}
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
                placeholder="Create a password"
                style={styles.input}
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                disabled={loading || success}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.inputContainer}>
              <Lock size={20} style={styles.icon} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                style={styles.input}
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
                disabled={loading || success}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{
              ...styles.button,
              backgroundColor: success ? '#16a34a' : loading ? '#4a5568' : '#2563eb',
              cursor: (loading || success) ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && !success) e.target.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              if (!loading && !success) e.target.style.backgroundColor = '#2563eb';
            }}
          >
            {success ? 'Account Created!' : loading ? 'Creating account...' : 'Create Account'}
          </button>

          {error && (
            <div style={styles.notification.error}>
              <XCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={styles.notification.success}>
              <CheckCircle size={20} style={{ flexShrink: 0 }} />
              <span>Registration successful! Redirecting to login...</span>
            </div>
          )}

          <div style={styles.loginLink}>
            Already have an account?{' '}
            <a 
              href="/login" 
              style={styles.link}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Login here
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

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
    transition: 'border-color 0.2s ease',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  notification: {
    error: {
      color: '#ef4444',
      fontSize: '0.875rem',
      padding: '0.875rem 1rem',
      backgroundColor: '#1f1315',
      border: '1px solid #991b1b',
      borderRadius: '0.5rem',
      marginTop: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      animation: 'slideIn 0.3s ease-out',
    },
    success: {
      color: '#22c55e',
      fontSize: '0.875rem',
      padding: '0.875rem 1rem',
      backgroundColor: '#0d1f17',
      border: '1px solid #166534',
      borderRadius: '0.5rem',
      marginTop: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      animation: 'slideIn 0.3s ease-out',
    }
  },
  loginLink: {
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.875rem',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '500',
  }
};