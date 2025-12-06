# Eduscan ML Service

A FastAPI-based backend service that provides facial recognition capabilities and machine learning-powered performance analytics for the Eduscan attendance tracking system.

## 🛠️ Tech Stack

- **Framework:** FastAPI (Python)
- **Face Recognition:** face_recognition library
- **Machine Learning:** scikit-learn (Random Forest classifiers)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Docker (optional)

## 📁 Project Structure

```
ml_service/
├── api/
│   ├── routes/                 # API route handlers
│   │   ├── face_encoding.py   # Facial encoding endpoint
│   │   ├── face_match.py      # Face matching endpoint
│   │   ├── performance_analytics.py  # ML analytics endpoint
│   │   └── user_cache.py      # User cache management
│   └── models.py              # Pydantic request/response models
│
├── services/                   # Business logic & integrations
│   ├── supabase.py            # Supabase client and database operations
│   └── user_listener.py       # User data listener/updater
│
├── ml/                         # Machine learning module
│   ├── analytics.py           # Main analytics orchestrator
│   ├── attendance_feature.py  # Feature extraction from attendance data
│   ├── train_classifier.py    # Model training script
│   ├── models/
│   │   ├── classifier/        # Classifier implementations
│   │   └── trained/           # Serialized model files (.joblib)
│   └── data/                  # Training datasets
│
├── utils/                      # Utility functions
│   ├── face_utils.py          # Facial recognition utilities
│   └── user_cache.py          # In-memory user caching
│
├── main.py                     # FastAPI application entry point
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker container configuration
└── docker-compose.yml         # Docker Compose configuration
```

## 🚀 Getting Started

### Prerequisites

- **Python** 3.9 or higher
- **pip** package manager
- **Supabase** account and project
- **Camera/Webcam** (for face recognition testing)

### Installation

1. **Clone the repository** (if not already done):

```bash
cd ml_service
```

2. **Create and activate a virtual environment**:

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate
```

3. **Install dependencies**:

```bash
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Required environment variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
SERVICE_PASSWORD=your_secure_service_password
```

Update the `.env` file with your actual credentials.

## 🚀 Running the Server

### Development Mode

Run with auto-reload enabled for development:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- `--host 0.0.0.0` allows external devices to connect (e.g., from web app)
- `--reload` enables auto-reload on code changes (development only)

### Production Mode

Run without reload:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker Deployment

Build and run with Docker:

```bash
docker-compose up --build
```

Or use Docker directly:

```bash
docker build -t eduscan-ml-service .
docker run -p 8000:8000 --env-file .env eduscan-ml-service
```

## 📡 API Endpoints

All endpoints require authentication via the `X-Service-Password` header.

### Face Recognition Endpoints

#### 1. Face Encoding
- **Endpoint:** `POST /api/face-encoding`
- **Description:** Accepts an image with a face and returns facial encoding (128-dimensional vector)
- **Headers:**
  - `X-Service-Password: <SERVICE_PASSWORD>`
- **Request:** Multipart form data with image file
- **Response:** JSON with face encoding array

#### 2. Face Match
- **Endpoint:** `POST /api/face-match`
- **Description:** Accepts an image with a face and returns matched user information
- **Headers:**
  - `X-Service-Password: <SERVICE_PASSWORD>`
- **Request:** Multipart form data with image file
- **Response:** JSON with user details if match found, or error if not

#### 3. Ping
- **Endpoint:** `POST /api/ping`
- **Description:** Health check endpoint
- **Headers:**
  - `X-Service-Password: <SERVICE_PASSWORD>`
- **Response:** `{"message": "pong"}`

### Performance Analytics Endpoints

#### 4. Aggregate Performance Analytics
- **Endpoint:** `POST /api/performance-analytics/aggregate`
- **Description:** Get ML-powered performance analytics for multiple users
- **Headers:**
  - `X-Service-Password: <SERVICE_PASSWORD>`
- **Request Body:**
  ```json
  {
    "user_ids": ["user_id_1", "user_id_2"],
    "user_type": "ALL" | "STUDENT" | "EMPLOYEE"
  }
  ```
- **Response:** Aggregated performance metrics including:
  - Average punctuality
  - Average time balance
  - Attendance rate
  - Attendance forecast (next-day probability)
  - Individual user records

### User Cache Endpoints

#### 5. Update User Cache
- **Endpoint:** `POST /api/user-cache/update`
- **Description:** Manually refresh the in-memory user cache
- **Headers:**
  - `X-Service-Password: <SERVICE_PASSWORD>`
- **Response:** Cache update confirmation

## 🧠 Machine Learning Features

### Performance Analytics

The service provides ML-powered analytics that include:

1. **Attendance Rate** - Percentage of sessions attended
2. **Punctuality Metrics** - Average arrival time offset
3. **Time Balance** - Average time-in vs time-out balance
4. **Attendance Forecasting** - ML-predicted next-day attendance probability (0-1)

### Attendance Forecasting

- Uses XGBoost regression models trained separately for students and employees
- Based on 10-day binary attendance sequences (PRESENT=1, ABSENT=0) using sliding windows
- Predicts continuous probability (0-1) for next-day attendance
- Captures temporal patterns: streaks, trends, volatility
- Includes rule-based fallback if models are not trained

See [`ml/README.md`](./ml/README.md) for detailed ML documentation.

## 🔄 User Cache Management

The service maintains an in-memory cache of user face encodings for fast face matching:

- **Initialization:** Cache is loaded on server startup
- **Auto-refresh:** Listener updates cache when user data changes in Supabase
- **Manual refresh:** Via `/api/user-cache/update` endpoint

This improves face matching performance by avoiding database queries for every match request.

## 🔒 Security

- **Service Password Authentication:** All endpoints require `X-Service-Password` header
- **Supabase Integration:** Secure database access via service role key
- **CORS Configuration:** Configured to allow requests from authorized origins

## 🧪 Testing

### Manual API Testing

Using curl:

```bash
# Ping endpoint
curl -X POST "http://localhost:8000/api/ping" \
  -H "X-Service-Password: your_password"

