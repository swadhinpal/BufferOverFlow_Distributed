import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PostContent.css';

const PostContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};

  const [question, setQuestion] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('C');
  const [file, setFile] = useState(null); // State to store uploaded file
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks
    if (!file && question.trim() === '' && code.trim() === '') {
      setError('You must enter text, upload a file, or paste code.');
      return;
    }

    if (file) {
      // If a file is uploaded, ensure code and language are empty
      if (code.trim() !== '' || question.trim() === '') {
        setError('If you upload a file, you cannot paste code, and you must enter text.');
        return;
      }
    }

    if (code.trim() !== '') {
      // If code is pasted, ensure no file is uploaded
      if (file) {
        setError('You cannot upload a file while pasting code.');
        return;
      }

      if (question.trim() === '') {
        setError('If you paste code, you must enter text as well.');
        return;
      }
    }

    // Prepare data to send to backend
    const uploadData = {
      email,
      text: question, // Keep original whitespace and newlines
      code: code,     // Keep original whitespace and newlines
      language,
      filename: file ? file.name : null, // Set filename if file is uploaded
    };

    // Send the data to the backend
    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('data', JSON.stringify(uploadData)); // Append metadata
      if (file) {
        formData.append('file', file); // Append the file if it exists
      }

      const response = await fetch('http://localhost:4002/post', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the headers
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Error uploading data to the server');
      }

      const data = await response.json();
      console.log('Data uploaded successfully:', data);

      navigate('/userDashboard', { state: { email } });
    } catch (uploadError) {
      console.error('Error uploading data:', uploadError);
      setError('Error uploading data. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Get the uploaded file
  };

  const handleBackToDashboard = () => {
    navigate('/userDashboard', { state: { email } });
  };

  return (
    <div className="post-content">
      <h2>Post Content</h2>
      <button onClick={handleBackToDashboard} className="back-button">Back to Dashboard</button>
      <form onSubmit={handleSubmit} className="post-form">
        {/* Change input to textarea for multi-line question input */}
        <textarea
          placeholder="Ask your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <textarea
          placeholder="Paste your code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {/* Conditional rendering for file input or filename display */}
        {file ? (
          <div className="file-info">
            <span>Uploaded File: {file.name}</span>
            <button type="button" onClick={() => setFile(null)}>Remove</button> {/* Option to remove the file */}
          </div>
        ) : (
          <input
            type="file"
            accept=".c,.cpp,.cs,.java,.py,.js" // Accept specific file types
            onChange={handleFileChange}
          />
        )}
        <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={file}>
          <option value="C">C</option>
          <option value="C++">C++</option>
          <option value="C#">C#</option>
          <option value="Java">Java</option>
          <option value="Python">Python</option>
        </select>
        <button type="submit">Post</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default PostContent;
