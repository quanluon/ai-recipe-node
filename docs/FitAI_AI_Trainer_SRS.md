# 🧩 SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Project: FitAI – AI Fitness Trainer
**Version:** 1.0 MVP  
**Date:** 2025-11-07  
**Author:** Business Analyst Team

---

## 1️⃣. Introduction

### 1.1. Purpose
This document describes the **Software Requirements Specification (SRS)** for the FitAI web application — an **AI-driven fitness trainer** platform that generates personalized workout and meal plans using data crawled from fitness influencers (TikTok, YouTube, etc.) and adapts dynamically to user progress.

### 1.2. Scope
FitAI provides a **personalized AI Trainer** capable of:
- Generating daily/weekly **workout plans** based on the user’s goal (muscle gain, fat loss, maintenance).
- Recommending **meal plans** and calculating caloric/macronutrient needs.
- Tracking **user performance** (e.g., bench press 60kg → 70kg next week).
- Learning continuously from influencer content (exercise tips, meal routines) to improve recommendations.

The platform focuses on fast, minimal UX interactions: one-click tracking, easy plan regeneration, and weekly AI feedback.

### 1.3. Definitions, Acronyms, Abbreviations
| Term | Description |
|------|--------------|
| AI Trainer | Virtual personal trainer powered by AI |
| RAG | Retrieval-Augmented Generation – combining AI with crawled content |
| PT | Personal Trainer |
| KPI | Key Performance Indicator |

### 1.4. References
- TikTok / YouTube influencer datasets  
- OpenAI GPT-4o API documentation  
- Supabase, Next.js, NestJS documentation

---

## 2️⃣. Overall Description

### 2.1. Product Perspective
FitAI acts as an **AI replacement for human trainers**, capable of personalized planning, progress tracking, and continuous adaptation. It integrates:
- Crawling subsystem (data collection)
- AI planning subsystem (plan generation)
- Tracking & analytics (user data feedback loop)

### 2.2. Product Functions
- User registration and goal setting  
- AI workout & meal plan generation  
- Daily workout tracking  
- Weekly AI progress feedback  
- Dashboard visualization (charts, calories, progress)

### 2.3. User Characteristics
| Type | Description | Technical Level |
|------|--------------|----------------|
| Beginner | New to fitness, needs easy guidance | Low |
| Intermediate | Regular gym-goer tracking strength | Medium |
| Athlete | Advanced user focusing on optimization | High |

### 2.4. Constraints
- Limited to static crawled data for MVP (no realtime updates)
- Only web-first interface (mobile PWA optional)
- Requires AI API connectivity (OpenAI/Claude)
- Privacy compliance for user health data (GDPR)

---

## 3️⃣. Functional Requirements

### 3.1. User Registration and Profile
**Description:** Collect personal data for plan generation.  
**Inputs:** Email, Gender, Age, Height, Weight, Goal (gain/loss), Activity level.  
**Outputs:** Stored user profile.  
**Priority:** High.

**Data Example:**
```json
{
  "userId": "uuid",
  "email": "string",
  "gender": "male",
  "height": 175,
  "weight": 70,
  "goal": "gain_muscle",
  "activityLevel": 3
}
```

---

### 3.2. AI Plan Generation (Workout & Meal)
**Description:** Generate plans using AI + influencer dataset.  
**Inputs:** user profile, influencer dataset, progress history.  
**Outputs:** JSON structured plan (7-day).  
**Priority:** Critical.

**Example Output:**
```json
{
  "workoutPlan": [
    {"day": "Monday", "focus": "Chest", "exercises": [
      {"name": "Bench Press", "sets": 4, "reps": 10, "video": "https://..."}
    ]}
  ],
  "mealPlan": [
    {"meal": "Breakfast", "calories": 450, "items": ["Oatmeal", "Egg Whites"]}
  ]
}
```

**Functional Flow:**
1. User submits goal.  
2. AI model queries RAG vector DB (TikTok influencers).  
3. Generates a personalized plan.  
4. User can “Regenerate” anytime.

---

