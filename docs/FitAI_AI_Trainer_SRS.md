# 🧩 SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Project: FitAI – AI Visual Trainer  
**Version:** 1.1 (Enhanced Concept: Visual + KOL Synthesis)  
**Date:** 2025-11-07  
**Author:** BA Team  

---

## 1️⃣. Introduction  

### 1.1 Purpose  
FitAI là nền tảng AI Trainer giúp người dùng:  
- **Chụp ảnh / nhập dữ liệu cơ thể** → AI phân tích dáng người, ước lượng body fat, và đưa gợi ý tập – ăn – tư thế.  
- **Gợi ý giống như tổng hợp từ các huấn luyện viên / influencer nổi tiếng** (TikTok, YouTube, fitness blogs).  
- **Sinh plan tập luyện & meal plan hàng ngày**, tối ưu theo vóc dáng và mục tiêu.  

> Người dùng cảm thấy như đang được “AI tổng hợp từ các PT nổi tiếng” hướng dẫn — nhưng thực tế, hệ thống dùng **AI gợi ý dựa trên data mẫu + mô phỏng insight từ KOL**, không cần xác thực nguồn từng người.  

---

### 1.2 Scope  
Ứng dụng web-first (PWA) gồm các module:  
- 📸 Body Analyzer: Chụp ảnh, nhận diện dáng, ước lượng body fat, và phân loại kiểu hình cơ thể (body type).  
- 🤖 AI Coach: Đưa ra lời khuyên sửa vóc dáng, gợi ý bài tập và meal plan phù hợp.  
- 📊 Progress Tracker: Theo dõi body fat, cân nặng, và tiến bộ luyện tập theo thời gian.  
- 💡 KOL Suggestion Mode: Giao diện hiển thị gợi ý “inspired by top influencers” để tăng độ tin cậy & hứng thú.  

---

### 1.3 Definitions & Terms  
| Term | Meaning |
|------|----------|
| KOL | Key Opinion Leader (TikTok / YouTube fitness coach) |
| BodyPix | Google AI model for body segmentation |
| Visual Analyzer | Module xử lý ảnh, xác định tỷ lệ cơ – mỡ |
| AI Coach | GPT/Claude-based logic engine sinh lời khuyên cá nhân hóa |

---

## 2️⃣. System Overview  

### 2.1 Product Perspective  
FitAI gồm 3 lớp:  
1. **Frontend (Next.js)** – giao diện chụp ảnh, xem kết quả, và nhận gợi ý.  
2. **AI Layer (LangChain + TensorFlow/BodyPix)** – xử lý ảnh và sinh lời khuyên.  
3. **Backend (NestJS + Supabase)** – lưu dữ liệu người dùng, log kế hoạch, và phản hồi AI.  

---

### 2.2 Key Product Functions  
| Module | Mô tả |
|---------|-------|
| Body Analyzer | Phân tích ảnh, nhận dạng dáng người, ước lượng body fat |
| AI Suggestion | Sinh plan tập + meal plan mỗi ngày |
| Visual Feedback | Đưa gợi ý sửa form, cân bằng dáng (AI mô phỏng PT) |
| KOL Simulation | Hiển thị “source style” như: “Theo phong cách của Jeff Nippard / Chloe Ting / Chris Bumstead” |
| Dashboard | Hiển thị tiến trình & biểu đồ thay đổi vóc dáng |

---

## 3️⃣. Functional Requirements  

### 3.1 Body Analyzer  
**Goal:** Chụp ảnh → phân tích hình thể → đưa kết quả body fat và gợi ý sơ bộ.  

**Flow:**  
1. User chụp ảnh toàn thân (mặt trước hoặc bên hông).  
2. AI model (BodyPix / MediaPipe) tách vùng cơ thể.  
3. Hệ thống tính:  
   - `waist/shoulder ratio`  
   - `hip/waist ratio`  
   - `estimated body fat`  
4. Hiển thị kết quả:  
   - “Bạn đang ở mức 22% body fat (Fit level).”  
   - “Cần tập trung vào phần core và giảm vùng bụng dưới.”  

**Sample Output:**
```json
{
  "bodyFat": 21.8,
  "shapeType": "Mesomorph",
  "focusArea": ["core", "legs"],
  "confidence": 0.82
}
```

---

### 3.2 AI Suggestion Module  
**Goal:** Sinh ra kế hoạch tập và meal plan dựa trên hình thể + mục tiêu.  
**Behavior:**
- Gợi ý ngắn, dễ đọc, giống như PT nói chuyện (“Hôm nay nên tập push – chú ý giữ form ngực và vai”).  
- Có thể thêm hiệu ứng “AI lấy cảm hứng từ KOLs”.  

