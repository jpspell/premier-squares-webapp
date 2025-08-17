import React, { useState, useEffect } from 'react';
import { contestAPI } from '../services/apiService';
import { validateNames, validateNamesForSave } from '../utils/validation';
import { getErrorMessage } from '../utils/errorHandler';
import { reportError } from '../utils/errorReporter';

// HTML sanitization function to prevent XSS on user input
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// List of random first and last names
const randomNames = [
  'James Smith', 'Mary Johnson', 'John Williams', 'Patricia Brown', 'Robert Jones', 'Jennifer Garcia', 
  'Michael Miller', 'Linda Davis', 'William Rodriguez', 'Elizabeth Martinez', 'David Anderson', 'Barbara Taylor',
  'Richard Thomas', 'Susan Hernandez', 'Joseph Moore', 'Jessica Martin', 'Thomas Jackson', 'Sarah Thompson', 
  'Christopher White', 'Karen Lopez', 'Charles Lee', 'Nancy Gonzalez', 'Daniel Wilson', 'Lisa Perez',
  'Matthew Anderson', 'Betty Hall', 'Anthony Young', 'Helen Allen', 'Mark King', 'Sandra Wright', 
  'Donald Scott', 'Donna Green', 'Steven Baker', 'Carol Adams', 'Paul Nelson', 'Ruth Hill',
  'Andrew Carter', 'Sharon Mitchell', 'Joshua Roberts', 'Michelle Turner', 'Kenneth Phillips', 'Laura Campbell',
  'Kevin Parker', 'Emily Evans', 'Brian Edwards', 'Kimberly Collins', 'George Stewart', 'Deborah Sanchez',
  'Edward Morris', 'Dorothy Rogers', 'Ronald Reed', 'Lisa Cook', 'Timothy Morgan', 'Nancy Bell',
  'Jason Murphy', 'Karen Bailey', 'Jeffrey Rivera', 'Betty Cooper', 'Ryan Richardson', 'Helen Cox',
  'Jacob Howard', 'Sandra Ward', 'Gary Torres', 'Donna Peterson', 'Nicholas Gray', 'Carol Ramirez',
  'Eric James', 'Ruth Watson', 'Jonathan Brooks', 'Sharon Kelly', 'Stephen Sanders', 'Michelle Price',
  'Larry Bennett', 'Laura Wood', 'Justin Barnes', 'Emily Ross', 'Scott Henderson', 'Kimberly Coleman',
  'Brandon Jenkins', 'Deborah Perry', 'Benjamin Powell', 'Dorothy Long', 'Samuel Patterson', 'Lisa Hughes',
  'Frank Flores', 'Nancy Butler', 'Gregory Simmons', 'Karen Foster', 'Raymond Bryant', 'Betty Alexander',
  'Alexander Russell', 'Helen Griffin', 'Patrick Diaz', 'Sandra Hayes', 'Jack Sanders', 'Donna Price',
  'Dennis Bennett', 'Carol Wood', 'Jerry Barnes', 'Ruth Ross', 'Adam Henderson', 'Virginia Coleman',
  'Bruce Jenkins', 'Evelyn Perry', 'Carl Powell', 'Jean Long', 'Earl Patterson', 'Cheryl Hughes',
  'Fred Flores', 'Mildred Butler', 'Harry Simmons', 'Pamela Foster', 'Ira Bryant', 'Nicole Alexander',
  'Jack Russell', 'Kathy Griffin', 'Keith Diaz', 'Diane Hayes', 'Larry Sanders', 'Joyce Price',
  'Milton Bennett', 'Diana Wood', 'Nathan Barnes', 'Gloria Ross', 'Oscar Henderson', 'Evelyn Coleman',
  'Philip Jenkins', 'Jean Perry', 'Quentin Powell', 'Mabel Long', 'Roger Patterson', 'Florence Hughes',
  'Stanley Flores', 'Grace Butler', 'Terry Simmons', 'Thelma Foster', 'Ulysses Bryant', 'Lucille Alexander',
  'Victor Russell', 'Edna Griffin', 'Walter Diaz', 'Mabel Hayes', 'Xavier Sanders', 'Grace Price',
  'Yves Bennett', 'Thelma Wood', 'Zachary Barnes', 'Lucille Ross', 'Adam Henderson', 'Edna Coleman'
];

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
        reportError(error, 'network', { operation: 'fetchExistingNames', contestId });
        // Continue with empty form if fetch fails
        // Don't set error state here to allow user to still interact with form
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
    newNames[index] = sanitizeInput(value);
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
      // Use validation function that allows partial names for saving
      const validation = validateNamesForSave(names);
      
      if (!validation.isValid) {
        setError(validation.message);
        return;
      }

      // Save names to backend using API service
      await contestAPI.updateContest(contestId, validation.value);

      setShowToast(true);
      setHasChanges(false); // Reset changes flag after successful save
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      setError(getErrorMessage(error) || 'Failed to save names. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Use new validation function
      const validation = validateNames(names);
      
      if (!validation.isValid) {
        setError(validation.message);
        setIsSubmitting(false);
        return;
      }

      // Save names to backend using API service
      await contestAPI.updateContest(contestId, validation.value);

      // Call the start endpoint to start the contest
      await contestAPI.startContest(contestId);

      // Call the callback to navigate to squares page
      if (onNamesSubmitted) {
        onNamesSubmitted();
      }
    } catch (error) {
      setError(getErrorMessage(error) || 'Failed to submit names. Please try again.');
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

  const fillRandomNames = () => {
    const newNames = [...names];
    
    // Fill only empty fields with random names
    for (let i = 0; i < newNames.length; i++) {
      if (!newNames[i] || newNames[i].trim() === '') {
        const randomIndex = Math.floor(Math.random() * randomNames.length);
        newNames[i] = randomNames[randomIndex];
      }
    }
    
    setNames(newNames);
    setHasChanges(true);
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
        <div className="header-buttons">
          <button onClick={copyUrl} className={`copy-url-button ${copyStatus === 'Copied!' ? 'copied' : ''}`}>
            {copyStatus}
          </button>
                     <button onClick={fillRandomNames} className="fill-random-button" title="Fill Random Names">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M20.49 9C19.2214 5.33108 15.6907 2.5 11.5 2.5C6.80546 2.5 2.5 6.80546 2.5 11.5C2.5 16.1945 6.80546 20.5 11.5 20.5C15.6907 20.5 19.2214 17.6689 20.49 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
           </button>
        </div>
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
                 maxLength="100"
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
