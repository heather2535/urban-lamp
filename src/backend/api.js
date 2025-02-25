
import axios from 'axios';

const baseURL = process.env.REACT_APP_COIN_GECKO_BASE_URL;

// Function to get current prices for selected coins
export const fetchCurrentPrices = async (coins) => {
  const response = await axios.get(`${baseURL}/simple/price`, {
    params: {
      ids: coins.join(','),
      vs_currencies: 'usd',
      include_24hr_change: 'true', // Include 24-hour change

    }
  });
  return response.data;
};

// Function to get historical data for a coin
export const fetchHistoricalData = async (coinId, days = 30) => {
  const response = await axios.get(`${baseURL}/coins/${coinId}/market_chart`, {
    params: {
      vs_currency: 'usd',
      days
    }
  });
  return response.data;
};
