import React from 'react';
import './navbar.css';
import { Link } from 'react-router-dom';
function Navbar() {
     return ( 
    <nav className="navbar"> 
        <div className="navbar-left"> 
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h1>CineVillage</h1>
            </Link> 
        </div> 
        <div className="navbar-right"> 
            <Link to="/login" className='button-pri'>Login</Link>
            <Link to="/register" className='button-pri'>Register</Link>
        </div>
    </nav> 
  );
}

export default Navbar;