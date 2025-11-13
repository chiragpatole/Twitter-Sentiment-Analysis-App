# Twitter Sentiment Analysis App

A full-stack web application that analyzes tweet sentiment using machine learning and provides interactive analytics dashboards.

## 📋 Description

This application performs real-time sentiment analysis on tweets, classifying them as positive, negative, or neutral. It features a React frontend with interactive visualizations and a FastAPI backend powered by machine learning models for sentiment classification.

## ✨ Features

- **Real-time Sentiment Analysis** - Analyze tweets instantly using NLP models
- **Interactive Dashboard** - Visualize sentiment trends and analytics
- **Sample Data Generation** - Generate sample tweets for testing
- **Analytics Overview** - View sentiment distribution and trending topics
- **RESTful API** - Well-documented API endpoints using FastAPI

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Chart.js/Recharts** - Data visualization

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - NoSQL database
- **NLTK/TextBlob** - Natural Language Processing
- **Uvicorn** - ASGI server

## 📁 Project Structure

/Twitter-Sentiment-Analysis-App
├── /frontend          # React application
│   ├── /src
│   │   ├── /components   # React components
│   │   ├── /styles       # CSS files
│   │   └── App.js
│   ├── package.json
│   └── public/
│
├── /backend           # FastAPI application
│   ├── /server.py       # Main server file
│   ├── requirements.txt
│   └── .env
│
└── README.md


## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+
- **MongoDB** (running locally or cloud instance)

### Installation

1. **Clone the repository**

git clone https://github.com/chiragpatole/Twitter-Sentiment-Analysis-App.git
cd Twitter-Sentiment-Analysis-App


2. **Backend Setup**

cd backend
pip install -r requirements.txt


Create a `.env` file:

MONGODB_URL=mongodb://localhost:27017/
DATABASE_NAME=twitter_sentiment

Start the backend server:

uvicorn server:app –reload –host 0.0.0.0 –port 8000


3. **Frontend Setup**

cd frontend
npm install


Create a `.env` file:
REACT_APP_BACKEND_URL=http://localhost:8000


Start the frontend:

npm start


4. **Start MongoDB**

mongosh


## 🔧 Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click **"Generate Sample Data"** to populate the database with sample tweets
3. View sentiment analysis on the **Analytics** tab
4. Explore **Trending Topics** and sentiment distribution

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Root endpoint |
| POST | `/api/tweets/ingest` | Add new tweet |
| GET | `/api/tweets/sentiment` | Get analyzed tweets |
| GET | `/api/analytics/overview` | Get analytics overview |
| GET | `/api/analytics/trending` | Get trending topics |
| POST | `/api/tweets/generate-sample` | Generate sample tweets |
| DELETE | `/api/tweets/clear` | Clear all tweets |

Full API documentation available at: `http://localhost:8000/docs`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Chirag Patole**

- GitHub: [@chiragpatole](https://github.com/chiragpatole)

## 🙏 Acknowledgments

- NLTK for natural language processing capabilities
- FastAPI for the excellent web framework
- React community for amazing tools and libraries

To create this file:
cd ~/Downloads/app
nano README.md

Paste the content above, save (Ctrl+X, Y, Enter), then commit and push:
git add README.md
git commit -m "Add comprehensive README documentation"
git push -u origin main

