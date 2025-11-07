# 🚀 FitAI – AI Visual Trainer  
## 📘 Phased Implementation Plan (Based on SRS v1.1)  
**Date:** 2025-11-07  
**Author:** BA Team  

---

## 🧩 Phase 1 — MVP Foundation  
**Duration:** 3–4 weeks  
**Goal:** Xây dựng nền tảng cơ bản (auth, upload ảnh, AI phân tích sơ bộ, dashboard đơn giản).  

### 🎯 Deliverables:
| Hạng mục | Mô tả |
|-----------|-------|
| Auth & Profile | Supabase Auth, lưu chiều cao/cân nặng/giới tính/mục tiêu. |
| Photo Upload | Cho phép chụp hoặc upload ảnh toàn thân. |
| AI Analyzer (BodyPix) | Phân tách ảnh và ước lượng body fat. |
| Body Fat Estimate | Tính toán `waist/shoulder` và `hip/waist` ratio. |
| Dashboard Basic | Hiển thị body fat %, focus area, shape type. |

### 💻 Tech Stack:
- **Frontend:** Next.js 15 + TailwindCSS + Shadcn/UI  
- **AI:** TensorFlow.js BodyPix (client-side)  
- **Backend:** NestJS + Supabase (PostgreSQL + Auth)  
- **Storage:** Supabase Storage (auto delete ảnh sau 5 phút).  

### ⚠️ Risks:
- Ảnh sáng & góc chụp ảnh hưởng model.  
- Thiết bị yếu → BodyPix chậm.  

---

## 🧠 Phase 2 — AI Suggestion Engine (Workout + Meal Plan)  
**Duration:** 4–5 weeks  
**Goal:** AI sinh kế hoạch tập luyện & meal plan cá nhân hóa.  

### 🎯 Deliverables:
| Hạng mục | Mô tả |
|-----------|-------|
| AI Suggestion Module | Kết nối GPT-4o / Claude 3 API để sinh plan. |
| Daily Workout Plan | Sinh plan 7 ngày (push/pull/legs). |
| Meal Plan | Sinh meal plan theo TDEE & macro. |
| KOL Simulation | Thêm prompt “AI tổng hợp xu hướng TikTok/YouTube”. |
| Plan Regeneration | Nút “Regenerate Plan” để sinh kế hoạch mới. |

### 💻 Tech Stack:
- **LangChain + OpenAI API**  
- **DB Schema:** `plans`, `meals`  
- **Frontend:** Card UI (gợi ý mỗi ngày)  

### ⚠️ Risks:
- GPT output không nhất quán → cần prompt tuning.  
- Gợi ý không phù hợp thể trạng → cần logic kiểm soát (rule layer).  

---

## 🤳 Phase 3 — Visual Feedback (Posture & Form Correction)  
**Duration:** 4 weeks  
**Goal:** AI phân tích dáng người, phát hiện lỗi form & gợi ý điều chỉnh.  

### 🎯 Deliverables:
| Hạng mục | Mô tả |
|-----------|-------|
| Pose Detection | MediaPipe Pose / OpenPose xác định keypoints. |
| Form Analysis | Phát hiện lỗi: lệch vai, gù lưng, hông lệch. |
| AI Suggestion | GPT sinh bài tập sửa form. |
| Overlay UI | Canvas highlight vùng sai. |
| Daily Posture Tip | Tự gợi ý bài tập fix posture mỗi ngày. |

### 💻 Tech Stack:
- **AI Vision:** MediaPipe Pose / MoveNet  
- **Frontend:** Canvas overlay / Shadcn UI  
- **Backend:** NestJS + LangChain  

### ⚠️ Risks:
- Sai keypoint do góc chụp, ánh sáng.  
- Phản hồi AI cần giữ “ngôn ngữ nhẹ nhàng, động viên”.  

---

## 📈 Phase 4 — Dashboard & Progress Tracker  
**Duration:** 3–4 weeks  
**Goal:** Theo dõi tiến độ luyện tập và phản hồi hàng tuần từ AI.  

### 🎯 Deliverables:
| Hạng mục | Mô tả |
|-----------|-------|
| Weekly Charts | Body fat %, weight, calories trend. |
| AI Weekly Review | GPT tổng hợp dữ liệu tuần → sinh feedback. |
| Progress Timeline | Lưu ảnh before/after. |
| Notifications | Nhắc user update ảnh/weight định kỳ. |

### 💻 Tech Stack:
- **Charts:** Recharts / Chart.js  
- **AI Feedback:** LangChain weekly summary  
- **Storage:** Supabase Storage (ảnh progress)  

### ⚠️ Risks:
- Người dùng quên cập nhật dữ liệu.  
- Cần tối ưu caching để dashboard mượt.  

---

## ⌚ Phase 5 — Smart Integration (Apple Watch / Voice / Community)  
**Duration:** 6–8 weeks  
**Goal:** Tích hợp ecosystem mở rộng để tạo trải nghiệm “AI huấn luyện viên thật”.  

### 🎯 Deliverables:
| Hạng mục | Mô tả |
|-----------|-------|
| Apple Watch Sync | HealthKit API → calories, heart rate, workouts. |
| Voice Coach | AI nói bằng voice (OpenAI TTS / ElevenLabs). |
| Community | Leaderboard + “AI Challenge Week”. |

### 💻 Tech Stack:
- **Mobile:** Swift (HealthKit) + API Sync  
- **Voice:** OpenAI TTS / ElevenLabs API  
- **Community:** Supabase Realtime + Leaderboard View  

### ⚠️ Risks:
- Yêu cầu đăng ký Apple Developer Account.  
- Cần chính sách bảo mật dữ liệu sức khỏe (GDPR).  

---

## 🧭 Timeline Summary
| Phase | Nội dung chính | Thời gian (tuần) | Deliverable chính |
|--------|----------------|------------------|-------------------|
| 1 | Core foundation (Auth, Upload, Analyzer) | 3–4 | Basic web app + body analysis |
| 2 | AI Suggestion & KOL Simulation | 4–5 | Workout + meal plan AI |
| 3 | Visual Feedback & Posture | 4 | Pose correction |
| 4 | Dashboard & Progress | 3–4 | Interactive analytics |
| 5 | Smart Integration (HealthKit, Voice, Community) | 6–8 | Ecosystem integration |
| **Tổng cộng** | **Phát triển MVP → v2.0** | **~20–24 tuần** | **Soft Launch ready** |

---

## 🔮 Suggested Real-World Execution Plan (Solo Developer)
| Giai đoạn | Công việc chính | Tháng |
|------------|----------------|--------|
| MVP | Phase 1 + Phase 2 | Tháng 1 |
| Posture AI | Phase 3 | Tháng 2 |
| Dashboard | Phase 4 | Tháng 3 |
| Integrations | Phase 5 | Quý 2 |

---

## 📊 Deliverable Milestones
| Milestone | Mô tả | Output |
|------------|-------|---------|
| M1 | MVP Live (body analysis + AI plan) | Demo site |
| M2 | Posture feedback + regeneration | Beta |
| M3 | Dashboard + tracking | Public beta |
| M4 | HealthKit sync + voice | Launch v2.0 |

---

**End of Document**  
