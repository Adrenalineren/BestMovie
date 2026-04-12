import React, { useState, useEffect } from 'react';
import './navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from '../AuthModal';

function Navbar() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [customer, setCustomer] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('login'); // 'login' or 'register'

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('accessToken');
        const customerData = localStorage.getItem('customer');
        if (token && customerData) {
            setIsLoggedIn(true);
            setCustomer(JSON.parse(customerData));
        } else {
            setIsLoggedIn(false);
        }

        // Listen for customer login event (from AuthModal)
        const handleCustomerLogin = () => {
            const token = localStorage.getItem('accessToken');
            const customerData = localStorage.getItem('customer');
            if (token && customerData) {
                setIsLoggedIn(true);
                setCustomer(JSON.parse(customerData));
            }
        };

        window.addEventListener('customerLogin', handleCustomerLogin);
        return () => window.removeEventListener('customerLogin', handleCustomerLogin);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('customer');
        setIsLoggedIn(false);
        navigate('/');
    };

    const handleAuthModalClose = () => {
        setShowAuthModal(false);
    };

    const handleLoginSuccess = () => {
        const customer = JSON.parse(localStorage.getItem('customer'));
        setCustomer(customer);
        setIsLoggedIn(true);
        setShowAuthModal(false);
    };

    return ( 
        <>
            <AuthModal 
                isOpen={showAuthModal}
                onClose={handleAuthModalClose}
                onLoginSuccess={handleLoginSuccess}
                mode={authModalMode}
                onModeChange={(newMode) => setAuthModalMode(newMode)}
            />
            <nav className="navbar"> 
                <div className="navbar-left"> 
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h1>CineVillage</h1>
                    </Link> 
                </div> 
                <div className="navbar-right">
                    {isLoggedIn ? (
                        <>
                            <span className="navbar-customer">
                                Welcome, {customer?.name}
                            </span>
                            <Link to="/my-tickets" className='button-pri'>My Tickets</Link>
                            <button onClick={handleLogout} className='button-pri logout-btn'>Logout</button>
                        </>
                    ) : (
                        <>
                            <button 
                                className='button-pri login-btn'
                                onClick={() => {
                                    setAuthModalMode('login');
                                    setShowAuthModal(true);
                                }}
                            >
                                Login
                            </button>
                            <button 
                                className='button-pri register-btn'
                                onClick={() => {
                                    setAuthModalMode('register');
                                    setShowAuthModal(true);
                                }}
                            >
                                Register
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </>
    );
}

export default Navbar;