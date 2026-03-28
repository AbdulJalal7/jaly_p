# khuber_shops Database Schema Documentation

This document outlines the schema of all collections (tables) within the `khuber_shops` database (ID: `6992ce540025a687a83e`).

---

## 1. `users`
**Description**: Stores user profile and wallet information.

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `user_id` | string | ✅ | Max size: 255 |
| `name` | string | ✅ | Max size: 50 |
| `email` | string | ✅ | Max size: 50 |
| `phone` | string | ❌ | Max size: 255 |
| `wallet_balance` | integer | ❌ | Default: `0` |
| `total_deposit` | integer | ❌ | Default: `0` |
| `total_withdraw` | integer | ❌ | Default: `0` |

---

## 2. `tournaments`
**Description**: Stores details about gaming tournaments.

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `title` | string | ✅ | Max size: 255 |
| `description` | string | ❌ | Max size: 1000 |
| `game` | string | ❌ | Max size: 255 |
| `date` | datetime | ✅ | ISO 8601 string |
| `enteryFee` | integer | ❌ | |
| `createdBy` | string | ❌ | Max size: 255 |
| `maxPlayers` | integer | ❌ | |
| `status` | enum (string) | ❌ | `completed`, `upcoming` (Default: `upcoming`) |

---

## 3. `tournament_participants`
**Description**: Links users to tournaments they have joined.

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `tournament_id` | relationship | ❌ | manyToOne with `tournaments` (setNull on delete) |
| `user_id` | relationship | ❌ | manyToOne with `users` (setNull on delete) |
| `game_id` | string | ❌ | Max size: 255 |
| `payment_status` | enum (string) | ❌ | `pending`, `verified`, `rejected` (Default: `pending`) |
| `receipt_file_id` | string | ❌ | Max size: 255 |
| `transaction_no` | string | ❌ | Max size: 30 |

---

## 4. `tournament_results`
**Description**: Stores the outcome and scores for tournament participants.

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `tournament_id` | relationship | ❌ | manyToOne with `tournaments` (cascade on delete) |
| `team_name` | string | ❌ | Max size: 255 |
| `game_id` | string | ❌ | Max size: 255 |
| `rank` | integer | ❌ | Min: `1` |
| `kills_score` | integer | ❌ | Default: `0` |
| `prize` | integer | ❌ | Min: `0`, Default: `0` |

---

## 5. `wallet_transactions`
**Description**: Ledger of all monetary transactions like deposits and withdrawals.

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `user_id` | relationship | ❌ | manyToOne with `users` (cascade on delete) |
| `amount` | integer | ✅ | |
| `type` | enum (string) | ✅ | `deposit`, `withdraw`, `fee` |
| `status` | enum (string) | ❌ | `pending`, `approved`, `rejected` (Default: `pending`) |
| `transaction_id` | string | ❌ | Max size: 30 |
| `receipt_image` | string | ❌ | Max size: 50 |
| `note` | string | ❌ | Max size: 50 |

---

## 6. `withdraw_requests`
**Description**: Stores withdrawal requests made by users.

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `user_id` | relationship | ❌ | manyToOne with `users` (setNull on delete) |
| `amount` | integer | ❌ | |
| `method` | enum (string) | ❌ | `bank`, `easypaisa`, `jazzcash` |
| `status` | enum (string) | ❌ | `pending`, `approved`, `rejected` |
| `account_name` | string | ❌ | Max size: 50 |
| `account_number` | string | ❌ | Max size: 50 |
| `upi_id` | string | ❌ | Max size: 100 |

---

## 7. `support_tickets`
**Description**: High-level support tickets created by users.

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `userId` | string | ❌ | Max size: 255 |
| `subject` | string | ❌ | Max size: 255 |
| `message` | string | ❌ | Max size: 1000 |
| `status` | string | ❌ | Max size: 50 (Default: `open`) |
| `adminReply` | string | ❌ | Max size: 5000 |
| `lastMessageAt` | string | ❌ | Max size: 32 |
| `lastSenderRole` | string | ❌ | Max size: 32 |

---

## 8. `support_messages`
**Description**: Individual messages exchanged within a support ticket.

| Attribute | Type | Required | Additional Info |
| :--- | :--- | :---: | :--- |
| `ticketId` | string | ✅ | Max size: 50 |
| `senderId` | string | ✅ | Max size: 50 |
| `role` | string | ✅ | Max size: 10 |
| `message` | string | ✅ | Max size: 3000 |
