// src/components/Nav.js

import React from 'react';
import { Link } from 'react-router-dom';
import './Nav.css'; // Import your CSS file

function Nav() {
    return (
        <nav>
            <div className="nav-links">
                <Link to='/signin' className="nav-link">Signin</Link> {/* Only showing the Login link */}
            </div>
        </nav>
    );
}

export default Nav;
