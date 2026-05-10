# UI Screens & User Flow — MedApp

## Design Principles
- Elderly font size: minimum 22px
- Caregiver font size: 16px standard
- High contrast colors for elderly interface
- Maximum 2 actions per screen on elderly side

---

## Elderly App

### Screen 1 — Login
- Phone number input (large)
- "Send Code" button (large, green)
- OTP input
- Language toggle: עברית | English

### Screen 2 — Home (Today's Medications)
- Greeting with patient name + today's date
- List of medications grouped by time slot:
  - 🟢 Taken (green card)
  - 🟡 Due now (yellow card + large "I took it" button)
  - 🔴 Upcoming (gray card, shows time remaining)
- Bottom nav: History | Help

### Screen 3 — Reminder Popup
- Full-screen overlay with medication name
- Large green "✅ I took it" button
- Gray "⏰ Remind me in 10 min" button
- Triggered with sound + vibration

### Screen 4 — History
- Simple weekly bar showing adherence % per day
- Weekly summary score ("Great! 85% this week")

---

## Caregiver App

### Screen 1 — Login
- Phone number + OTP (standard size)
- Language toggle

### Screen 2 — Dashboard
- Patient name card with today's adherence
- ⚠️ Alert banner if a dose was missed
- Weekly adherence percentage
- Quick actions: Add Medication | View Report | Settings

### Screen 3 — Add Medication
- Medication name (text input)
- Dosage (text input, e.g., "500mg")
- Reminder times (time picker, add multiple)
- Medication photo (camera or gallery)
- Alert delay setting ("notify me after X minutes")
- Save button

### Screen 4 — Weekly Report
- Per-medication adherence bar chart
- List of missed doses (date + time)
- Overall weekly score
- Export as PDF button

### Screen 5 — Settings
- Patient name and phone number
- Additional caregivers list (add/remove)
- Language selection
- Subscription status + manage

---

## Full User Flow

```
[Caregiver downloads app]
        ↓
[Creates patient profile + adds medications]
        ↓
[Patient receives SMS invitation]
        ↓
[Patient downloads app + logs in with OTP]
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
[After X minutes → Caregiver receives Push Notification ⚠️]
        ↓
[Caregiver can call patient or take action]
```

---

## Color Palette (Proposed)

| Element | Color |
|---------|-------|
| Primary | #2E86AB (calm blue) |
| Success / Taken | #4CAF50 (green) |
| Warning / Due now | #FFC107 (amber) |
| Danger / Missed | #F44336 (red) |
| Background | #FFFFFF / #121212 (dark mode) |
| Text | #212121 / #FAFAFA (dark mode) |
