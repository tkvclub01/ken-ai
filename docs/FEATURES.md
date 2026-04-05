# KEN AI - FEATURE DOCUMENTATION

## Overview

KEN AI is a comprehensive student management and AI-powered platform designed for educational consulting agencies. The system provides role-based dashboards, document management with OCR verification, AI chat assistance, and knowledge base with semantic search.

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Employee Management](#2-employee-management)
3. [Student Management](#3-student-management)
4. [Document Management & OCR](#4-document-management--ocr)
5. [AI Chat Assistant](#5-ai-chat-assistant)
6. [Knowledge Base](#6-knowledge-base)
7. [Analytics Dashboard](#7-analytics-dashboard)
8. [Settings & Preferences](#8-settings--preferences)
9. [Role-Based Access Control](#9-role-based-access-control)

---

## 1. Authentication & Authorization

### Features
- **Email/Password Authentication**: Secure login with Supabase Auth
- **OAuth Integration**: Google Sign-In support
- **Magic Link**: Passwordless authentication option
- **Role-Based Access**: 5 distinct user roles with different permissions
- **Session Management**: Persistent sessions with automatic refresh
- **Email Verification**: Email confirmation required for new accounts

### User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | System administrators | Full access to all features |
| **Manager** | Team managers | Manage students, documents, view analytics |
| **Counselor** | Student advisors | Manage assigned students and documents |
| **Processor** | Document processors | Upload and verify documents |
| **Student** | End users | View own information and documents |

### Login Flow
```
1. User enters email/password → Supabase Auth
2. Verify credentials → Create session
3. Fetch user profile → Get role and permissions
4. Role-based redirect:
   - Admin → /admin dashboard
   - Manager/Counselor/Processor → /employee dashboard
   - Student → /student dashboard
5. Load user data → React Query cache
```

### Security Features
- Password requirements (minimum 8 characters)
- Email verification on signup
- Session timeout handling
- Protected routes with middleware
- Row Level Security (RLS) on all tables

---

## 2. Employee Management

**Access**: Admin only

### Features

#### Invite Employees
- Send email invitations to new team members
- Assign roles during invitation (Admin, Manager, Counselor, Processor)
- Customizable invitation message
- Track invitation status

#### Manage Employees
- **View All Employees**: List all team members with roles and status
- **Edit Employee Details**: Update name, role, and active status
- **Activate/Deactivate**: Toggle employee access without deletion
- **Delete Employees**: Remove employees with confirmation dialog
- **Search & Filter**: Find employees by name, email, or role

#### Employee Table
Displays:
- Employee name and email
- Role badge with color coding
- Status (Active/Inactive, Verified)
- Last login timestamp
- Account creation date
- Action menu (Edit, Activate/Deactivate, Delete)

#### Audit Logging
All employee management actions are logged:
- `INVITE_USER` - New employee invitation
- `UPDATE_USER` - Employee details changed
- `DEACTIVATE_USER` - Employee deactivated
- `ACTIVATE_USER` - Employee activated
- `DELETE_USER` - Employee removed

### User Interface
```
┌─────────────────────────────────────────────┐
│ Employee Management                         │
│ Manage team members and their permissions   │
├─────────────────────────────────────────────┤
│ [Search by name or email...] [Filter: All] │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Name          │ Role     │ Status      │ │
│ ├─────────────────────────────────────────┤ │
│ │ John Doe      │ Admin    │ ● Active    │ │
│ │ john@ken.ai   │          │ ✓ Verified  │ │
│ │               │          │ ... actions │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [+ Invite Employee]                         │
└─────────────────────────────────────────────┘
```

---

## 3. Student Management

**Access**: Manager, Counselor, Admin

### Features

#### Student List (Table View)
- Comprehensive table of all students
- Sortable columns (name, status, GPA, country)
- Filter by status, country, counselor
- Search by name, email, or passport number
- Bulk actions (export, assign counselor)

#### Kanban Board View
- Visual pipeline management
- Drag-and-drop between stages
- Stage colors and counts
- Quick student cards with key info

#### Student Details
- **Personal Information**: Name, DOB, passport, nationality
- **Contact Details**: Email, phone, address
- **Academic Info**: GPA, intended country, intended major
- **Assigned Counselor**: Link to counselor profile
- **Application Status**: Current pipeline stage
- **Documents**: List of uploaded documents
- **Notes**: Internal notes about the student

#### Student CRUD Operations
- **Create**: Add new student with full details
- **Read**: View student profile and history
- **Update**: Edit student information
- **Delete**: Remove student (with cascade to documents)

#### Pipeline Management
- Move students between stages
- Track stage transitions with timestamps
- Add notes when moving between stages
- View pipeline history

### Student Status Flow
```
Lead → Active → Inactive → Completed
         ↓
      Rejected
```

### Pipeline Stages
1. **Consultation** - Initial assessment
2. **Document Collection** - Gathering required documents
3. **School Submission** - Application submitted
4. **Visa Application** - Visa processing
5. **Approved** - Visa approved
6. **Rejected** - Application rejected

---

## 4. Document Management & OCR

**Access**: Counselor, Processor, Manager, Admin

### Features

#### Document Upload
- **Drag & Drop**: Intuitive file upload interface
- **Multi-file Upload**: Upload multiple documents at once
- **File Type Validation**: Accept PDF, JPG, PNG, etc.
- **Size Limits**: Configurable maximum file size
- **Progress Indicators**: Real-time upload progress
- **Categorization**: Tag documents by type (passport, transcript, etc.)

#### OCR Processing
- **Automatic OCR**: Trigger OCR on upload
- **Google Gemini Vision**: AI-powered text extraction
- **Processing Status**: Track OCR progress (pending → processing → completed)
- **Extracted Data**: View OCR results in structured format
- **Re-processing**: Re-run OCR if needed

#### Document Verification
- **Manual Review**: Verify OCR accuracy
- **Edit Extracted Data**: Correct OCR errors
- **Rejection**: Reject documents with reason
- **Verification History**: Track who verified and when

#### Document Viewer
- **Preview**: View documents in browser
- **Zoom**: Zoom in/out for detailed inspection
- **Download**: Download original or processed file
- **Metadata**: View file information (size, type, upload date)

#### OCR Verification Interface
```
┌─────────────────────────────────────────────┐
│ Document: passport.jpg                      │
│ Student: John Doe                           │
│ Status: ● Processing                        │
├─────────────────────────────────────────────┤
│ ┌──────────────┐  ┌─────────────────────┐  │
│ │   Document   │  │   Extracted Data    │  │
│ │   Preview    │  │                     │  │
│ │              │  │ Full Name: John Doe │  │
│ │  [Image]     │  │ Passport: A1234567  │  │
│ │              │  │ DOB: 1990-01-15     │  │
│ │              │  │ Expiry: 2025-12-31  │  │
│ └──────────────┘  └─────────────────────┘  │
│                                             │
│ [✓ Verify]  [✗ Reject]  [⟳ Re-process]    │
└─────────────────────────────────────────────┘
```

### Document Types
- Passport
- ID Card
- Academic Transcript
- Diploma/Certificate
- English Test Scores (IELTS, TOEFL, etc.)
- Financial Documents
- Recommendation Letters
- Statement of Purpose
- Other

---

## 5. AI Chat Assistant

**Access**: All authenticated users

### Features

#### Chat Interface
- **Real-time Messaging**: Instant message sending and receiving
- **Message History**: Persistent conversation history
- **Rich Text Support**: Formatted responses with markdown
- **Citations**: AI responses cite knowledge base sources
- **Conversation List**: View and manage all conversations
- **Search Conversations**: Find past conversations by content

#### AI Capabilities
- **Knowledge Base Queries**: Answer questions using internal knowledge
- **Student Information**: Retrieve student details (with permissions)
- **Document Assistance**: Help with document requirements
- **Visa Guidance**: Provide visa application guidance
- **Country Information**: Share country-specific requirements

#### Rich Text Editor
- **Formatting**: Bold, italic, lists, headers
- **Code Blocks**: Syntax-highlighted code
- **Links**: Clickable URLs
- **Tables**: Formatted tables
- **Copy to Clipboard**: One-click copy

#### Conversation Management
- **Create New Chat**: Start new conversation
- **Rename Chat**: Custom conversation titles
- **Archive Chat**: Hide old conversations
- **Delete Chat**: Remove conversation permanently
- **Student Context**: Link chat to specific student

#### AI Chat Interface
```
┌─────────────────────────────────────────────┐
│ Chat: Visa requirements for Australia       │
├─────────────────────────────────────────────┤
│                                             │
│  👤 User: What are the visa requirements    │
│     for Australia?                          │
│                                             │
│  🤖 AI: For an Australian student visa     │
│     (subclass 500), you need:              │
│                                             │
│     1. Confirmation of Enrollment (CoE)    │
│     2. Genuine Temporary Entrant statement │
│     3. English proficiency test            │
│     4. Financial capacity evidence         │
│     5. OSHC health cover                   │
│                                             │
│     Source: Visa Requirements Guide        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Type your message...          [Send] │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [📎 Attach] [🎤 Voice] [😊 Emoji]         │
└─────────────────────────────────────────────┘
```

### AI Integration
- **Google Gemini API**: Primary AI model
- **Vector Search**: Semantic search in knowledge base
- **Context Window**: Maintains conversation context
- **Rate Limiting**: Prevent abuse of AI features
- **Caching**: Cache common responses

---

## 6. Knowledge Base

**Access**: All authenticated users (view), Manager/Admin (create/edit)

### Features

#### Knowledge Base Search
- **Semantic Search**: AI-powered vector similarity search
- **Keyword Search**: Traditional text search
- **Filters**: Category, tags, verification status
- **Sorting**: By relevance, date, popularity
- **Instant Results**: Real-time search suggestions

#### Article Management
- **Create Articles**: Add new knowledge base entries
- **Rich Content**: Formatted text, images, links
- **Categories**: Organize by topic (Visa, Scholarships, etc.)
- **Tags**: Flexible tagging system
- **Verification**: Mark articles as verified
- **Version History**: Track article changes

#### Vector Embeddings
- **Automatic Embedding**: Generate embeddings on article creation
- **1536 Dimensions**: Using Google Gemini embedding model
- **Similarity Search**: Find related articles
- **Threshold Filtering**: Minimum similarity score

#### Article Interface
```
┌─────────────────────────────────────────────┐
│ Knowledge Base                              │
│ [🔍 Search...] [Category: All] [Verified: ✓]│
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Visa Requirements for Australia         │ │
│ │ Category: Australia | Tags: visa, reqs  │ │
│ │ Verified ✓ | Views: 1,234 | Helpful: 45 │ │
│ │                                         │ │
│ │ Students applying for Australian visa   │ │
│ │ need: CoE, GTE statement, English test  │ │
│ │ ...                                     │ │
│ │                                         │ │
│ │ [Read More] [Edit] [Delete]             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [+ Add Article]                             │
└─────────────────────────────────────────────┘
```

### Content Categories
- Australia (Visa requirements, scholarships)
- United Kingdom (Tier 4 visa, CAS process)
- United States (F-1 visa, SEVIS)
- Canada (Study permit, DLI)
- Scholarships (Funding opportunities)
- Academic Requirements (GPA, prerequisites)
- English Tests (IELTS, TOEFL, PTE)
- Application Process (Document checklists)
- Pre-departure (Travel preparation)

---

## 7. Analytics Dashboard

**Access**: Manager, Admin

### Features

#### Stats Cards
- **Total Students**: Count of all students
- **Active Students**: Currently active students
- **Visa Approval Rate**: Success rate percentage
- **Total Revenue**: Revenue generated
- **Pending Documents**: Documents awaiting verification
- **Total Documents**: All documents in system

#### Pipeline Chart
- **Visual Pipeline**: Funnel chart of student stages
- **Conversion Rates**: Stage-to-stage conversion
- **Stage Counts**: Number of students per stage
- **Trend Analysis**: Historical progression

#### Country Distribution
- **Pie/Bar Chart**: Students by target country
- **Percentages**: Distribution breakdown
- **Interactive**: Click to filter students

#### Revenue Tracking
- **Monthly Revenue**: Revenue over time
- **Payment Status**: Paid vs. pending
- **Counselor Performance**: Revenue by counselor
- **Projections**: Revenue forecasts

#### Activity Feed
- **Recent Actions**: Latest system activities
- **User Activities**: Who did what and when
- **Filter by Type**: Filter by action type
- **Real-time Updates**: Live activity stream

#### AI Summary Widget
- **Auto-generated Insights**: AI analyzes data
- **Key Metrics**: Highlighted important numbers
- **Trends**: Identified patterns
- **Recommendations**: Actionable suggestions

#### Analytics Interface
```
┌─────────────────────────────────────────────┐
│ Analytics Dashboard                         │
├─────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ 156  │ │ 142  │ │ 89%  │ │$45K  │        │
│ │Total │ │Active│ │Approv│ │Rev   │        │
│ └────── └──────┘ └──────┘ └──────┘        │
│                                             │
│ ┌─────────────────┐  ┌──────────────────┐  │
│ │ Pipeline Chart  │  │ Activity Feed    │  │
│ │                 │  │                  │  │
│ │ [Funnel]        │  │ • John updated   │  │
│ │                 │  │   student doc    │  │
│ │                 │  │ • Sarah verified │  │
│ └─────────────────┘  │   passport       │  │
│                      └──────────────────┘  │
│ ┌─────────────────┐  ┌──────────────────┐  │
│ │ Country Dist.   │  │ Revenue Chart    │  │
│ │ [Pie Chart]     │  │ [Line Chart]     │  │
│ └─────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────┘
```

### Dashboard Types by Role

#### Admin Dashboard
- System health metrics
- User management stats
- Financial overview
- Audit log access
- All analytics features

#### Manager Dashboard
- Team performance metrics
- Student pipeline overview
- Revenue tracking
- Counselor performance
- Document processing stats

#### Counselor Dashboard
- Assigned students
- Pending tasks
- Student progress
- Document verification queue

#### Student Dashboard
- Application status
- Required documents
- Upcoming deadlines
- Counselor contact info

---

## 8. Settings & Preferences

### Profile Settings
- **Personal Information**: Name, email, phone, department
- **Avatar**: Upload profile picture
- **Bio**: Personal description
- **Location**: City and country

### Security Settings
- **Change Password**: Update account password
- **Current Password Verification**: Verify old password
- **Password Requirements**: Minimum 8 characters
- **Session Management**: Active sessions list

### Notification Preferences
- **Email Notifications**: Toggle email alerts
- **Push Notifications**: Browser notifications
- **Marketing Emails**: Promotional content
- **Student Updates**: Student activity alerts
- **Document Reminders**: Pending document alerts

### Appearance Settings
- **Theme Selection**: Light, Dark, System
- **Language**: English (Vietnamese coming soon)
- **High Contrast Mode**: Accessibility option
- **Reduce Motion**: Minimize animations

### Account Management
- **Data Export**: Download all personal data (JSON)
- **Delete Account**: Permanent account deletion
- **Logout**: Sign out from all devices

### Settings Interface
```
┌─────────────────────────────────────────────┐
│ Settings                                    │
│ Manage your account settings                │
├─────────────────────────────────────────────┤
│ [Profile] [Security] [Notifications] [Prefs]│
├─────────────────────────────────────────────┤
│                                             │
│ Profile Information                         │
│ ┌──────────┐                                │
│ │  [Avatar]│  John Doe (Admin)              │
│ │          │  john@ken.ai                   │
│ └──────────┘                                │
│                                             │
│ Full Name:     [John Doe            ]       │
│ Email:         [john@ken.ai (locked)]       │
│ Phone:         [+1 234 567 8900     ]       │
│ Department:    [Admissions            ]     │
│ Location:      [Hanoi, Vietnam        ]     │
│ Bio:           [Tell us about...      ]     │
│                                             │
│ [Save Changes]                              │
└─────────────────────────────────────────────┘
```

---

## 9. Role-Based Access Control

### Permission Matrix

| Permission | Admin | Manager | Counselor | Processor |
|------------|-------|---------|-----------|-----------|
| **Students** | | | | |
| View all students | ✓ | ✓ | ✗ | ✗ |
| View assigned students | ✓ | ✓ | ✓ | ✗ |
| Create students | ✓ | ✓ | ✓ | ✗ |
| Edit students | ✓ | ✓ | ✓ | ✗ |
| Delete students | ✓ | ✗ | ✗ | ✗ |
| **Documents** | | | | |
| View documents | ✓ | ✓ | ✓ | ✓ |
| Upload documents | ✓ | ✓ | ✓ | ✓ |
| Verify documents | ✓ | ✓ | ✓ | ✓ |
| Delete documents | ✓ | ✗ | ✗ | ✗ |
| **Knowledge Base** | | | | |
| View articles | ✓ | ✓ | ✓ | ✓ |
| Create articles | ✓ | ✓ | ✗ | ✗ |
| Edit articles | ✓ | ✓ | ✗ | ✗ |
| Delete articles | ✓ | ✗ | ✗ | ✗ |
| Access AI settings | ✓ | ✗ | ✗ | ✗ |
| **Pipeline** | | | | |
| View pipeline | ✓ | ✓ | ✓ | ✓ |
| Move students | ✓ | ✓ | ✓ | ✗ |
| Edit stages | ✓ | ✗ | ✗ | ✗ |
| **Analytics** | | | | |
| View analytics | ✓ | ✓ | ✓ | ✗ |
| View financials | ✓ | ✓ | ✗ | ✗ |
| **User Management** | | | | |
| View users | ✓ | ✓ | ✗ | ✗ |
| Invite users | ✓ | ✗ | ✗ | ✗ |
| Edit users | ✓ | ✗ | ✗ | ✗ |
| Delete users | ✓ | ✗ | ✗ | ✗ |
| **Settings** | | | | |
| Access settings | ✓ | ✓ | ✓ | ✓ |
| Manage settings | ✓ | ✗ | ✗ | ✗ |

### Permission Categories

1. **Students** (5 permissions)
   - `view_students`: View student list
   - `create_students`: Create new students
   - `edit_students`: Edit student records
   - `delete_students`: Delete students
   - `view_all_students`: View all students (not just assigned)

2. **Documents** (4 permissions)
   - `view_documents`: View documents
   - `upload_documents`: Upload new documents
   - `verify_documents`: Verify OCR results
   - `delete_documents`: Delete documents

3. **Knowledge Base** (5 permissions)
   - `view_knowledge`: View knowledge articles
   - `create_knowledge`: Create articles
   - `edit_knowledge`: Edit articles
   - `delete_knowledge`: Delete articles
   - `access_ai_settings`: Configure AI settings

4. **Pipeline** (3 permissions)
   - `view_pipeline`: View pipeline
   - `move_pipeline`: Move students in pipeline
   - `edit_pipeline`: Edit pipeline stages

5. **Analytics** (2 permissions)
   - `view_analytics`: View analytics
   - `view_financials`: View financial data

6. **User Management** (4 permissions)
   - `view_users`: View user list
   - `invite_users`: Invite new users
   - `edit_users`: Edit user roles
   - `delete_users`: Delete users

7. **Settings** (2 permissions)
   - `access_settings`: Access settings
   - `manage_settings`: Manage system settings

### Permission Enforcement

#### Application Level
```typescript
// Check permission in component
const { hasPermission } = useAuth();

if (hasPermission('create_students')) {
  // Show create button
}
```

#### Component Level
```tsx
<PermissionGuard permission="edit_students">
  <EditStudentButton />
</PermissionGuard>
```

#### Route Level
```tsx
<ProtectedRoute requiredPermissions={['view_analytics']}>
  <AnalyticsPage />
</ProtectedRoute>
```

#### Database Level (RLS)
```sql
-- RLS policy uses permission function
CREATE POLICY "students_create" ON students
FOR INSERT WITH CHECK (
  user_has_permission(auth.uid(), 'create_students')
);
```

---

## Feature Roadmap

### Completed ✅
- Authentication & Authorization
- Employee Management
- Student Management (Table + Kanban)
- Document Upload & OCR
- AI Chat Assistant
- Knowledge Base with Vector Search
- Analytics Dashboard
- Settings & Preferences
- RBAC System
- Audit Logging

### In Progress 🚧
- Email Templates & Automated Emails
- Advanced Analytics with AI Insights
- Mobile Responsive Improvements
- Performance Optimizations

### Planned 📅
- WhatsApp Integration
- Payment Gateway Integration
- Advanced Reporting
- Multi-language Support (Vietnamese)
- Student Portal (self-service)
- API Documentation
- Mobile App (React Native)

---

*Last Updated: April 2025*
