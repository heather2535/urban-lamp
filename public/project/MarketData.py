# In MarketData.py
import pandas as pd
import ccxt

# Initialize exchange (e.g., Binance)
exchange = ccxt.binance({
    'rateLimit': 1200,
    'enableRateLimit': True,
})

# Fetch historical data function
def fetch_historical_data(symbol, timeframe, since):
    ohlcv = exchange.fetch_ohlcv(symbol, timeframe, since=since)
    df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    return df

# Example usage: Fetch last 6 months of BTC/USDT data
symbol = 'BTC/USDT'
timeframe = '1h'
since = exchange.parse8601('2023-06-01T00:00:00Z')
data = fetch_historical_data(symbol, timeframe, since)

# Check the first few rows of the data
print(data.head())
