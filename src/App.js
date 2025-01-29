import React, { useState, useEffect } from 'react';
import { fetchCurrentPrices, fetchHistoricalData } from './backend/api';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { DollarSign, TrendingUp, TrendingDown, Search, ExternalLink } from 'lucide-react';
import SentimentAnalysis from './components/SentimentAnalysis';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Products from './pages/Products';
import Community from './pages/Community';
import Markets from './pages/Markets';
import News from './pages/News';
import OhlcvChart from './components/OHLCVChart'; // Adjust path as needed

import './App.css';

const App = () => {
  const [myCoins, setMyCoins] = useState(['bitcoin', 'ethereum']);
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [prices, setPrices] = useState({});
  const [historicalData, setHistoricalData] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [timePeriod, setTimePeriod] = useState('30');
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [sentimentData, setSentimentData] = useState({});
  const [summary, setSummary] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [news, setNews] = useState([]); // State for news articles

  // Fetch trending coins from the CoinGecko API
  useEffect(() => {
    fetchPrediction(); // Fetch prediction when selectedCoin changes
  }, [selectedCoin]);

  useEffect(() => {
    const fetchTrendingCoins = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
        const data = await response.json();
        const coins = data.coins.map(coin => coin.item.id);
        setTrendingCoins(coins);
      } catch (error) {
        console.error('Error fetching trending coins:', error);
      }
    };

    fetchTrendingCoins();
  }, []);

  // Fetch current prices for all coins
  useEffect(() => {
    const getPrices = async () => {
      try {
        const data = await fetchCurrentPrices([...myCoins, ...trendingCoins]);
        setPrices(data);
      } catch (error) {
        console.error('Error fetching current prices:', error);
      }
    };

    if (trendingCoins.length > 0) {
      getPrices();
    }
  }, [myCoins, trendingCoins]);

  // Fetch historical data for the selected coin and time period
  useEffect(() => {
    const getHistoricalData = async () => {
      try {
        const data = await fetchHistoricalData(selectedCoin, timePeriod);
        setHistoricalData(data);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    getHistoricalData();
  }, [timePeriod, selectedCoin]);

  // Fetch sentiment summary from the backend API when a coin is selected
  const fetchSentimentSummary = async (coin) => {
    console.log('Fetching sentiment for:', coin);
    try {
      const response = await fetch(`http://localhost:5005/api/sentiment-summary?coin=${coin}`);
      const data = await response.json();
      setSentimentData(data);
      setSummary(`${data.name}: ${data.sentiment} (${data.sentimentScore})\n${data.recentNews}`);
    } catch (error) {
      console.error('Error fetching sentiment summary:', error);
      alert(`Failed to fetch sentiment summary: ${error.message}`);
    }
  };

  // Fetch prediction data from the backend API
  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5005/prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coin: selectedCoin }),
      });
      const data = await response.json();
      console.log('Prediction response:', data);
      if (data.prediction) {
        setPrediction(data.prediction);
      } else {
        setPrediction('No prediction available');
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
      setPrediction('Error fetching prediction');
    } finally {
      setLoading(false);
    }
  };

  // Fetch news for the selected coin
  const fetchNews = async (coin) => {
    try {
      const response = await fetch(`http://localhost:5005/api/crypto-news?coin=${coin}`);
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]); // Reset news on error
    }
  };

  // Fetch news for Bitcoin by default on component mount
  useEffect(() => {
    fetchNews('bitcoin'); // Fetch news for Bitcoin by default
  }, []);

  // Handle coin click to update selected coin and fetch sentiment data
  const handleCoinClick = async (coin) => {
    setSelectedCoin(coin);
    fetchSentimentSummary(coin); // Fetch sentiment data
    fetchPrediction(); // Fetch prediction data
    fetchNews(coin); // Fetch news for the selected coin
  };

  // Data for the chart
  const chartData = {
    labels: historicalData?.prices?.map(price => new Date(price[0]).toLocaleDateString()) || [],
    datasets: [
      {
        label: `${selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)} Price`,
        data: historicalData?.prices?.map(price => price[1]) || [],
        borderColor: '#FF5733',
        fill: false,
      },
    ],
  };

  // Chart options with axis labels and straight y-axis label
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          callback: function (value, index) {
            return index % 5 === 0 ? this.getLabelForValue(value) : '';
          },
          maxRotation: 0,
          minRotation: 0,
          color: darkMode ? '#FFFFFF' : '#000000',
        },
        grid: {
          display: false,
          drawBorder: true,
        },
      },
      y: {
        title: {
          display: true,
          text: '$',
          rotation: 90,
        },
        ticks: {
          callback: function (value) {
            return `$${value}`;
          },
          color: darkMode ? '#FFFFFF' : '#000000',
        },
        grid: {
          display: false,
          drawBorder: true,
        },
      },
    },
  };

  // Filter coins based on search term
  const filteredMyCoins = myCoins.filter((coin) => coin.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTrendingCoins = trendingCoins.filter((coin) => coin.toLowerCase().includes(searchTerm.toLowerCase()));

  // Drag and Drop Methods
  const handleDragStart = (e, coin) => {
    e.dataTransfer.setData('coin', coin);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const coin = e.dataTransfer.getData('coin');
    if (coin && !myCoins.includes(coin)) {
      setMyCoins((prevCoins) => [...prevCoins, coin]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnd = (e, coin) => {
    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
    const isInMyCoinsContainer = elementUnderCursor?.closest('.my-coins-column');
    if (!isInMyCoinsContainer) {
      setMyCoins(prevCoins => prevCoins.filter(c => c !== coin));
    }
  };

  return (
    <Router>
      <Layout darkMode={darkMode}>
        <Routes>
          <Route path="/" element={
            <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
              <div className="content-container">
                <div className="card" style={{ padding: '20px' }}>
                  <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
                    Toggle Dark Mode
                  </button>
                  <h1 style={{ fontWeight: 'bold', fontSize: '2rem', textAlign: 'left' }}>Heather's Epic Crypto Price Tracker</h1>

                  {/* Coin search input */}
                  <div className="coin-search-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search for coins..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="search-icon" size={18} />
                  </div>

                  <div className="coins-container">
                    <div className="column my-coins-column" 
                      onDrop={handleDrop} 
                      onDragOver={handleDragOver}
                    >
                      <h2 style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'left' }}>My Coins</h2>
                      {filteredMyCoins.map((coin) => (
                        <div
                          key={coin}
                          className={`coin-item-container ${selectedCoin === coin ? 'selected' : ''}`}
                          onClick={() => handleCoinClick(coin)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, coin)}
                          onDragEnd={(e) => handleDragEnd(e, coin)}
                        >
                          <h3 style={{ display: 'flex', alignItems: 'center' }}>
                            <DollarSign style={{ marginRight: '5px' }} />
                            {coin.charAt(0).toUpperCase() + coin.slice(1)}
                          </h3>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <p style={{ marginRight: '10px' }}>
                              ${prices[coin]?.usd?.toFixed(2) || 'Loading...'}
                            </p>
                            {prices[coin]?.usd_24h_change !== undefined && (
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {prices[coin]?.usd_24h_change > 0 ? (
                                  <TrendingUp color="#32CD32" style={{ marginRight: '5px', marginLeft: '10px', width: '16px', height: '16px'  }} />
                                ) : (
                                  <TrendingDown color="red" style={{ marginRight: '5px', marginLeft: '10px', width: '16px', height: '16px' }} />
                                )}
                                <p
                                  style={{
                                    color: prices[coin]?.usd_24h_change > 0 ? '#32CD32' : 'red',
                                  }}
                                >
                                  {prices[coin]?.usd_24h_change.toFixed(2)}%
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="column" 
                      onDrop={handleDrop} 
                      onDragOver={handleDragOver}
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <h2 style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'left' }}>Trending Coins</h2>
                      <p style={{ fontSize: '0.9rem', color: darkMode ? '#CCCCCC' : '#333', marginTop: '-20px', marginBottom: '15px' }}>
                        Drag coins from here to add them to your watchlist
                      </p>
                      <div className="trending-coins-container">
                        {filteredTrendingCoins.slice(0, 20).map((coin) => (
                          <div
                            key={coin}
                            className={`coin-item-container ${selectedCoin === coin ? 'selected' : ''}`}
                            onClick={() => handleCoinClick(coin)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, coin)}
                          >
                            <h3 style={{ display: 'flex', alignItems: 'center' }}>
                              <DollarSign style={{ marginRight: '10px' }} />
                              {coin.charAt(0).toUpperCase() + coin.slice(1)}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <p style={{ marginRight: '10px' }}>
                                ${prices[coin]?.usd ? prices[coin]?.usd.toFixed(3) : 'Loading...'}
                              </p>
                              {prices[coin]?.usd_24h_change !== undefined && (
                                <div style={{ height: '60px', display: 'flex', alignItems: 'center' }}>
                                  {prices[coin]?.usd_24h_change > 0 ? (
                                    <TrendingUp
                                      color="#32CD32"
                                      style={{ marginRight: '5px', width: '16px', height: '16px' }}
                                    />
                                  ) : (
                                    <TrendingDown
                                      color="red"
                                      style={{ marginRight: '5px', width: '16px', height: '16px' }}
                                    />
                                  )}
                                  <p
                                    style={{
                                      color: prices[coin]?.usd_24h_change > 0 ? '#32CD32' : 'red',
                                      margin: 0,
                                    }}
                                  >
                                    {prices[coin]?.usd_24h_change.toFixed(2)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="graph-and-sentiment-container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  <div className="graph-container card" style={{ 
                    padding: '20px', 
                    border: '1px solid #ccc', 
                    borderRadius: '8px', 
                    minWidth: '0'
                  }}>
                    <div className="time-period-container">
                      <div className="time-buttons-container">
                        <button className={`time-button ${timePeriod === '1' ? 'active' : ''}`} onClick={() => setTimePeriod('1')}>1D</button>
                        <button className={`time-button ${timePeriod === '7' ? 'active' : ''}`} onClick={() => setTimePeriod('7')}>1W</button>
                        <button className={`time-button ${timePeriod === '30' ? 'active' : ''}`} onClick={() => setTimePeriod('30')}>1M</button>
                        <button className={`time-button ${timePeriod === '90' ? 'active' : ''}`} onClick={() => setTimePeriod('90')}>3M</button>
                      </div>
                    </div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem', textAlign: 'left' }}>
                      {selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)} Historical Data
                    </h3>
                    {historicalData?.prices && historicalData?.prices.length > 0 ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <p>Loading data...</p>
                    )}
                  </div>

                  <div className="sentiment-container card" style={{ 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid #ccc', 
                    marginLeft: '10px', 
                    marginTop: '-20px', 
                    minWidth: '0' 
                  }}>
                    <SentimentAnalysis coin={selectedCoin} />
                    {/* Display prediction */}
              

            {/* Display news */}
<div className="news-container" style={{ marginTop: '-60px' }}>
  <h3 style={{ fontWeight: 'bold', margin: '20px' }}>
    {selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)} News
  </h3>
  <div className="news-cards" style={{
    display: 'flex',
    flexDirection: 'column', // Arrange cards vertically
    marginTop: '-20px',
    maxHeight: '500px', // Set the maximum height for the container (adjust as needed)
    overflowY: 'auto',  // Enable vertical scrolling
    gap: '10px', 
    padding: '20px'
  }}>
    {news.length > 0 ? (
      news.map((article, index) => {
        // Regular expression to find coin name in the title
        const coinMentionRegex = new RegExp(`(${selectedCoin})`, 'i'); 
        const titleMatch = article.title?.match(coinMentionRegex);
        
        // If the title contains the coin, extract the portion
        const titlePortion = titleMatch ? article.title.slice(titleMatch.index) : article.title;
        
        // Format the publication date
        const formattedDate = new Date(article.publishedAt).toLocaleDateString();

        return (
          <a 
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none', // Remove the default link underline
              color: 'inherit' // Inherit color for all child elements
            }}
          >
            <div
              className="news-card"
              style={{
                minWidth: '300px',
                maxHeight: '300px', // Set max height for the individual cards (increased for description)
                border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                borderRadius: '8px',
                padding: '10px',
                backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                color: darkMode ? '#fff' : '#000',
                overflow: 'hidden', // Prevent overflow of card content
                transition: 'background-color 0.3s ease', // Smooth transition for background color
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#333' : '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#1e1e1e' : '#fff'}
            >
              {/* Display the filtered title portion */}
              <h4 style={{ fontSize: '1rem', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {titlePortion}
              </h4>
              
              {/* Display the description of the article */}
              <p style={{
                fontSize: '0.9rem',
                marginBottom: '8px',
                color: darkMode ? '#ccc' : '#666',
                whiteSpace: 'nowrap', // Ensure the text doesn't overflow the container
                overflow: 'hidden',
                textOverflow: 'ellipsis', // Ellipsis for long descriptions
              }}>
                {article.description}
              </p>

              {/* Display the source of the article */}
              <p style={{ fontSize: '0.9rem', marginBottom: '4px', color: darkMode ? '#ccc' : '#666', fontStyle: 'italic' }}>
                {article.source?.name || 'Unknown Source'}
              </p>
              
              {/* Display the publication date */}
              <p style={{ fontSize: '0.8rem', marginBottom: '8px', color: darkMode ? '#888' : '#444' }}>
                {formattedDate}
              </p>
            </div>
          </a>
        );
      })
    ) : (
      <p>No news available.</p>
    )}
  </div>





                    </div>
                  </div>
                </div>
              </div>

              
            </div>
          } />
          <Route path="/products" element={<Products />} />
          <Route path="/community" element={<Community />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/news" element={<News />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;