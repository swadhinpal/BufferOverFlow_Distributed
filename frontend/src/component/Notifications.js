/*import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Notifications.css';

const Notifications = () => {
  const location = useLocation();
  const { email } = location.state || {};
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:4000/notification?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        setNotifications((data.notifications || []).reverse());
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [email]);

  const handleNotificationClick = async (postId) => {
    const response = await fetch('http://localhost:4000/notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, postId }),
    });

    if (response.ok) {
      const { content, code } = await response.json();
      navigate('/postVisited', { state: { postId, email, content, code } });
    } else {
      console.error('Error fetching post content:', await response.json());
    }
  };

  const handleBackToDashboard = () => {
    navigate('/userDashboard', { state: { email } }); // Change this path according to your routing
  };

  return (
    <div className="notifications">
      <h2>Notifications</h2>
      <button className="back-button" onClick={handleBackToDashboard}>Back to Dashboard</button>
      {notifications.length > 0 ? (
        notifications.map((notif, index) => (
          <div key={index} className="notification-item" onClick={() => handleNotificationClick(notif.postId)}>
            <p>{notif.email} has posted.</p>
          </div>
        ))
      ) : (
        <p>No new notifications.</p>
      )}
    </div>
  );
};

export default Notifications;*/

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Notifications.css';

const Notifications = () => {
  const location = useLocation();
  const { email } = location.state || {};
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Retrieve the token from localStorage (or sessionStorage)
        const token = localStorage.getItem('token'); 
        console.log(email);
        console.log("Notification response status: below");
        const response = await fetch(`http://localhost:4003/notification?email=${encodeURIComponent(email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`, // Attach the token in the Authorization header
            'Content-Type': 'application/json',
          },
        });
        console.log("Notification response status:", response.status);
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setNotifications((data.notifications || []).reverse());
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (email) {
      fetchNotifications();
    }
    else {
      console.log("email missing");
    }
  }, [email]);

  const handleNotificationClick = async (postId) => {
    try {
      // Retrieve the token from localStorage (or sessionStorage)
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:4003/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Attach the token in the Authorization header
        },
        body: JSON.stringify({ email, postId }),
      });

      if (response.ok) {
        const { content, code } = await response.json();
        navigate('/postVisited', { state: { postId, email, content, code } });
      } else {
        console.error('Error fetching post content:', await response.json());
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/userDashboard', { state: { email } });
  };

  return (
    <div className="notifications">
      <h2>Notifications</h2>
      <button className="back-button" onClick={handleBackToDashboard}>Back to Dashboard</button>
      {notifications.length > 0 ? (
        notifications.map((notif, index) => (
          <div key={index} className="notification-item" onClick={() => handleNotificationClick(notif.postId)}>
            <p>{notif.email} has posted.</p>
          </div>
        ))
      ) : (
        <p>No new notifications.</p>
      )}
    </div>
  );
};

export default Notifications;

