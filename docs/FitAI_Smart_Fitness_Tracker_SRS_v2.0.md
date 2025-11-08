# 🧩 SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Project: FitAI – Smart Fitness Tracker & AI Coach  
**Version:** 2.0 (Fitness Data Tracking + AI Recommendation)  
**Date:** 2025-11-07  
**Tech Stack:** NestJS (Backend) · Flutter (Mobile App) · AWS (Infra)  
**Author:** BA Team  

---

## 1️⃣. Introduction  

### 1.1 Purpose  
FitAI là hệ thống huấn luyện viên ảo thông minh giúp người dùng **theo dõi tiến trình tập luyện thực tế** (reps, sets, weight, inbody) và **nhận gợi ý bài tập & dinh dưỡng cá nhân hóa** từ AI, được huấn luyện dựa trên **nguồn dữ liệu KOL TikTok / YouTube Fitness**.  

Ứng dụng hướng tới việc **biến điện thoại thành PT AI**, theo dõi quá trình luyện tập, thống kê tiến bộ và gợi ý điều chỉnh plan hằng tuần.  

---

### 1.2 Scope  
Ứng dụng mobile-first (Flutter) với backend NestJS và hạ tầng AWS, bao gồm:  

| Module | Mô tả |
|--------|-------|
| 🏋️ Workout Tracker | Lưu lại từng bài tập: số kg, số reps, sets. |
| 🍽 Meal & Nutrition Plan | Gợi ý khẩu phần ăn dựa trên mục tiêu & tiến trình. |
| 📈 InBody Scan & Body Analysis | Scan kết quả InBody / ảnh để phân tích thay đổi cơ thể. |
| 🤖 AI Coach & Plan Generator | AI huấn luyện viên sinh plan tập + ăn, cập nhật theo dữ liệu thật. |
| 🌐 KOL Crawler Engine | Cào nội dung TikTok/YouTube Fitness KOL để tạo dataset huấn luyện. |
| 📊 Weekly Analytics | Thống kê, biểu đồ & feedback AI mỗi tuần. |

---

## 2️⃣. System Overview  

### 2.1 Architecture Overview  
```
Flutter App (Mobile)
 ├── Workout Logger (offline cache)
 ├── InBody Scanner (OCR/Image)
 ├── AI Dashboard (Chat/Feedback)
 └── Sync Engine (AWS API Gateway)
       ↓
NestJS Backend (AWS ECS/Fargate)
 ├── Auth + User Service (Cognito)
 ├── Workout / Meal / InBody APIs
 ├── AI Planner Service (LangChain + OpenAI)
 ├── Crawler Engine (TikTok/YT data)
 └── Data Warehouse (AWS RDS + S3 + Athena)
```

---

### 2.2 Tech Stack  
| Layer | Technology |
|-------|-------------|
| Frontend | Flutter 3 (cross-platform iOS/Android) |
| Backend | NestJS (REST + GraphQL) |
| Database | AWS RDS (PostgreSQL) + Redis Cache |
| Storage | AWS S3 (InBody PDFs, media, images) |
| Auth | AWS Cognito |
| AI Engine | LangChain + OpenAI GPT-4o-mini |
| Crawler | Python + Playwright (TikTok/YT scraping) |
| Analytics | AWS QuickSight / Athena (weekly reports) |

---

## 3️⃣. Functional Requirements  

### 3.1 Workout Tracker  
**Goal:** Ghi lại dữ liệu tập luyện chi tiết theo bài tập, ngày, khối lượng, số lần.  

**Flow:**
1. User chọn bài tập (hoặc AI đề xuất).  
2. Nhập số set, reps, trọng lượng.  
3. App lưu dữ liệu offline → sync lên backend.  
4. AI phân tích trend (tăng/giảm hiệu suất).  

**Data Example:**
```json
{
  "userId": "uuid",
  "date": "2025-11-07",
  "exercise": "Bench Press",
  "sets": [
    { "reps": 10, "weight": 60 },
    { "reps": 8, "weight": 65 },
    { "reps": 6, "weight": 70 }
  ],
  "volume": 1950
}
```

---

### 3.2 AI Workout Plan Generator  
**Goal:** Sinh plan tập 7 ngày phù hợp với dữ liệu thật.  

**Input:**  
- Thông tin cơ thể, mục tiêu (tăng cơ, giảm mỡ).  
- Lịch sử tập (reps, sets, fatigue).  

**Output:**
```json
{
  "day": "Monday",
  "focus": "Chest + Triceps",
  "exercises": [
    {"name": "Bench Press", "sets": 4, "reps": 8, "targetWeight": 72.5},
    {"name": "Dumbbell Fly", "sets": 3, "reps": 12}
  ]
}
```

AI cập nhật mỗi tuần dựa trên:
- Trend sức mạnh (progression load).  
- Dữ liệu hồi phục từ inbody scan.  

---

### 3.3 Meal & Nutrition Plan  
**Goal:** Gợi ý dinh dưỡng theo TDEE & macro.  

**Input:**  
- Body weight, body fat %, mục tiêu (bulk/cut).  
- Activity level, meal preferences.  

**Output Example:**
```json
{
  "totalCalories": 2400,
  "protein": 180,
  "carbs": 220,
  "fats": 60,
  "meals": [
    {"name": "Breakfast", "items": ["Oats", "Egg Whites", "Banana"]},
    {"name": "Lunch", "items": ["Chicken", "Rice", "Broccoli"]}
  ]
}
```

