# khuber_shops Database Schema Documentation

This document outlines the schema of all collections (tables) within the `khuber_shops` database (ID: `69ca636c00163e9c30a2`).

---

## 1. `users`
**Description**: users

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `name` | string | ✅ | Max size: 50 |
| `email` | string | ✅ | Max size: 50 |
| `user_id` | string | ✅ | Max size: 255 |
| `phone` | string | ❌ | Max size: 255 |
| `wallet_balance` | integer | ❌ | Default: `0` |
| `total_deposit` | integer | ❌ | Default: `0` |
| `total_withdraw` | integer | ❌ | Default: `0` |
| `wins` | integer | ❌ | Default: `0` |
| `losses` | integer | ❌ | Default: `0` |
| `total_matches` | integer | ❌ | Default: `0` |

---

## 2. `tournaments`
**Description**: tournaments

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `title` | string | ✅ | Max size: 255 |
| `description` | string | ❌ | Max size: 1000, Default: `` |
| `game` | string | ❌ | Max size: 255 |
| `date` | datetime | ✅ |  |
| `enteryFee` | integer | ❌ |  |
| `createdBy` | string | ❌ | Max size: 255 |
| `maxPlayers` | integer | ❌ |  |
| `status` | string | ❌ | Default: `upcoming`, Values: `completed`, `upcoming` |

---

## 3. `tournament_participants`
**Description**: tournament_participants

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `tournament_id` | relationship | ❌ | Relation: `manyToOne` with `tournaments` |
| `game_id` | string | ❌ | Max size: 255 |
| `payment_status` | string | ❌ | Default: `pending`, Values: `pending`, `verified`, `rejected` |
| `receipt_file_id` | string | ❌ | Max size: 255 |
| `transaction_no` | string | ❌ | Max size: 30 |
| `user_id` | relationship | ❌ | Relation: `manyToOne` with `users` |

---

## 4. `tournament_results`
**Description**: tournament_results

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `tournament_id` | relationship | ❌ | Relation: `manyToOne` with `tournaments` |
| `team_name` | string | ❌ | Max size: 255 |
| `game_id` | string | ❌ | Max size: 255 |
| `rank` | integer | ❌ |  |
| `kills_score` | integer | ❌ | Default: `0` |
| `prize` | integer | ❌ | Default: `0` |

---

## 5. `support_tickets`
**Description**: support tickets

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `userId` | string | ❌ | Max size: 255 |
| `subject` | string | ❌ | Max size: 255 |
| `message` | string | ❌ | Max size: 1000 |
| `adminReply` | string | ❌ | Max size: 5000 |
| `status` | string | ❌ | Max size: 50, Default: `open` |
| `lastMessageAt` | string | ❌ | Max size: 32 |
| `lastSenderRole` | string | ❌ | Max size: 32 |

**Indexes:**

| Key | Type | Attributes |
| :--- | :--- | :--- |
| `userId_index` | key | userId |

---

## 6. `support_messages`
**Description**: support messages

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `ticketId` | string | ✅ | Max size: 50 |
| `senderId` | string | ✅ | Max size: 50 |
| `role` | string | ✅ | Max size: 10 |
| `message` | string | ✅ | Max size: 3000 |

**Indexes:**

| Key | Type | Attributes |
| :--- | :--- | :--- |
| `ticketId` | key | ticketId |

---

## 7. `withdraw_requests`
**Description**: withdraw_requests

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `user_id` | relationship | ❌ | Relation: `manyToOne` with `users` |
| `amount` | integer | ❌ |  |
| `method` | string | ❌ | Values: `bank`, `easypaisa`, `jazzcash` |
| `upi_id` | string | ❌ | Max size: 100 |
| `account_number` | string | ❌ | Max size: 50 |
| `account_name` | string | ❌ | Max size: 50 |
| `status` | string | ❌ | Values: `pending`, `approved`, `rejected` |

---

## 8. `wallet_transactions`
**Description**: wallet_transactions

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `amount` | integer | ✅ |  |
| `type` | string | ✅ | Values: `deposit`, `withdraw`, `fee` |
| `status` | string | ❌ | Default: `pending`, Values: `pending`, `approved`, `rejected` |
| `transaction_id` | string | ❌ | Max size: 30 |
| `receipt_image` | string | ❌ | Max size: 50 |
| `note` | string | ❌ | Max size: 50 |
| `user_id` | relationship | ❌ | Relation: `manyToOne` with `users` |
| `tournament_id` | relationship | ❌ | Relation: `manyToOne` with `tournaments` |

---

## 9. `challenges`
**Description**: challenges

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `challenger_id` | relationship | ❌ | Relation: `manyToOne` with `users` |
| `opponent_id` | relationship | ❌ | Relation: `manyToOne` with `users` |
| `game` | string | ❌ | Max size: 50 |
| `map` | string | ✅ | Max size: 100 |
| `entry_fee` | integer | ✅ |  |
| `prize` | integer | ❌ |  |
| `status` | string | ❌ | Values: `pending`, `accepted`, `rejected`, `completed`, `expired`, `disputed`, `cancelled` |
| `winner_id` | string | ❌ | Max size: 50 |
| `room_id` | string | ❌ | Max size: 100 |
| `room_pass` | string | ❌ | Max size: 50 |
| `expires_at` | datetime | ❌ |  |

---

## 10. `challenge_results`
**Description**: challenge_results

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `challenges` | relationship | ❌ | Relation: `manyToOne` with `challenges` |
| `submitted_by` | string | ❌ | Max size: 50 |
| `winner_id` | string | ❌ | Max size: 50 |
| `screenshot` | string | ❌ | Max size: 100 |

---

## 11. `chats`
**Description**: chats

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `participants` | string[] | ✅ | Max size: 255 |
| `last_message` | string | ❌ | Max size: 3000 |
| `last_message_time` | datetime | ❌ |  |

**Indexes:**

| Key | Type | Attributes |
| :--- | :--- | :--- |
| `idx_participants` | key | participants |

---

## 12. `messages`
**Description**: messages

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `chat_id` | string | ✅ | Max size: 50 |
| `sender_id` | string | ✅ | Max size: 50 |
| `receiver_id` | string | ✅ | Max size: 50 |
| `message` | string | ❌ | Max size: 3000 |
| `type` | string | ❌ | Max size: 20, Default: `text` |
| `created_at` | datetime | ✅ |  |

**Indexes:**

| Key | Type | Attributes |
| :--- | :--- | :--- |
| `idx_chat_id` | key | chat_id |
| `idx_created_at` | key | created_at |

---

