# ThaiFin Pro — LINE Group Chat Integration

Enable expense tracking directly in LINE group chats by linking LINE groups to RaRiFlow finance groups.

---

## Setup Flow

1. Bot added to LINE group → receives "join" event with `source.type = "group"` and `groupId`
2. Bot asks: "สวัสดีค่ะ! ต้องการเชื่อมต่อกับกลุ่มไหนใน ThaiFin?"
3. User can:
   - Link to existing: "เชื่อมกับกลุ่ม 'ทริปเชียงใหม่'"
   - Create new: "สร้างกลุ่มใหม่ชื่อ 'ทริปเชียงใหม่'"
4. Bot links LINE group to finance group
5. Members link their LINE accounts to group members

## Commands

- "เชื่อมกลุ่ม" / "link group" → Start group linking flow
- "ยกเลิกเชื่อม" / "unlink" → Unlink (only creator/owner)
- "ฉันคือ [name]" / "I am [name]" → Link LINE user to group member

## Processing Messages in Linked Groups

1. Get context: `POST /api/v1/ai/line-groups/context` with `line_group_id` + `line_user_id`
2. If linked → use `finance_group_id` for all operations
3. If member linked → use their `member_id` for transactions
4. If member not linked → ask to identify: "ฉันคือ [name]"

## API Endpoints

### Get LINE Group Context

`POST /api/v1/ai/line-groups/context`

```json
{"line_group_id": "C...", "line_user_id": "U..."}
```

Returns: `is_linked`, `finance_group_id`, `finance_group_name`, `member_id`, `member_name`, `is_member_linked`, `members[]`

### Link LINE Group

`POST /api/v1/ai/line-groups/link`

Link to existing:
```json
{"line_group_id": "C...", "line_user_id": "U...", "finance_group_id": "uuid"}
```

Create and link:
```json
{"line_group_id": "C...", "line_user_id": "U...", "create_new_group": true, "new_group_name": "ทริปเชียงใหม่"}
```

### Unlink LINE Group

`POST /api/v1/ai/line-groups/unlink?line_group_id=C...&line_user_id=U...`

Only original creator or group owner can unlink.

### Link LINE User to Group Member

`POST /api/v1/ai/line-groups/link-member`

```json
{"line_group_id": "C...", "line_user_id": "U...", "member_name": "Som"}
```

Use when user says "ฉันคือ Som".

### Get Available Groups for Linking

`GET /api/v1/ai/line-groups/available?line_user_id={line_user_id}`

Returns available finance groups the user owns.

## Permissions

- Only creator/owner can unlink
- Any linked member can create expenses
- Members must link LINE accounts before creating transactions
