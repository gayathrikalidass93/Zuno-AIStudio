# ZUNO — Your Extra Pair of Hands

> **On-Demand Household Assistance Marketplace Starting in Chennai, India**  
> *ONE booking → ONE helper → MULTIPLE tasks → ONE bill.*

---

## 1. Product Philosophy & Problem Statement

Conventional service apps force customers into siloed, inflexible buckets (e.g. paying separate call-out fees for a maid, a cook, and a laundry service). In reality, real homes think in terms of:

> *"I have several things to do at home, but I don't have enough time or an available person to help me."*

**ZUNO solves this with multi-task visits:**  
A customer books a trusted nearby helper for **1–4 hours** and bundles diverse chores (e.g., sweep + mop + wash vessels + cut vegetables + cook lunch + fold clothes) into **one single visit** with **one transparent bill**.

---

## 2. Key Marketplace Differentiators

| Feature | Description |
| :--- | :--- |
| **✨ Build My Visit** | Core multi-task visit builder. Select chores across cleaning, cooking, laundry, organisation, and care with live workload estimation. |
| **⚡ Need Help Now** | Urgent booking flow for immediate dispatch (~25–35 mins ETA) matching helpers currently on *Available Now* status. |
| **🎯 ZUNO Match Engine** | Intelligent scoring algorithm factoring in task skills, distance, apartment familiarity, ratings, on-time rate, and childcare verification. |
| **🛡️ Safety-First Childcare** | Kids Care is decoupled from general housekeeping. Helpers must pass dedicated screening to earn the **Kids Care Verified** badge. |
| **🔄 ZUNO Replacement** | If a confirmed helper cancels, the system automatically queries and offers an eligible nearby replacement instead of leaving the customer stranded. |
| **🔑 OTP Check-in / Out** | 4-digit customer OTP verification upon helper arrival ensures precise timestamps and worker accountability. |
| **❤️ My Helpers & Book Again** | Instant 1-click rebooking with previously trusted helpers, retaining identical chores, duration, and preferences. |
| **🏢 Apartment-First Density** | Initial Chennai pilot clusters: Pallavaram, Chromepet, Pammal, Keelkattalai, Medavakkam, Velachery, Tambaram, Perungalathur. |

---

## 3. Technology Stack & Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- **State & Persistence:** Reactive local storage engine with normalized relations, transactional updates, and exportable audit trail.
- **Backend / Relational Schema:** SQLite / PostgreSQL normalized schema (`schema.sql`).
- **Python Stack Reference:** `requirements.txt` provided for Streamlit / FastAPI prototype export.

### Normalized Relational Schema (`schema.sql`)
1. `users` (Roles: customer, helper, admin)
2. `customers` (Apartment, block, flat, dietary preferences, saved favourites)
3. `helpers` (Locality, radius, payout, ratings, verified credentials)
4. `apartments` (Total flats, active customers, active helpers, density)
5. `services` & `tasks` (Service categories and granular chores with estimated minutes)
6. `helper_skills` (Normalized M:N relation between helper and task skills)
7. `bookings` (Multi-task visit record, start OTP, status lifecycle, transparent fee breakdown)
8. `booking_tasks` (Tasks attached to a visit)
9. `ratings` (Bilateral ratings: customer rates helper; helper rates customer)
10. `support_tickets` (Customer issues routed to operations control tower)
11. `pricing_configs` (Admin-managed base hourly rate, payout splits, surge fees)

---

## 4. How to Run Locally

### Run the Vite web application
```bash
npm install
npm run dev
```

Open the local URL shown by Vite (the project defaults to port 3000).

### Create a production build locally
```bash
npm run lint
npm run build
npm run preview
```

## 5. Online Preview with Vercel

This repository is configured for Vercel preview deployments:

- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback: all routes serve `index.html`
- Production branch: `main`
- Pull requests and non-main branches can be used as preview deployments.

To deploy from GitHub, import `gayathrikalidass93/Zuno-AIStudio` into Vercel. Vercel automatically detects Vite projects and creates a deployment URL. Subsequent GitHub pushes can create new deployments. citeturn0search12

For local/CLI deployment, Vercel documents the flow as linking the project, optionally pulling environment variables, then deploying a preview with `vercel`. citeturn0search9

**Important:** this is currently a browser/local-state MVP preview. Do not add private API keys with a `VITE_` prefix; Vite bundles those variables into client-side code. citeturn0search11

## 6. Current MVP Preview Flow

1. Customer opens ZUNO.
2. Customer selects one of the six MVP services.
3. Customer enters the simple work-specific questions.
4. Customer reviews matching helpers.
5. Customer selects a helper and negotiates the price.
6. Customer confirms the booking.
7. Payment is intentionally deferred until helper arrival or work completion; live Razorpay processing is not yet connected.
8. Customer and helper views resolve the booking relationship through explicit customer/helper IDs.

## 7. Privacy Architecture & DPDP Alignment (Digital Personal Data Protection Act, 2023)

ZUNO implements a **privacy-first data architecture** to ensure household data protection:

### Data Classification Model
1. **Public Marketplace Data:** Display names, ratings, verified badges, skills, and service locality.
2. **Private PII (Protected):** Phone numbers and email addresses are masked (`+91 ••••• •2099`, `k•••••n@gmail.com`).
3. **Residential Address Protection:** Helper home addresses are **never** exposed to customers. Customer flat/block is revealed **only** to the assigned helper during an active booking window for fulfilment.
4. **Restricted Operational Data:** Identity verification documents, family emergency contacts, and childcare screening records are restricted to admin operations.

### Consent & User Control
- **Versioned Consent:** Versioned consent tracking (`v1.2.0-dpdp`) captured in local state.
- **Data Principal Rights:** Customers can submit DPDP requests via the **Privacy & DPDP Controls** modal:
  - Summary of processed personal data
  - Correction of inaccurate data
  - Account erasure / anonymisation
  - Withdrawal of consent
  - Grievance registration with the Data Protection Officer (`dpo@zuno.in`)

---

## 8. Known Prototype Limitations & Production Readiness Gaps

The current repository is a high-fidelity working prototype. Production deployment requires:

1. **Authentication & Authorization:** Replace demo role switching with server-side authentication (e.g., Firebase Auth or OAuth2 with JWT session tokens).
2. **Database & Storage:** Migrate reactive browser storage to an encrypted PostgreSQL database.
3. **Payment & Payout Gateway:** Integrate real UPI / payment gateways with automated escrow splits (Razorpay / Cashfree Route).
4. **SMS / OTP Verification:** Replace in-memory OTP codes with real SMS gateway delivery (e.g., Twilio / Fast2SMS).
5. **GPS & Telematics:** Implement real GPS location updates; current ETA calculations are synthetic estimates.
6. **Legal & DPDP Audit:** Complete independent legal and data privacy audits before onboarding real households.

---

*ZUNO — Your extra pair of hands.*
