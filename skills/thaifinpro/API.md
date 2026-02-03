# ThaiFin Pro — API Endpoints Reference

All endpoints use:
- Base URL: `${THAIFINPRO_API_URL}`
- Auth header: `Authorization: Bearer ${THAIFINPRO_API_KEY}`
- Content-Type: `application/json` (for POST/PATCH)
- LINE user identification: `line_user_id` parameter

---

## Table of Contents

1. [Create Transaction](#create-transaction)
2. [Update Transaction](#update-transaction)
3. [Get Budget Status](#get-budget-status)
4. [Get Summary](#get-summary)
5. [List Transactions](#list-transactions)
6. [Financial Q&A](#financial-qa)
7. [Delete Last Transaction](#delete-last-transaction)
8. [Delete Transaction by ID](#delete-transaction-by-id)
9. [List Groups](#list-groups)
10. [Create Split](#create-split)
11. [Create Itemized Split](#create-itemized-split)
12. [Get Debts](#get-debts)
13. [Get Simplified Debts](#get-simplified-debts)
14. [Settle Debt](#settle-debt)
15. [Create Recurring Bill](#create-recurring-bill)
16. [Update Recurring Bill](#update-recurring-bill)
17. [Delete Recurring Bill](#delete-recurring-bill)
18. [Get Upcoming Bills](#get-upcoming-bills)
19. [Create Financial Event](#create-financial-event)
20. [List Financial Events](#list-financial-events)
21. [Update Financial Event](#update-financial-event)
22. [Get PromptPay QR (GET)](#get-promptpay-qr-get)
23. [Generate PromptPay QR (POST)](#generate-promptpay-qr-post)
24. [Update PromptPay Settings](#update-promptpay-settings)
25. [Get Chart](#get-chart)
26. [Get Monthly Report](#get-monthly-report)
27. [Get Chart Data](#get-chart-data)
28. [Render Custom Chart](#render-custom-chart)
29. [Get Notification Preferences](#get-notification-preferences)
30. [Update Notification Preferences](#update-notification-preferences)
31. [Create Personal Budget](#create-personal-budget)
32. [Update Personal Budget](#update-personal-budget)
33. [Delete Personal Budget](#delete-personal-budget)
34. [Savings Rate](#savings-rate)
35. [Category Breakdown](#category-breakdown)
36. [Spending Velocity](#spending-velocity)
37. [Create Finance Group](#create-finance-group)
38. [Update Finance Group](#update-finance-group)
39. [Add Group Member](#add-group-member)
40. [Remove Group Member](#remove-group-member)
41. [Validate Receipt](#validate-receipt)
42. [Get User Profile](#get-user-profile)
43. [Update User Profile](#update-user-profile)
44. [Export via LINE](#export-via-line)
45. [List All Users](#list-all-users)
46. [List Inactive Users](#list-inactive-users)

**Cognitive Memory API (AERITH Architecture)**
47. [Create Emotional Memory](#47-create-emotional-memory)
48. [Get Emotional Memories](#48-get-emotional-memories)
49. [Delete Emotional Memory](#49-delete-emotional-memory)
50. [Create Narrative Memory](#50-create-narrative-memory)
51. [Get Narrative Memories](#51-get-narrative-memories)
52. [Update Narrative Memory](#52-update-narrative-memory)
53. [Delete Narrative Memory](#53-delete-narrative-memory)
54. [Create Intent Memory](#54-create-intent-memory)
55. [Get Intent Memories](#55-get-intent-memories)
56. [Get Self-Concept](#56-get-self-concept)
57. [Update Self-Concept](#57-update-self-concept)
58. [Get Gap Analysis](#58-get-gap-analysis)
59. [Get Care Graph](#59-get-care-graph)
60. [Create Care Graph Entry](#60-create-care-graph-entry)
61. [Update Care Graph Entry](#61-update-care-graph-entry)
62. [Delete Care Graph Entry](#62-delete-care-graph-entry)
63. [Get Cognitive State](#63-get-cognitive-state)
64. [Update Cognitive State](#64-update-cognitive-state)
65. [Search Memories](#65-search-memories)

---

## Create Transaction

`POST /api/v1/ai/transactions`

```json
{
  "line_user_id": "U...",
  "amount": 200,
  "category": "food",
  "description": "กาแฟ",
  "type": "expense",
  "merchant": "Starbucks",
  "transaction_date": "2026-01-28T14:30:00+07:00",
  "tags": ["essential", "morning"],
  "notes": "Meeting with client",
  "image_hash": "a1b2c3..."
}
```

Required: `line_user_id`, `amount`, `category`, `type`
Optional: `description`, `merchant`, `transaction_date`, `date`, `tags` (max 10), `notes` (max 1000), `image_hash`

**Date precedence:** `transaction_date` > `date` > server time (Bangkok)
- Use `transaction_date` for slip dates, receipt dates, past dates
- Format: ISO 8601 with +07:00 timezone

**If `image_hash` provided and duplicate exists:** returns `{"duplicate": true, "existing_transaction_id": "..."}`

Response includes `remaining_budget` and `budget_percentage_used`.

## Update Transaction

`PATCH /api/v1/ai/transactions/{id}?line_user_id={line_user_id}`

Partial update — only provided fields change. Updatable: `date`, `merchant`, `tags`, `notes`, `description`, `amount`, `category`, `type`.

## Get Budget Status

`GET /api/v1/ai/budget-status?line_user_id={line_user_id}`

Response includes `budget_id` per category — use it for `PATCH /ai/budgets/{budget_id}` or `DELETE /ai/budgets/{budget_id}`.

## Get Summary

`GET /api/v1/ai/summary?line_user_id={line_user_id}&period={today|week|month}`

## List Transactions

`GET /api/v1/ai/transactions?line_user_id={line_user_id}&period={today|week|month}&limit=10`

Returns: `id`, `amount`, `category`, `category_emoji`, `description`, `time_display`, `type`, `is_split`, `split_with`.

Show 👥 next to split transactions with names.

## Financial Q&A

`POST /api/v1/ai/query`

```json
{
  "line_user_id": "U...",
  "question": "เดือนนี้ใช้เงินกินข้าวไปเท่าไหร่"
}
```

Returns structured data based on detected query type: `category_total`, `period_total`, `transaction_list`, `merchant_analysis`, `comparison`, `budget_status`.

Response includes `summary`, `comparison`, `top_merchants` as applicable.

## Delete Last Transaction

`DELETE /api/v1/ai/transactions/last?line_user_id={line_user_id}`

Returns deleted transaction details with `category_emoji` and `time_display`.

## Delete Transaction by ID

`DELETE /api/v1/ai/transactions/{id}?line_user_id={line_user_id}`

Same response format as Delete Last.

## List Groups

`GET /api/v1/ai/groups?line_user_id={line_user_id}`

Returns `groups[]` with `id`, `name`, `member_count`, `member_names`.

**CRITICAL:** `split_with` must use EXACT member names from this endpoint. Do NOT transliterate names. Always call this first before creating splits.

## Create Split

`POST /api/v1/ai/splits`

```json
{
  "line_user_id": "U...",
  "description": "ค่าอาหาร",
  "total_amount": 500,
  "category": "food",
  "split_with": ["Mik"],
  "split_type": "equal"
}
```

`split_type`: "equal" (default) or "exact"

Error responses: no groups → suggest creating in app; multiple groups → list names; member not found → suggest checking name.

## Create Itemized Split

`POST /api/v1/ai/splits/itemized`

```json
{
  "line_user_id": "U...",
  "description": "ร้าน MK เซ็นทรัล",
  "items": [
    {"index": 1, "description": "ต้มยำกุ้ง", "amount": 180, "quantity": 1},
    {"index": 2, "description": "หมูกระทะ", "amount": 299, "quantity": 1}
  ],
  "assignments": [
    {"item_indices": [1], "member_name": "ฉัน"},
    {"item_indices": [2], "member_name": "Som"},
    {"item_indices": [3, 4], "member_name": null}
  ],
  "service_charge": 50,
  "vat": 35,
  "category": "food"
}
```

Assignment: `null` = split among all, `"ฉัน"/"me"` = current user, `"Som"` = named member.

## Get Debts

`GET /api/v1/ai/debts?line_user_id={line_user_id}`

Returns `total_owed_to_you`, `total_you_owe`, `net_balance`, `debts[]` with `member_name`, `amount`, `direction` (owes_you/you_owe), `group_name`, `group_id`.

## Get Simplified Debts

`GET /api/v1/ai/debts/simplified?line_user_id={line_user_id}`

Returns optimized payment plan: `simplified_payments[]`, `payment_count`, `original_debt_count`, `savings_count`.

## Settle Debt

`POST /api/v1/ai/debts/settle`

```json
{
  "line_user_id": "U...",
  "member_name": "Mik",
  "group_id": "uuid..."
}
```

`group_id` optional — needed when user has multiple groups with same member name.

## Create Recurring Bill

`POST /api/v1/ai/recurring-bills`

```json
{
  "line_user_id": "U...",
  "name": "Claude Max Plan",
  "amount": 107.00,
  "currency": "USD",
  "category_id": "subscriptions",
  "frequency": "monthly",
  "day_of_month": 22
}
```

Required: `name`, `amount`, `frequency` (monthly/weekly/yearly)
Optional: `currency` (default THB), `category_id` (default bills), `day_of_month` (1-31), `day_of_week` (0-6)

## Update Recurring Bill

`PATCH /api/v1/ai/recurring-bills/{id}?line_user_id={line_user_id}`

Fields: `name`, `amount`, `currency`, `category_id`, `frequency`, `day_of_month`, `day_of_week`.

## Delete Recurring Bill

`DELETE /api/v1/ai/recurring-bills/{id}?line_user_id={line_user_id}`

## Get Upcoming Bills

`GET /api/v1/ai/bills?line_user_id={line_user_id}&days_ahead=30`

Returns personal + group bills with `scope` (personal/group), `currency`, `source`, `is_overdue`, `days_until_due`.

## Create Financial Event

`POST /api/v1/ai/financial-events`

```json
{
  "line_user_id": "U...",
  "event_type": "loan",
  "name": "สินเชื่อรถ",
  "amount": 467.47,
  "currency": "THB",
  "category_id": "debt",
  "metadata": {
    "schedule": {"frequency": "monthly", "day_of_month": 28, "until_date": "2026-10-28"},
    "payoff_tracking": {"original_amount": 40000, "remaining": 35000, "payoff_date": "2026-10-28"},
    "reminders": [{"time": "13:30", "message": "ถามว่าเงินเดือนเข้าไหม"}]
  }
}
```

Event types: `loan`, `investment`, `savings_goal`, `freelance_project`, `bill`

Metadata fields (flexible, Claude can add any structure):
- `schedule`: frequency, day_of_month, until_date
- `payoff_tracking`: original_amount, remaining, payoff_date
- `automation`: trigger_time, actions[]
- `reminders[]`: time + message (fires independently, dedup key: `{event_id}_{time}`)
- `portfolio`, `performance`, `milestones`

**When to use instead of RecurringBill:** loans, payoff tracking, automation, investments, savings goals.

## List Financial Events

`GET /api/v1/ai/financial-events?line_user_id={line_user_id}&event_type=loan`

Optional filter: `event_type`

## Update Financial Event

`PATCH /api/v1/ai/financial-events/{id}?line_user_id={line_user_id}`

Updatable: `name`, `amount`, `next_due_date`, `is_active`, `metadata`
- `metadata_merge`: set to false to replace entirely (default: merge)

## Get PromptPay QR (GET)

`GET /api/v1/ai/qr/promptpay/{line_user_id}?amount=150`

`amount` optional: with = dynamic QR (one-time), without = static QR (reusable).

Returns `qr_image_url`, `qr_image_base64`, `promptpay_id` (masked), `amount`.

**CRITICAL — MANDATORY IMAGE FORMAT:**
Send QR as LINE Image Message, NEVER as plain text URL:
```json
{
  "type": "image",
  "originalContentUrl": "<qr_image_url>",
  "previewImageUrl": "<qr_image_url>"
}
```
- Use `qr_image_url` (NOT base64) — LINE cannot use base64 directly
- URL is signed, expires after 1 hour
- QR image is branded with PromptPay header and amount display

## Generate PromptPay QR (POST)

`POST /api/v1/ai/qr/promptpay`

```json
{"line_user_id": "U...", "amount": 150.00}
```

Same response as GET version.

## Update PromptPay Settings

`PATCH /api/v1/ai/promptpay/settings?line_user_id={line_user_id}`

```json
{"promptpay_id": "0891234567"}
```

Accepts phone (9-10 digits) or National ID (13 digits).

## Get Chart

`GET /api/v1/ai/chart?line_user_id={line_user_id}&chart_type={type}&period={period}`

Types: `expense_pie`, `monthly_bar`, `budget_progress`
Periods: `week`, `month` (default), `year`

Returns `chart_url` — direct image URL for LINE.

## Get Monthly Report

`GET /api/v1/ai/monthly-report?line_user_id={line_user_id}&month=2026-01`

Returns `summary` (income/expense/savings/top_categories), `charts` (pie + budget URLs), `insights[]`.

## Get Chart Data

`GET /api/v1/ai/chart-data?line_user_id={line_user_id}&data_type={type}&period={period}`

Data types: `category_breakdown`, `monthly_trend`, `daily_trend`, `weekday_breakdown`, `budget_vs_spent`, `income_vs_expense`
Periods: `week`, `month`, `3months`, `6months`, `year`

Returns `labels`, `datasets[]`, `metadata` for constructing Chart.js configs.

## Render Custom Chart

`POST /api/v1/ai/chart/render`

```json
{
  "line_user_id": "U...",
  "chart_config": {
    "type": "bar",
    "data": {"labels": [...], "datasets": [...]},
    "options": {...}
  },
  "width": 600,
  "height": 400
}
```

Types: `bar`, `line`, `pie`, `doughnut`, `radar`, `polarArea`

## Get Notification Preferences

`GET /api/v1/ai/notifications/preferences?line_user_id={line_user_id}`

Returns: `budget_alerts`, `budget_warning_threshold`, `bill_reminders`, `bill_reminder_days`, `weekly_summary`, `quiet_start`, `quiet_end`, `default_notification_hour`, `default_notification_minute`, `timezone`.

## Update Notification Preferences

`PATCH /api/v1/ai/notifications/preferences?line_user_id={line_user_id}`

All fields optional: `budget_alerts`, `budget_warning_threshold`, `bill_reminders`, `bill_reminder_days`, `weekly_summary`, `quiet_start`, `quiet_end`, `default_notification_hour` (0-23), `default_notification_minute` (0-59), `timezone`.

## Create Personal Budget

`POST /api/v1/ai/budgets`

```json
{"line_user_id": "U...", "category": "food", "limit_amount": 3000, "period": "monthly"}
```

Category accepts aliases (e.g., "กาแฟ" → "food").

## Update Personal Budget

`PATCH /api/v1/ai/budgets/{id}?line_user_id={line_user_id}`

```json
{"limit_amount": 5000}
```

Get `budget_id` from budget-status endpoint first.

## Delete Personal Budget

`DELETE /api/v1/ai/budgets/{id}?line_user_id={line_user_id}`

## Savings Rate

`GET /api/v1/ai/analytics/savings-rate?line_user_id={line_user_id}`

Returns `current_month`, `previous_month`, `average_6_months` each with `rate` and `amount`.

## Category Breakdown

`GET /api/v1/ai/analytics/category-breakdown?line_user_id={line_user_id}&period={week|month|year}`

Returns `categories[]` with `category`, `total`, `percentage`, `count`.

## Spending Velocity

`GET /api/v1/ai/analytics/spending-velocity?line_user_id={line_user_id}&days=30`

Returns `daily_average`, `projected_monthly`, `days_analyzed`, `total_spent`.

## Create Finance Group

`POST /api/v1/ai/groups/create`

```json
{"line_user_id": "U...", "name": "ทริปเชียงใหม่"}
```

Returns `group_id`, `name`, `invite_code`.

## Update Finance Group

`PATCH /api/v1/ai/groups/{id}?line_user_id={line_user_id}`

```json
{"name": "ทริปภูเก็ต"}
```

## Add Group Member

`POST /api/v1/ai/groups/{id}/members`

```json
{"line_user_id": "U...", "display_name": "Som"}
```

## Remove Group Member

`DELETE /api/v1/ai/groups/{id}/members/{member_id}?line_user_id={line_user_id}`

Requires owner/admin permission. Get `member_id` from group members list.

## Validate Receipt

`POST ${THAIFINPRO_VALIDATE_URL}/api/v1/validate/receipt`

```json
{"raw_amount": "127.00", "raw_merchant": "7-ELEVEN สาขาสยาม", "raw_date": "26/01/68"}
```

## Get User Profile

`GET /api/v1/ai/users/me?line_user_id={line_user_id}`

Returns `display_name`, `billing_cycle_day`, `currency`, `language`, `timezone`, `promptpay_id`, `bank_name`, `bank_account`, `line_display_name`, `personality_prefs`.

**Use this at session start** to load user preferences (API key auth).

## Update User Profile

`PATCH /api/v1/ai/users/profile`

```json
{
  "line_user_id": "U...",
  "display_name": "มิค",
  "billing_cycle_day": 25,
  "promptpay_id": "0812345678",
  "currency": "THB",
  "language": "th",
  "timezone": "Asia/Bangkok",
  "bank_name": "KBANK",
  "bank_account": "..."
}
```

All fields optional except `line_user_id`. Only non-null fields updated. If `promptpay_id` changes, QR regenerated automatically.

## Export via LINE

`GET /api/v1/ai/export?line_user_id={line_user_id}&format=csv|xlsx|pdf&period=week|month|year|all`

Returns `download_url` (signed, 1hr expiry), `filename`, `format`, `record_count`, `message`.

Formats: `csv` (spreadsheet-compatible), `xlsx` (Excel with auto-width columns), `pdf` (Thai-rendered PDF with summary totals).

User says "ส่งรายงานเดือนนี้" → call with `period=month&format=xlsx` → send download_url as link in LINE.
User says "export PDF" → call with `format=pdf`.

## Audio/TTS

### Generate TTS

`POST /api/v1/ai/audio/tts`

```json
{
  "line_user_id": "U...",
  "text": "สวัสดีค่ะ วันนี้ใช้ไป 450 บาท",
  "voice": "shimmer",
  "instructions": "Speak warmly in Thai, cheerful and sisterly tone"
}
```

**CRITICAL — match language to user setting:**
- Thai user (`language: th`): `"text"` in Thai, `"instructions": "Speak warmly in Thai, cheerful and sisterly tone"`
- English user (`language: en`): `"text"` in English, `"instructions": "Speak warmly in English, cheerful and sisterly tone"`
- Always write BOTH `text` AND `instructions` in the user's language. Never mix.

Returns `audio_url` (signed, 1hr expiry), `duration_hint` ("short"/"medium"/"long"), `duration_ms` (estimated milliseconds). The `audio_url` includes `dur=` parameter so LINE displays correct playback duration.

**How to send audio**: Set `audio_url` as the `media` field in your message response. The LINE plugin auto-detects audio URLs (any URL containing `/audio/download`) and sends them as LINE AudioMessage with a playable audio player. Do NOT use image-specific methods — just set it as `media`.

### Upload Audio

`POST /api/v1/ai/audio/upload?line_user_id={line_user_id}`

Body: raw MP3 bytes, Content-Type: audio/mpeg. Max 10MB.

Returns `audio_url` (signed).

## Currency Conversion

`GET /api/v1/ai/currency/rate?from_currency=USD&to_currency=THB&amount=107`

Returns `rate`, `converted_amount` (if amount provided).

**Bills integration**: `GET /ai/bills` now returns `amount_thb` and `amount_display` for non-THB bills (e.g., `"$107.00 USD (~3,383฿)"`).

## Premium PDF Report

`GET /api/v1/ai/report/pdf?line_user_id={line_user_id}&month=2026-01`

Generates a 5-6 page premium PDF financial report with embedded charts, health score, MoM comparisons, budget forecast, and spending tips. Returns a signed download URL valid for 1 hour.

**Parameters:**
- `line_user_id` (required): LINE user ID
- `month` (optional): YYYY-MM format, defaults to current month

**Response:** `success`, `download_url`, `filename`, `message`

**Download:** `GET /api/v1/ai/report/download?token=...&fmt=pdf&ts=...&sig=...` — No auth required, signature-verified.

---

## List All Users

`GET /api/v1/ai/users/list`

Returns all active (non-deleted) users. No `line_user_id` needed — admin-level endpoint.

Response: `users[]` with `line_user_id`, `display_name`, `line_display_name`, `auth_provider`, `language`, `created_at`, `updated_at`, `is_onboarded`. Plus `total` count.

## List Inactive Users

`GET /api/v1/ai/users/inactive?days=3`

Returns users whose `updated_at` is older than `days` threshold (default: 3).

Response: same fields as user list + `days_inactive` calculated field. Plus `total` count and `threshold_days`.

---

# Cognitive Memory API (AERITH Architecture)

Endpoints 47-65 for emotional, narrative, and intent memories, self-concept, care graph, and cognitive state.

**Architecture Layers:**
- **MEMORY**: emotional, narrative, intent memories + care graph
- **MIND**: conscious mode (emotional vs analytical)
- **SELF**: real self, ideal self, gap analysis

**Critical Invariant:** The LLM never edits REAL_SELF directly. All REAL_SELF updates go through backend calculations with write gates.

---

## 47. Create Emotional Memory

`POST /api/v1/ai/cognitive/emotional-memory`

```json
{
  "line_user_id": "U1234567890abcdef",
  "trigger": "เครียดเรื่องเงิน",
  "emotion": "stress",
  "intensity": 0.7,
  "confidence": 0.8
}
```

Required: `line_user_id`, `trigger`, `emotion`
Optional: `intensity` (0-1, default 0.5), `confidence` (0-1, default 0.5)

**Write Gates Protect Against:**
- Low confidence signals (< 0.7)
- One-off events (requires pattern, min 2 occurrences)
- Emotional volatility (24hr cooldown per trigger)

Returns either the created memory or a `WriteGateResult`:
```json
{
  "blocked": true,
  "reason": "confidence_too_low",
  "message": "Confidence 0.6 below threshold 0.7",
  "recommendation": "Wait for more signals before recording"
}
```

## 48. Get Emotional Memories

`GET /api/v1/ai/cognitive/emotional-memory?line_user_id={line_user_id}`

Optional params: `emotion` (filter by type), `since_days` (1-365), `limit` (1-100, default 50)

Returns memories with decay-adjusted intensity:
```json
[
  {
    "id": "uuid",
    "trigger": "เครียดเรื่องเงิน",
    "emotion": "stress",
    "intensity": 0.7,
    "confidence": 0.8,
    "decay_rate": 0.1,
    "effective_intensity": 0.63,
    "last_seen": "2026-02-03T10:00:00Z",
    "created_at": "2026-02-01T10:00:00Z"
  }
]
```

## 49. Delete Emotional Memory

`DELETE /api/v1/ai/cognitive/emotional-memory/{memory_id}?line_user_id={line_user_id}`

Returns: `{"success": true, "message": "Emotional memory deleted"}`

---

## 50. Create Narrative Memory

`POST /api/v1/ai/cognitive/narrative-memory`

```json
{
  "line_user_id": "U1234567890abcdef",
  "event": "ปิดหนี้บัตรเครดิตหมดแล้ว!",
  "meaning": "ฉันทำได้ ฉันเป็นคนที่ควบคุมการเงินได้",
  "emotion": "pride",
  "role": "debt_destroyer",
  "event_date": "2026-02-01"
}
```

Required: `line_user_id`, `event`
Optional: `meaning`, `emotion`, `role` (identity marker), `event_date`

**No write gates** — these are explicit user-shared events, not inferred.

**Common Roles:**
- `debt_destroyer` — paid off debt
- `saver` — hit savings milestone
- `provider` — supporting family
- `budgeter` — stayed within budget
- `survivor` — overcame financial hardship

## 51. Get Narrative Memories

`GET /api/v1/ai/cognitive/narrative-memory?line_user_id={line_user_id}`

Optional params: `role` (filter by identity role), `reusable_only` (default true), `limit` (1-100, default 50)

Reusable memories are milestones that can be referenced in future conversations for encouragement.

## 52. Update Narrative Memory

`PATCH /api/v1/ai/cognitive/narrative-memory/{memory_id}?line_user_id={line_user_id}`

```json
{
  "meaning": "Updated meaning",
  "emotion": "joy",
  "role": "budgeter",
  "reusable": true
}
```

All fields optional.

## 53. Delete Narrative Memory

`DELETE /api/v1/ai/cognitive/narrative-memory/{memory_id}?line_user_id={line_user_id}`

---

## 54. Create Intent Memory

`POST /api/v1/ai/cognitive/intent-memory`

```json
{
  "line_user_id": "U1234567890abcdef",
  "action": "ถอนเงินออม 5000",
  "intent": "ช่วยค่ารักษาพ่อแม่",
  "emotion": "worried"
}
```

Required: `line_user_id`, `action`, `intent`
Optional: `emotion`

**Critical Purpose:** Captures the "why" behind financial actions. Prevents judgment — context matters.

**Thai Cultural Context:**
- ถอนเงินช่วยพ่อแม่ = filial duty, not weakness
- ใช้เงินเยอะช่วงเทศกาล = cultural norm, not overspending

## 55. Get Intent Memories

`GET /api/v1/ai/cognitive/intent-memory?line_user_id={line_user_id}`

Optional params: `since_days` (1-365), `limit` (1-100, default 50)

---

## 56. Get Self-Concept

`GET /api/v1/ai/cognitive/self-concept?line_user_id={line_user_id}`

Returns:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "real_self": {
    "monthly_savings": 5000,
    "stress_level": 0.4,
    "financial_confidence": 0.6
  },
  "ideal_self": {
    "goal_verbatim": "อยากมีเงินเก็บ 6 เดือน",
    "goal": "emergency_fund",
    "time_horizon": 12,
    "constraints": {"income_limited": true}
  },
  "trust": {
    "trust_level": 0.7,
    "trust_signals": ["shared_struggle", "accepted_advice"]
  }
}
```

**Real Self** = observable state (backend calculates from transaction data)
**Ideal Self** = aspirational state (user's own words, 50% verbatim)
**Trust** = relationship state (how much user trusts Rari)

## 57. Update Self-Concept

`PATCH /api/v1/ai/cognitive/self-concept`

```json
{
  "line_user_id": "U1234567890abcdef",
  "goal_verbatim": "อยากมีเงินเก็บ 6 เดือน",
  "goal": "emergency_fund",
  "time_horizon": 12,
  "constraints": {"income_limited": true}
}
```

**AI can only update IDEAL_SELF fields:**
- `goal_verbatim`, `goal`, `time_horizon`, `constraints`

**REAL_SELF fields are backend-only:**
- `monthly_savings`, `stress_level`, `financial_confidence`

## 58. Get Gap Analysis

`GET /api/v1/ai/cognitive/gap-analysis?line_user_id={line_user_id}`

```json
{
  "overall_gap_score": 0.35,
  "gaps": {
    "savings": {"current": 5000, "target": 30000, "gap_ratio": 0.83},
    "stress": {"current": 0.4, "target": 0.2, "gap_ratio": 0.5},
    "confidence": {"current": 0.6, "target": 0.8, "gap_ratio": 0.25}
  },
  "suggested_actions": [
    "Focus on building emergency fund - largest gap",
    "Stress is moderate - check for specific triggers"
  ],
  "has_sufficient_data": true
}
```

Gap score: 0-1, lower is better (closer to ideal).

---

## 59. Get Care Graph

`GET /api/v1/ai/cognitive/care-graph?line_user_id={line_user_id}`

```json
[
  {
    "id": "uuid",
    "relation": "parents",
    "weight": 0.9,
    "notes": "ส่งเงินให้ทุกเดือน 5000฿",
    "created_at": "2026-01-15T10:00:00Z"
  },
  {
    "id": "uuid",
    "relation": "siblings",
    "weight": 0.6,
    "notes": "ช่วยค่าเทอมน้อง",
    "created_at": "2026-01-20T10:00:00Z"
  }
]
```

**Thai Cultural Context:** ค่าเลี้ยงพ่อแม่ is strength, not burden. The care graph informs how Rari frames financial decisions.

**Weight meaning:**
- 0.9-1.0: Primary financial responsibility
- 0.6-0.8: Regular support
- 0.3-0.5: Occasional help
- 0.1-0.2: Emergency only

## 60. Create Care Graph Entry

`POST /api/v1/ai/cognitive/care-graph`

```json
{
  "line_user_id": "U1234567890abcdef",
  "relation": "parents",
  "weight": 0.9,
  "notes": "ส่งเงินให้ทุกเดือน"
}
```

Required: `line_user_id`, `relation`
Optional: `weight` (0-1, default 0.5), `notes`

## 61. Update Care Graph Entry

`PATCH /api/v1/ai/cognitive/care-graph/{entry_id}?line_user_id={line_user_id}`

```json
{
  "weight": 0.8,
  "notes": "Updated notes"
}
```

## 62. Delete Care Graph Entry

`DELETE /api/v1/ai/cognitive/care-graph/{entry_id}?line_user_id={line_user_id}`

---

## 63. Get Cognitive State

`GET /api/v1/ai/cognitive/state?line_user_id={line_user_id}`

**Use at message start to determine response tone.**

```json
{
  "mind_mode": "emotional",
  "trust_level": 0.7,
  "dominant_emotion": "stress",
  "active_roles": ["saver", "provider"],
  "care_priorities": ["parents"],
  "updated_at": "2026-02-03T10:00:00Z"
}
```

**Mind Modes:**
- `emotional`: Validate first, solutions second ("ระริเข้าใจค่ะ 💕")
- `analytical`: Direct information, minimal emotional framing

**Response Calibration:**
| Mind Mode | Trust Level | Response Style |
|-----------|-------------|----------------|
| emotional | high | Warm, detailed advice with encouragement |
| emotional | low | Validate feelings, gentle suggestions |
| analytical | high | Direct data, proactive recommendations |
| analytical | low | Facts only, wait for questions |

## 64. Update Cognitive State

`PATCH /api/v1/ai/cognitive/state?line_user_id={line_user_id}`

```json
{
  "mind_mode": "analytical"
}
```

Switch mind mode based on user's explicit preference or detected communication style.

---

## 65. Search Memories

`POST /api/v1/ai/cognitive/memory-search`

```json
{
  "line_user_id": "U1234567890abcdef",
  "query": "parents money help",
  "memory_types": ["narrative", "intent"],
  "limit": 10
}
```

Required: `line_user_id`, `query`
Optional: `memory_types` (default all), `limit` (1-50, default 10)

**Memory Scoring:** `score = relevance × recency × intensity × confidence`
- Narrative memories get 1.5× bonus (always outrank raw emotion)
- Emotional memories decay over time

```json
{
  "results": [
    {
      "type": "narrative",
      "content": {
        "event": "ช่วยค่ารักษาพ่อ",
        "meaning": "เป็นลูกที่ดี",
        "role": "provider"
      },
      "score": 0.92,
      "score_breakdown": {
        "relevance": 0.9,
        "recency": 0.95,
        "intensity": 0.8,
        "confidence": 0.85,
        "type_bonus": 1.5
      }
    },
    {
      "type": "intent",
      "content": {
        "action": "ถอนเงินออม 5000",
        "intent": "ช่วยค่ารักษาพ่อแม่"
      },
      "score": 0.78
    }
  ],
  "total_found": 2,
  "query_tokens": ["parents", "money", "help"]
}
