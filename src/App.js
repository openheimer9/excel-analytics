import React, { useState } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedXAxis, setSelectedXAxis] = useState('');
  const [selectedYAxis, setSelectedYAxis] = useState('');
  const [selectedChartType, setSelectedChartType] = useState('bar'); // Default to bar chart
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.ms-excel' || 
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError('');
      } else {
        setError('Please upload only Excel files (.xls or .xlsx)');
        setFile(null);
        setFileName('');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setData(response.data.data);
      setHeaders(response.data.headers);
      setSelectedXAxis('');
      setSelectedYAxis('');
      setChartData(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.response?.data?.message || 'Error uploading file');
      setIsLoading(false);
    }
  };

  const generateChart = () => {
    if (!selectedXAxis || !selectedYAxis) {
      setError('Please select both X and Y axes');
      return;
    }

    // Create a copy of the data to sort
    const sortedData = [...data].sort((a, b) => {
      const valA = a[selectedXAxis];
      const valB = b[selectedXAxis];

      // Check if values are numeric for X-axis
      const isNumericX = !isNaN(parseFloat(valA)) && isFinite(valA) && !isNaN(parseFloat(valB)) && isFinite(valB);

      if (isNumericX) {
        return parseFloat(valA) - parseFloat(valB);
      } else {
        // Fallback to string comparison if not numeric
        if (String(valA) < String(valB)) return -1;
        if (String(valA) > String(valB)) return 1;
        return 0;
      }
    });

    const labels = sortedData.map(item => item[selectedXAxis]);
    const values = sortedData.map(item => parseFloat(item[selectedYAxis]) || 0);

    // Define a color palette for charts
    const backgroundColors = [
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(199, 199, 199, 0.6)',
      'rgba(83, 102, 255, 0.6)',
      'rgba(40, 159, 64, 0.6)',
      'rgba(210, 99, 132, 0.6)'
    ];

    const borderColors = [
      'rgba(54, 162, 235, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(199, 199, 199, 1)',
      'rgba(83, 102, 255, 1)',
      'rgba(40, 159, 64, 1)',
      'rgba(210, 99, 132, 1)'
    ];

    let datasetOptions = {
      label: selectedYAxis,
      data: values,
      borderWidth: 1,
    };

    if (selectedChartType === 'pie') {
      datasetOptions.backgroundColor = backgroundColors.slice(0, values.length);
      datasetOptions.borderColor = borderColors.slice(0, values.length);
    } else {
      datasetOptions.backgroundColor = backgroundColors[0];
      datasetOptions.borderColor = borderColors[0];
    }

    const chartDataConfig = {
      labels,
      datasets: [datasetOptions],
    };

    setChartData(chartDataConfig);
    setError('');
  };

  const renderChart = () => {
    if (!chartData) return null;

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${selectedYAxis} by ${selectedXAxis} (${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Chart)`,
        },
      },
    };

    switch (selectedChartType) {
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Excel Data Analyzer</h1>
      </header>
      <main className="container">
        <div className="upload-section">
          <h2>Upload Excel File</h2>
          <div className="file-input-container">
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="file-input"
              accept=".xls,.xlsx"
            />
            {fileName && <p className="file-name">Selected: {fileName}</p>}
          </div>
          <button 
            onClick={handleUpload} 
            disabled={!file || isLoading}
            className="upload-button"
          >
            {isLoading ? 'Uploading...' : 'Upload'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>

        {headers.length > 0 && (
          <div className="analysis-section">
            <h2>Generate Chart</h2>
            <div className="axis-selectors">
              <div className="selector">
                <label>X-Axis:</label>
                <select 
                  value={selectedXAxis} 
                  onChange={(e) => setSelectedXAxis(e.target.value)}
                >
                  <option value="">Select X-Axis</option>
                  {headers.map((header, index) => (
                    <option key={index} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <div className="selector">
                <label>Y-Axis:</label>
                <select 
                  value={selectedYAxis} 
                  onChange={(e) => setSelectedYAxis(e.target.value)}
                >
                  <option value="">Select Y-Axis</option>
                  {headers.map((header, index) => (
                    <option key={index} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <div className="selector">
                <label>Chart Type:</label>
                <select 
                  value={selectedChartType} 
                  onChange={(e) => setSelectedChartType(e.target.value)}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
            </div>
            <button 
              onClick={generateChart} 
              disabled={!selectedXAxis || !selectedYAxis}
              className="generate-button"
            >
              Generate Chart
            </button>
          </div>
        )}

        {chartData && (
          <div className="chart-container">
            <h2>Chart</h2>
            {renderChart()}
          </div>
        )}

        {data.length > 0 && (
          <div className="data-preview">
            <h2>Data Preview</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((header, colIndex) => (
                        <td key={colIndex}>{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 10 && (
                <p className="more-data">Showing 10 of {data.length} rows</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
