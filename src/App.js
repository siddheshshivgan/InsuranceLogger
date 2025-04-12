import React, { useState } from 'react';
import './styles.css';
import logo from './logo.png'; // Make sure to add the logo image to your src folder


// Add your Google Apps Script web app URL here
const API_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL;

// Define company options for each insurance type
const companyOptions = {
  MEDICLAIM: ['Star Health', 'NII', 'Oriental', 'NJ','I.C.E.','Care'],
  PA: ['Star Health', 'Oriental','NII', 'NJ'],
  TERM: ['ICICI Prudential', 'HDFC Life', 'TATA AIA', 'Others'],
  MOTOR: ['ICICI', 'HDFC', 'Go Digit', 'TATA', 'IffcoTokio', 'Bajaj','Others'],
  OTHER: ['NII','Oriental','I.C.E.']
};

function App() {
  const [activeTab, setActiveTab] = useState('MEDICLAIM');
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: companyOptions.MEDICLAIM[0], // Default to first option in MEDICLAIM list
    dueDate: '',
    lastPremium: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setShowSuccess(false);
    setErrorMessage('');
    
    // Update company to the first option in the new tab's company list
    setFormData(prev => ({
      ...prev,
      company: companyOptions[tab][0]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date from yyyy-mm-dd to dd-mm-yyyy for submission
  const formatDateForSubmission = (dateString) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    // Create the form data to send
    const formDataToSend = {
      insuranceType: activeTab,
      name: formData.name,
      company: formData.company,
      dueDate: formatDateForSubmission(formData.dueDate),
      lastPremium: formData.lastPremium
    };

    try {
      // Real API call to Google Apps Script
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSend),
      });

      // Reset form after successful submission
      setFormData({
        name: '',
        company: companyOptions[activeTab][0],
        dueDate: '',
        lastPremium: ''
      });
      
      setShowSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting data:", error);
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="insurance-form">      
      <div className="form-group">
        <label>NAME</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>COMPANY</label>
        <select
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
          className="form-control"
        >
          {companyOptions[activeTab].map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>DUE DATE</label>
        <input
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          placeholder="DD-MM-YYYY"
          required
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label>LAST PREMIUM</label>
        <input
          type="number"
          name="lastPremium"
          value={formData.lastPremium}
          onChange={handleChange}
          required
          className="form-control"
        />
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <div className="button-container">
        <button
          type="submit"
          className="save-button"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Data'}
        </button>
      </div>
    </form>
  );

  const renderSuccessMessage = () => (
    <div className="success-message">
      <div className="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      </div>
      <h3 className="success-title">Data Saved Successfully!</h3>
      <p className="success-subtitle">
        Your {activeTab} insurance data has been saved to the Google Sheet.
      </p>
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <img src={logo} alt="Shivgan Associates Logo" className="company-logo" />
        </div>
      </header>
      
      <div className="content-container">
        <div className="card">
          <h1>Insurance Data Logger</h1>
          
          {!showSuccess ? (
            <>
              <div className="pill-container">
                {['MEDICLAIM', 'PA', 'TERM', 'MOTOR','OTHER'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={`pill-button ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              <div className="form-container">
                <h3>Add {activeTab} Insurance Data</h3>
                {renderForm()}
              </div>
            </>
          ) : (
            renderSuccessMessage()
          )}
        </div>
      </div>
      
      <footer className="app-footer">
        <p>© 2025 Shivgan Associates. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;