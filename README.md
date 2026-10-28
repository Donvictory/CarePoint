CarePoint Clinic is an appointment booking web application built with React, TypeScript, Vite, and Tailwind CSS. It enables patients to view available healthcare provider time slots, book appointments with client-side validation and idempotency protection, manage existing bookings by email, and cancel scheduled visits.

Features
Live Slot Directory: Fetches real-time provider slots, sorted and grouped by day, displaying availability indicators and timezone context.
Appointment Booking: Modal booking workflow featuring real-time input validation (full name, valid email) and automated duplicate prevention.
Idempotency & Concurrency Control: Uses unique idempotency keys per submission attempt to prevent duplicate bookings during network retries or concurrent slot conflicts.
Manage Existing Bookings: Search and view appointment history by email with cursor-based pagination and status tracking (confirmed, cancelled).
Cancellation Flow: Cancel scheduled appointments with instant state updates and slot list synchronization.
Resilient Error & Rate-Limit Handling: Granular error categorization for timeouts, network failures, conflicts, authorization errors, and rate limits with retry-after timers.
Configurable API Access: Built-in API key management modal with persistent localStorage storage.
Accessible & Responsive Design: Healthcare design system, smooth reveal transitions with prefers-reduced-motion support, and dialog focus trapping.

