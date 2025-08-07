import React, { useState, useEffect } from 'react';
import { contestAPI } from '../services/apiService';

function NameEntry({ contestId, onNamesSubmitted }) {
  const [names, setNames] = useState(Array(100).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyStatus, setCopyStatus] = useState('Copy URL');
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch existing names on component mount
  useEffect(() => {
    const fetchExistingNames = async () => {
      try {
        const data = await contestAPI.getContest(contestId);
          
          // Check contest status
          const status = data.contest?.status || data.status;
          
          // If contest has already started (not 'new'), show error
          if (status && status !== 'new') {
            setError('Contest has already started!');
            setIsLoading(false);
            return;
          }
          
          // Check if names are in the contest object
          const namesArray = data.contest?.names || data.names;
          
          if (namesArray && Array.isArray(namesArray)) {
            // Create a new array with 100 elements, populated with existing names
            const populatedNames = Array(100).fill('').map((_, index) => 
              namesArray[index] || ''
            );
            setNames(populatedNames);
            
            // Check if there are any existing names to set hasChanges
            const hasAnyNames = namesArray.some(name => name && name.trim() !== '');
            setHasChanges(hasAnyNames);
          }
      } catch (error) {
        console.error('Error fetching existing names:', error);
        // Continue with empty form if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    if (contestId) {
      fetchExistingNames();
    } else {
      setIsLoading(false);
    }
  }, [contestId]);

  const handleNameChange = (index, value) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
    
    // Check if any names have been entered (changed from empty)
    const hasAnyNames = newNames.some(name => name.trim() !== '');
    setHasChanges(hasAnyNames);
  };

  // Function to determine if a field should be enabled
  const isFieldEnabled = (index) => {
    // First field is always enabled
    if (index === 0) return true;
    
    // For subsequent fields, check if the previous field has a value
    const previousField = names[index - 1];
    return previousField && previousField.trim() !== '';
  };

  const saveNames = async () => {
    try {
      // Filter out empty names
      const validNames = names.filter(name => name.trim() !== '');
      
      if (validNames.length === 0) {
        setError('Please enter at least one name');
        return;
      }

      // Save names to backend using API service
      await contestAPI.updateContest(contestId, validNames);

      setShowToast(true);
      setHasChanges(false); // Reset changes flag after successful save
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      setError('Failed to save names. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Filter out empty names
      const validNames = names.filter(name => name.trim() !== '');
      
      if (validNames.length !== 100) {
        setError('Please enter exactly 100 names');
        setIsSubmitting(false);
        return;
      }

      // Save names to backend using API service
      await contestAPI.updateContest(contestId, validNames);

      // Call the start endpoint to start the contest
      await contestAPI.startContest(contestId);

      // Call the callback to navigate to squares page
      if (onNamesSubmitted) {
        onNamesSubmitted();
      }
    } catch (error) {
      setError('Failed to submit names. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/contests/${contestId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => {
        setCopyStatus('Copy URL');
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyStatus('Copied!');
      setTimeout(() => {
        setCopyStatus('Copy URL');
      }, 2000);
    });
  };

  // If no contestId is provided, show an error
  if (!contestId) {
    return (
      <div className="name-entry-container">
        <div className="error-text">Invalid contest URL. Please go back and try again.</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="name-entry-container">
        <div className="error-text">{error}</div>
      </div>
    );
  }

  // Show loading state while fetching existing names
  if (isLoading) {
    return (
      <div className="name-entry-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading existing names...</div>
      </div>
    );
  }

  return (
    <div className="name-entry-container">
      {showToast && (
        <div className="toast-notification">
          Names saved successfully!
        </div>
      )}
      
      <div className="name-entry-header">
        <h1 className="name-entry-title">Enter Names for Squares</h1>
        <button onClick={copyUrl} className={`copy-url-button ${copyStatus === 'Copied!' ? 'copied' : ''}`}>
          {copyStatus}
        </button>
      </div>
      
      <div className="name-entry-form">
                 <div className="names-grid">
                      {names.map((name, index) => (
             <div key={index} className="name-input-wrapper">
               <input
                 type="text"
                 id={`name-${index}`}
                 value={name}
                 onChange={(e) => handleNameChange(index, e.target.value)}
                 className={`name-input ${!isFieldEnabled(index) ? 'disabled' : ''}`}
                 placeholder={`Name ${index + 1}`}
                 maxLength="50"
                 disabled={!isFieldEnabled(index)}
               />
             </div>
           ))}
        </div>
        
        <div className="submit-section">
          <div className="button-group">
                         <button 
               onClick={saveNames}
               disabled={!hasChanges}
               className="save-names-button"
             >
               Save
             </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || names.filter(name => name.trim() !== '').length !== 100}
              className="submit-names-button"
            >
              {isSubmitting ? 'Submitting...' : `Submit ${names.filter(name => name.trim() !== '').length}/100`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NameEntry;
