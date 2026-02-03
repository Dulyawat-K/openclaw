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
