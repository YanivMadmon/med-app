# MedApp — Complete System Design Document

## 1. Background & Idea

### Market Research
- Elderly care app market worth **$4.58B (2024)** growing to **$19.22B by 2035** (CAGR 13.92%)
- Senior care tech market valued at **$32.8B in 2026**
- Only **45%** of adults 65+ are comfortable using apps
- **20.5%** of seniors report loneliness and isolation
- Medisafe (market leader) moved to paid-only in Jan 2026 — created a market gap
- No Hebrew-first solution exists

### The Problem
- Seniors forget to take medications or accidentally double-dose
- Existing apps are too complex for elderly users
- Family members have no real-time visibility when doses are missed
- No unified Hebrew + English solution exists

### The Solution
A **two-sided mobile app**:
- **Elderly user** — ultra-simple interface, large buttons, voice reminders
- **Caregiver (child/family)** — full control dashboard, manages medications remotely, receives alerts

---

## 2. Target Users

| User | Description |
|------|-------------|
| **Patient (Elderly)** | 65+ managing multiple daily medications |
| **Caregiver** | Adult child or family member caring for an aging parent |

---

## 3. Competitive Advantage

| Feature | MedApp | Medisafe | Pillo | SteadiDay |
|---------|--------|----------|-------|-----------|
| Hebrew support | ✅ | ❌ | ❌ | ❌ |
| Real-time caregiver alerts | ✅ | ✅ | ✅ | ❌ |
| Ultra-simple elderly UI | ✅ | ❌ | ❌ | ✅ |
| Free tier | ✅ | ❌ (since 2026) | ✅ | ✅ |
| Family plan (multi-patient) | ✅ | ❌ | ❌ | ❌ |

---

## 4. Business Model

### Who Pays?
The **caregiver (adult child)** — not the elderly user.
The elderly interface is always free and simple.

### Subscription Plans
| Plan | Price | Included |
|------|-------|----------|
| **Free** | $0/month | Up to 3 medications, 1 caregiver |
| **Pro** | $8/month | Unlimited medications, up to 5 caregivers, weekly reports, PDF export |
| **Family** | $15/month | Up to 3 patients, unlimited caregivers, all Pro features |

### Go-To-Market
- **Phase 1:** Israel first — Hebrew-first product, Facebook groups for adult children
- **Phase 2:** English markets — US, UK, Australia
- **Phase 3:** B2B — nursing homes, health insurance companies

---

## 5. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Mobile** | React Native (Expo) | iOS + Android from one codebase |
| **Navigation** | React Navigation v7 | Standard, well-maintained |
| **State** | Zustand | Lightweight, simple |
| **HTTP** | Axios | API calls with JWT interceptor |
| **Backend** | Node.js + Express | Fast development |
| **ORM** | Prisma 7 | Type-safe, great DX |
| **Database** | PostgreSQL 15 | Relational, good for health data |
| **Auth** | OTP via SMS (Twilio) + JWT | Simple login for elderly, no password |
| **Push Notifications** | Firebase FCM | Free, cross-platform |
| **Payments** | RevenueCat | Handles iOS + Android subscriptions |
| **DB Adapter** | @prisma/adapter-pg | Required for Prisma 7 with PostgreSQL |
| **Dev DB** | Docker (postgres:15) | Local development |
| **Hosting** | Railway (planned) | Simple deployment |

---

## 6. System Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Elderly App    │     │  Caregiver App   │
│  (React Native) │     │  (React Native)  │
└────────┬────────┘     └────────┬────────┘
         └──────────┬────────────┘
                    │ REST API (HTTPS)
         ┌──────────▼────────────┐
         │   Node.js / Express   │
         │   src/index.js :3000  │
         └──────────┬────────────┘
                    │
         ┌──────────▼────────────┐
         │  PostgreSQL (Docker)  │
         │  localhost:5432       │
         │  db: medapp           │
         └───────────────────────┘
                    │
         ┌──────────▼────────────┐
         │    Firebase FCM        │
         │  (Push Notifications)  │
         └───────────────────────┘
