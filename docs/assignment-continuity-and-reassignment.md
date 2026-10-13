# Assignment Continuity, Emergency Cancellation, and Reassignment

## Purpose

Keep accepted helper assignments stable while ensuring customers are not left without service when a helper abandons an assignment, fails to arrive, or is no longer near the service location.

## Rules

1. **Accepted assignment stays assigned**
   - Once a helper accepts a booking, do not cancel or reassign it merely because another helper becomes available.
   - Let the assigned helper complete the booking and follow the normal checkout/release flow.
   - Exception: a confirmed emergency or a verified fulfilment failure.

2. **Emergency**
   - An authorized emergency action may cancel the current assignment.
   - Record the emergency reason, actor, timestamp, and booking status change in the audit trail.
   - Notify the customer and operations, then search for eligible replacement helpers.
   - Do not silently cancel a booking or claim a replacement is confirmed until another helper accepts.

3. **Absconding / abandonment**
   - When abandonment is reported or reliably detected, flag the assignment for operations review.
   - Alert the operations/admin team and customer as appropriate.
   - Move the booking to a replacement-required state and offer it to eligible, available helpers.
   - Preserve the original assignment and event history for audit purposes.

4. **Arrival timeout (30 minutes)**
   - Start the 30-minute timer from the agreed dispatch/arrival reference time, not from an arbitrary page load.
   - If arrival is not confirmed within 30 minutes, alert operations and mark the booking for reassignment review.
   - Before automatic reassignment, check for a valid arrival/check-in event and allow an authorized operator to resolve GPS or connectivity issues.
   - Do not treat missing GPS data alone as proof of misconduct.

5. **Not nearby**
   - Compare a fresh, consented location signal with the booking location and a configurable arrival geofence/threshold.
   - If the assigned helper is outside the configured proximity threshold at the required check, alert operations and evaluate replacement.
   - Ignore stale, unavailable, or low-accuracy location readings; request a location refresh or human review instead.
   - Use location only for active fulfilment and according to the product's privacy/consent rules.

## Priority and state handling

- An accepted assignment remains stable unless an emergency or a verified fulfilment failure occurs.
- Emergency, abandonment, timeout, and proximity alerts should be idempotent so repeated checks do not spam users or create duplicate replacements.
- Reassignment must be atomic: only one replacement helper may be confirmed for a booking.
- Replacements must pass the existing ZUNO eligibility checks (verification, required childcare/elder-care clearance, skills, service radius, and availability).
- Notify the customer and operations when an alert is raised, when reassignment begins, and when a replacement is confirmed.
- Keep an audit trail containing the booking ID, assigned helper, trigger/reason, timestamps, location freshness/accuracy where applicable, notifications, and reassignment outcome.

## Suggested acceptance tests

1. An accepted booking is not reassigned just because a higher-scoring helper becomes available.
2. A recorded emergency cancels the current assignment, alerts operations, and starts replacement matching.
3. An abandonment event alerts operations and sets the booking to replacement-required.
4. No arrival after 30 minutes triggers one alert and replacement review; a valid check-in prevents the timeout action.
5. A helper outside the configured proximity threshold triggers review only when the location reading is fresh and accurate enough.
6. Duplicate timer runs or location events do not create duplicate alerts or multiple confirmed replacements.
7. Replacement matching excludes unverified or otherwise ineligible helpers.
8. All status changes and notifications are auditable.
