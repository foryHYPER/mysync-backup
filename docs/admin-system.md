# mySync Admin System Documentation

## Overview

The mySync admin system is a comprehensive administrative interface for managing the entire recruitment platform. It provides administrators with powerful tools to oversee users, companies, candidates, job postings, system security, and platform analytics.

## Architecture & Access Control

### Authentication & Authorization
- **Admin Access**: Only users with `role = 'admin'` in the `profiles` table can access admin routes
- **Route Protection**: All admin routes are under `/dashboard/admin/*` and protected by middleware
- **Navigation**: Role-based sidebar navigation with collapsible subroutes

### Route Structure
```
/dashboard/admin/
├── dashboard/          # Main admin dashboard with overview metrics
├── users/             # User management section
│   ├── candidates/    # Candidate user management
│   ├── companies/     # Company user management
│   └── admins/        # Admin user management
├── companies/         # Company-specific management
│   └── onboarding/    # Company onboarding pipeline
├── candidates/        # Candidate-specific management
│   └── quality/       # Candidate quality control
├── resumes/           # Resume management and analysis
├── reports/           # Analytics and reporting
│   ├── activity/      # User activity reports
│   ├── matching/      # Matching algorithm reports
│   └── export/        # Data export functionality
└── system/            # System administration
    ├── settings/      # Platform configuration
    ├── audit/         # Audit logging and compliance
    └── security/      # Security monitoring and threat management
```

## Feature Documentation

### 1. Main Dashboard (`/dashboard/admin`)
**Purpose**: Central overview of platform health and key metrics

**Current Implementation**:
- Real-time statistics from database queries
- Key performance indicators (KPIs)
- Recent activity feed
- Quick action buttons
- System status indicators

**Database Integration**: ✅ **IMPLEMENTED**
- Uses real data from `profiles`, `companies`, `candidates`, `job_postings` tables
- Calculates metrics using aggregate queries

### 2. User Management (`/dashboard/admin/users/*`)

#### 2.1 Candidates Management (`/users/candidates`)
**Purpose**: Comprehensive candidate user administration

**Features**:
- User listings with advanced filtering
- Profile verification status
- Account status management (active/inactive/suspended)
- Bulk operations support
- Individual candidate detailed modals

**Database Integration**: ✅ **IMPLEMENTED** 
- Real data from `candidates` and `profiles` tables
- Real-time filtering and search

#### 2.2 Companies Management (`/users/companies`) 
**Purpose**: Company user administration and account management

**Features**:
- Company account listings
- Onboarding status tracking
- Account verification workflow
- Subscription status monitoring
- Company profile management

**Database Integration**: ✅ **IMPLEMENTED**
- Real data from `companies` and `profiles` tables
- Joins for comprehensive company information

#### 2.3 Admins Management (`/users/admins`)
**Purpose**: Administrative user management and permissions

**Features**:
- Admin user listings
- Role and permission management
- Last activity tracking
- Admin account creation/modification

**Database Integration**: ✅ **IMPLEMENTED**
- Real data from `profiles` table filtered by `role = 'admin'`

### 3. Company Management (`/dashboard/admin/companies/*`)

#### 3.1 Company Onboarding (`/companies/onboarding`)
**Purpose**: Manage company registration and onboarding pipeline

**Features**:
- Onboarding status tracking (pending, in_review, approved, rejected, incomplete)
- Document verification workflow
- Profile completeness scoring
- Reviewer notes and approval/rejection workflow
- Timeline tracking and processing metrics

**Current Implementation**: ⚠️ **MOCK DATA USED**

**Database Requirements**:
```sql
-- Additional columns needed in companies table:
ALTER TABLE companies ADD COLUMN IF NOT EXISTS onboarding_status TEXT 
  DEFAULT 'pending' 
  CHECK (onboarding_status IN ('pending','in_review','approved','rejected','incomplete'));

ALTER TABLE companies ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;
```

### 4. Candidate Management (`/dashboard/admin/candidates/*`)

#### 4.1 Candidate Quality Control (`/candidates/quality`)
**Purpose**: Monitor and manage candidate profile quality and verification

**Features**:
- Quality scoring system (0-100)
- Profile completeness tracking
- Verification status management (verified, pending, failed)
- Red flag system for problematic profiles
- Performance metrics (match success rate, employer feedback)
- Bulk quality actions

**Current Implementation**: ⚠️ **MOCK DATA USED**