```

---

## 7. Database Schema

### Enums
- **Role:** `PATIENT` | `CAREGIVER`
- **Language:** `HE` | `EN`
- **DoseStatus:** `TAKEN` | `MISSED` | `SNOOZED`
- **SubscriptionPlan:** `FREE` | `PRO` | `FAMILY`
- **SubscriptionStatus:** `ACTIVE` | `CANCELLED` | `EXPIRED`

### Tables

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| phone | String | Unique, used for OTP login |
| name | String | |
| role | Role | PATIENT or CAREGIVER |
| language | Language | HE (default) or EN |
| fcmToken | String? | Firebase push token |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### PatientProfile
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| userId | UUID | FK → User (unique) |
| notes | String? | Allergies, doctor info |

#### CaregiverPatient (many-to-many)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| caregiverId | UUID | FK → User |
| patientId | UUID | FK → User |
| isOwner | Boolean | Who set up the account |
| @@unique | [caregiverId, patientId] | |

#### Medication
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| patientId | UUID | FK → User |
| name | String | e.g. "אספירין" |
| dosage | String | e.g. "100mg" |
| photoUrl | String? | |
| notes | String? | |
| isActive | Boolean | Soft delete flag |

#### MedicationSchedule
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| medicationId | UUID | FK → Medication |
| time | String | "08:00", "13:00", "20:00" |
| alertDelayMinutes | Int | Default 30 — notify caregiver after X min |

#### DoseLog
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| scheduleId | UUID | FK → MedicationSchedule |
| scheduledAt | DateTime | When the dose was due |
| takenAt | DateTime? | When actually taken (null if missed) |
| status | DoseStatus | TAKEN / MISSED / SNOOZED |
| @@unique | [scheduleId, scheduledAt] | |

#### Subscription
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| userId | UUID | FK → User (unique) |
| plan | SubscriptionPlan | FREE (default) |
| status | SubscriptionStatus | ACTIVE (default) |
| revenueCatId | String? | RevenueCat subscription ID |
| expiresAt | DateTime? | |

---

## 8. API Endpoints

### Auth — `/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/send-otp` | ❌ | Send OTP via SMS to phone number |
| POST | `/verify-otp` | ❌ | Verify OTP, create user if new, return JWT |
| POST | `/update-fcm-token` | ✅ | Save Firebase push token |
| GET | `/me` | ✅ | Get current user + subscription |

### Medications — `/medications`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:patientId` | ✅ | Get all active medications |
| GET | `/:patientId/today` | ✅ | Get today's medications with dose status |
| POST | `/` | ✅ | Add new medication + schedules |
| PUT | `/:id` | ✅ | Update medication |
| DELETE | `/:id` | ✅ | Soft delete (set isActive=false) |

### Doses — `/doses`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/confirm` | ✅ | Patient confirms dose taken |
| POST | `/snooze` | ✅ | Patient snoozes reminder |
| GET | `/history/:patientId` | ✅ | Weekly adherence history |
| GET | `/missed/:patientId` | ✅ | Today's missed doses (for caregiver) |

### Caregivers — `/caregivers`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/link` | ✅ | Link caregiver to patient by phone |
| GET | `/patients` | ✅ | Get all patients linked to caregiver |
| DELETE | `/link/:patientId` | ✅ | Unlink a patient |

---

## 9. UI Screens

### Design Principles
| | Elderly | Caregiver |
|-|---------|-----------|
| Font size | 22px minimum | 16px standard |
| Buttons | Huge, high contrast | Normal |
| Actions per screen | Maximum 2 | Full |
| Login | OTP only, no password | OTP only |

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#2E86AB` | Main brand color (calm blue) |
| Success | `#4CAF50` | Taken / confirmed (green) |
| Warning | `#FFC107` | Due now (amber) |
| Danger | `#F44336` | Missed dose (red) |
| Background | `#F5F7FA` | App background |

### Screen List

#### Auth (shared)
- **LoginScreen** — Phone number input + send OTP button + language toggle
- **OtpScreen** — 6-digit code input + name/role fields for new users

#### Patient App
- **HomeScreen** — Today's medications as large cards grouped by time, confirm button
- **ReminderModal** — Full overlay with "I took it ✅" and "Snooze 10 min" buttons
- **HistoryScreen** — Weekly adherence % per medication with progress bars

#### Caregiver App
- **DashboardScreen** — Patient list + missed dose alerts + add medication button
- **AddMedicationScreen** — Form: name, dosage, times, alert delay, photo
- **HistoryReportScreen** — Per-patient weekly adherence charts
- **SettingsScreen** — User info, subscription plan, language, logout

### Navigation Structure
```
App
├── AuthNavigator (not logged in)
│   ├── LoginScreen
│   └── OtpScreen
├── PatientNavigator (role = PATIENT)
│   ├── Tab: HomeScreen
│   └── Tab: HistoryScreen
└── CaregiverNavigator (role = CAREGIVER)
    ├── Tab: DashboardStack
    │   ├── DashboardScreen
    │   └── AddMedicationScreen
    ├── Tab: HistoryReportScreen
    └── Tab: SettingsScreen
```

---

## 10. User Flow

