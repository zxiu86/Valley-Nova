# Eternity Corridors — Firestore Security Specification

## 1. Security Model & Core Invariants

1. **Default Deny**: Root `match /{document=**}` denies all reads and writes.
2. **Server-Authoritative Roles**: Publication permission (`canPublish`), verification badges (`author`, `founder`), and admin moderation privileges (`founder`) come **strictly** from server-protected `/user_roles/{uid}`, `/founders/{uid}`, and `/admins/{uid}` — NEVER from `/users/{uid}` or `/public_profiles/{uid}` or any client-writable profile field.
3. **Founder Bootstrapping (`@zid`)**: Designated founder email (`zly30257@gmail.com`) with `request.auth.token.email_verified == true` is verified cryptographically via Firebase Auth ID token claims. Only the founder/admin can claim `@zid`, review writer applications, assign roles, or moderate/remove violating works.
4. **PII Isolation**:
   - `/users/{userId}` holds email and private account config (`allow get: if isOwner(userId) || isAdmin()`, `allow list: if false`).
   - `/public_profiles/{userId}` forbids `email`, `role`, `roles`, `isWriter`, `isAuthor`, `canPublish`, `isFounder`, `isAdmin`.
   - `/founders/{founderId}` holds only public non-PII seal metadata (`{ uid, badge: 'founder', handle: 'zid', active: true }`) readable by visitors (`allow get`) so the official seal displays everywhere without exposing admin email.
5. **Unique Chapter Numbers (`chapter_slots`)**:
   - Creating a chapter at `/novels/{novelId}/chapters/{chapterId}` requires an atomic transaction that simultaneously creates `/novels/{novelId}/chapter_slots/slot_{chapterNumber}` while asserting `!exists(.../chapter_slots/slot_{chapterNumber})`. Concurrent writers or duplicate submissions cannot overwrite or create two chapters with the same `chapterNumber`.
6. **Optimistic Concurrency Control (`revision`)**:
   - Chapters enforce an integer `revision >= 1` (`revision == 1` on create; `revision == existing().revision + 1` on update) so simultaneous multi-tab/multi-session saves fail cleanly cleanly instead of silently overwriting newer edits.
7. **Server-Verified 60-Second Read Counting (`request.time`)**:
   - Starting a reading session creates `/novels/{novelId}/read_sessions/{sessionId}` with `startedAt == request.time` (enforced strictly against Firestore server clock) and `consumed == false`.
   - Committing a verified read requires an atomic transaction/batch that:
     - Updates the session from `consumed == false` to `consumed == true`.
     - Asserts `request.time >= session.startedAt + duration.value(60, 's')`.
     - Creates `/novels/{novelId}/verified_reads/{readerKey}` (`!exists` prior) with `verifiedAt == request.time`.
     - Increments parent `/novels/{novelId}.verifiedReadsCount` by exact `+1` (`affectedKeys().hasOnly(['verifiedReadsCount', 'lastVerifiedReadKey'])`).
8. **Anti-Spam Reports & Literary Moderation**:
   - Users can file at most ONE report per novel (`/work_reports/{novelId}__{reporterUid}` with `!exists`).
   - Threshold escalation to `under_review` requires a valid atomic report batch; literary prose is never censored, and moderation rejection (`rejected_removed`) is restricted exclusively to Founder/Admin.
9. **Cover Upload Safety**:
   - Only `https://` Firebase Storage URLs or safe raster `data:image/(webp|png|jpeg);base64,` payloads (<= 450 KB) are accepted; `<svg` or arbitrary script data URLs are rejected.

---

## 2. The Dirty Dozen — Adversarial Malicious Payloads Blocked by Rules

| # | Attack Vector | Collection / Operation | Malicious Payload / Condition | Rule Defense |
|---|---|---|---|---|
| 1 | **Identity Spoofing on Novel Creation** | `CREATE /novels/evil_novel` | `{ id: 'evil_novel', authorId: 'victim_uid', title: 'Hijacked', ... }` by `attacker_uid` | `incoming().authorId == request.auth.uid` rejects cross-UID authoring. |
| 2 | **Self-Granting Founder / Writer Role** | `WRITE /user_roles/attacker_uid` | `{ userId: 'attacker_uid', role: 'founder', canPublish: true, status: 'active' }` | `allow write: if isAdmin()` blocks non-founders completely. |
| 3 | **Profile Flag Privilege Escalation** | `UPDATE /public_profiles/attacker_uid` | `{ displayName: 'Fake Admin', role: 'founder', isWriter: true, canPublish: true }` | `isValidPublicProfile()` forbids `role`, `roles`, `isWriter`, `canPublish`, `isFounder`, `isAdmin`, `email` AND `affectedKeys().hasOnly(...)` blocks extra fields. |
| 4 | **Duplicate Chapter Slot Bypass** | `CREATE /novels/n1/chapters/ch_dup` | Two chapters with `chapterNumber: 3` without creating free `/chapter_slots/slot_3` | Rule requires `!exists(.../chapter_slots/slot_3) && existsAfter(.../chapter_slots/slot_3)` atomically. |
| 5 | **Premature Verified Read Spoof (< 60s)** | `CREATE /novels/n1/verified_reads/r1` | Committing read 5 seconds after opening chapter, or forging `startedAt` in the past | `read_sessions.create` requires `startedAt == request.time`; `verified_reads.create` requires `request.time >= session.startedAt + duration.value(60, 's')`. |
| 6 | **Direct Counter Inflation on Novel** | `UPDATE /novels/n1` | `{ verifiedReadsCount: 999999 }` | Direct edit to `verifiedReadsCount` by anyone (even author) is rejected unless paired atomically with a new `verified_reads` doc and `verifiedReadsCount == existing().verifiedReadsCount + 1`. |
| 7 | **Replay Attack on Read Session** | `CREATE /novels/n1/verified_reads/r2` | Re-using the same `sessionId` where `session.consumed == true` to double-count reads | Rule requires `existing_session.consumed == false` AND `getAfter(session).data.consumed == true` AND `!exists(verified_reads/{readerKey})`. |
| 8 | **Unauthorized Application Approval** | `UPDATE /writer_applications/attacker_uid` | `{ status: 'approved', reviewedBy: 'attacker_uid' }` | Owner can only re-submit a `'rejected'` app back to `'pending'`; only `isAdmin()` can set `'approved'`. |
| 9 | **Hijacking Reserved Handle `@zid`** | `CREATE /usernames/zid` | `{ uid: 'attacker_uid', username: 'zid', isPublic: true }` | `isAllowedUsernameWrite('zid')` requires `isAdmin()`. |
| 10 | **Cross-User PII Leak** | `GET /users/victim_uid` | Unauthenticated or signed-in attacker reading `users/{victim_uid}` | `allow get: if isOwner(userId) || isAdmin()`, `allow list: if false`. |
| 11 | **Report Bombing / Mass Takedown** | `CREATE /work_reports/spam_2` | Signed-in attacker submitting 10 reports with random IDs against one novel | Report doc ID MUST match `novelId + '__' + request.auth.uid` with `!exists`, capping at 1 report per user per novel. |
| 12 | **Stale Overwrite / Revision Tampering** | `UPDATE /novels/n1/chapters/ch_1` | Overwriting a newer chapter edit with `revision: existing.revision` instead of `existing.revision + 1` | Chapter `update` requires `incoming().revision == existing().revision + 1`. |
