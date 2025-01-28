// PostVisited.js
import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import hljs from 'highlight.js'; // Import highlight.js
import 'highlight.js/styles/github.css'; // Import a highlight.js theme
import './postVisited.css'; // Import the custom CSS

const PostVisited = () => {
  //const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { postId, email, content, code } = location.state || {}; // Access email, content, and code from the state

  useEffect(() => {
    // Highlight the code after the component has mounted
    if (code) {
      hljs.highlightAll(); // Automatically highlights the code blocks
    }
  }, [code]);

  return (
    <div className="post-details">
      <h2>Post Details for Post ID: {postId}</h2>
      <h3>Posted by: {email}</h3>
      <p><strong>Posted on:</strong> {new Date(content.time).toLocaleString()}</p>
      <p><strong>Content:</strong></p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{content.text}</p> {/* Preserves newline and spacing */}

      {code && (
        <div>
          <h4>Code:</h4>
          <pre>
            <code className={`language-${content.filename?.split('.').pop()}`}>
              {code}
            </code>
          </pre>
        </div>
      )}

      <button onClick={() => navigate('/notifications', { state: { email } })}>Back to Notifications</button>
      <button onClick={() => navigate('/userDashboard', { state: { email } })}>Back to Dashboard</button>
    </div>
  );
};

export default PostVisited;
