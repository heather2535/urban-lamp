import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale } from 'chart.js';
import Badge from './Badge';

// Register chart components
ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale);

const SentimentAnalysis = ({ coin }) => {
  const [sentimentData, setSentimentData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState(null);

  // Fetch sentiment summary and graph data
  useEffect(() => {
    console.log('Coin changed:', coin); // Check if the coin value is updating correctly
    const fetchSentimentData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5005/api/sentiment-summary?coin=${coin}`);
  
        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data');
        }
  
        const data = await response.json();
        setSentimentData(data);
  
        const graphData = {
          labels: ['12 AM', '6 AM', '12 PM', '6 PM'],
          datasets: [
            {
              label: `Sentiment for ${coin}`,
              data: [0.2, -0.5, 0.6, -0.1],
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: true,
            },
          ],
        };
        setGraphData(graphData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSentimentData();
  }, [coin]); // Re-run when `coin` changes
  

  if (loading) {
    return <div>Loading sentiment data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
      {/* Sentiment Analysis Summary */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'left' }}>Market Sentiment</h1><br></br>
        <h3 style={{fontWeight: 'normal', fontSize: '13px'}}>Sentiment Score</h3><br></br>
        <p
        style={{
          fontWeight: 'normal',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center', // Ensures proper vertical alignment
        }}
      >
        <div
        style={{
          backgroundColor: 'black',
          color: 'white',
          padding: '3px 10px',
          borderRadius: '12px',
          fontWeight: 'bold',
          display: 'inline-block',
          textAlign: 'center',
          fontSize: '12px',
          border: '1px solid #007bff',
        }}
      >
        {sentimentData?.sentiment || 'N/A'}
      </div>
      </p><br></br>
        <p
        style={{
          fontWeight: 'normal',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center', // Ensures proper vertical alignment
        }}        
        >
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
  <span style={{ fontSize: '35px', fontWeight: 'bold' }}>
    {sentimentData?.sentimentScore}
  </span>
</div>


    
        </p><br></br>
        <p>
          <strong>Trending Topics:</strong><br></br>
          {sentimentData?.keyTopics && sentimentData.keyTopics.length > 0 ? (
            sentimentData.keyTopics.map((topic, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  textAlign: 'center',
                  fontSize: '10px',
                  border: '1px solid #007bff',
                  marginRight: '5px', // Adds space between badges
                }}
              >
                {topic}
              </span>
            ))
          ) : (
            'No key topics available'
          )}
        </p>

<br></br>
    
      </div>

      {/* Sentiment Graph */}
     
    </div>
  );
};

export default SentimentAnalysis;
