export interface ChapterSummary {
  id: string;
  chapterIndex: number;
  title: string;
  wordCount: number;
  utf8Bytes: number;
  mtxBytes: number;
  savingsPercent: number;
  mtxBase64: string; // Base64 representation of the Uint8Array MTX file
  decodingDurationMs?: number;
  isLossless?: boolean;
  diacriticsCount?: number;
}

export type AppRole = 'auditor' | 'author' | 'translate' | 'founder';

export interface UserRoleRecord {
  userId: string;
  role: AppRole;
  roles?: AppRole[];
  status: 'active' | 'revoked';
  assignedBy?: string;
  assignedAt: string;
}

export interface RoleRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: 'auditor' | 'author' | 'translate';
  statement?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface AuditReview {
  id: string;
  novelId: string;
  novelTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  reviewerId: string;
  reviewerName: string;
  decision: 'approved' | 'issues_found';
  explanation?: string;
  evidence?: string;
  concernType?: 'plagiarism' | 'unauthorized_publication' | 'concealed_ownership' | 'distortion' | 'linguistic' | 'none';
  createdAt: string;
}

export interface WorkModeration {
  novelId: string;
  status: 'pending_audit' | 'approved' | 'disputed' | 'suspended' | 'removed';
  approvalCount: number;
  issueCount: number;
  requiredApprovals: number; // Configurable agreement threshold (default = 2)
  hasCopyrightConcern: boolean;
  suspendedReason?: string;
  lastAuditedAt?: string;
  updatedAt: string;
}

export interface ModerationLog {
  id: string;
  targetType: 'work' | 'user_role' | 'request';
  targetId: string;
  action: string;
  reason: string;
  decidedBy: string;
  createdAt: string;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  authorCover?: string;
  authorBio?: string;
  translator?: string;
  translatorId?: string;
  translatorAvatar?: string;
  translatorCover?: string;
  translatorBio?: string;
  category: string;
  description: string;
  coverGradient: string;
  coverImage?: string;
  riwaqId?: string;
  riwaqName?: string;
  accentColor: string;
  rating?: number;
  ratingCount?: number;
  views?: string;
  badge?: string;
  section?: string;
  chapters: ChapterSummary[];
  createdAt: string;
  updatedAt: string;
  isPreloaded?: boolean;
  status?: 'pending_audit' | 'approved' | 'disputed' | 'suspended' | 'removed';
  copyrightConfirmed?: boolean;
  isTranslation?: boolean;
  originalWorkTitle?: string;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'black' | 'emerald' | 'navy';
export type ReaderFont = 'amiri' | 'cairo' | 'tajawal' | 'naskh' | 'kufi' | 'system';
export type ReaderWidth = 'narrow' | 'normal' | 'wide' | 'full';
export type ReaderAlign = 'justify' | 'right' | 'center' | 'left';
export type ReaderWeight = 'normal' | 'medium' | 'bold';
export type ParagraphSpacing = 'compact' | 'normal' | 'relaxed';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontFamily: ReaderFont;
  fontSize: number;
  lineHeight: number;
  pageWidth: ReaderWidth;
  highlightTashkeel: boolean;
  showDiagnostics: boolean;
  textAlign: ReaderAlign;
  paragraphSpacing: ParagraphSpacing;
  fontWeight?: ReaderWeight;
  indentParagraphs?: boolean;
  screenDimmer?: number;
  readingRuler?: boolean;
}
