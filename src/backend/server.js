require('dotenv').config(); // Load .env variables


const express = require('express');
const axios = require('axios');
const { LanguageServiceClient } = require('@google-cloud/language');
const googleClient = new LanguageServiceClient();
const cors = require('cors');
const cron = require('node-cron');
const app = express();
const PORT = 5005;

// API Keys
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const CMC_BASE_URL = process.env.CMC_API_BASE_URL;
const API_KEY = process.env.API_KEY
const NEWS_API_KEY = process.env.NEWS_API_KEY// For fetching news articles

// Store sentiment data
let sentimentDataCache = {};

// Middleware
app.use(cors());
app.use(express.json());

// Fetch cryptocurrency data
app.get('/api/crypto-prices', async (req, res) => {
  try {
    const { data } = await axios.get(`${CMC_API_BASE_URL}/cryptocurrency/listings/latest`, {
      headers: { 'X-CMC_PRO_API_KEY': API_KEY },
      params: { start: 1, limit: 10, convert: 'USD' }, // Top 10 coins
    });

    const coins = data.data.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.quote.USD.price.toFixed(2),
    }));

    res.json(coins);
  } catch (error) {
    console.error('Error fetching crypto prices:', error.message);
    res.status(500).json({ error: 'Unable to fetch data.' });
  }
});




// Fetch OHLCV data from Kraken


app.get('/api/kraken-ohlcv', async (req, res) => {
    try {
      const pair = req.query.pair || 'ETHUSDC'; // Default to ETHUSDC if no pair is provided
      const interval = req.query.interval || '60'; // Default to 1-hour interval if no interval is provided
    
      // Make the request to Kraken's API
      const response = await axios.get('https://api.kraken.com/0/public/OHLC', {
        params: {
          pair: pair,
          interval: interval,  // Set the desired interval (60 = 1 hour)
        }
      });
    
      // Extract the OHLCV data for the requested pair
      const ohlcvData = response.data.result[pair];
    
      if (!ohlcvData || ohlcvData.length === 0) {
        return res.status(404).json({ error: `No data found for pair: ${pair}` });
      }
    
      // Return the OHLCV data
      res.json(ohlcvData);
    } catch (error) {
      console.error('Error fetching OHLCV data:', error.message);
      // Handle errors gracefully and return a relevant message
      res.status(500).json({ error: 'Unable to fetch OHLCV data.' });
    }
  });

  
  
  
  


// Fetch news and analyze sentiment for a specific coin
app.get('/api/sentiment-summary', async (req, res) => {
  try {
    const coin = req.query.coin; // Get the coin name from the query parameters
    if (!coin) {
      return res.status(400).json({ error: 'Coin parameter is required.' });
    }

    // Check if we have cached sentiment data
    if (sentimentDataCache[coin]) {
      return res.json(sentimentDataCache[coin]);
    }

    // Fetching news articles for the specific coin
    const { data: newsData } = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: coin, // Use the coin name to fetch relevant news
        apiKey: NEWS_API_KEY,
      },
    });

    if (newsData.articles.length === 0) {
      return res.status(404).json({ error: 'No news articles found for this coin.' });
    }

    // Analyze sentiment of news articles using Google Cloud NLP API
    const sentimentResults = await Promise.all(newsData.articles.map(async (article) => {
      const document = {
        content: article.title + ' ' + article.description,
        type: 'PLAIN_TEXT',
        language: 'en',
      };

      const [result] = await googleClient.analyzeSentiment({ document });
      const sentimentScore = result.documentSentiment.score; // Sentiment score from Google NLP
      return sentimentScore;
    }));

    // Calculate the average sentiment score
    const averageSentimentScore = sentimentResults.reduce((acc, score) => acc + score, 0) / sentimentResults.length;

    // Classify the average sentiment score
    let sentimentCategory = 'Neutral';
    if (averageSentimentScore > 0) sentimentCategory = 'Positive';
    if (averageSentimentScore < 0) sentimentCategory = 'Negative';

    // Extract key topics dynamically using Google NLP's Entity Analysis for the most recent article
    const recentArticle = newsData.articles[0];
    const document = {
      content: recentArticle.title + ' ' + recentArticle.description,
      type: 'PLAIN_TEXT',
      language: 'en',
    };

    const [entityResult] = await googleClient.analyzeEntities({ document });
    const entities = entityResult.entities;
    const keyTopics = entities.filter(entity => entity.type === 'ORGANIZATION' || entity.type === 'EVENT').map(entity => entity.name);

    // Prepare the summary response
    const sentimentSummary = {
      name: coin.charAt(0).toUpperCase() + coin.slice(1),
      sentiment: sentimentCategory,
      sentimentScore: averageSentimentScore.toFixed(2),
      keyTopics: keyTopics.length > 0 ? keyTopics : ['General Crypto'], // Fallback if no topics found
      recentNews: recentArticle.title,
    };

    // Cache the sentiment summary data
    sentimentDataCache[coin] = sentimentSummary;

    res.json(sentimentSummary);
  } catch (error) {
    console.error('Error fetching sentiment summary:', error.message);
    res.status(500).json({ error: 'Unable to generate sentiment summary.' });
  }
});

