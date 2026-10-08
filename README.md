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

### Run Vite Web Application:
```bash
# 1. Install dependencies
npm install

# 2. Run local development server (Port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Live Demo Walkthrough (12-Step Test Scenario)

You can switch between **Customer**, **Helper App**, and **Admin Tower** anytime via the top navigation bar:

1. **Customer View:** Open ZUNO homepage. Notice the apartment density banner (*Purva Windermere, Pallavaram · 16 helpers nearby*).
2. **Build My Visit:** Tap **"Build My Visit"**.
3. **Select Tasks:**
   - Cleaning: Sweep, Mop, Wash vessels
   - Cooking: Vegetable preparation, Cook lunch (Meals)
4. **Task Intelligence:** Notice the workload estimator calculates `~3.0 hrs (180 mins)` and provides feasibility guidance. Select **3 Hours**.
5. **Mode A / Matching:** Tap **"Choose Helper"**. See **Lakshmi Narayanan** ranked at **96% Match** with highlights (*✓ 5/5 tasks matched, ✓ 1.8 km away, ✓ 4.9★ rating, ✓ Previously served your society*).
6. **Bill Transparency:** Review the breakdown (Base: ₹747, Multi-task discount: -₹75, Total: ₹672, Helper Payout: ₹551 [82%], ZUNO Fee: ₹121 [18%]). Tap **Confirm & Book**.
7. **Customer Tracker:** Note the 4-digit start OTP (e.g. `4821`).
8. **Helper App View:** Switch to **Helper App** in the top bar. You see Lakshmi's dashboard with today's jobs and transparent payout.
9. **OTP Check-in:** Helper taps **"Start Visit"**, enters OTP `4821`, and the visit officially starts.
10. **Emergency Replacement Test:** Helper taps **"Cancel Due to Emergency"**. Switch back to Customer view to see ZUNO's automated **Replacement Engine** offer candidate **Anandhi Sekar (94% match)**.
11. **Admin Control Tower:** Switch to **Admin Tower**. Inspect the **Supply-Demand View** (Pallavaram shortage: +8 helpers vs Chromepet surplus: +3), check verification checklists, or upload CSV files.
12. **Book Again:** Completed visits enable 1-click **Book Again** with pre-filled preferences.

---

## 6. How to Add Services or Change Pricing

### Adding a New Task:
Edit `/src/data/services.ts` and append to `MASTER_TASKS`:
```typescript
{
  id: 'clean_balcony',
  category: 'cleaning',
  name: 'Balcony wash & railing wipe',
  tamilName: 'பால்கனி சுத்தம்',
  estimatedMinutes: 30,
  description: 'Mop balcony tiles and wipe handrails'
}
```

### Changing Pricing:
1. In the **Admin Control Tower**, navigate to **Pricing Engine**.
2. Modify Base Hourly Rate (₹249), Helper Payout Share (82%), Multi-Task Discount (10%), or Urgent Premium (20%).
3. Click **Update Pricing Engine Rules**. All subsequent bookings will compute against updated rules.

### Importing Helpers via CSV:
1. In the **Admin Control Tower**, select **CSV Data Import**.
2. Click **Load Sample Helper CSV Template**.
3. Click **Validate & Preview Rows** to check for missing fields or invalid localities.
4. Click **Confirm & Save to Database**.

---

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
