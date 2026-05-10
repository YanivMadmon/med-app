# App Planning — MedApp

## Overview
MedApp is a dual-interface mobile application for medication management.
- Elderly users receive simple reminders and confirm doses with one tap
- Caregivers configure medications remotely and receive push notifications when doses are missed

## User Roles

| Role | Description |
|------|-------------|
| **Elderly (Patient)** | Receives reminders, confirms doses, views today's schedule |
| **Caregiver (Child/Family)** | Adds medications, sets schedules, monitors adherence, receives alerts |

## Core Design Principles
- **For elderly:** minimum friction, large buttons (48pt+), high contrast, voice alerts
- **For caregiver:** full control, real-time dashboard, multi-user support
- **Languages:** Hebrew (RTL) + English, switchable per user
- **Login:** OTP via SMS only — no passwords for elderly users

---

## MVP Features

### Elderly Side
- Today's medication schedule (large cards per dose)
- Voice + vibration reminder at scheduled time
- One large "I took it ✅" button per dose
- Snooze reminder ("remind me in 10 min")
- Simple weekly adherence history

### Caregiver Side
- Add/edit/delete medications (name, dosage, times, photo)
- Set reminder times per medication
- Configure alert delay (e.g., notify me if not taken within 30 min)
- Real-time dashboard: doses taken today, weekly adherence %
- Add multiple caregivers per patient (siblings, doctor)
- Weekly adherence report (exportable as PDF)

### General
- Hebrew + English with full RTL support
- OTP login (phone number)
- Push notifications (FCM)
- Dark / Light mode

---

## Future Features (Post-MVP)
- Scan medication barcode with camera
- Drug interaction warnings
- Pharmacy integration for prescription renewal
- Doctor report sharing
- Fall detection
- Dementia mode (extra confirmation steps, family auto-alert)

---

## Timeline

| Phase | Deliverables | Duration |
|-------|-------------|----------|
| 1 | Auth + DB schema + basic screens | 2 weeks |
| 2 | Reminders + Push Notifications | 2 weeks |
| 3 | Caregiver dashboard + alerts | 2 weeks |
| 4 | Hebrew/English + RTL + UI polish | 1 week |
| 5 | Payments (RevenueCat) | 1 week |
| 6 | Testing + App Store submission | 1 week |
| **Total** | | **~9 weeks** |
