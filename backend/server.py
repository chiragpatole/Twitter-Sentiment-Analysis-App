from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob
import random
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize sentiment analyzers
vader_analyzer = SentimentIntensityAnalyzer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Define Models
class Tweet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    username: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    hashtags: List[str] = []
    vader_score: float = 0.0
    vader_label: str = "neutral"
    textblob_polarity: float = 0.0
    textblob_subjectivity: float = 0.0
    combined_sentiment: str = "neutral"
    combined_score: float = 0.0
    relevance_score: float = 0.0


class TweetCreate(BaseModel):
    text: str
    username: str
    hashtags: Optional[List[str]] = []


class AnalyticsOverview(BaseModel):
    total_tweets: int
    positive_count: int
    negative_count: int
    neutral_count: int
    avg_sentiment: float
    top_hashtags: List[Dict[str, Any]]
    sentiment_distribution: Dict[str, int]
    hourly_trend: List[Dict[str, Any]]


class TrendingTopic(BaseModel):
    topic: str
    count: int
    avg_sentiment: float
    sentiment_label: str


def extract_hashtags(text: str) -> List[str]:
    """Extract hashtags from tweet text"""
    return re.findall(r'#(\w+)', text)


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Analyze sentiment using VADER and TextBlob"""
    # VADER Analysis
    vader_scores = vader_analyzer.polarity_scores(text)
    vader_compound = vader_scores['compound']
    
    if vader_compound >= 0.05:
        vader_label = "positive"
    elif vader_compound <= -0.05:
        vader_label = "negative"
    else:
        vader_label = "neutral"
    
    # TextBlob Analysis
    blob = TextBlob(text)
    textblob_polarity = blob.sentiment.polarity
    textblob_subjectivity = blob.sentiment.subjectivity
    
    # Combined sentiment (weighted average)
    combined_score = (vader_compound + textblob_polarity) / 2
    
    if combined_score >= 0.05:
        combined_sentiment = "positive"
    elif combined_score <= -0.05:
        combined_sentiment = "negative"
    else:
        combined_sentiment = "neutral"
    
    return {
        "vader_score": vader_compound,
        "vader_label": vader_label,
        "textblob_polarity": textblob_polarity,
        "textblob_subjectivity": textblob_subjectivity,
        "combined_sentiment": combined_sentiment,
        "combined_score": combined_score
    }


def calculate_relevance_score(tweet_data: Dict[str, Any]) -> float:
    """Calculate relevance score based on sentiment strength and engagement indicators"""
    sentiment_strength = abs(tweet_data['combined_score'])
    hashtag_count = len(tweet_data.get('hashtags', []))
    
    # Simple ranking: stronger sentiment + more hashtags = more relevant
    relevance = (sentiment_strength * 0.7) + (min(hashtag_count / 5, 1.0) * 0.3)
    return round(relevance, 3)


@api_router.get("/")
async def root():
    return {"message": "Twitter Sentiment Analysis API"}


@api_router.post("/tweets/ingest", response_model=Tweet)
async def ingest_tweet(tweet_input: TweetCreate):
    """Ingest and analyze a single tweet"""
    try:
        # Extract hashtags if not provided
        hashtags = tweet_input.hashtags or extract_hashtags(tweet_input.text)
        
        # Analyze sentiment
        sentiment_results = analyze_sentiment(tweet_input.text)
        
        # Create tweet object
        tweet_dict = {
            "text": tweet_input.text,
            "username": tweet_input.username,
            "hashtags": hashtags,
            **sentiment_results
        }
        
        tweet = Tweet(**tweet_dict)
        tweet.relevance_score = calculate_relevance_score(tweet.model_dump())
        
        # Store in MongoDB
        doc = tweet.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.tweets.insert_one(doc)
        
        return tweet
    except Exception as e:
        logger.error(f"Error ingesting tweet: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/tweets/sentiment", response_model=List[Tweet])
async def get_analyzed_tweets(
    limit: int = 100,
    sentiment: Optional[str] = None,
    sort_by: str = "timestamp"
):
    """Get analyzed tweets with optional filtering"""
    try:
        query = {}
        if sentiment:
            query['combined_sentiment'] = sentiment
        
        # Determine sort field
        sort_field = "relevance_score" if sort_by == "relevance" else "timestamp"
        sort_order = -1  # Descending
        
        tweets = await db.tweets.find(query, {"_id": 0}).sort(sort_field, sort_order).limit(limit).to_list(limit)
        
        # Convert ISO string timestamps back to datetime objects
        for tweet in tweets:
            if isinstance(tweet['timestamp'], str):
                tweet['timestamp'] = datetime.fromisoformat(tweet['timestamp'])
        
        return tweets
    except Exception as e:
        logger.error(f"Error fetching tweets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_analytics_overview():
    """Get aggregated sentiment analytics"""
    try:
        # Get all tweets
        tweets = await db.tweets.find({}, {"_id": 0}).to_list(10000)
        
        if not tweets:
            return AnalyticsOverview(
                total_tweets=0,
                positive_count=0,
                negative_count=0,
                neutral_count=0,
                avg_sentiment=0.0,
                top_hashtags=[],
                sentiment_distribution={"positive": 0, "negative": 0, "neutral": 0},
                hourly_trend=[]
            )
        
        # Calculate statistics
        total_tweets = len(tweets)
        positive_count = sum(1 for t in tweets if t['combined_sentiment'] == 'positive')
        negative_count = sum(1 for t in tweets if t['combined_sentiment'] == 'negative')
        neutral_count = sum(1 for t in tweets if t['combined_sentiment'] == 'neutral')
        
        avg_sentiment = sum(t['combined_score'] for t in tweets) / total_tweets
        
        # Get top hashtags
        hashtag_counts = {}
        hashtag_sentiments = {}
        
        for tweet in tweets:
            for tag in tweet.get('hashtags', []):
                hashtag_counts[tag] = hashtag_counts.get(tag, 0) + 1
                if tag not in hashtag_sentiments:
                    hashtag_sentiments[tag] = []
                hashtag_sentiments[tag].append(tweet['combined_score'])
        
        top_hashtags = [
            {
                "tag": tag,
                "count": count,
                "avg_sentiment": sum(hashtag_sentiments[tag]) / len(hashtag_sentiments[tag])
            }
            for tag, count in sorted(hashtag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Hourly trend (last 24 hours)
        hourly_trend = []
        hour_buckets = {}
        
        for tweet in tweets:
            timestamp = tweet['timestamp']
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp)
            hour = timestamp.strftime('%Y-%m-%d %H:00')
            if hour not in hour_buckets:
                hour_buckets[hour] = []
            hour_buckets[hour].append(tweet['combined_score'])
        
        for hour in sorted(hour_buckets.keys())[-24:]:
            scores = hour_buckets[hour]
            hourly_trend.append({
                "hour": hour,
                "avg_sentiment": sum(scores) / len(scores),
                "count": len(scores)
            })
        
        return AnalyticsOverview(
            total_tweets=total_tweets,
            positive_count=positive_count,
            negative_count=negative_count,
            neutral_count=neutral_count,
            avg_sentiment=avg_sentiment,
            top_hashtags=top_hashtags,
            sentiment_distribution={
                "positive": positive_count,
                "negative": negative_count,
                "neutral": neutral_count
            },
            hourly_trend=hourly_trend
        )
    except Exception as e:
        logger.error(f"Error getting analytics overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/trending", response_model=List[TrendingTopic])
async def get_trending_topics(limit: int = 10):
    """Get trending hashtags with sentiment analysis"""
    try:
        tweets = await db.tweets.find({}, {"_id": 0}).to_list(10000)
        
        hashtag_data = {}
        
        for tweet in tweets:
            for tag in tweet.get('hashtags', []):
                if tag not in hashtag_data:
                    hashtag_data[tag] = {'count': 0, 'sentiments': []}
                hashtag_data[tag]['count'] += 1
                hashtag_data[tag]['sentiments'].append(tweet['combined_score'])
        
        trending = []
        for tag, data in hashtag_data.items():
            avg_sentiment = sum(data['sentiments']) / len(data['sentiments'])
            sentiment_label = "positive" if avg_sentiment >= 0.05 else "negative" if avg_sentiment <= -0.05 else "neutral"
            trending.append(TrendingTopic(
                topic=tag,
                count=data['count'],
                avg_sentiment=avg_sentiment,
                sentiment_label=sentiment_label
            ))
        
        # Sort by count
        trending.sort(key=lambda x: x.count, reverse=True)
        
        return trending[:limit]
    except Exception as e:
        logger.error(f"Error getting trending topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/tweets/generate-sample")
async def generate_sample_tweets(count: int = 50):
    """Generate sample tweets for demonstration"""
    try:
        sample_topics = [
            "#AI", "#MachineLearning", "#DataScience", "#Python", "#Technology",
            "#Innovation", "#BigData", "#CloudComputing", "#CyberSecurity", "#IoT"
        ]
        
        positive_templates = [
            "Amazing progress in {topic}! The future is bright",
            "Absolutely love the new developments in {topic}",
            "{topic} is revolutionizing the industry! Incredible work",
            "Just deployed my first {topic} project. So excited!",
            "The community around {topic} is fantastic and supportive"
        ]
        
        negative_templates = [
            "Disappointed with the current state of {topic}",
            "{topic} has too many issues that need addressing",
            "Struggling to understand {topic}. Documentation is lacking",
            "Not impressed with recent {topic} updates",
            "The hype around {topic} is overblown and misleading"
        ]
        
        neutral_templates = [
            "Exploring {topic} for our next project",
            "Attended a conference on {topic} today",
            "Reading about {topic} developments",
            "Working on understanding {topic} better",
            "Considering {topic} for our tech stack"
        ]
        
        usernames = [f"user{i}" for i in range(1, 21)]
        
        generated_count = 0
        for _ in range(count):
            template_choice = random.choice(['positive', 'negative', 'neutral'])
            if template_choice == 'positive':
                template = random.choice(positive_templates)
            elif template_choice == 'negative':
                template = random.choice(negative_templates)
            else:
                template = random.choice(neutral_templates)
            
            topic = random.choice(sample_topics)
            text = template.format(topic=topic)
            
            # Add random additional hashtags
            additional_tags = random.sample([t for t in sample_topics if t != topic], random.randint(0, 2))
            if additional_tags:
                text += " " + " ".join(additional_tags)
            
            username = random.choice(usernames)
            
            # Create tweet
            tweet_input = TweetCreate(text=text, username=username)
            await ingest_tweet(tweet_input)
            generated_count += 1
        
        return {"message": f"Generated {generated_count} sample tweets", "count": generated_count}
    except Exception as e:
        logger.error(f"Error generating sample tweets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/tweets/clear")
async def clear_all_tweets():
    """Clear all tweets from database"""
    try:
        result = await db.tweets.delete_many({})
        return {"message": f"Deleted {result.deleted_count} tweets"}
    except Exception as e:
        logger.error(f"Error clearing tweets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