// Schedule task to fetch and update sentiment every 12 hours
cron.schedule('0 0 */12 * *', async () => {
  try {
    const coins = ['bitcoin', 'ethereum', 'cardano', 'dogecoin', 'solana']; // Add more coins as needed

    for (let coin of coins) {
      console.log(`Updating sentiment for ${coin}`);

      const { data: newsData } = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: coin, // Use the coin name to fetch relevant news
          apiKey: NEWS_API_KEY,
        },
      });

      if (newsData.articles.length === 0) {
        console.log(`No news articles found for ${coin}`);
        continue;
      }

      // Analyze sentiment of news articles
      const sentimentResults = await Promise.all(newsData.articles.map(async (article) => {
        const document = {
          content: article.title + ' ' + article.description,
          type: 'PLAIN_TEXT',
          language: 'en',
        };

        const [result] = await googleClient.analyzeSentiment({ document });
        return result.documentSentiment.score;
      }));

      // Calculate the average sentiment score
      const averageSentimentScore = sentimentResults.reduce((acc, score) => acc + score, 0) / sentimentResults.length;

      // Classify the average sentiment score
      let sentimentCategory = 'Neutral';
      if (averageSentimentScore > 0) sentimentCategory = 'Positive';
      if (averageSentimentScore < 0) sentimentCategory = 'Negative';

      // Extract key topics from the most recent article
      const recentArticle = newsData.articles[0];
      const document = {
        content: recentArticle.title + ' ' + recentArticle.description,
        type: 'PLAIN_TEXT',
        language: 'en',
      };

      const [entityResult] = await googleClient.analyzeEntities({ document });
      const entities = entityResult.entities;
      const keyTopics = entities
        .filter(entity => entity.type === 'ORGANIZATION' || entity.type === 'EVENT')
        .map(entity => entity.name);

      const sentimentSummary = {
        name: coin.charAt(0).toUpperCase() + coin.slice(1),
        sentiment: sentimentCategory,
        sentimentScore: averageSentimentScore.toFixed(2),
        keyTopics: keyTopics.length > 0 ? keyTopics : ['General Crypto'],
        recentNews: recentArticle.title,
      };

      // Cache the sentiment summary data
      sentimentDataCache[coin] = sentimentSummary;

      console.log(`Sentiment for ${coin} updated successfully.`);
    }
  } catch (error) {
    console.error('Error updating sentiment data:', error.message);
  }
});

// Fetch news articles for a specific coin
app.get('/api/crypto-news', async (req, res) => {
    try {
      // Get the coin name from the query parameters
      const coin = req.query.coin;
      console.log('Received coin parameter:', coin); // Log to ensure it's being received correctly
  
      // Construct a query for fetching crypto news
      let query = '';
      
      if (coin) {
        // If the coin is specified, use it to filter the news
        query = `"${coin}" cryptocurrency OR "${coin}" crypto OR "${coin}" blockchain`;
        console.log('Constructed query for coin:', query);  // Log the query to ensure it's correct
      }
  
      // Fetch news articles (with or without the coin filter)
      const { data: newsData } = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query || 'cryptocurrency', // If no coin is provided, fetch general cryptocurrency news
          apiKey: NEWS_API_KEY,
          pageSize: 20,
          sortBy: 'publishedAt', // Sort by publication date
          language: 'en', // Filter by English articles
        },
      });
  
      // Log the raw response from NewsAPI
      console.log('NewsAPI response:', newsData);  // Log the full response to inspect it
  
      if (!newsData || !newsData.articles || newsData.articles.length === 0) {
        return res.status(404).json({ error: 'No news articles found.' });
      }
  
      // Filter the articles to ensure they are relevant to the selected coin
      const filteredArticles = newsData.articles.filter((article) => {
        const title = article.title?.toLowerCase() || '';
        const description = article.description?.toLowerCase() || '';
        const content = article.content?.toLowerCase() || '';
  
        // If a coin is provided, check if it is in the title, description, or content
        return coin ? (
          title.includes(coin.toLowerCase()) ||
          description.includes(coin.toLowerCase()) ||
          content.includes(coin.toLowerCase())
        ) : true; // If no coin is provided, include all articles
      });
  
      // Log the filtered articles to see if filtering is working correctly
      console.log('Filtered articles:', filteredArticles);
  
      if (filteredArticles.length === 0) {
        return res.status(404).json({ error: 'No relevant news articles found.' });
      }
  
      // Return the filtered news articles
      res.json(filteredArticles);
    } catch (error) {
      console.error('Error fetching news:', error.message);
      res.status(500).json({ error: 'Unable to fetch news articles.' });
    }
  });
  
  

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});