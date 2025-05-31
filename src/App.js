import React, { useState, useEffect, useCallback } from 'react';
import './styles.css';
import logo from './logo.png'; 

// Define company options for each insurance type
const companyOptions = {
  MEDICLAIM: ['Star Health', 'NII', 'Oriental', 'NJ','I.C.E.','Care'],
  PA: ['Star Health', 'Oriental','NII', 'NJ'],
  TERM: ['ICICI', 'HDFC', 'TATA', 'Others'],
  MOTOR: ['ICICI', 'HDFC', 'Go Digit', 'TATA', 'IffcoTokio', 'Bajaj','Others'],
  OTHER: ['NII','Oriental','I.C.E.']
};

function App() {
  const [activeTab, setActiveTab] = useState('MEDICLAIM');
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '', // Default to first option in MEDICLAIM list
    dueDate: '',
    lastPremium: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mode, setMode] = useState('add'); // 'add' or 'update'
  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [monthFilter, setMonthFilter] = useState('');

  // Get the API URL from .env file
  const API_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL;

  // Use useCallback to memoize the fetchRecords function to avoid recreating it on every render
  const fetchRecords = useCallback(async () => {
    if (!API_URL) {
      setErrorMessage('API URL is not configured. Please check .env file.');
      return;
    }
    
    setIsLoadingRecords(true);
    try {
      // Use fetchRecords as the action parameter
      const url = `${API_URL}?action=fetchRecords&insuranceType=${activeTab}`;
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error("Error fetching records:", error);
      setErrorMessage('Failed to fetch records. Please try again.');
    } finally {
      setIsLoadingRecords(false);
    }
  }, [API_URL, activeTab]);

  // Fetch records when activeTab changes or when fetchRecords function changes
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setShowSuccess(false);
    setErrorMessage('');
    resetForm();
    setSearchTerm('');
    
    // Update company to the first option in the new tab's company list
    // setFormData(prev => ({
    //   ...prev,
    //   company: companyOptions[tab][0]
    // }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '-';
    // If already DD-MM-YYYY, just return
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    // Try to parse ISO or other formats
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Format date from yyyy-mm-dd to dd-mm-yyyy for submission
  const formatDateForSubmission = (dateString) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }

  const resetForm = () => {
    setFormData({
      company: '',
      name: '',
      dueDate: '',
      lastPremium: ''
    });
    setMode('add');
    setSelectedRecordId(null);
  };

  const handleRecordSelect = (record) => {
    setFormData({
      company: record.company,
      name: record.name || '',
      dueDate: record.dueDate,
      lastPremium: record.lastPremium
    });
    setSelectedRecordId(record.id);
    setMode('update');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!API_URL) {
      setErrorMessage('API URL is not configured. Please check .env file.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    // Create the form data to send
    const formDataToSend = {
      insuranceType: activeTab,
      company: formData.company,
      name: formData.name,
      dueDate: formatDateForSubmission(formData.dueDate),
      lastPremium: formData.lastPremium,
      action: mode === 'add' ? 'addRecord' : 'updateRecord',
      id: selectedRecordId
    };
    
    try {
      // Using no-cors mode means we can't read the response
      // so we don't need to store it in a variable
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', // This is important to bypass CORS
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSend),
      });
      
      // Reset form after submission
      resetForm();
      setShowSuccess(true);
      
      // Refresh records after successful submission
      setTimeout(() => {
        fetchRecords();
      }, 1000);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting data:", error);
      setErrorMessage('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="insurance-form">            
      <div className="form-group">
        <label>CLIENT NAME</label>
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
          <option value="" disabled>
            -- Select Company --
          </option>
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
          {isLoading ? (mode === 'add' ? 'Saving...' : 'Updating...') : (mode === 'add' ? 'Save Data' : 'Update Data')}
        </button>
        
        {mode === 'update' && (
          <button
            type="button"
            className="cancel-button"
            onClick={resetForm}
          >
            Cancel
          </button>
        )}
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
      <h3 className="success-title">
        {mode === 'add' ? 'Data Saved Successfully!' : mode === 'update' ? 'Data Updated Successfully!' : 'Record Deleted Successfully!'}
      </h3>
      <p className="success-subtitle">
        {mode === 'delete' ? 
        `The ${activeTab} insurance record has been deleted.` : 
        `Your ${activeTab} insurance data has been ${mode === 'add' ? 'saved to' : 'updated in'} the Google Sheet.`}
      </p>
    </div>
  );

  const renderRecordsList = () => {
    if (isLoadingRecords) {
      return (
        <div className="loading-records" aria-live="polite">
          <span className="spinner" aria-label="Loading"></span> Loading records...
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <div className="no-records" aria-live="polite" style={{ textAlign: 'center', color: '#888', margin: '40px 0' }}>
          <div style={{ fontSize: '3rem' }}>📄</div>
          <div>No records found for {activeTab} insurance.</div>
        </div>
      );
    }

    const filteredRecords = records.filter(record => {
      const matchesSearch = debouncedSearchTerm.trim() === '' || (
        record.name && record.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
      if (!monthFilter) return matchesSearch;

      let recordMonth = '';
      if (record['due date']) {
        // Handle both DD-MM-YYYY and ISO formats
        if (/^\d{2}-\d{2}-\d{4}$/.test(record['due date'])) {
          const [, month] = record['due date'].split('-');
          recordMonth = month;
        } else {
          const d = new Date(record['due date']);
          if (!isNaN(d)) {
            recordMonth = String(d.getMonth() + 1).padStart(2, '0');
          }
        }
      }
      return matchesSearch && (!monthFilter || recordMonth === monthFilter);
    })
    .sort((a, b) => {
      // Helper to extract MMDD as a number for sorting
      const getMonthDay = (dateStr) => {
        if (!dateStr) return 0;
        let month = '01', day = '01';
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
          [day, month] = dateStr.split('-');
        } else {
          const d = new Date(dateStr);
          if (!isNaN(d)) {
            day = String(d.getDate()).padStart(2, '0');
            month = String(d.getMonth() + 1).padStart(2, '0');
          }
        }
        return parseInt(month + day, 10); // e.g., "0703" -> 703
      };
      return getMonthDay(a['due date']) - getMonthDay(b['due date']);
    });

    return (
      <div className="records-list">
        <h3>Existing {activeTab.toLowerCase()} records</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="month-filter-input"
            style={{ marginLeft: '16px' }}
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => {
              const value = String(i + 1).padStart(2, '0');
              const label = new Date(0, i).toLocaleString('default', { month: 'long' });
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        <div className="records-table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>CLIENT NAME</th>
                <th>DUE DATE</th>
                <th>LAST PREMIUM</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className={selectedRecordId === record.id ? 'selected-record' : ''}>
                  <td>{record.company}</td>
                  <td>{record.name || '-'}</td>
                  <td>{formatDisplayDate(record['due date'])}</td>
                  <td>{record['last premium']}</td>
                  <td>
                  <div className="action-buttons">
                    <button 
                      className="edit-button"
                      onClick={() => handleRecordSelect(record)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => initiateDelete(record.id)}
                    >
                      Delete
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const initiateDelete = (recordId) => {
    setRecordToDelete(recordId);
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteRecord = async () => {
    if (!API_URL || !recordToDelete) {
      setErrorMessage('API URL is not configured or no record selected.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteRecord',
          id: recordToDelete,
          insuranceType: activeTab
        }),
      });
      
      // Close the confirmation dialog
      setShowDeleteConfirm(false);
      
      // Show success message
      setShowSuccess(true);
      setMode('delete'); // Add this mode for success message
      
      // Reset form if we were editing the record that got deleted
      if (selectedRecordId === recordToDelete) {
        resetForm();
      }
      
      // Refresh records after deletion
      setTimeout(() => {
        fetchRecords();
      }, 1000);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setMode('add'); // Reset to add mode after deletion
      }, 3000);
      
    } catch (error) {
      console.error("Error deleting record:", error);
      setErrorMessage('Failed to delete the record. Please try again.');
    } finally {
      setIsLoading(false);
      setRecordToDelete(null);
    }
  };
  
  // Add this function to cancel the deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setRecordToDelete(null);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400); // 400ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

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
          
          {!API_URL && (
            <div className="error-message" style={{ margin: '20px 0' }}>
              API URL is not configured. Please add REACT_APP_GOOGLE_SCRIPT_URL to your .env file.
            </div>
          )}
          
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
                <h3>{mode === 'add' ? `Add ${activeTab} Insurance Data` : `Update ${activeTab} Insurance Data`}</h3>
                {renderForm()}
              </div>
              
              {renderRecordsList()}
            </>
          ) : (
            renderSuccessMessage()
          )}
        </div>
      </div>
      
      <footer className="app-footer">
        <p>© 2025 Shivgan Associates. All rights reserved.</p>
      </footer>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="confirmation-buttons">
              <button 
                className="cancel-delete-button"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-button"
                onClick={handleDeleteRecord}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