### 3.3. Workout Tracking
**Description:** Record exercise completion and strength progress.  
**Inputs:** exercise name, sets, reps, weight, completion flag.  
**Outputs:** Progress logs, trend charts.  
**Priority:** High.

**Flow:**
1. User marks exercise “Done.”  
2. System logs performance (auto time-stamped).  
3. Weekly AI reviews improvement (% increase in load).

**Example:**
```json
{
  "userId": "uuid",
  "exercise": "Bench Press",
  "date": "2025-11-07",
  "weight": 60,
  "reps": 10,
  "sets": 4,
  "status": "done"
}
```

---

### 3.4. Meal Tracking
**Description:** User tracks daily meals and caloric intake.  
**Inputs:** meal, portion size, calories.  
**Outputs:** daily nutrition summary.  
**Priority:** Medium.

**UI Features:**
- Pie chart: % macro distribution  
- Progress bar: calories consumed vs target  

---

### 3.5. Progress Analytics & Feedback
**Description:** Weekly AI feedback based on logs.  
**Inputs:** past week’s performance data.  
**Outputs:** AI-generated feedback message.  
**Priority:** Medium.

**Example Output:**
```json
{
  "weekStats": {
    "avgCalories": 2200,
    "avgWeightLifted": 70
  },
  "aiFeedback": "Tốt lắm! Tuần tới hãy tăng 5% mức tạ trung bình."
}
```

---

## 4️⃣. Non-Functional Requirements

| Category | Requirement |
|-----------|--------------|
| Performance | Dashboard loads < 2 seconds |
| Scalability | Support up to 10k active users in MVP |
| Security | JWT-based Auth via Supabase |
| Data Privacy | No public exposure of personal data |
| Availability | 99% uptime target |
| AI Model | GPT-4o or Claude 3 Haiku |
| UI | Tailwind + Shadcn (clean, responsive) |
| Hosting | Vercel (FE), Render/Fly.io (BE) |

---

## 5️⃣. System Architecture Overview

```
Frontend (Next.js)
 ├── Auth & Profile
 ├── Workout / Meal Dashboard
 ├── AI Trainer Chat
       ↓
Backend (NestJS)
 ├── User API / Plan / Progress
 ├── AI Engine (LangChain + OpenAI)
 ├── Vector Store (Supabase Vector)
 └── Weekly Feedback Scheduler
```

---

## 6️⃣. Database Schema (MVP)

| Table | Description | Key Fields |
|--------|--------------|------------|
| users | Profile data | id, gender, goal, weight |
| plans | AI-generated plans | id, userId, jsonData |
| progress | Workout logs | id, userId, date, exercise |
| meals | Food intake logs | id, userId, calories |
| feedback | Weekly AI tips | id, userId, week, text |

---

## 7️⃣. External Interfaces

| Interface | Description |
|------------|-------------|
| OpenAI API | Generate workout/meal plans |
| Supabase | Auth, DB, and storage |
| TikTok Crawler | Data collection for RAG |
| Redis Cache | Temporary plan storage |

---

## 8️⃣. System Flow Summary

```
[User SignUp] → [Input Goals]
→ [AI Generates Plan]
→ [User Follows Plan]
→ [Logs Workouts/Meals]
→ [AI Analyzes Progress]
→ [Weekly Feedback Generated]
```

---

## 9️⃣. Future Enhancements

- Real-time TikTok crawling and influencer ranking  
- Pose detection (AI form correction)  
- Smartwatch synchronization (Apple, Fitbit)  
- Community & leaderboard challenges  
- AI voice coach for live feedback  

---

## 🔟. Acceptance Criteria

| ID | Requirement | Acceptance Criteria |
|----|--------------|--------------------|
| AC-01 | AI Plan Generation | Returns a complete JSON plan with valid sets/reps/macros |
| AC-02 | Workout Tracking | Logs are stored and displayed on dashboard |
| AC-03 | Meal Tracking | Calories auto-calculated and charted |
| AC-04 | AI Feedback | Generated weekly message based on user logs |
| AC-05 | Performance | Dashboard < 2s on average load |

---

**End of Document**
