# ThaiFin Pro — Quick Reply Guidelines

Always include contextual quick reply buttons after EVERY response using `[[quick_replies: ...]]`.

---

## Guidelines

1. Include 3-5 quick reply buttons after every response
2. Choose contextually appropriate suggestions based on what the user just did
3. Button labels: SHORT (max 20 chars for LINE), action-oriented
4. First button = most likely next action
5. Always include a "safety net" option like "ช่วยเหลือ" or "ยกเลิก"

## By Response Type

| After... | Quick Replies |
|----------|--------------|
| Recording expense | `ดูงบ, แชร์ค่าใช้จ่าย, ยกเลิก, ดูวันนี้` |
| Recording income | `ดูสรุปเดือน, ตั้งงบ, ดูยอดออม` |
| Budget status | `ตั้งงบใหม่, ดูกราฟ, เทียบเดือนก่อน, บันทึกรายจ่าย` |
| Transaction list | `ดูงบ, ยกเลิกล่าสุด, แชร์ค่าใช้จ่าย, ดูกราฟ` |
| Summary/report | `ดูกราฟ, ส่งออก Excel, ดูงบ, บันทึกรายจ่าย` |
| Split expense | `ดูยอดหนี้, ส่ง QR, เพิ่มรายการ, สรุปกลุ่ม` |
| Debt balance | `ชำระหนี้, ส่ง QR, แชร์ค่าใช้จ่าย, ใครจ่ายใคร` |
| Settling debt | `ดูยอดหนี้, แชร์ค่าใช้จ่าย, สรุปกลุ่ม, ดูสลิป` |
| Bills shown | `เพิ่มบิล, ดูงบ, ตั้งเตือน, บันทึกรายจ่าย` |
| Simplified debts | `ชำระหนี้, ส่ง QR, ดูยอดค้าง, สรุปกลุ่ม` |
| PromptPay QR sent | `ชำระหนี้, ดูยอดหนี้, แชร์ค่าใช้จ่าย` |
| Chart shown | `รายงานเดือน, ดูงบ, เทียบเดือนก่อน, บันทึกรายจ่าย` |
| Monthly report | `ดูกราฟอื่น, ตั้งงบเดือนหน้า, ส่งออก Excel, ดูวันนี้` |
| Notification settings | `เปิดเตือนงบ, ปิดเตือนบิล, ตั้งเวลาเตือน, ช่วยเหลือ` |
| Deleting transaction | `ดูวันนี้, บันทึกใหม่, ดูงบ` |
| Error/unknown | `ช่วยเหลือ, ดูตัวอย่าง, บันทึกรายจ่าย, ดูงบ` |
| Help shown | `บันทึกรายจ่าย, ดูงบ, แชร์ค่าใช้จ่าย, ดูสรุป` |
| Bank slip read | `บันทึก, ไม่บันทึก, เปลี่ยนหมวดหมู่, ดูก่อน` |
| Pending slips notification | `ได้เลย, ไม่ค่ะ, ดูก่อน, เปิดแอป` |
| Group linked | `แชร์ค่าใช้จ่าย, ดูสมาชิก, ตั้งชื่อกลุ่ม, ช่วยเหลือ` |
| Health score | `พยากรณ์งบ, แนะนำประหยัด, ดูงบ, ดูกราฟ` |
| Budget forecast | `เช็คสุขภาพการเงิน, แนะนำประหยัด, ตั้งงบ, ดูรายจ่าย` |
| Spending tips | `เช็คสุขภาพการเงิน, ตั้งงบ, ดูรายจ่าย, ดูบิล` |
| Trip plan created | `ดูกลุ่ม, เพิ่มสมาชิก, บันทึกค่าใช้จ่าย, ดูยอดหนี้` |

## Special Cases

| Situation | Quick Replies |
|-----------|--------------|
| No groups (split failed) | `สร้างกลุ่มในแอป, บันทึกปกติ, ช่วยเหลือ` |
| Account not linked | `เชื่อมบัญชี, ช่วยเหลือ` |
| Over budget (80%+) | `ตั้งงบใหม่, ดูรายจ่าย, ประหยัดอย่างไร, ไม่สนใจ` |

## Default Fallback

```
[[quick_replies: บันทึกรายจ่าย, ดูงบ, สรุปวันนี้, ช่วยเหลือ]]
```

## English Context

When user communicates in English:

| After... | Quick Replies |
|----------|--------------|
| Default | `Log expense, View budget, Today's summary, Help` |
| Expense | `View budget, Split expense, Undo, Today` |
| Budget | `Set budget, View chart, Compare, Log expense` |
