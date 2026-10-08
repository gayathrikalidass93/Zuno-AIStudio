-- ZUNO Database Schema (SQLite / PostgreSQL Compatible)
-- "Your extra pair of hands" - Household Assistance Marketplace (Chennai)

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'helper', 'admin')),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(120),
    name VARCHAR(120) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Apartments & Residential Communities
CREATE TABLE IF NOT EXISTS apartments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    locality VARCHAR(80) NOT NULL,
    address TEXT NOT NULL,
    total_flats INT DEFAULT 0,
    active_customers INT DEFAULT 0,
    active_helpers INT DEFAULT 0,
    total_bookings INT DEFAULT 0,
    repeat_booking_rate DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    apartment_id VARCHAR(64) REFERENCES apartments(id) ON DELETE SET NULL,
    locality VARCHAR(80) NOT NULL,
    apartment_name VARCHAR(150) NOT NULL,
    block VARCHAR(40),
    flat VARCHAR(40),
    preferred_language VARCHAR(50) DEFAULT 'Tamil',
    dietary_preferences TEXT,
    is_elder_friendly BOOLEAN DEFAULT FALSE,
    is_kids_friendly BOOLEAN DEFAULT FALSE,
    has_pets BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Helpers
CREATE TABLE IF NOT EXISTS helpers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    gender VARCHAR(10) CHECK (gender IN ('female', 'male')),
    age INT NOT NULL,
    home_locality VARCHAR(80) NOT NULL,
    service_radius_km DECIMAL(4,1) DEFAULT 5.0,
    languages TEXT, -- Comma-separated or JSON
    experience_years INT DEFAULT 0,
    hourly_payout DECIMAL(8,2) DEFAULT 205.0,
    availability_status VARCHAR(30) DEFAULT 'available_today' CHECK (availability_status IN ('available_now', 'available_today', 'scheduled', 'off_duty')),
    preferred_time_slot VARCHAR(80),
    is_active BOOLEAN DEFAULT TRUE,
    verification_status VARCHAR(30) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'documents_submitted', 'verified', 'rejected', 'suspended')),
    is_childcare_verified BOOLEAN DEFAULT FALSE,
    childcare_experience TEXT,
    childcare_age_groups TEXT,
    is_elder_assistance_eligible BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 5.0,
    completed_jobs INT DEFAULT 0,
    cancellation_rate DECIMAL(5,2) DEFAULT 0.0,
    on_time_rate DECIMAL(5,2) DEFAULT 100.0,
    emergency_contact VARCHAR(120),
    background_check_status VARCHAR(30) DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'in_progress', 'verified')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Verification Checklist & Audits
CREATE TABLE IF NOT EXISTS verification_checklists (
    id VARCHAR(64) PRIMARY KEY,
    helper_id VARCHAR(64) REFERENCES helpers(id) ON DELETE CASCADE,
    id_verified BOOLEAN DEFAULT FALSE,
    address_reference_verified BOOLEAN DEFAULT FALSE,
    experience_verified BOOLEAN DEFAULT FALSE,
    skills_assessed BOOLEAN DEFAULT FALSE,
    childcare_screened BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(64) REFERENCES users(id),
    verified_at TIMESTAMP,
    notes TEXT
);

-- 6. Services & Master Tasks
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    tamil_name VARCHAR(120),
    icon_name VARCHAR(40),
    color_token VARCHAR(40),
    requires_special_verification BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    service_id VARCHAR(40) REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    tamil_name VARCHAR(150),
    estimated_minutes INT NOT NULL,
    description TEXT,
    is_childcare_only BOOLEAN DEFAULT FALSE,
    is_coming_soon BOOLEAN DEFAULT FALSE
);

-- 7. Helper Skills Mapping
CREATE TABLE IF NOT EXISTS helper_skills (
    helper_id VARCHAR(64) REFERENCES helpers(id) ON DELETE CASCADE,
    task_id VARCHAR(64) REFERENCES tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (helper_id, task_id)
);

-- 8. Customer Favourite Helpers
CREATE TABLE IF NOT EXISTS favourites (
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE CASCADE,
    helper_id VARCHAR(64) REFERENCES helpers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, helper_id)
);

