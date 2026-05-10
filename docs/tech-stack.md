# Tech Stack — MedApp

## Mobile (Frontend)
| Technology | Choice | Reason |
|------------|--------|--------|
| Framework | React Native | Single codebase for iOS + Android |
| Navigation | React Navigation v7 | Standard, well-maintained |
| State Management | Zustand | Lightweight, simple |
| UI Components | React Native Paper | Material Design, accessible |
| Push Notifications | Firebase FCM | Free, reliable, cross-platform |
| Payments | RevenueCat | Handles iOS + Android subscriptions easily |
| Auth | Firebase Auth (OTP) | Simple phone number login, no password needed |

## Backend
| Technology | Choice | Reason |
|------------|--------|--------|
| Runtime | Node.js | Fast development |
| Framework | Express.js | Simple REST API |
| Database | PostgreSQL | Relational, good for health data |
| ORM | Prisma | Type-safe, great DX |
| Hosting | Railway | Simple deployment, affordable |
| File Storage | Cloudinary | Medication photos |

## Notifications
| Technology | Choice | Reason |
|------------|--------|--------|
| Push | Firebase FCM | Free, cross-platform |
| SMS (OTP) | Twilio | Reliable OTP delivery |
| Scheduling | node-cron | Server-side reminder scheduling |

## DevOps
| Technology | Choice | Reason |
|------------|--------|--------|
| Version Control | Git + GitHub | Standard |
| CI/CD | GitHub Actions | Free for small projects |
| Environment | .env files | Simple config management |

---

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Elderly App    │     │  Caregiver App   │
│  (React Native) │     │  (React Native)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └──────────┬────────────┘
                    │ REST API (HTTPS)
         ┌──────────▼────────────┐
         │   Node.js / Express   │
         │       Backend         │
         └──────────┬────────────┘
                    │
         ┌──────────▼────────────┐
         │      PostgreSQL        │
         │       Database         │
         └───────────────────────┘
                    │
         ┌──────────▼────────────┐
         │    Firebase FCM        │
         │  (Push Notifications)  │
         └───────────────────────┘
```
