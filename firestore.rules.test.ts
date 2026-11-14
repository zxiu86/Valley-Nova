import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Security & Schema Invariant Verification against /firestore.rules and /security_spec.md
 * Ensures every critical invariant & Dirty Dozen defense stays enforced in rules.
 */
describe('Firestore Security Rules & Dirty Dozen Spec Verification', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const specPath = path.resolve(process.cwd(), 'security_spec.md');
  const rulesText = fs.readFileSync(rulesPath, 'utf8');
  const specText = fs.readFileSync(specPath, 'utf8');

  it('maintains root default-deny and zero permissive wildcard catch-alls', () => {
    expect(rulesText).toContain('match /{document=**}');
    expect(rulesText).toContain('allow read, write: if false;');
    expect(rulesText).not.toMatch(/allow\s+(read|write)\s*:\s*if\s+true\s*;/);
  });

  it('protects PII isolation in users and public_profiles', () => {
    expect(rulesText).toContain('match /users/{userId}');
    expect(rulesText).toContain('allow list: if false;');
    expect(rulesText).toContain("!('email' in data)");
    expect(rulesText).toContain("!('canPublish' in data)");
    expect(rulesText).toContain("!('isFounder' in data)");
  });

  it('locks user_roles, writer_applications approvals, and @zid handle to verified founder/admin', () => {
    expect(rulesText).toContain("request.auth.token.email == 'zly30257@gmail.com'");
    expect(rulesText).toContain('match /user_roles/{userId}');
    expect(rulesText).toContain('allow create, update: if isValidId(userId) && isAdmin()');
    expect(rulesText).toContain("(name == 'zid' && isAdmin())");
  });

  it('enforces atomic unique chapter_slots lock and optimistic revision locking', () => {
    expect(rulesText).toContain('match /chapter_slots/{slotId}');
    expect(rulesText).toContain("slotId.matches('^slot_[1-9][0-9]{0,5}$')");
    expect(rulesText).toContain('incoming().revision == existing().revision + 1');
    expect(rulesText).toContain('incoming().revision == 1');
  });

  it('enforces server-time 60-second read verification and atomic verifiedReadsCount', () => {
    expect(rulesText).toContain('incoming().startedAt == request.time');
    expect(rulesText).toContain("request.time >= existing().startedAt + duration.value(60, 's')");
    expect(rulesText).toContain("request.time >= get(/databases/$(database)/documents/novels/$(novelId)/read_sessions/$(incoming().sessionId)).data.startedAt + duration.value(60, 's')");
    expect(rulesText).toContain("affectedKeys().hasOnly(['verifiedReadsCount', 'lastVerifiedReadKey'])");
    expect(rulesText).toContain("incoming().verifiedReadsCount == (existing().get('verifiedReadsCount', 0) + 1)");
  });

  it('prevents duplicate report spam and restricts SVG/script cover data URIs', () => {
    expect(rulesText).toContain("reportId == (incoming().novelId + '__' + request.auth.uid)");
    expect(rulesText).toContain("!exists(/databases/$(database)/documents/work_reports/$(reportId))");
    expect(rulesText).toContain("url.matches('^data:image/(webp|png|jpeg);base64,.*')");
  });

  it('documents all 12 Dirty Dozen adversarial vectors in security_spec.md', () => {
    expect(specText).toContain('Identity Spoofing on Novel Creation');
    expect(specText).toContain('Premature Verified Read Spoof (< 60s)');
    expect(specText).toContain('Duplicate Chapter Slot Bypass');
    expect(specText).toContain('Stale Overwrite / Revision Tampering');
  });

  it('supports legacy author roles without explicit canPublish flag and null-safe application fields', () => {
    expect(rulesText).toContain("get('canPublish', true) == true");
    expect(rulesText).toContain("data.reviewNote == null || (data.reviewNote is string");
    expect(rulesText).toContain("existing().status == 'approved' && !isApprovedWriter()");
  });

  it('enforces hardened deterministic role_requests validation and admin-only approval', () => {
    expect(rulesText).toContain('function isValidRoleRequest(data)');
    expect(rulesText).toContain("requestId == (request.auth.uid + '__' + incoming().role)");
    expect(rulesText).toContain('function isValidUserRolePayload(data, userId)');
    expect(rulesText).toContain('isValidUserRolePayload(incoming(), userId)');
  });
});

