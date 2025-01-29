import talib  # Technical Analysis Library

# Add RSI
data['RSI'] = talib.RSI(data['close'], timeperiod=14)

# Add MACD
data['MACD'], data['MACD_signal'], data['MACD_hist'] = talib.MACD(data['close'], 
                                                                  fastperiod=12, 
                                                                  slowperiod=26, 
                                                                  signalperiod=9)

# Add Moving Averages
data['SMA_50'] = data['close'].rolling(window=50).mean()
data['SMA_200'] = data['close'].rolling(window=200).mean()

print(data[['RSI', 'MACD', 'SMA_50', 'SMA_200']].tail())
