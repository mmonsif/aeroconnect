
export enum UserRole {
  STAFF = 'staff',
  SUPERVISOR = 'supervisor',
  MANAGER = 'manager',
  SAFETY_MANAGER = 'safety_manager',
  ADMIN = 'admin'
}

export type Language = 'en' | 'ar';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  staffId: string;
  avatar?: string;
  department: string;
  status: 'active' | 'inactive';
  mustChangePassword?: boolean;
  managerId?: string; // Added for hierarchy
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  createdAt: string;
  department: string;
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  type: 'near_miss' | 'incident' | 'hazard' | 'equipment';
  description: string;
  translation?: string;
  aiAnalysis?: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'investigating' | 'resolved';
  timestamp: string;
  imageUrls?: string[];
  entities?: {
    locations: string[];
    equipment: string[];
    personnel: string[];
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  text: string;
  translation?: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  replies: ForumReply[];
  createdAt: string;
}

export interface ForumReply {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: 'sick' | 'annual' | 'emergency';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'suggestion_sent';
  reason: string;
  suggestion?: string; 
  suggestedStartDate?: string;
  suggestedEndDate?: string;
}

export interface DocFile {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  date: string;
  filePath?: string;
  fileSize?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'safety' | 'doc' | 'leave' | 'forum' | 'message' | 'broadcast';
  severity: 'info' | 'urgent';
  isRead: boolean;
  timestamp: Date;
}

export interface BroadcastAlert {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  status: 'active' | 'expired';
  recipients: string[]; // Array of user IDs who received it
  readBy: string[]; // Array of user IDs who read it
}