**Database Requirements**:
```sql
-- Additional columns needed in candidates table:
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS verification_status TEXT 
  DEFAULT 'pending' 
  CHECK (verification_status IN ('verified','pending','failed'));
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS red_flags JSONB DEFAULT '[]';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS resume_quality TEXT 
  CHECK (resume_quality IN ('excellent','good','needs_improvement','poor'));
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS match_success_rate INTEGER DEFAULT 0;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS employer_feedback_score DECIMAL(2,1) DEFAULT 0;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_level TEXT;
```

### 5. Resume Management (`/dashboard/admin/resumes`)
**Purpose**: Comprehensive resume management, analysis, and quality control

**Features**:
- Resume upload tracking and management
- Automated quality scoring and analysis
- Skills extraction and validation
- File management (download, preview)
- Approval/rejection workflow
- Language detection and experience analysis

**Current Implementation**: ⚠️ **MOCK DATA USED**

**Database Requirements**:
```sql
-- New table needed:
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','approved','rejected','under_review')),
  quality_score INTEGER DEFAULT 0,
  skills_extracted JSONB DEFAULT '[]',
  experience_years INTEGER DEFAULT 0,
  education_level TEXT,
  languages JSONB DEFAULT '[]',
  analysis_complete BOOLEAN DEFAULT FALSE,
  reviewer_notes TEXT,
  download_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6. Reports & Analytics (`/dashboard/admin/reports/*`)

#### 6.1 Main Reports Dashboard (`/reports`)
**Purpose**: Central analytics hub with key performance indicators

**Features**:
- User growth analytics
- Platform engagement metrics
- Revenue and subscription tracking
- Geographic distribution analysis
- Performance trends and forecasting

**Database Integration**: ✅ **IMPLEMENTED**
- Real analytics from existing tables

#### 6.2 Activity Reports (`/reports/activity`)
**Purpose**: Detailed user activity monitoring and engagement analysis

**Features**:
- User activity tracking and trends
- Session duration analytics
- Feature usage statistics
- Login/logout pattern analysis
- Activity heatmaps and visualizations

**Current Implementation**: ⚠️ **MOCK DATA USED**

**Database Requirements**:
```sql
-- New table needed:
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_details JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 6.3 Matching Reports (`/reports/matching`)
**Purpose**: Analyze matching algorithm performance and efficiency

**Features**:
- Match success rate analytics
- Algorithm performance metrics
- Quality score distribution analysis
- Industry-specific matching trends
- Matching efficiency optimization insights

**Current Implementation**: ⚠️ **MOCK DATA USED**
- Uses real `candidate_matches` table but enhances with mock analytics

#### 6.4 Data Export (`/reports/export`)
**Purpose**: Data export functionality for compliance and analysis

**Features**:
- Multi-format export (CSV, JSON, PDF)
- Scheduled export functionality
- Export history and tracking
- Compliance reporting
- Custom date range selection

**Current Implementation**: ⚠️ **MOCK DATA USED**

**Database Requirements**:
```sql
-- New table needed:
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv','json','pdf')),
  file_url TEXT,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','processing','completed','failed')),
  parameters JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### 7. System Administration (`/dashboard/admin/system/*`)

#### 7.1 System Settings (`/system/settings`)
**Purpose**: Platform-wide configuration management

**Features**:
- General platform settings (name, description, maintenance mode)
- Authentication & security configuration
- Notification preferences and templates
- Matching algorithm parameters
- Data retention and backup policies
- API rate limiting and integrations

**Current Implementation**: ⚠️ **MOCK DATA USED**

**Database Requirements**:
```sql
-- New table needed:
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL CHECK (data_type IN ('string','number','boolean','object','array')),
  is_sensitive BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category, setting_key)
);
```

#### 7.2 Audit Logging (`/system/audit`)
**Purpose**: Comprehensive system activity logging and compliance tracking

**Features**:
- Detailed audit trail with 500+ entries
- Advanced filtering by date, severity, resource type
- User activity tracking with IP and session information
- System event monitoring
- Compliance reporting and export functionality

**Current Implementation**: ⚠️ **ENHANCED MOCK DATA** 
- Uses existing `audit_logs` table but enhances with additional mock fields

**Database Enhancement Requirements**:
```sql
-- Enhance existing audit_logs table:
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity TEXT 
  DEFAULT 'info' 
  CHECK (severity IN ('info','warning','error','critical'));
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
```

#### 7.3 Security Management (`/system/security`)
**Purpose**: Advanced security monitoring and threat management

**Features**:
- **Security Threats Tab**: Real-time threat detection and analysis
  - 200+ mock security threats with different types (brute force, DDoS, SQL injection, XSS, malware)
  - Severity assessment (low, medium, high, critical)
  - Geographic threat analysis
  - Automated and manual blocking capabilities
- **Blocked IPs Tab**: IP blocking management
  - 50+ blocked IP addresses with reasons
  - Temporary and permanent blocking options
  - Expiration management and automatic unblocking
- Comprehensive metrics and risk assessment
- Manual IP blocking with reason tracking

**Current Implementation**: ⚠️ **MOCK DATA USED**

**Database Requirements**:
```sql
-- New tables needed:
CREATE TABLE IF NOT EXISTS security_threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  country TEXT,
  threat_type TEXT NOT NULL CHECK (threat_type IN (
    'brute_force','ddos','sql_injection','xss','suspicious_activity','malware'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempt_count INTEGER DEFAULT 1,
  blocked BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  description TEXT,
  auto_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  permanent BOOLEAN DEFAULT FALSE,
  attempts_before_block INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Technical Implementation Details

### Database Integration Status

#### ✅ Fully Integrated (Using Real Database Data)
- Main Admin Dashboard
- User Management (Candidates, Companies, Admins)
- Reports Dashboard

#### ⚠️ Mock Data Used (Requires Database Integration)
- Company Onboarding Pipeline
- Candidate Quality Control
- Resume Management System
- Activity Reports
- Matching Algorithm Reports
- Data Export System
- System Settings Management
- Security Threat Management
- Enhanced Audit Logging

### Navigation System

The admin navigation uses a sophisticated collapsible system implemented in `components/nav-main.tsx`:

```typescript
// Enhanced navigation structure with subroutes
type NavItem = {
  title: string;
  url: string;
  icon: any;
  items?: NavItem[]; // Subroutes support
};

// Auto-expansion when subroutes are active
const isItemActive = (item: NavItem): boolean => {
  if (pathname === item.url) return true;
  if (item.items) {
    return item.items.some(subItem => pathname === subItem.url);
  }
  return false;
};
```

### Data Flow Architecture

1. **Real-time Metrics**: Uses `Promise.all()` for parallel database queries
2. **Advanced Filtering**: Client-side filtering with search, status, and date range filters
3. **Modal System**: Comprehensive detail modals with action capabilities
4. **Toast Notifications**: User feedback for all CRUD operations
5. **Responsive Design**: Mobile-friendly interfaces with proper breakpoints

### Security & Performance

- **Row Level Security (RLS)**: All admin routes respect existing RLS policies
- **Parallel Queries**: Multiple database queries executed simultaneously for performance
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Professional loading indicators throughout the interface

## Migration Plan for Database Integration

### Phase 1: Core Tables Enhancement
1. Update `companies` table with onboarding fields
2. Update `candidates` table with quality control fields
3. Create `resumes` table for file management

### Phase 2: Analytics & Reporting
1. Create `user_activities` table for activity tracking
2. Create `data_exports` table for export management
3. Enhance `candidate_matches` for better analytics

### Phase 3: System Administration
1. Create `system_settings` table for configuration
2. Enhance `audit_logs` table with additional fields
3. Create security tables (`security_threats`, `blocked_ips`)

### Phase 4: Integration & Testing
1. Replace mock data with real database queries
2. Implement real-time data updates
3. Add comprehensive error handling
4. Performance optimization and testing

## File Structure

```
app/dashboard/admin/
├── page.tsx                    # Main dashboard ✅
├── users/
│   ├── candidates/page.tsx     # Candidate management ✅
│   ├── companies/page.tsx      # Company management ✅
│   └── admins/page.tsx         # Admin management ✅
├── companies/
│   └── onboarding/page.tsx     # Onboarding pipeline ⚠️
├── candidates/
│   └── quality/page.tsx        # Quality control ⚠️
├── resumes/page.tsx            # Resume management ⚠️
├── reports/
│   ├── page.tsx                # Reports dashboard ✅
│   ├── activity/page.tsx       # Activity reports ⚠️
│   ├── matching/page.tsx       # Matching reports ⚠️
│   └── export/page.tsx         # Data export ⚠️
└── system/
    ├── settings/page.tsx       # System settings ⚠️
    ├── audit/page.tsx          # Audit logging ⚠️
    └── security/page.tsx       # Security management ⚠️
```

**Legend:**
- ✅ = Fully implemented with real database integration
- ⚠️ = Implemented with mock data, requires database integration

## Conclusion

The mySync admin system provides a comprehensive, enterprise-grade administrative interface with 13 fully functional routes. The system is built with scalability, security, and user experience in mind. While core functionality uses real database integration, several advanced features currently use mock data and require database schema enhancements for full production deployment.

---
*Last Updated: December 2024* 