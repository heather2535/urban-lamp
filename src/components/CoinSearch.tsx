import React, { useState } from 'react';
import axios from 'axios';

const CoinSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [coins, setCoins] = useState([]); // Array of coins that user has added
  const [loading, setLoading] = useState(false); // Loading state to show spinner during API call

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Handle search button click
  const handleSearchClick = async () => {
    if (searchQuery.trim() === '') return;

    setLoading(true);
    
    try {
      // Replace with your CoinMarketCap API key
      const API_KEY = 'YOUR_COINMARKETCAP_API_KEY';
      const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest`;

      const response = await axios.get(url, {
        headers: {
          'X-CMC_PRO_API_KEY': API_KEY,
          'Accept': 'application/json',
        },
        params: {
          start: 1,
          limit: 100, // Limit to 100 coins
          sort: 'market_cap',
        },
      });

      // Filter coins based on the search query
      const filteredCoins = response.data.data.filter((coin) =>
        coin.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(filteredCoins);
    } catch (error) {
      console.error('Error fetching data from CoinMarketCap:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a coin to the user's list of coins
  const handleAddCoin = (coin) => {
    setCoins((prevCoins) => [...prevCoins, coin]);
  };

  return (
    <div className="coin-search-container">
      {/* Search bar */}
      <div className="search-container">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search for a coin..."
          className="search-input"
        />
        <button onClick={handleSearchClick} className="search-button">
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results</h3>
          <ul>
            {searchResults.map((coin) => (
              <li key={coin.id}>
                <span>{coin.name} ({coin.symbol})</span>
                <button
                  onClick={() => handleAddCoin(coin)}
                  className="add-coin-button"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Display added coins */}
      <div className="coins-container">
        <h3>Your Coins</h3>
        {coins.length > 0 ? (
          <ul>
            {coins.map((coin, index) => (
              <li key={index}>{coin.name}</li>
            ))}
          </ul>
        ) : (
          <p>No coins added yet.</p>
        )}
      </div>
    </div>
  );
};

export default CoinSearch;
