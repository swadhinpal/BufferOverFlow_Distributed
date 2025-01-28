// src/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import Nav from './nav';
import './home.css'; // Import your CSS file
import logo from './images/logo.png'; // Adjust the path based on your file structure
import actImage from './images/act.png'; // Import the image for the right section

function Home() {
    return (
        <div id="body">
            <img src={logo} alt="Logo" className="logo" /> {/* Logo at the top */}
            <div className="intro">
                <h1>BufferOverflow</h1>
                <p><b>Stuck in coding? We are here to assist!</b></p>
            </div>
            <Nav />
            <div className="content">
                <div className="left-section">
                    <h2>Every developer has a tab open to BufferOverflow.</h2> {/* Specific heading */}
                    <p>For over 15 years we’ve been the Q&A platform of choice that millions of people visit every month to ask questions, learn, and share technical knowledge.</p> {/* Specific paragraph */}
                    <Link to='/signup'> {/* Wrap the button with Link to navigate */}
                        <button className="signup-button">Sign Up</button>
                    </Link>
                </div>
                <div className="right-section">
                    <img src={actImage} alt="Action" className="action-image" />
                </div>
            </div>
            {/* Keep h1 and introductory paragraph here to stay centered */}
            
        </div>
    );
}

export default Home;
