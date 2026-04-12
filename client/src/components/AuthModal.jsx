import { useState } from 'react';
import '../assets/AuthModal.css';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, mode = 'login', onModeChange }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isLogin = mode === 'login';

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const body = isLogin 
                ? { email, password }
                : { email, password, name };

            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Error processing request');
                setLoading(false);
                return;
            }

            if (isLogin && data.accessToken) {
                // Save token to localStorage
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('customer', JSON.stringify(data.customer));
                // Dispatch event to notify navbar of login
                window.dispatchEvent(new Event('customerLogin'));
                onLoginSuccess();
                onClose();
            } else if (!isLogin && data.customerId) {
                // Registration successful, show message and close
                alert('Registration successful! Please log in.');
                setEmail('');
                setPassword('');
                setName('');
                onClose();
            }
        } catch (err) {
            setError('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-modal-close" onClick={onClose}>×</button>
                
                <div className="auth-modal-header">
                    <h2>{isLogin ? 'Log In' : 'Register'}</h2>
                    <p>{isLogin ? 'to continue booking' : 'create your account'}</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                required={!isLogin}
                                disabled={loading}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <button 
                        type="submit" 
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Register')}
                    </button>

                    {onModeChange && (
                        <div className="auth-mode-toggle">
                            <p>
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setError('');
                                        setEmail('');
                                        setPassword('');
                                        setName('');
                                        onModeChange(isLogin ? 'register' : 'login');
                                    }}
                                    className="toggle-link"
                                >
                                    {isLogin ? 'Create one' : 'Log in'}
                                </button>
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
