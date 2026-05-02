import React, { useState } from 'react';
import axios from 'axios';

function App() {
  // ================================================
  // STATE MANAGEMENT (Person 1 - Complete this)
  // ================================================
  // TODO: Add these state variables:
  // - prompt (what user types)
  // - loading (is video generating?)
  // - videoUrl (path to generated video)
  // - error (error message if something fails)
  
  const [prompt, setPrompt] = useState('');
  // TODO: Add other states here
  

  // ================================================
  // API CALL HANDLER (Person 3 - Complete this)
  // ================================================
  const handleGenerate = async (e) => {
    e.preventDefault();
    // TODO: Add validation - if prompt is empty, don't proceed
    
    // TODO: Set loading to true
    // TODO: Clear any previous errors
    
    try {
      // TODO: Make POST request to http://localhost:5000/api/generate
      // Send: { prompt: prompt }
      // Receive: { videoUrl: "path/to/video.mp4" }
      
      // TODO: Set videoUrl to the response
      // TODO: Clear the prompt field
      
    } catch (err) {
      // TODO: Set error message
    } finally {
      // TODO: Set loading to false
    }
  };

  // ================================================
  // FORM SUBMISSION
  // ================================================
  return (
    <div style={styles.container}>
      <h1>Manifestation Video Generator</h1>
      <p>Describe your future. AI creates your story.</p>

      <form onSubmit={handleGenerate} style={styles.form}>
        {/* TEXTAREA - Person 1 */}
        <textarea
          placeholder="In 2 years, I am... describe your future in detail"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={styles.textarea}
          rows="6"
        />

        {/* SUBMIT BUTTON - Person 1 */}
        {/* TODO: Add disabled={loading} to button */}
        <button type="submit" style={styles.button}>
          {/* TODO: Show "Generating..." if loading, else "Create My Video" */}
          Create My Video
        </button>
      </form>

      {/* ================================================
          LOADING STATE (Person 3)
          ================================================ */}
      {/* TODO: Show only when loading === true */}
      {/* TODO: Display spinner animation + "Creating your future..." message */}
      {false && (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Creating your future... This takes about 30 seconds</p>
        </div>
      )}

      {/* ================================================
          ERROR STATE (Person 3)
          ================================================ */}
      {/* TODO: Show only when error exists */}
      {false && <div style={styles.error}>Error message here</div>}

      {/* ================================================
          VIDEO PLAYER (Person 1)
          ================================================ */}
      {/* TODO: Show only when videoUrl exists */}
      {false && (
        <div style={styles.videoContainer}>
          <h2>Your Manifestation Video Ready! 🎉</h2>
          {/* TODO: Add <video controls src={videoUrl} /> */}
          <a href={videoUrl} download style={styles.downloadLink}>
            ⬇️ Download Video
          </a>
        </div>
      )}
    </div>
  );
}

// ================================================
// STYLES (Do not change)
// ================================================
const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px',
  },
  textarea: {
    padding: '15px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    resize: 'vertical',
    minHeight: '120px',
  },
  button: {
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    margin: '0 auto 20px',
    animation: 'spin 1s linear infinite',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ef5350',
  },
  videoContainer: {
    textAlign: 'center',
    marginTop: '30px',
  },
  video: {
    width: '100%',
    maxWidth: '600px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  downloadLink: {
    display: 'inline-block',
    padding: '12px 30px',
    backgroundColor: '#4caf50',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
  }
};

export default App;
