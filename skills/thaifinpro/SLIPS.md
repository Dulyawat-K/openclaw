# ThaiFin Pro — Slip Detection & Gallery Scanning

---

## Background Slip Detection

Mobile app runs background task (15-min intervals) detecting new bank slips, uploading to PostgreSQL BYTEA storage, then notifying via Clawdbot webhook.

### Flow

```
Mobile App (background, 15-min)
  → Detect new photos in bank albums
  → POST /uploads/slips/session → get session_id
  → POST /uploads/slips (multipart) → upload to PostgreSQL
  → POST /ai/pending-slips (session_id) → trigger LINE notification
  → Bot asks user for permission
```

### User Confirmation

| User Says | Action |
|-----------|--------|
| "ได้" / "เอา" / "ok" / "yes" / "ตกลง" / "บันทึก" | Process slips, create transactions |
| "ไม่" / "no" / "ยังก่อน" / "ไว้ก่อน" / "cancel" | Clear pending, acknowledge |
| "ดูก่อน" / "show me" / "preview" | Send previews, ask again |
| "เอาแค่ X อัน" / "only X" | Ask which specific slips |

### Processing Flow

1. User confirms → `GET /ai/pending-slips/{line_user_id}` (returns base64 images + `image_hash`)
2. For each slip, send base64 to Claude Vision
3. Extract: amount, date, merchant, bank
4. Infer category from merchant (Grab→transport, 7-Eleven→food)
5. `POST /ai/transactions` with `transaction_date` (ISO 8601 +07:00), `merchant`, `image_hash`
6. **If response has `"duplicate": true`** → skip, inform user
7. Send summary → `DELETE /ai/pending-slips/{line_user_id}`

### Duplicate Detection

- SHA-256 hash computed on upload
- Backend checks `image_hash` against existing transactions (30-day window)
- Prevents duplicates from LINE chat + background scanner

### Notification Templates

**Initial (Thai):**
```
📸 พบสลิปใหม่ {count} รายการค่ะ!
{slip_list if available}
บันทึกให้เลยไหมคะ? ✨
(ตอบ "ได้" หรือ "ไม่")
```

**After processing:**
```
✅ บันทึกแล้ว {count} รายการค่า~

{foreach slip}
• {emoji} {description} {amount}฿
{/foreach}

รวม {total}฿ สู้ๆ นะคะ! 💪
```

**User declines:** "โอเคค่ะ ไว้บอกได้เมื่อไหร่ก็ได้นะ 😊"

**Too many (10+):**
```
📸 พบสลิปเยอะมาก ({count} รายการ)!
เปิดแอปดูก่อนไหมคะ? 📱
👆 กดลิงก์นี้: finance://scan-slips
```

### API Endpoints

**Get pending slips (with base64):**
`GET /api/v1/ai/pending-slips/{line_user_id}`

**Check status (lightweight):**
`GET /api/v1/ai/pending-slips/{line_user_id}/status`

**Cancel/delete:**
`DELETE /api/v1/ai/pending-slips/{line_user_id}`

### Storage

- PostgreSQL BYTEA (not S3) — zero cost
- Auto-deleted after 24 hours (APScheduler)
- PDPA compliant

---

## Gallery Slip Scanning (Mobile App)

User requests batch scanning from phone gallery.

### Triggers

- "อ่านสลิป" / "scan slips" / "สแกนสลิป"
- "สแกนสลิปเดือนนี้"

### Supported Bank Albums

| Bank | Album Patterns |
|------|---------------|
| KBank | K-PLUS, K PLUS, KPLUS |
| KBank Credit | Make by KBank |
| SCB | SCB, SCB EASY |
| KTB | Krungthai, KTB, Krungthai NEXT |
| BBL | Bangkok Bank, BBL |
| TTB | ttb, ttb touch |
| Krungsri | Krungsri, KMA |
| GSB | GSB, MyMo |
| Fallback | Screenshots |

### Date Range (Payday Cycle)

- Default: 20th of month to 1st of next
- Day >= 20: scans from 20th of this month to now
- Day < 20: scans from 20th of last month to 1st of this month

### Deep Link

`finance://scan-slips`

### Response

Provide deep link and list supported albums. Users can also send slip photos directly to LINE for 1-2 slips.

---

## Auto-Save Trusted Merchants

When reading a slip, if ALL conditions met:
1. Merchant listed in MEMORY.md "Common Merchants"
2. Amount within ±20% of typical
3. Category unambiguous

**Then:** Save automatically WITHOUT asking:
> "☕ บันทึกกาแฟ True 55฿ ให้แล้วค่า~ (ถ้าผิดพิมพ์ 'ยกเลิก' ได้นะคะ)"

Otherwise → ask confirmation as usual.

## Copyright Compliance for Receipt Processing

Extract key data, paraphrase confirmation. Don't reproduce full receipt layouts verbatim.

**Good:** "เซเว่น 127฿ วันนี้ค่ะ~"
**Bad:** Full address + timestamp + receipt number

Omit: addresses, receipt numbers, tax IDs, full item lists (summarize instead).