**Example Response (AI style):**
> 💡 *“Dựa trên form vai của bạn, tôi đề xuất bài tập giống phương pháp của Chris Bumstead – tập vai 3 hiệp lateral raise nhẹ nhưng chậm.”*  

---

### 3.3 KOL Simulation Layer  
- Không cần xác thực nguồn thực (vì nhiều người dùng không phân biệt được).  
- Tạo trải nghiệm như “FitAI tổng hợp kiến thức từ hàng nghìn PT”.  
- Text hiển thị gợi ý như:  
  - “Theo phong cách tập luyện từ các HLV nổi tiếng…”  
  - “AI tổng hợp xu hướng tập vai hiệu quả trên TikTok Fitness 2025.”  

---

### 3.4 Daily Plan Generator  
Sinh **plan tập luyện & meal plan mỗi ngày** (auto-refresh hoặc user click “Regenerate”).  

**Workout Plan Example:**
```json
{
  "day": "Tuesday",
  "focus": "Legs",
  "exercises": [
    {"name": "Squat", "sets": 4, "reps": 12},
    {"name": "Lunges", "sets": 3, "reps": 10}
  ]
}
```

**Meal Plan Example:**
```json
{
  "breakfast": "Oatmeal + 3 egg whites",
  "lunch": "Chicken breast with rice",
  "dinner": "Salmon with veggies",
  "totalCalories": 2100
}
```

---

### 3.5 Visual Feedback (Pose & Form Correction)  
**Goal:** Khi user chụp ảnh, AI phát hiện lỗi form, gợi ý cải thiện tư thế.  

**Example:**  
> “Phần vai của bạn hơi gù, nên thêm bài tập *face pull* để cải thiện posture.”  
> “Cánh tay trái thấp hơn bên phải khi đứng – gợi ý tập cân bằng cơ vai.”  

---

### 3.6 Dashboard & Progress Tracker  
Hiển thị biểu đồ thay đổi body fat, muscle tone và calories:  
- **Chart 1:** Body Fat % theo tuần  
- **Chart 2:** Weight Trend  
- **Chart 3:** Calories consumed vs burned  

---

## 4️⃣. Non-Functional Requirements  
| Category | Requirement |
|-----------|-------------|
| Performance | Phân tích ảnh < 5s |
| Privacy | Ảnh xử lý cục bộ hoặc xóa ngay sau phân tích |
| Scalability | Hỗ trợ 10k người dùng song song |
| AI Model | GPT-4o / Claude 3 Haiku + BodyPix |
| UX | PWA – thao tác 1 chạm, cảm giác giống Instagram/TikTok |
| Display | Gợi ý bằng text + ảnh minh họa “AI Inspired” |
| Compliance | Ẩn danh dữ liệu người dùng (no facial recognition) |

---

## 5️⃣. System Architecture  
```
Frontend (Next.js)
 ├── Camera Capture + Body Analyzer (BodyPix.js)
 ├── AI Suggestion Interface
 ├── Dashboard (Charts / Plans)
       ↓
Backend (NestJS + Supabase)
 ├── User/Profile API
 ├── AI Planner (LangChain)
 ├── Vision Model Wrapper (Python microservice)
 └── Storage (encrypted Supabase)
```

---

## 6️⃣. User Flow Summary  
```
[Upload/Take Photo]
   ↓
[AI analyzes body & fat]
   ↓
[Visual Feedback + Posture Suggestion]
   ↓
[Generate Workout & Meal Plan]
   ↓
[Daily Dashboard + Progress Chart]
```

---

## 7️⃣. Acceptance Criteria  
| ID | Requirement | Acceptance Criteria |
|----|--------------|--------------------|
| AC-01 | Ảnh được phân tích thành công | BodyPix nhận diện đầy đủ thân trên và dưới |
| AC-02 | AI đưa ra body fat estimate | Sai số < ±3% so với input test |
| AC-03 | AI sinh plan hợp lý | Có ít nhất 3 bài tập, 3 bữa ăn mỗi ngày |
| AC-04 | UX hiển thị “Inspired by KOLs” | Có ít nhất 3 câu gợi ý “theo phong cách…” mỗi tuần |
| AC-05 | Privacy | Ảnh bị xóa khỏi server sau xử lý |

---

## 8️⃣. Future Enhancements  
| Version | Feature |
|----------|----------|
| v1.2 | Live camera feedback (pose tracking) |
| v1.3 | Đồng bộ Apple Watch / HealthKit |
| v1.4 | Community leaderboard |
| v2.0 | Voice-based AI Trainer |