# Face encoding
curl -X POST "http://localhost:8000/api/face-encoding" \
  -H "X-Service-Password: your_password" \
  -F "image=@path/to/image.jpg"

# Performance analytics
curl -X POST "http://localhost:8000/api/performance-analytics/aggregate" \
  -H "X-Service-Password: your_password" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["user_id"], "user_type": "ALL"}'
```

### Automated Testing

Coming soon – add test cases using **pytest** or **FastAPI TestClient**.

## 📊 Monitoring & Logging

- **FastAPI Docs:** Access interactive API documentation at `http://localhost:8000/docs`
- **Logging:** Application logs to console (stdout/stderr)
- **Error Handling:** Comprehensive error responses with details

## 🐛 Troubleshooting

### Common Issues

1. **"Module not found" errors:**
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt` again

2. **Supabase connection errors:**
   - Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
   - Check network connectivity

3. **Face recognition not working:**
   - Verify face_recognition library is installed correctly
   - Ensure images contain clear face views
   - Check dlib dependencies (C++ libraries)

4. **ML models not found:**
   - Train models first using `ml/train_forecast.py`
   - System will fall back to rule-based logic if models unavailable

## 📝 Development Notes

- Uses async/await for better performance with I/O operations
- Face encodings are cached in memory for fast matching
- ML models are loaded lazily when first needed
- Separate XGBoost models for students and employees
- Forecasting uses sliding window approach for training data generation

## 🔗 Integration

### With Admin Web App

The admin web app (`/admin`) calls this service via:
- Supabase Edge Functions (proxy endpoints)
- Direct API calls (in some cases)

### With Kiosk App

The kiosk app (`/kiosk`) uses this service through Supabase Edge Functions for:
- Face matching during attendance logging
- User identification

## 📚 Related Documentation

- [Root README](../README.md) - General project overview
- [ML Module README](./ml/README.md) - Detailed ML analytics documentation
- [Admin Web App README](../admin/README.md) - Frontend application details
- [Kiosk README](../kiosk/README.md) - Kiosk application details

## 🧼 Clean-Up

To deactivate the virtual environment:

```bash
deactivate
```

## 📄 License

[Add your license information here]
