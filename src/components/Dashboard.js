import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [excelData, setExcelData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedXAxis, setSelectedXAxis] = useState('');
  const [selectedYAxis, setSelectedYAxis] = useState('');
  const [chartInstance, setChartInstance] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [activeSection, setActiveSection] = useState('upload'); // 'upload', 'profile', 'admin'
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadStatus('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      setExcelData(response.data.data);
      setColumns(response.data.headers);
      setUploadStatus('File uploaded successfully!');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Error uploading file. Please try again.');
    }
  };

  const generateChart = () => {
    if (!excelData || !selectedXAxis || !selectedYAxis) {
      alert('Please select both X and Y axes');
      return;
    }

    const ctx = document.getElementById('myChart');
    
    // Destroy existing chart if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }

    // Prepare and sort data for chart
    const combinedData = excelData.map(row => ({
      x: row[selectedXAxis],
      y: parseFloat(row[selectedYAxis]) || 0
    }));

    // Sort data based on X-axis values
    combinedData.sort((a, b) => {
      // If x values are numbers, sort numerically
      if (!isNaN(a.x) && !isNaN(b.x)) {
        return parseFloat(a.x) - parseFloat(b.x);
      }
      // Otherwise sort as strings
      return a.x.toString().localeCompare(b.x.toString());
    });

    const labels = combinedData.map(item => item.x);
    const data = combinedData.map(item => item.y);
    
    // Generate random colors for better visualization
    const generateColors = (count) => {
      const colors = [];
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
      }
      return colors;
    };
    
    const backgroundColors = generateColors(data.length);
    
    // Chart configuration based on chart type
    let chartConfig = {};
    
    if (chartType === 'pie' || chartType === 'doughnut') {
      chartConfig = {
        type: chartType,
        data: {
          labels: labels,
          datasets: [{
            label: selectedYAxis,
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: `${selectedYAxis} by ${selectedXAxis}`
            }
          }
        }
      };
    } else if (chartType === 'polarArea') {
      chartConfig = {
        type: 'polarArea',
        data: {
          labels: labels,
          datasets: [{
            label: selectedYAxis,
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: `${selectedYAxis} by ${selectedXAxis}`
            }
          }
        }
      };
    } else {
      // For bar, line, radar charts
      chartConfig = {
        type: chartType,
        data: {
          labels: labels,
          datasets: [{
            label: selectedYAxis,
            data: data,
            backgroundColor: chartType === 'line' ? 'rgba(54, 162, 235, 0.2)' : backgroundColors,
            borderColor: chartType === 'line' ? 'rgba(54, 162, 235, 1)' : 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            fill: chartType === 'line' ? false : true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: true,
              text: `${selectedYAxis} by ${selectedXAxis}`
            }
          }
        }
      };
    }

    const newChart = new Chart(ctx, chartConfig);
    setChartInstance(newChart);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // Render the appropriate section based on activeSection state
  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="profile-section">
            <h2>User Profile</h2>
            {userData && (
              <div className="profile-details">
                <div className="profile-card">
                  <div className="profile-avatar">
                    {userData.name ? userData.name.charAt(0).toUpperCase() : userData.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-info">
                    <h3>{userData.name || 'User'}</h3>
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Role:</strong> {userRole}</p>
                    <p><strong>Member Since:</strong> {new Date(userData.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="upload-history">
                  <h3>Upload History</h3>
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Filename</th>
                          <th>Upload Date</th>
                          <th>Rows</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* This would be populated from an API call to get user's upload history */}
                        <tr>
                          <td colSpan="3">Loading history...</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'admin':
        return userRole === 'admin' ? (
          <div className="admin-section">
            <h2>Admin Panel</h2>
            <div className="admin-stats">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p className="stat-number">0</p>
              </div>
              <div className="stat-card">
                <h3>Total Uploads</h3>
                <p className="stat-number">0</p>
              </div>
              <div className="stat-card">
                <h3>Storage Used</h3>
                <p className="stat-number">0 MB</p>
              </div>
            </div>
            
            <div className="user-management">
              <h3>User Management</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* This would be populated from an API call to get all users */}
                  <tr>
                    <td colSpan="4">Loading users...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="unauthorized">
            <h2>Unauthorized Access</h2>
            <p>You do not have permission to view this page.</p>
          </div>
        );
      
      default: // 'upload'
        return (
          <div className="upload-section">
            <h2>Upload Excel File</h2>
            <div className="file-upload-container">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                id="file-upload"
                className="file-input"
              />
              <label htmlFor="file-upload" className="file-label">
                <span className="file-icon">📄</span>
                <span>{selectedFile ? selectedFile.name : 'Choose a file'}</span>
              </label>
              <button 
                onClick={handleFileUpload} 
                disabled={!selectedFile}
                className="upload-button"
              >
                Upload File
              </button>
            </div>
            {uploadStatus && <p className={`upload-status ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>{uploadStatus}</p>}
            
            {excelData && (
              <div className="chart-section">
                <div className="chart-controls">
                  <div className="axis-selectors">
                    <div className="selector">
                      <label>Select X-Axis:</label>
                      <select
                        value={selectedXAxis}
                        onChange={(e) => setSelectedXAxis(e.target.value)}
                      >
                        <option value="">Select column</option>
                        {columns.map((column, index) => (
                          <option key={index} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                    <div className="selector">
                      <label>Select Y-Axis:</label>
                      <select
                        value={selectedYAxis}
                        onChange={(e) => setSelectedYAxis(e.target.value)}
                      >
                        <option value="">Select column</option>
                        {columns.map((column, index) => (
                          <option key={index} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="chart-type-selector">
                    <label>Chart Type:</label>
                    <div className="chart-type-options">
                      <button 
                        className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                        onClick={() => setChartType('bar')}
                      >
                        Bar
                      </button>
                      <button 
                        className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                        onClick={() => setChartType('line')}
                      >
                        Line
                      </button>
                      <button 
                        className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
                        onClick={() => setChartType('pie')}
                      >
                        Pie
                      </button>
                      <button 
                        className={`chart-type-btn ${chartType === 'doughnut' ? 'active' : ''}`}
                        onClick={() => setChartType('doughnut')}
                      >
                        Doughnut
                      </button>
                      <button 
                        className={`chart-type-btn ${chartType === 'polarArea' ? 'active' : ''}`}
                        onClick={() => setChartType('polarArea')}
                      >
                        Polar
                      </button>
                      <button 
                        className={`chart-type-btn ${chartType === 'radar' ? 'active' : ''}`}
                        onClick={() => setChartType('radar')}
                      >
                        Radar
                      </button>
                    </div>
                  </div>
                  
                  <button className="generate-button" onClick={generateChart}>
                    Generate Chart
                  </button>
                </div>
                
                <div className="chart-container">
                  <canvas id="myChart"></canvas>
                </div>
                
                <div className="data-preview">
                  <h3>Data Preview</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {columns.map((column, index) => (
                            <th key={index}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {columns.map((column, colIndex) => (
                              <td key={colIndex}>{row[column]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {excelData.length > 10 && (
                    <p className="data-note">Showing 10 of {excelData.length} rows</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Excel Analyzer</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className={`nav-link ${activeSection === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveSection('upload')}
              >
                <span className="nav-icon">📊</span>
                <span>Excel Upload</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSection('profile')}
              >
                <span className="nav-icon">👤</span>
                <span>User Profile</span>
              </button>
            </li>
            {userRole === 'admin' && (
              <li>
                <button 
                  className={`nav-link ${activeSection === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveSection('admin')}
                >
                  <span className="nav-icon">⚙️</span>
                  <span>Admin Panel</span>
                </button>
              </li>
            )}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="content-header">
          <h1>
            {activeSection === 'upload' && 'Excel Data Analyzer'}
            {activeSection === 'profile' && 'User Profile'}
            {activeSection === 'admin' && 'Admin Panel'}
          </h1>
          <div className="user-welcome">
            {userData && (
              <span>Welcome, {userData.name || userData.email.split('@')[0]}</span>
            )}
          </div>
        </header>
        
        <div className="content-body">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;