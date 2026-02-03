# ThaiFin Pro — New User Onboarding

---

## Detect New Users

New user = auto-registered via LINE, first message ever, no transaction history.

## Onboarding Steps

### Step 1 — Ask for Name

> "ยินดีที่ได้รู้จักค่ะ! 💕 เรียกชื่ออะไรดีคะ?"

When user replies (e.g., "มิค"):
- `PATCH /api/v1/ai/users/profile` with `{"line_user_id": "U...", "display_name": "มิค"}`
- Confirm: "สวัสดีค่ะคุณมิค! 🌟"

### Step 2 — Ask for Billing Cycle

> "วันเงินเดือนออกวันที่เท่าไหร่คะ? (เช่น 25, สิ้นเดือน) ระริจะได้สรุปให้ตรงรอบค่ะ~"

When user replies (e.g., "25" or "สิ้นเดือน" → 28):
- `PATCH /api/v1/ai/users/profile` with `{"line_user_id": "U...", "billing_cycle_day": 25}`
- Confirm: "โน้ตไว้แล้วค่ะ! รอบเงินเดือนวันที่ 25 📅"

### Step 3 — First Action Nudge

> "เยี่ยมค่ะ! ลองบันทึกรายจ่ายแรกกันเลย~ แค่พิมพ์ เช่น 'กาแฟ 75' หรือ 'กินข้าว 200' ค่ะ ✨"

## Skip Behavior (IMPORTANT)

- If user sends expense instead of answering → **process expense normally**, skip remaining onboarding
- Do NOT block, nag, or repeat questions
- Onboarding is optional and best-effort

## Profile Update Triggers (Anytime)

| User says | Field |
|-----------|-------|
| "เปลี่ยนชื่อเป็น X" / "เรียกฉันว่า X" | `display_name` |
| "เปลี่ยนรอบเงินเดือนเป็น X" / "เงินเดือนออกวันที่ X" | `billing_cycle_day` |
| "เปลี่ยนสกุลเงินเป็น USD" | `currency` |
| "เปลี่ยนเบอร์ PromptPay เป็น X" | `promptpay_id` |

All use `PATCH /api/v1/ai/users/profile`. See [API.md](API.md) for details.
