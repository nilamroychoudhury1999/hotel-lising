# PrepBoard Exam Site

A standalone React + Firebase mock-test website inspired by exam-prep platforms. It uses original UI, content, and sample questions.

## Features

- Exam category tabs for Banking, SSC, Railways, and Regulatory exams
- Free and locked test-series cards
- Student lead capture
- Google sign-in when Firebase is configured
- Timed mock-test runner
- Answer review with detailed solutions
- Score, accuracy, attempted count, and section-wise analysis
- Free weekly live-test, PYP, and popular-exam sections
- Host Studio for manual test setup, manual question entry, local publishing, deletion, and attempt counts
- Firestore-ready collections: `examTests`, `examLeads`, `examAttempts`

## Demo Access

- Locked test unlock code: `PREP100`
- Host Studio demo code: `HOST100`
- Cloud publishing to `examTests` is restricted in `firestore.rules` to the admin email.

## Setup

1. Copy `.env.example` to `.env`.
2. Add your Firebase web app values.
3. Run `npm install`.
4. Run `npm start`.

The app also works in local demo mode without Firebase configuration, but leads and attempts are saved only in the browser.

## Deploy

- Firebase Hosting is configured in `firebase.json`.
- Build with `npm run build`, then deploy with `firebase deploy` after running `firebase login` and selecting a Firebase project.