```
[Caregiver downloads app]
        ↓
[Creates account with phone + OTP]
        ↓
[Links patient by their phone number]
        ↓
[Adds medications with schedules]
        ↓
[Patient receives SMS, downloads app, logs in]
        ↓
[Patient sees today's medication schedule]
        ↓
[Reminder fires at scheduled time → sound + vibration]
        ↓
[Patient taps "I took it ✅"]
        ↓
[Caregiver dashboard updates in real time]

--- If dose is NOT taken ---
        ↓
[After X minutes → Caregiver gets Push Notification ⚠️]
        ↓
[Caregiver can call patient or take action]
```

---

## 11. Project Structure

```
med-app/
├── docs/
│   ├── system-design.md     ← this file
│   ├── planning.md
│   ├── screens.md
│   ├── tech-stack.md
│   └── business-model.md
│
├── backend/
│   ├── src/
│   │   ├── index.js                    ← Express server (port 3000)
│   │   ├── middleware/
│   │   │   └── auth.middleware.js      ← JWT verification
│   │   ├── services/
│   │   │   └── otp.service.js          ← Twilio SMS + in-memory OTP store
│   │   ├── utils/
│   │   │   └── prisma.js               ← PrismaClient with pg adapter
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── medication.controller.js
│   │   │   ├── dose.controller.js
│   │   │   └── caregiver.controller.js
│   │   └── routes/
│   │       ├── auth.routes.js
│   │       ├── medication.routes.js
│   │       ├── dose.routes.js
│   │       └── caregiver.routes.js
│   ├── prisma/
│   │   ├── schema.prisma               ← DB models
│   │   └── migrations/                 ← SQL migration history
│   ├── prisma.config.ts                ← Prisma 7 config (datasource URL)
│   ├── .env                            ← secrets (not in git)
│   ├── .env.example                    ← template for env vars
│   └── test-api.js                     ← manual API test script
│
└── mobile/
    ├── App.js                          ← entry point
    ├── app.json                        ← Expo config (iOS + Android only)
    └── src/
        ├── constants/
        │   └── colors.js               ← color palette
        ├── services/
        │   └── api.js                  ← Axios instance + all API calls
        ├── store/
        │   └── authStore.js            ← Zustand auth state
        ├── navigation/
        │   ├── index.js                ← root navigator
        │   ├── AuthNavigator.js
        │   ├── PatientNavigator.js
        │   └── CaregiverNavigator.js
        └── screens/
            ├── auth/
            │   ├── LoginScreen.js
            │   └── OtpScreen.js
            ├── patient/
            │   ├── HomeScreen.js
            │   └── HistoryScreen.js
            └── caregiver/
                ├── DashboardScreen.js
                ├── AddMedicationScreen.js
                ├── HistoryReportScreen.js
                └── SettingsScreen.js
```

---

## 12. Development Setup

### Prerequisites
- Node.js v22+
- Docker Desktop
- Expo Go app on phone

### Run Backend
```bash
# Start PostgreSQL
docker start medapp-postgres
# or first time:
docker run --name medapp-postgres \
  -e POSTGRES_USER=medapp \
  -e POSTGRES_PASSWORD=medapp123 \
  -e POSTGRES_DB=medapp \
  -p 5432:5432 -d postgres:15

# Start server
cd backend
npm run dev         # runs on http://localhost:3000
```

### Run Mobile
```bash
cd mobile
npx expo start          # LAN mode (same WiFi)
npx expo start --tunnel # Tunnel mode (different networks)
```

### Dev OTP Bypass
In development (no real Twilio keys), use code **`000000`** to bypass OTP verification.

### Environment Variables (.env)
```
DATABASE_URL="postgresql://medapp:medapp123@localhost:5432/medapp"
PORT=3000
JWT_SECRET="your-secret"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
```

---

## 13. Current Status & Next Steps

### ✅ Done
- [x] Market research & idea validation
- [x] App planning & UI screen design
- [x] DB schema (7 tables with Prisma)
- [x] Full REST API (16 endpoints)
- [x] React Native mobile app (8 screens)
- [x] Navigation (Auth / Patient / Caregiver)
- [x] PostgreSQL running in Docker
- [x] All API endpoints tested and working
- [x] Expo app running on device via tunnel
- [x] Dev OTP bypass (code: 000000)

### 🔜 Next Steps
- [ ] Fix OTP dev bypass on mobile (commit pending)
- [ ] Push Notifications — Firebase FCM setup
- [ ] Deploy backend to Railway
- [ ] RevenueCat payment integration
- [ ] App Store / Google Play submission

---

## 14. GitHub Repository
[https://github.com/YanivMadmon/med-app](https://github.com/YanivMadmon/med-app)
