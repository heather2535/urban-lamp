from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# Prepare data
data['target'] = (data['close'].shift(-1) > data['close']).astype(int)  # 1 for Buy, 0 for Sell
features = ['RSI', 'MACD', 'SMA_50', 'SMA_200']
data = data.dropna()

X = data[features]
y = data['target']

# Split into train and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate model
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))
