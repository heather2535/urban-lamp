import json
import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
import string
from textblob import TextBlob
import matplotlib.pyplot as plt

# Download NLTK data (only needed once)
nltk.download('punkt')  # For tokenization
nltk.download('stopwords')  # For stopwords
nltk.download('vader_lexicon')  # For VADER sentiment analysis

# Step 1: Load data from the JSON file
with open('conversations.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Step 2: Extract user messages and assistant responses
def extract_messages(conversation):
    user_messages = []
    assistant_responses = []
    mapping = conversation.get('mapping', {})
    for message_id, message_data in mapping.items():
        message = message_data.get('message', {})
        if message:
            role = message.get('author', {}).get('role')
            content = message.get('content', {})
            if content and content.get('content_type') == 'text':
                parts = content.get('parts', [])
                for part in parts:
                    if part.strip():  # Skip empty parts
                        if role == 'user':
                            user_messages.append(part)
                        elif role == 'assistant':
                            assistant_responses.append(part)
    return user_messages, assistant_responses

# Extract user messages and assistant responses from all conversations
user_messages = []
assistant_responses = []
for conversation in data:
    user_msgs, assistant_resps = extract_messages(conversation)
    user_messages.extend(user_msgs)
    assistant_responses.extend(assistant_resps)

print("User Messages:")
print(user_messages[:5])  # Print the first 5 user messages
print("\nAssistant Responses:")
print(assistant_responses[:5])  # Print the first 5 assistant responses

# Step 3: Remove noise (optional, if needed)
def clean_text(text_list):
    cleaned_texts = []
    for text in text_list:
        text = re.sub(r'\[\d{1,2}:\d{2} (AM|PM)\]', '', text)  # Remove timestamps
        text = re.sub(r'(User|Assistant):', '', text)  # Remove metadata
        text = re.sub(r'\s+', ' ', text).strip()  # Remove extra spaces
        cleaned_texts.append(text)
    return cleaned_texts

user_messages = clean_text(user_messages)
assistant_responses = clean_text(assistant_responses)

# Step 4: Tokenize and Normalize (optional, if needed)
def normalize_text(text_list):
    normalized_texts = []
    for text in text_list:
        text = text.lower()  # Convert to lowercase
        text = text.translate(str.maketrans('', '', string.punctuation))  # Remove punctuation
        stop_words = set(stopwords.words('english'))
        words = [word for word in word_tokenize(text) if word not in stop_words]  # Remove stopwords
        normalized_texts.append(' '.join(words))
    return normalized_texts

user_messages = normalize_text(user_messages)
assistant_responses = normalize_text(assistant_responses)

# Step 5: Perform Sentiment Analysis
def analyze_sentiment(text_list):
    results = []
    for text in text_list:
        blob = TextBlob(text)
        results.append({
            'text': text,
            'polarity': blob.sentiment.polarity,
            'subjectivity': blob.sentiment.subjectivity
        })
    return results

# Analyze sentiment for user messages
user_sentiment_results = analyze_sentiment(user_messages)

# Analyze sentiment for assistant responses
assistant_sentiment_results = analyze_sentiment(assistant_responses)

# Step 6: Display Results
print("\nSentiment Analysis Results:")
print("User Messages:")
for i, result in enumerate(user_sentiment_results):
    print(f"Message {i + 1}:")
    print(f"Text: {result['text']}")
    print(f"Polarity: {result['polarity']:.2f}, Subjectivity: {result['subjectivity']:.2f}")
    print()

print("\nAssistant Responses:")
for i, result in enumerate(assistant_sentiment_results):
    print(f"Response {i + 1}:")
    print(f"Text: {result['text']}")
    print(f"Polarity: {result['polarity']:.2f}, Subjectivity: {result['subjectivity']:.2f}")
    print()

# Step 7: Visualize Sentiment Distribution
user_polarities = [result['polarity'] for result in user_sentiment_results]
assistant_polarities = [result['polarity'] for result in assistant_sentiment_results]

plt.figure(figsize=(12, 6))

# Plot user messages sentiment
plt.subplot(1, 2, 1)
plt.hist(user_polarities, bins=20, color='blue', alpha=0.7)
plt.title('User Messages Sentiment Distribution')
plt.xlabel('Polarity')
plt.ylabel('Frequency')

# Plot assistant responses sentiment
plt.subplot(1, 2, 2)
plt.hist(assistant_polarities, bins=20, color='green', alpha=0.7)
plt.title('Assistant Responses Sentiment Distribution')
plt.xlabel('Polarity')
plt.ylabel('Frequency')

plt.tight_layout()
plt.show()