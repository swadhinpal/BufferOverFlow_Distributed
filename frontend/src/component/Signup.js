import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({}); // State for validation errors
  const [backendError, setBackendError] = useState(''); // State for backend error message

  const navigate = useNavigate(); // Get the navigate function

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};

    if (!formData.email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
      validationErrors.email = 'Invalid email format';
    }

    /*if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,50}/.test(formData.password)) {
      validationErrors.password = 'Password must contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character, and be between 8 and 50 characters long';
    }*/

    // Set errors state
    setErrors(validationErrors);
    console.log('Validation Errors:', validationErrors);
    console.log('Form Data before submission:', formData);
    console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);

    // If there are no validation errors, submit the form
    if (Object.keys(validationErrors).length === 0) {
      try {
        const response = await axios.post(`http://localhost:4001/signup`, formData);
        console.log(response.data);
        // Redirect to login page after successful registration
        navigate('/signin');
      } catch (error) {
        console.error('Error registering user:', error.response);
        if (error.response && error.response.status === 400) {
          setBackendError('Email is already registered');
        } else {
          setBackendError('Error registering user');
        }
      }
    }
  };

  const handleClose = () => {
    navigate('/'); // Navigate to homepage on close
  };


  return (
    <div id="reg">
      {/* Wrapper to control positioning */}
      <div className="register-container">
      <div className="register-wrapper">
        {/* Close Button Positioned Separately */}
        <span className="close-button" onClick={handleClose}>✖</span>
        
          <h2>Sign Up Here</h2>
          <form onSubmit={handleSubmit}>
            <input type="email" name="email" placeholder="Email" onChange={handleChange} /> <br />
            {errors.email && <p className="error">{errors.email}</p>}
            <input type="password" name="password" placeholder="Password" onChange={handleChange} /> <br />
            <button type="submit">Signup</button> <br />
            {backendError && <p className="error">{backendError}</p>}
          </form>
          <p>Already have an account? <a href="/signin"><b>Signin</b></a></p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