-- 9. Pricing Configuration
CREATE TABLE IF NOT EXISTS pricing_configs (
    id VARCHAR(64) PRIMARY KEY,
    base_hourly_rate DECIMAL(8,2) DEFAULT 249.0,
    minimum_duration_hours INT DEFAULT 1,
    urgent_premium_percent DECIMAL(5,2) DEFAULT 20.0,
    weekend_premium_percent DECIMAL(5,2) DEFAULT 10.0,
    helper_payout_percent DECIMAL(5,2) DEFAULT 82.0,
    zuno_platform_fee_percent DECIMAL(5,2) DEFAULT 18.0,
    multi_task_discount_percent DECIMAL(5,2) DEFAULT 10.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Bookings (Multi-Task Visit)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    booking_code VARCHAR(30) UNIQUE NOT NULL,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE RESTRICT,
    helper_id VARCHAR(64) REFERENCES helpers(id) ON DELETE SET NULL,
    status VARCHAR(40) NOT NULL CHECK (status IN (
        'requested',
        'confirmed',
        'helper_assigned',
        'on_the_way',
        'started',
        'completed',
        'cancelled',
        'replacement_required'
    )),
    scheduled_date DATE NOT NULL,
    scheduled_slot VARCHAR(50) NOT NULL,
    duration_hours INT NOT NULL CHECK (duration_hours BETWEEN 1 AND 4),
    estimated_workload_minutes INT NOT NULL,
    booking_mode VARCHAR(30) CHECK (booking_mode IN ('choose_helper', 'let_zuno_choose', 'need_help_now')),
    is_urgent BOOLEAN DEFAULT FALSE,
    locality VARCHAR(80) NOT NULL,
    apartment_name VARCHAR(150) NOT NULL,
    block VARCHAR(40),
    flat VARCHAR(40),
    customer_notes TEXT,
    start_otp VARCHAR(6) NOT NULL,
    
    -- Financial breakdown
    base_hourly_rate DECIMAL(8,2) NOT NULL,
    base_amount DECIMAL(8,2) NOT NULL,
    multi_task_discount DECIMAL(8,2) DEFAULT 0.0,
    urgent_fee DECIMAL(8,2) DEFAULT 0.0,
    weekend_fee DECIMAL(8,2) DEFAULT 0.0,
    subtotal DECIMAL(8,2) NOT NULL,
    zuno_fee DECIMAL(8,2) NOT NULL,
    helper_payout DECIMAL(8,2) NOT NULL,
    total_amount DECIMAL(8,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Booking Tasks (Normalized relation - Not stored as plain blob)
CREATE TABLE IF NOT EXISTS booking_tasks (
    booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE CASCADE,
    task_id VARCHAR(64) REFERENCES tasks(id) ON DELETE RESTRICT,
    PRIMARY KEY (booking_id, task_id)
);

-- 12. Booking Status History / Audit Trail
CREATE TABLE IF NOT EXISTS booking_status_history (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE CASCADE,
    previous_status VARCHAR(40),
    new_status VARCHAR(40) NOT NULL,
    actor_type VARCHAR(20) CHECK (actor_type IN ('customer', 'helper', 'admin', 'system')),
    actor_id VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Helper Replacement Events
CREATE TABLE IF NOT EXISTS replacement_events (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE CASCADE,
    original_helper_id VARCHAR(64) REFERENCES helpers(id),
    replacement_helper_id VARCHAR(64) REFERENCES helpers(id),
    match_score INT,
    reason TEXT,
    status VARCHAR(30) CHECK (status IN ('searching', 'found', 'accepted', 'declined', 'unfulfilled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Ratings & Reviews
CREATE TABLE IF NOT EXISTS ratings (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) REFERENCES customers(id),
    helper_id VARCHAR(64) REFERENCES helpers(id),
    overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
    punctuality INT CHECK (punctuality BETWEEN 1 AND 5),
    quality INT CHECK (quality BETWEEN 1 AND 5),
    behaviour INT CHECK (behaviour BETWEEN 1 AND 5),
    task_completion INT CHECK (task_completion BETWEEN 1 AND 5),
    customer_feedback TEXT,
    helper_rating_for_customer INT CHECK (helper_rating_for_customer BETWEEN 1 AND 5),
    helper_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE SET NULL,
    customer_id VARCHAR(64) REFERENCES customers(id),
    category VARCHAR(40) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    description TEXT NOT NULL,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_helpers_locality ON helpers(home_locality);
CREATE INDEX IF NOT EXISTS idx_helpers_status ON helpers(availability_status, is_active, verification_status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_helper ON bookings(helper_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(scheduled_date);
