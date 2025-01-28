import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './signin.css';

const Signin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState(''); // State for login error message
  const navigate = useNavigate(); // Get the navigate function

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email format
    if (!formData.email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
      setError('Invalid email format');
      return;
    }

    // Attempt login
    try {
      const response = await axios.post(`http://localhost:4001/signin`, formData);
      console.log("Token here ...response");
      console.log(response.data.token);
      localStorage.setItem('token', response.data.token);

      console.log(response.data);
      navigate('/userDashboard', { state: { email: formData.email } }); // Pass email as state
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Invalid credentials');
    }    
    
  };

  const handleClose = () => {
    navigate('/'); // Navigate to homepage on close
  };

  return (
    <div id="lg">
      <div className="login-container">
        <div className="login-wrapper">
          <span className="close-button" onClick={handleClose}>✖</span>
          <h2>Signin</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
            />
            <br />
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
            />
            <br />
            <button type="submit">Signin</button>
            <br />
            {error && <p className="error">{error}</p>} {/* Display error message if login fails */}
          </form>
          <p>
            Not Signed Up Yet?{' '}
            <a href="/signup">
              <b>Signup</b>
            </a>
          </p>
          <p>
            
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signin;

