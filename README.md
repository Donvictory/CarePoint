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
Tech Stack
Frontend: React 18
Language: TypeScript
Bundler & Dev Server: Vite 6
Styling: Tailwind CSS v4 via @tailwindcss/vite
Schema Validation: Zod
Typography: Google Fonts (Manrope)
Project Structure
text
carepoint/
└── carepoint-clinic/
    ├── public/
    │   └── favicon.svg
    ├── src/
    │   ├── components/
    │   │   ├── ApiKeyPanel.tsx        # API key entry and storage modal
    │   │   ├── BookingConfirmation.tsx# Successful booking details and actions
    │   │   ├── BookingForm.tsx        # Patient details form with validation
    │   │   ├── CareLogo.tsx           # Brand icon and logo mark
    │   │   ├── ErrorState.tsx         # Inline and block error presentations
    │   │   ├── Header.tsx             # Navbar with connection status indicator
    │   │   ├── LoadingState.tsx       # Skeleton and spinner indicators
    │   │   ├── ManageBooking.tsx      # Email lookup and booking cancellation
    │   │   ├── Marks.tsx              # Status icons and symbols
    │   │   └── SlotCard.tsx           # Individual slot card component
    │   ├── schemas/
    │   │   └── booking.ts             # Zod runtime parsing schemas
    │   ├── services/
    │   │   └── api.ts                 # HTTP client, error handling, and API endpoints
    │   ├── types/
    │   │   └── booking.ts             # TypeScript interfaces and error kinds
    │   ├── utils/
    │   │   └── date.ts                # Date formatting and timezone helpers
    │   ├── App.tsx                    # Main application state and page layout
    │   ├── index.css                  # Global styles and Tailwind imports
    │   └── main.tsx                   # React DOM root entry
    ├── .env.example                   # Sample environment configuration
    ├── index.html                     # HTML root template with SEO metadata
    ├── package.json                   # Project metadata and dependencies
    ├── tsconfig.json                  # TypeScript compiler configuration
    └── vite.config.ts                 # Vite bundler and Tailwind plugin configuration
