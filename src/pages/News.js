import React, { useState, useEffect } from 'react';
import { ExternalLink, Search } from 'lucide-react';

const NewsImageFallback = ({ darkMode }) => (
  <div style={{
    width: '100%',
    height: '200px',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: darkMode ? '#999' : '#666',
    fontSize: '1.2rem',
    fontWeight: '500'
  }}>
    <span>Crypto News</span>
  </div>
);

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isDarkMode = document.body.classList.contains('dark-mode');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:5005/api/crypto-news');
        if (!response.ok) throw new Error('Failed to fetch news');
        const data = await response.json();
        setNews(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Filter news based on search term
  const filteredNews = news.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6">Loading news...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="content-container">
      <div className={`card ${isDarkMode ? 'dark-mode' : ''}`} style={{ 
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'transparent',
        boxShadow: 'none'
      }}>
        <h1 className="text-2xl font-bold mb-6">Crypto News</h1>
        
        {/* Add search bar */}
        <div className="coin-search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search news articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="search-icon" size={18} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((article, index) => (
            <div 
              key={index} 
              className={`coin-item-container ${isDarkMode ? 'dark-mode' : ''}`}
              style={{
                height: 'auto',
                minHeight: '400px',
                flexDirection: 'column',
                padding: '0',
                overflow: 'hidden',
                backgroundColor: 'transparent',
                border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
                transition: 'transform 0.3s ease-in-out',
                cursor: 'pointer'
              }}
            >
              {article.urlToImage ? (
                <img 
                  src={article.urlToImage} 
                  alt={article.title}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.appendChild(
                      document.createElement('div')
                    ).outerHTML = `<div class="fallback-image">${NewsImageFallback({ darkMode: isDarkMode })}</div>`;
                  }}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <NewsImageFallback darkMode={isDarkMode} />
              )}
              <div style={{ 
                padding: '20px', 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: isDarkMode ? 'black' : 'inherit',
                color: isDarkMode ? 'white' : 'inherit'
              }}>
                <h2 style={{ 
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '12px',
                  lineHeight: '1.4',
                  color: isDarkMode ? 'white' : 'inherit'
                }}>
                  {article.title}
                </h2>
                <p style={{ 
                  fontSize: '0.9rem',
                  marginBottom: '16px',
                  flex: 1,
                  color: isDarkMode ? '#ccc' : 'inherit'
                }}>
                  {article.description}
                </p>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto'
                }}>
                  <span style={{ 
                    fontSize: '0.8rem',
                    opacity: '0.7',
                    color: isDarkMode ? '#999' : 'inherit'
                  }}>
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#ff5733',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      textDecoration: 'none'
                    }}
                  >
                    Read More <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Show message when no results found */}
        {filteredNews.length === 0 && searchTerm && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            color: isDarkMode ? '#999' : '#666'
          }}>
            No articles found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}

function isValidImageUrl(url) {
  if (!url) return false;
  return url.match(/\.(jpeg|jpg|gif|png)$/) != null || 
         url.startsWith('https://') || 
         url.startsWith('http://');
}
