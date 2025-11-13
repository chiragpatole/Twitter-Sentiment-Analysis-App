import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  MessageSquare, 
  Hash, 
  BarChart3, 
  RefreshCw, 
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Search,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [tweets, setTweets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');

  const fetchTweets = async () => {
    try {
      const params = {
        limit: 100,
        sort_by: sortBy
      };
      if (selectedSentiment !== 'all') {
        params.sentiment = selectedSentiment;
      }
      const response = await axios.get(`${API}/tweets/sentiment`, { params });
      setTweets(response.data);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast.error('Failed to fetch tweets');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/overview`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await axios.get(`${API}/analytics/trending`);
      setTrending(response.data);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      toast.error('Failed to fetch trending topics');
    }
  };

  const generateSampleData = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/tweets/generate-sample`, null, { params: { count: 100 } });
      toast.success('Generated 100 sample tweets!');
      await fetchData();
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data');
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    setLoading(true);
    try {
      await axios.delete(`${API}/tweets/clear`);
      toast.success('All tweets cleared!');
      await fetchData();
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTweets(), fetchAnalytics(), fetchTrending()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTweets();
  }, [selectedSentiment, sortBy]);

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4" />;
      case 'negative':
        return <ThumbsDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'negative':
        return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
    }
  };

  const getSentimentBadgeColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case 'negative':
        return 'bg-rose-100 text-rose-800 hover:bg-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
    }
  };

  const pieData = analytics ? [
    { name: 'Positive', value: analytics.positive_count, color: '#10b981' },
    { name: 'Negative', value: analytics.negative_count, color: '#ef4444' },
    { name: 'Neutral', value: analytics.neutral_count, color: '#64748b' }
  ] : [];

  const filteredTweets = tweets.filter(tweet => 
    tweet.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tweet.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Twitter Sentiment Analysis
              </h1>
              <p className="text-base text-slate-600">
                Real-time NLP-powered sentiment tracking with VADER, TextBlob & BERT models
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                data-testid="generate-sample-btn"
                onClick={generateSampleData}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Data
              </Button>
              <Button
                data-testid="refresh-btn"
                onClick={fetchData}
                disabled={loading}
                variant="outline"
                size="icon"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                data-testid="clear-data-btn"
                onClick={clearData}
                disabled={loading}
                variant="outline"
                size="icon"
              >
                <Database className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card data-testid="total-tweets-card" className="border-2 border-indigo-100 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Total Tweets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">{analytics.total_tweets.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">Processed tweets</p>
              </CardContent>
            </Card>

            <Card data-testid="positive-tweets-card" className="border-2 border-emerald-100 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Positive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{analytics.positive_count}</div>
                <Progress value={(analytics.positive_count / analytics.total_tweets) * 100} className="mt-2 h-2" />
                <p className="text-xs text-slate-500 mt-1">
                  {((analytics.positive_count / analytics.total_tweets) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card data-testid="negative-tweets-card" className="border-2 border-rose-100 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4" />
                  Negative
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-rose-600">{analytics.negative_count}</div>
                <Progress value={(analytics.negative_count / analytics.total_tweets) * 100} className="mt-2 h-2" />
                <p className="text-xs text-slate-500 mt-1">
                  {((analytics.negative_count / analytics.total_tweets) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card data-testid="avg-sentiment-card" className="border-2 border-purple-100 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Avg Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{analytics.avg_sentiment.toFixed(3)}</div>
                <p className="text-xs text-slate-500 mt-1">Combined score</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="stream" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger data-testid="stream-tab" value="stream">Tweet Stream</TabsTrigger>
            <TabsTrigger data-testid="trending-tab" value="trending">Trending</TabsTrigger>
            <TabsTrigger data-testid="analytics-tab" value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Tweet Stream Tab */}
          <TabsContent value="stream" className="space-y-4">
            <Card className="border-2 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Real-time Tweet Stream</CardTitle>
                    <CardDescription>Live sentiment analysis results</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 md:flex-initial">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                      <Input
                        data-testid="search-input"
                        placeholder="Search tweets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-full md:w-[200px]"
                      />
                    </div>
                    <select
                      data-testid="sentiment-filter"
                      value={selectedSentiment}
                      onChange={(e) => setSelectedSentiment(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Sentiments</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                    </select>
                    <select
                      data-testid="sort-filter"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="timestamp">Latest</option>
                      <option value="relevance">Most Relevant</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div data-testid="tweet-list" className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredTweets.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No tweets found. Generate sample data to get started!</p>
                    </div>
                  ) : (
                    filteredTweets.map((tweet) => (
                      <div
                        key={tweet.id}
                        data-testid={`tweet-item-${tweet.id}`}
                        className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getSentimentColor(tweet.combined_sentiment)}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-sm">@{tweet.username}</span>
                              <Badge variant="outline" className={getSentimentBadgeColor(tweet.combined_sentiment)}>
                                <span className="flex items-center gap-1">
                                  {getSentimentIcon(tweet.combined_sentiment)}
                                  {tweet.combined_sentiment}
                                </span>
                              </Badge>
                              {sortBy === 'relevance' && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                                  Relevance: {tweet.relevance_score}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm mb-2">{tweet.text}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {tweet.hashtags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
                              <div>
                                <span className="font-medium">VADER:</span> {tweet.vader_score.toFixed(3)}
                              </div>
                              <div>
                                <span className="font-medium">TextBlob:</span> {tweet.textblob_polarity.toFixed(3)}
                              </div>
                              <div>
                                <span className="font-medium">Combined:</span> {tweet.combined_score.toFixed(3)}
                              </div>
                              <div>
                                <span className="font-medium">Subjectivity:</span> {tweet.textblob_subjectivity.toFixed(3)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-4">
            <Card className="border-2 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Hashtags
                </CardTitle>
                <CardDescription>Most discussed topics with sentiment analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div data-testid="trending-list" className="space-y-3">
                  {trending.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No trending topics yet</p>
                    </div>
                  ) : (
                    trending.map((topic, idx) => (
                      <div
                        key={idx}
                        data-testid={`trending-item-${idx}`}
                        className="p-4 rounded-lg border-2 bg-white hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-slate-300">#{idx + 1}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">#{topic.topic}</span>
                                <Badge className={getSentimentBadgeColor(topic.sentiment_label)}>
                                  {topic.sentiment_label}
                                </Badge>
                              </div>
                              <div className="flex gap-4 mt-1 text-sm text-slate-600">
                                <span>{topic.count} tweets</span>
                                <span>Avg: {topic.avg_sentiment.toFixed(3)}</span>
                              </div>
                            </div>
                          </div>
                          <div className={`text-4xl ${getSentimentIcon(topic.sentiment_label)}`}>
                            {getSentimentIcon(topic.sentiment_label)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sentiment Distribution Pie Chart */}
                <Card className="border-2 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Sentiment Distribution</CardTitle>
                    <CardDescription>Overall sentiment breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Hashtags Bar Chart */}
                <Card className="border-2 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Top Hashtags</CardTitle>
                    <CardDescription>Most popular hashtags</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.top_hashtags.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tag" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Hourly Trend Line Chart */}
                <Card className="border-2 bg-white/80 backdrop-blur-sm lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Sentiment Trend Over Time</CardTitle>
                    <CardDescription>Average sentiment by hour</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.hourly_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="avg_sentiment" stroke="#8b5cf6" strokeWidth={2} />
                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
