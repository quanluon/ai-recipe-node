# GigaFit – Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
Tài liệu này mô tả chi tiết các yêu cầu phần mềm cho ứng dụng **GigaFit**, một Progressive Web App (PWA) giúp người mới tập thể hình và huấn luyện viên cá nhân (PT) tạo, theo dõi và phân tích kế hoạch tập luyện, meal plan, cùng với sự hỗ trợ của AI.

### 1.2 Scope
GigaFit là một ứng dụng web PWA được xây dựng bằng **ReactJS** cho frontend và **Bun + ExpressJS** cho backend. Ứng dụng cho phép:
- Người dùng cá nhân thiết lập mục tiêu, nhận kế hoạch tập luyện và dinh dưỡng do AI gợi ý.
- Theo dõi tiến độ, lưu trữ và phân tích kết quả (bao gồm ảnh hoặc file InBody).
- PT quản lý khách hàng, theo dõi sự tiến bộ và xuất báo cáo.
- Crawl và hiển thị nội dung hữu ích từ các KOL về fitness & nutrition.

Ứng dụng hoạt động tốt trên trình duyệt, có khả năng chạy offline và đồng bộ khi có kết nối mạng.

### 1.3 Target Users
- **Beginner Users:** Chưa có kinh nghiệm, cần hướng dẫn cụ thể và dễ hiểu.
- **Personal Trainers (PT):** Cần công cụ để quản lý khách hàng, lịch tập và tiến độ.

---

## 2. System Overview

### 2.1 General Description
GigaFit là hệ thống web hoạt động theo kiến trúc **client–server**. Người dùng tương tác thông qua ReactJS PWA, dữ liệu và xử lý AI được quản lý bởi backend.

### 2.2 System Architecture
```
ReactJS PWA (Frontend)
 ├── Service Worker (cache & offline)
 ├── IndexedDB (local storage)
 ↓
Bun + ExpressJS Backend (modular)
 ├── Redis (cache/session)
 ├── AI Service (FastAPI: OpenAI + OCR)
 └── Cloud Storage (AWS S3 / Supabase)
```

### 2.3 Major Components
- **Frontend (ReactJS PWA):** Giao diện, logic client-side, caching offline.
- **Backend (Bun + ExpressJS):** Xử lý nghiệp vụ, tương tác AI và lưu trữ cloud.
- **AI Layer:** Tạo kế hoạch tập luyện/dinh dưỡng, phân tích InBody bằng OCR.
- **Redis Cache:** Lưu session, dữ liệu AI tạm thời để giảm độ trễ.

---

## 3. Functional Requirements

### 3.1 Authentication & User Profile
- Người dùng có thể đăng ký/đăng nhập (email, Google OAuth).
- Hệ thống cho phép nhập thông tin cơ bản (chiều cao, cân nặng, tuổi, giới tính, mục tiêu).
- Hệ thống tự động tính **TDEE** để phục vụ AI gợi ý kế hoạch tập luyện.

### 3.2 AI Workout & Meal Plan
- AI tạo lịch tập (bài tập, nhóm cơ, số buổi/tuần) dựa trên mục tiêu người dùng.
- AI gợi ý **meal plan** theo chỉ số calorie và macro phù hợp.
- Người dùng có thể điều chỉnh hoặc yêu cầu “tạo lại plan”.

### 3.3 Workout Tracking
- Người dùng ghi log: **bài tập, số reps, sets, trọng lượng, thời gian nghỉ.**
- Hệ thống hiển thị biểu đồ tiến triển (biểu đồ đường, tổng khối lượng tập).
- AI đánh giá hiệu suất và đề xuất tăng/giảm cường độ tập.

### 3.4 InBody Scan & AI Analysis
- Người dùng upload ảnh hoặc file PDF chứa kết quả InBody.
- Hệ thống OCR (AI) tự động trích xuất thông tin: `Cân nặng, Body Fat %, Muscle Mass, BMI`.
- AI phân tích xu hướng và đưa ra nhận xét tổng quát.
  _VD: “Tăng 2kg cơ trong 4 tuần, nên tập trung thêm nhóm chân.”_