**AI Features:**
- Cập nhật macro tự động khi cân nặng thay đổi.  
- Gợi ý công thức dựa trên KOL data (“high protein TikTok recipes”).  

---

### 3.4 InBody & Body Scan Module  
**Goal:** Lưu trữ & phân tích dữ liệu InBody để theo dõi body composition.  

**Flow:**
1. User upload ảnh/PDF kết quả InBody hoặc scan QR.  
2. OCR engine đọc các giá trị:  
   - Weight, Muscle Mass, Body Fat %, BMR, BMI.  
3. Lưu kết quả vào DB → hiển thị trend.  

**Data Example:**
```json
{
  "userId": "uuid",
  "scanDate": "2025-11-07",
  "weight": 73.5,
  "muscleMass": 34.8,
  "bodyFat": 18.2,
  "bmi": 23.4,
  "bmr": 1650
}
```

**AI Uses:**
- Dự đoán mục tiêu tuần tới (“Tăng 0.5kg cơ bắp trong 2 tuần”).  
- Tự động điều chỉnh meal plan.  

---

### 3.5 TikTok/Youtube KOL Crawler  
**Goal:** Cào dữ liệu hướng dẫn tập luyện và dinh dưỡng từ influencer để huấn luyện AI.  

**Flow:**
1. Crawl hashtags: #fitness, #workoutplan, #mealprep.  
2. Extract captions, transcript, hashtags, metrics (likes/comments).  
3. Vectorize và lưu vào database → làm RAG dataset cho AI gợi ý.  

**Output Example:**
```json
{
  "id": "kol123",
  "platform": "TikTok",
  "creator": "JeffNippard",
  "topic": "Chest Workout",
  "content": "Incline dumbbell press focus on upper chest...",
  "tags": ["chest", "hypertrophy", "beginner"]
}
```

---

### 3.6 Weekly Analytics & AI Feedback  
**Goal:** Phân tích tiến trình theo tuần và sinh gợi ý cải thiện.  

**Flow:**  
1. Tổng hợp workout volume, calories, inbody changes.  
2. AI sinh đánh giá và lời khuyên:  
   > “Tuần này bạn tăng 5% trọng lượng squat. Hãy giữ nguyên mức protein và thêm 1 buổi cardio nhẹ.”  

**Dashboard Outputs:**
- **Workout Volume Trend**  
- **Body Composition Trend**  
- **AI Weekly Note**  

---

## 4️⃣. Non-Functional Requirements  
| Category | Requirement |
|-----------|-------------|
| Performance | API < 300ms response time, AI Plan < 5s |
| Scalability | 100k+ users (AWS ECS/Fargate autoscale) |
| Security | Cognito JWT auth, S3 signed URLs |
| Privacy | Ảnh & InBody file xóa sau 30 ngày (opt-in storage) |
| Availability | 99.9% uptime (multi-AZ RDS, CloudFront CDN) |
| UX | Flutter smooth animation + offline-first caching |
| AI Ethics | Gợi ý minh bạch: “AI tổng hợp dữ liệu công khai từ internet, không thay thế HLV thật.” |

---

## 5️⃣. Database Schema (Simplified)
| Table | Description | Key Fields |
|--------|--------------|------------|
| users | Hồ sơ người dùng | id, email, goal, gender, height, weight |
| workouts | Lịch sử bài tập | id, userId, exercise, sets, reps, weight, date |
| meals | Meal plans | id, userId, day, macros, calories |
| inbody | Kết quả đo InBody | id, userId, weight, muscle, fat, date |
| kol_dataset | Nội dung cào từ KOL | id, platform, content, tags, vectorEmbedding |
| feedback | AI phản hồi tuần | id, userId, week, text, metrics |

---

## 6️⃣. AI Prompt Logic  
**Prompt Template (LangChain):**
```
Given user profile {height, weight, goal}, 
and last 7 days workouts + meals,
generate a 7-day workout and meal plan.

Also include 1 KOL-style advice from TikTok data related to their focus area.
```

**Response Output:**
```json
{
  "plan": {...},
  "kolTip": "Theo trend TikTok #pushday, hãy thử thêm incline push-up để kích hoạt cơ ngực trên."
}
```

---

## 7️⃣. Future Enhancements  
| Version | Feature |
|----------|----------|
| v2.1 | Real-time set counter bằng camera (AI vision) |
| v2.2 | Voice AI coach (ElevenLabs TTS) |
| v2.3 | Leaderboard cộng đồng + thử thách AI |
| v3.0 | Sync smartwatch (Apple Watch, Garmin) |

---

## 8️⃣. Acceptance Criteria  
| ID | Requirement | Criteria |
|----|--------------|----------|
| AC-01 | Workout log hoạt động ổn định | Ghi & sync 10 bài tập/ngày không lỗi |
| AC-02 | AI plan hợp lý | Sinh ra ≥3 bài tập + 3 bữa ăn/ngày |
| AC-03 | InBody scan chính xác | OCR chính xác ≥95% field |
| AC-04 | Weekly analytics | Hiển thị biểu đồ & feedback AI đúng dữ liệu |
| AC-05 | Crawl KOL thành công | ≥1000 video/text crawl mỗi tháng |

---

**End of Document**  
📘 _FitAI – Smart Fitness Tracker & AI Coach (v2.0)_  
Stack: **NestJS · Flutter · AWS · LangChain/OpenAI**
