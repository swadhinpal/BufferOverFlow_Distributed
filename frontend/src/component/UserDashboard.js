/*import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};
  const [contents, setContents] = useState([]);

  useEffect(() => {
    const fetchUserContents = async () => {
      console.log("Fetching contents for email:", email);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:4000/api/getAllContents?email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log('Fetched contents:', data.contents);
          setContents(data.contents);
        } else {
          console.error('Error fetching contents:', data.message);
        }
      } catch (error) {
        console.error('Error fetching contents:', error);
      }
    };

    fetchUserContents();
  }, [email]);

  useEffect(() => {
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach((block) => hljs.highlightBlock(block));
  }, [contents]);

  const handlePostNow = () => navigate('/postContent', { state: { email } });
  const handleYourContent = () => navigate('/yourContent', { state: { email } });
  const handleNotifications = () => navigate('/notifications', { state: { email } });
  const handleLogout = () => navigate('/');

  return (
    <div className="user-dashboard">
      <nav1>
        <button className="dashboard-button" onClick={handlePostNow}>
          Post Now
        </button>
        <button className="dashboard-button" onClick={handleYourContent}>
          Your Content
        </button>
        <button className="dashboard-button" onClick={handleNotifications}>
          Notifications
        </button>
        <button className="dashboard-button" onClick={handleLogout}>
          Logout
        </button>
      </nav1>

      <div className="content-list">
        {contents.length > 0 ? (
          contents.map((content, index) => (
            <div key={index} className="content-item">
              <h3>{content.email}</h3>
              <p className="date">
                Posted on: {new Date(content.time).toLocaleString()}
              </p>
              <p><strong>Content:</strong></p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{content.text}</p>
              {content.code && (
                <pre>
                  <code className={`language-${content.filename?.split('.').pop()}`}>
                    {content.code}
                  </code>
                </pre>
              )}
            </div>
          ))
        ) : (
          <p>No contents available.</p>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;*/
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};
  const [contents, setContents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserContents = async () => {
      console.log("Fetching contents for email:", email);
      const token = localStorage.getItem('token');

      // Check if the token exists before making the request
      if (!token) {
        setError('Token is missing. Please log in again.');
        navigate('/login'); // Redirect to login page
        return;
      }

      console.log('Token:', token); 

      try {
        const response = await fetch(
          `http://localhost:4002/post?email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
       
        // Check if the response indicates an invalid token
        if (response.status === 401) {
          setError('Invalid token. Please log in again.');
          localStorage.removeItem('token'); // Clear invalid token
          navigate('/login'); // Redirect to login page
          return;
        }

        const data = await response.json();

        if (response.ok) {
          console.log('Fetched contents:', data.contents);
          setContents(data.contents);
        } else {
          setError(data.message || 'Error fetching contents');
          console.error('Error fetching contents:', data.message);
        }
      } catch (error) {
        console.error('Error fetching contents:', error);
        setError('An error occurred while fetching contents.');
      }
    };

    fetchUserContents();
  }, [email, navigate]);

  useEffect(() => {
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach((block) => hljs.highlightBlock(block));
  }, [contents]);

  const handlePostNow = () => navigate('/postContent', { state: { email } });
  //const handleYourContent = () => navigate('/yourContent', { state: { email } });
  const handleNotifications = () => navigate('/notifications', { state: { email } });
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token on logout
    navigate('/signin');
  };

  return (
    <div className="user-dashboard">
      <nav1>
        <button className="dashboard-button" onClick={handlePostNow}>
          Post Now
        </button>
        <button className="dashboard-button" onClick={handleNotifications}>
          Notifications
        </button>
        <button className="dashboard-button" onClick={handleLogout}>
          Logout
        </button>
      </nav1>

      {error && <div className="error-message">{error}</div>}

      <div className="content-list">
        {contents.length > 0 ? (
          contents.map((content, index) => (
            <div key={index} className="content-item">
              <h3>{content.email}</h3>
              <p className="date">
                Posted on: {new Date(content.time).toLocaleString()}
              </p>
              <p><strong>Content:</strong></p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{content.text}</p>
              {content.code && (
                <pre>
                  <code className={`language-${content.filename?.split('.').pop()}`}>
                    {content.code}
                  </code>
                </pre>
              )}
            </div>
          ))
        ) : (
          <p>No contents available.</p>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

