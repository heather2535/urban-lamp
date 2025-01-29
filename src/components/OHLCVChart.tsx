import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register necessary chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface OHLCVData {
  [key: string]: string[];
}

const KrakenOHLCV: React.FC = () => {
  // State for selected coin, interval, and OHLCV data
  const [coin, setCoin] = useState<string>('ETHUSDC');
  const [interval, setInterval] = useState<string>('60');
  const [ohlcvData, setOhlcvData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Function to fetch OHLCV data from the backend
  const fetchOHLCVData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:5005/api/kraken-ohlcv`, {
        params: { pair: coin, interval },
      });

      if (response.data && response.data.length > 0) {
        setOhlcvData(response.data);
      } else {
        setError('No data found.');
      }
    } catch (error) {
      setError('Unable to fetch OHLCV data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle coin selection change
  const handleCoinChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCoin(event.target.value);
  };

  // Function to handle interval selection change
  const handleIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInterval(event.target.value);
  };

  // Prepare data for the chart
  const prepareChartData = () => {
    if (!ohlcvData || ohlcvData.length === 0) return null;

    const labels = ohlcvData.map((item: any) =>
      new Date(item[0] * 1000).toLocaleString()
    ); // Convert timestamp to human-readable date
    const openPrices = ohlcvData.map((item: any) => parseFloat(item[1]));
    const highPrices = ohlcvData.map((item: any) => parseFloat(item[2]));
    const lowPrices = ohlcvData.map((item: any) => parseFloat(item[3]));
    const closePrices = ohlcvData.map((item: any) => parseFloat(item[4]));

    return {
      labels,
      datasets: [
        {
          label: 'Open Price',
          data: openPrices,
          borderColor: 'green',
          fill: false,
        },
        {
          label: 'High Price',
          data: highPrices,
          borderColor: 'blue',
          fill: false,
        },
        {
          label: 'Low Price',
          data: lowPrices,
          borderColor: 'red',
          fill: false,
        },
        {
          label: 'Close Price',
          data: closePrices,
          borderColor: 'black',
          fill: false,
        },
      ],
    };
  };

  // Chart data prepared for rendering
  const chartData = prepareChartData();

  return (
    <div>
      <h1>Kraken OHLCV Data</h1>

      <div>
        <label htmlFor="coinSelect">Select Coin: </label>
        <select id="coinSelect" value={coin} onChange={handleCoinChange}>
          <option value="ETHUSDC">Ethereum (ETH)</option>
          <option value="BTCUSDC">Bitcoin (BTC)</option>
          {/* Add more coins if needed */}
        </select>
      </div>

      <div>
        <label htmlFor="intervalSelect">Select Interval: </label>
        <select id="intervalSelect" value={interval} onChange={handleIntervalChange}>
          <option value="5">5 minutes</option>
          <option value="15">15 minutes</option>
          <option value="60">1 hour</option>
          <option value="1440">1 day</option>
          {/* Add more intervals if needed */}
        </select>
      </div>

      <button onClick={fetchOHLCVData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {chartData && (
        <div>
          <h2>OHLCV Data Chart</h2>
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
};

export default KrakenOHLCV;