### 3.5 KOL Feed (Content Aggregation)
- Hệ thống crawl nội dung từ các KOL fitness (bài viết, video, tips).
- Hiển thị feed theo chủ đề: “Workout”, “Nutrition”, “Motivation”.
- AI có thể gợi ý nội dung phù hợp với mục tiêu tập luyện của người dùng.

### 3.6 PT Dashboard
- PT có thể thêm, xem, và theo dõi tiến trình khách hàng.
- Dashboard hiển thị biểu đồ tiến độ và khuyến nghị AI.
- Hỗ trợ xuất báo cáo (PDF hoặc web view).

---

## 4. Non-functional Requirements

| Category | Requirement |
|-----------|-------------|
| **Performance** | Web load < 3s, phản hồi UI < 200ms |
| **Scalability** | Hỗ trợ tối thiểu 10.000 người dùng đồng thời |
| **Security** | JWT, HTTPS, mã hóa dữ liệu cá nhân |
| **Availability** | Uptime ≥ 99.5% |
| **Usability** | UX tối giản, mobile-first, hỗ trợ dark mode |
| **Maintainability** | Mã nguồn theo module, dễ mở rộng |
| **Offline Capability** | PWA cache & sync tự động |
| **Extensibility** | Cho phép thêm AI module hoặc wearable sync |

---

## 5. System Components

### 5.1 Frontend – ReactJS PWA
**Structure:**
```
src/
├── pages/
│   ├── Home/
│   ├── Workout/
│   ├── Progress/
│   ├── MealPlan/
│   ├── PTDashboard/
│   └── Feed/
├── components/
├── store/ (Zustand / Redux Toolkit)
├── services/
├── hooks/
└── utils/
```

**Key Features:**
- Service Worker (cache static + dynamic data).
- IndexedDB lưu log bài tập khi offline.
- Thông báo đẩy (Push Notification API).
- Responsive layout (Tailwind + Shadcn/UI).

### 5.2 Backend – Bun + ExpressJS
- Cấu trúc module theo domain: `user`, `workout`, `inbody`, `pt`, `kol`.
- Giao tiếp với AI microservice (FastAPI).
- Cache layer bằng Redis.
- Lưu trữ file InBody qua S3/Supabase.

---

## 6. AI Integration

| Component | Function |
|------------|-----------|
| **OpenAI API / LLM** | Sinh kế hoạch tập luyện & meal plan cá nhân hóa. |
| **OCR (Tesseract / Vision API)** | Trích xuất dữ liệu từ ảnh InBody. |
| **Recommendation Engine** | Phân tích xu hướng và đề xuất điều chỉnh. |

---

## 7. Deployment & DevOps

| Layer | Technology |
|--------|-------------|
| **Containerization** | Docker Compose |
| **Web Hosting** | Vercel / Netlify |
| **Backend Hosting** | DigitalOcean App Platform |
| **Storage** | AWS S3 / Supabase |
| **CI/CD** | GitHub Actions (build + deploy) |
| **Monitoring** | Uptime Kuma / Grafana |

---

## 8. Roadmap

| Sprint | Duration | Deliverables |
|---------|-----------|--------------|
| **Sprint 1** | 2 weeks | React PWA setup, Auth, AI Workout UI |
| **Sprint 2** | 2 weeks | Workout log + InBody OCR feature |
| **Sprint 3** | 2 weeks | PT Dashboard + KOL Feed integration |

---

## 9. Success Metrics

| Metric | Target |
|---------|--------|
| Active users (D7 Retention) | ≥ 30% |
| Avg. workouts logged / week | ≥ 3 |
| AI plan adoption rate | ≥ 80% |
| OCR scan usage | ≥ 60% |
| PT engagement rate | ≥ 50% |

---

## 10. Future Enhancements
- Tích hợp đồng bộ với **smartwatch / wearable (Apple Watch, Fitbit)**.
- Tăng cường AI Coach Chatbot (real-time Q&A).
- Social feature: chia sẻ kết quả & nhận feedback cộng đồng.

---

**Document version:** `v1.0 – GigaFit ReactJS PWA MVP`
**Prepared by:** Business Analyst Team – GigaFit Project
**Date:** 2025-11-10
