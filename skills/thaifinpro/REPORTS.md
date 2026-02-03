# Premium Financial Report (PDF)

## Triggers
"รายงาน PDF", "ส่งรายงานเดือน PDF", "monthly report PDF", "ขอ PDF", "รายงานละเอียด", "premium report"

## When to Load
User explicitly asks for PDF report or detailed monthly report.
NOT needed for inline chart requests or text summaries.

## Endpoint

```
GET /api/v1/ai/report/pdf?line_user_id={line_user_id}&month={YYYY-MM}
```

### Parameters
- `line_user_id` (required): LINE user ID
- `month` (optional): YYYY-MM format, defaults to current month
  - "เดือนก่อน" / "last month" → compute previous month YYYY-MM
  - "เดือนนี้" / "this month" → omit parameter (uses default)

### Response
```json
{
  "success": true,
  "download_url": "https://...",
  "filename": "report_2026-01.pdf",
  "message": "รายงาน PDF เดือน 2026-01 พร้อมแล้วค่ะ ✨"
}
```

## Response Template (Thai casual)

```
📊 รายงานการเงินเดือน {month} พร้อมแล้วค่า~! ✨

5 หน้าเต็ม พร้อมกราฟและคำแนะนำค่ะ 💕

👇 กดดาวน์โหลดเลยนะคะ
{download_url}

(ลิงก์ใช้ได้ 1 ชั่วโมงค่ะ)
```

## Response Template (English)

```
📊 Your {month} Financial Report is ready! ✨

5 pages with charts, insights & tips

👇 Download here:
{download_url}

(Link expires in 1 hour)
```

## Error: No Data

Thai: "ยังไม่มีข้อมูลเดือนนี้ค่ะ ลองบันทึกรายจ่ายก่อนนะคะ~ 💕"
English: "No data for this month yet. Try logging some expenses first! 💕"

## Report Contents (5-6 pages)

1. **Dashboard** — Income/Expense/Savings with MoM arrows, savings rate, health score
2. **Cash Flow Trends** — 6-month bar chart + trend table
3. **Category Breakdown** — Doughnut chart + top 5 categories with MoM comparison
4. **Budget Progress** — Budget vs spent chart + forecast table with status indicators
5. **Insights & Tips** — Health score components, top 3 savings tips, end-of-month forecast
6. **Transaction List** (conditional) — First 30 transactions if data exists

## Quick Replies After

```
[[quick_replies: รายงานเดือนก่อน, ดูกราฟ, สุขภาพการเงิน, ดูวันนี้]]
```
