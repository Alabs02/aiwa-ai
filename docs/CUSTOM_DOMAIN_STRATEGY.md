# 🌐 Custom Domain & Subdomain Deployment Strategy

## Executive Summary

This document outlines a comprehensive strategy to implement:

1. **Custom domains** for user projects (e.g., `myapp.com`)
2. **AIWA subdomains** for generated apps (e.g., `sass-app.aiwa.live`)

**Current State**: Generated apps use v0's default domain (`*.vusercontent.net`)  
**Target State**: Apps use AIWA subdomains (`*.aiwa.live`) with optional custom domains

---

## 🎯 Goals

### Primary Goals

1. Replace `*.vusercontent.net` URLs with `*.aiwa.live` subdomains
2. Enable users to connect custom domains to their projects
3. Maintain seamless integration with v0 SDK
4. Leverage Vercel for deployment and domain management

### Secondary Goals

1. Automatic SSL certificate provisioning
2. Zero-downtime deployments
3. Preview deployments for each version
4. Analytics and monitoring per domain

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AIWA AI Platform                      │
│                     (www.aiwa.codes)                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─── User creates app
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    v0 API (Code Generation)                  │
│              Returns: chatId, versionId, files               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─── Download version files
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  AIWA Deployment Service                     │
│         (New microservice or API route)                      │
│                                                              │
│  1. Download files from v0 API                              │
│  2. Inject environment variables                            │
│  3. Deploy to Vercel                                        │
│  4. Map to subdomain (*.aiwa.live)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─── Deployment complete
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Deployed Applications                     │
│                                                              │
│  • Default: sass-app.aiwa.live                              │
│  • Custom: myapp.com (optional)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Strategy

### Phase 1: Subdomain Deployment (\*.aiwa.live)

#### Step 1.1: Set Up Vercel Integration

**What to do:**

1. Create a Vercel team account for AIWA AI
2. Set up Vercel API token with deployment permissions
3. Configure wildcard domain `*.aiwa.live` in Vercel

**How:**

```bash
# 1. In Vercel Dashboard:
#    - Go to Settings → Domains
#    - Add domain: aiwa.live
#    - Add wildcard: *.aiwa.live
#    - Configure DNS records (provided by Vercel)

# 2. DNS Configuration (at your domain registrar):
#    Add these records:
#    A     aiwa.live          → 76.76.21.21
#    CNAME *.aiwa.live        → cname.vercel-dns.com
```

**Vercel API Token:**

- Go to Vercel → Settings → Tokens
- Create token with `deployments:write` scope
- Store in environment variable: `VERCEL_API_TOKEN`

#### Step 1.2: Create Deployment Service

**File**: `examples/v0-clone/lib/deployment/vercel-deployer.ts`

**Purpose**: Handle deployment to Vercel with subdomain mapping

**Key Functions:**

```typescript
interface DeploymentConfig {
  chatId: string
  versionId: string
  projectName: string
  subdomain: string // e.g., "sass-app"
  envVars?: Record<string, string>
}

class VercelDeployer {
  // 1. Download files from v0 API
  async downloadVersionFiles(chatId: string, versionId: string): Promise<Files>

  // 2. Create Vercel project
  async createVercelProject(projectName: string): Promise<VercelProject>

  // 3. Deploy to Vercel
  async deployToVercel(
    files: Files,
    config: DeploymentConfig,
  ): Promise<Deployment>

  // 4. Map subdomain
  async mapSubdomain(deploymentId: string, subdomain: string): Promise<Domain>

  // 5. Complete deployment flow
  async deploy(config: DeploymentConfig): Promise<DeploymentResult>
}
```

#### Step 1.3: Create API Route for Deployment

**File**: `examples/v0-clone/app/api/deployments/create/route.ts`

**Purpose**: API endpoint to trigger deployment

**Flow:**

```typescript
POST /api/deployments/create
{
  "chatId": "abc123",
  "versionId": "v1",
  "subdomain": "sass-app", // Optional, auto-generate if not provided
  "projectId": "proj_123"  // Optional, for env vars
}

Response:
{
  "deploymentId": "dpl_xyz",
  "url": "https://sass-app.aiwa.live",
  "status": "building",
  "vercelDeploymentId": "dpl_vercel_123"
}
```

#### Step 1.4: Update Database Schema

**Add deployment tracking table:**

```sql
CREATE TABLE deployments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  chat_id VARCHAR(255) NOT NULL,
  version_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255),

  -- Deployment details
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  vercel_project_id VARCHAR(255),
  vercel_deployment_id VARCHAR(255),

  -- URLs
  deployment_url TEXT NOT NULL,
  preview_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'building', -- building, ready, error
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deployed_at TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_deployments_chat_version ON deployments(chat_id, version_id);
CREATE INDEX idx_deployments_subdomain ON deployments(subdomain);
CREATE INDEX idx_deployments_user ON deployments(user_id);
```

#### Step 1.5: Implement Subdomain Generation

**File**: `examples/v0-clone/lib/deployment/subdomain-generator.ts`

**Purpose**: Generate unique, memorable subdomains

**Strategy:**

```typescript
function generateSubdomain(chatName?: string, chatId?: string): string {
  // Option 1: Use chat name (sanitized)
  if (chatName) {
    const sanitized = chatName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30)

    // Add random suffix to ensure uniqueness
    const suffix = generateRandomString(6)
    return `${sanitized}-${suffix}`
  }

  // Option 2: Generate from chatId
  const hash = hashChatId(chatId)
  return `app-${hash}`

  // Option 3: Use memorable words (like Vercel)
  return `${randomAdjective()}-${randomNoun()}-${randomNumber()}`
}

// Examples:
// - "todo-app-x7k2m9"
// - "app-abc123def"
// - "happy-panda-42"
```

---

### Phase 2: Vercel Deployment Integration

#### Step 2.1: Vercel API Integration

**File**: `examples/v0-clone/lib/deployment/vercel-api.ts`

**Key Operations:**

```typescript
class VercelAPI {
  private token: string
  private teamId: string

  // 1. Create project
  async createProject(name: string): Promise<VercelProject> {
    return fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        framework: 'nextjs',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
      }),
    })
  }

  // 2. Create deployment
  async createDeployment(projectId: string, files: Files): Promise<Deployment> {
    // Convert files to Vercel format
    const vercelFiles = Object.entries(files).map(([path, content]) => ({
      file: path,
      data: Buffer.from(content).toString('base64'),
    }))

    return fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectId,
        files: vercelFiles,
        projectSettings: {
          framework: 'nextjs',
        },
        target: 'production',
      }),
    })
  }

  // 3. Add domain to project
  async addDomain(projectId: string, domain: string): Promise<Domain> {
    return fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
      }),
    })
  }

  // 4. Set environment variables
  async setEnvVars(
    projectId: string,
    envVars: Record<string, string>,
  ): Promise<void> {
    const envs = Object.entries(envVars).map(([key, value]) => ({
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview'],
    }))

    return fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ envs }),
    })
  }
}
```

#### Step 2.2: File Download from v0 API

**Use existing v0 SDK method:**

```typescript
async function downloadVersionFiles(
  chatId: string,
  versionId: string,
): Promise<Files> {
  // Use v0 SDK's downloadVersion method
  const archive = await v0.chats.downloadVersion({
    chatId,
    versionId,
    format: 'zip',
    includeDefaultFiles: true, // Include package.json, config files, etc.
  })

  // Extract files from archive
  const files = await extractZipFiles(archive)

  return files
}
```

#### Step 2.3: Environment Variable Injection

**File**: `examples/v0-clone/lib/deployment/env-injector.ts`

**Purpose**: Inject project environment variables into deployment

```typescript
async function injectEnvVars(files: Files, projectId: string): Promise<Files> {
  // 1. Get project env vars from database
  const envVars = await getProjectEnvVars(projectId)

  // 2. Create .env.local file
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  // 3. Add to files
  files['.env.local'] = envContent

  // 4. Also set in Vercel project settings
  // (handled by VercelAPI.setEnvVars)

  return files
}
```

---

### Phase 3: Custom Domain Support

#### Step 3.1: Domain Verification

**File**: `examples/v0-clone/lib/deployment/domain-verifier.ts`

**Purpose**: Verify domain ownership before connecting

```typescript
class DomainVerifier {
  // 1. Generate verification token
  async generateVerificationToken(domain: string): Promise<string> {
    const token = generateSecureToken()

    // Store in database
    await db.insert(domain_verifications).values({
      domain,
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })

    return token
  }

  // 2. Verify domain ownership
  async verifyDomain(domain: string): Promise<boolean> {
    const verification = await db.query.domain_verifications.findFirst({
      where: eq(domain_verifications.domain, domain),
    })

    if (!verification) return false

    // Check TXT record
    const txtRecords = await dns.resolveTxt(domain)
    const hasToken = txtRecords.some((record) =>
      record.includes(`aiwa-verification=${verification.token}`),
    )

    if (hasToken) {
      // Update status
      await db
        .update(domain_verifications)
        .set({ status: 'verified', verified_at: new Date() })
        .where(eq(domain_verifications.domain, domain))

      return true
    }

    return false
  }
}
```

#### Step 3.2: Domain Connection Flow

**User Flow:**

1. User clicks "Connect Custom Domain"
2. Enter domain name (e.g., `myapp.com`)
3. System generates verification token
4. User adds TXT record to DNS: `aiwa-verification=token123`
5. User clicks "Verify Domain"
6. System verifies TXT record
7. System adds domain to Vercel project
8. System provides DNS configuration (A/CNAME records)
9. User updates DNS records
10. Domain is live!

**API Route**: `examples/v0-clone/app/api/deployments/[id]/domains/route.ts`

```typescript
POST /api/deployments/{deploymentId}/domains
{
  "domain": "myapp.com"
}

Response:
{
  "verificationToken": "aiwa_verify_abc123",
  "txtRecord": {
    "name": "@",
    "type": "TXT",
    "value": "aiwa-verification=aiwa_verify_abc123"
  },
  "status": "pending_verification"
}

---

GET /api/deployments/{deploymentId}/domains/{domain}/verify

Response:
{
  "verified": true,
  "dnsRecords": [
    {
      "type": "A",
      "name": "@",
      "value": "76.76.21.21"
    },
    {
      "type": "CNAME",
      "name": "www",
      "value": "cname.vercel-dns.com"
    }
  ],
  "status": "verified"
}
```

---

### Phase 4: UI Integration

#### Step 4.1: Deployment Button in Chat Interface

**File**: `examples/v0-clone/components/chat/deployment-button.tsx`

**Features:**

- "Deploy to AIWA" button in chat interface
- Shows deployment status (building, ready, error)
- Displays deployment URL
- Option to connect custom domain

```typescript
function DeploymentButton({ chatId, versionId }: Props) {
  const [deploying, setDeploying] = useState(false)
  const [deployment, setDeployment] = useState<Deployment | null>(null)

  async function handleDeploy() {
    setDeploying(true)

    const response = await fetch('/api/deployments/create', {
      method: 'POST',
      body: JSON.stringify({ chatId, versionId })
    })

    const result = await response.json()
    setDeployment(result)

    // Poll for deployment status
    pollDeploymentStatus(result.deploymentId)
  }

  return (
    <div>
      {!deployment && (
        <Button onClick={handleDeploy} disabled={deploying}>
          {deploying ? 'Deploying...' : 'Deploy to AIWA'}
        </Button>
      )}

      {deployment && (
        <DeploymentStatus deployment={deployment} />
      )}
    </div>
  )
}
```

#### Step 4.2: Deployment Management Page

**File**: `examples/v0-clone/app/deployments/page.tsx`

**Features:**

- List all user deployments
- Deployment status and URLs
- Custom domain management
- Deployment settings (env vars, etc.)
- Analytics and logs

---

## 🔄 Complete Deployment Flow

### Automatic Deployment (Recommended)

```
1. User generates app in chat
   ↓
2. v0 API creates chat and version
   ↓
3. AIWA automatically triggers deployment:
   - Download files from v0 API
   - Generate subdomain (e.g., "todo-app-x7k2m9")
   - Inject environment variables
   - Deploy to Vercel
   - Map subdomain (todo-app-x7k2m9.aiwa.live)
   ↓
4. User sees deployment URL in chat
   ↓
5. User can optionally connect custom domain
```

### Manual Deployment (Alternative)

```
1. User generates app in chat
   ↓
2. User clicks "Deploy" button
   ↓
3. Deployment modal opens:
   - Choose subdomain (auto-generated or custom)
   - Select project (for env vars)
   - Configure settings
   ↓
4. User clicks "Deploy"
   ↓
5. Deployment process starts
   ↓
6. User sees deployment URL
```

---

## 💾 Database Schema Updates

```sql
-- Deployments table
CREATE TABLE deployments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  chat_id VARCHAR(255) NOT NULL,
  version_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255),

  -- Deployment details
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  vercel_project_id VARCHAR(255),
  vercel_deployment_id VARCHAR(255),

  -- URLs
  deployment_url TEXT NOT NULL,
  preview_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'building',
  error_message TEXT,
  build_logs TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deployed_at TIMESTAMP,

  UNIQUE(chat_id, version_id)
);

-- Domain verifications table
CREATE TABLE domain_verifications (
  id SERIAL PRIMARY KEY,
  deployment_id INTEGER REFERENCES deployments(id),
  domain VARCHAR(255) UNIQUE NOT NULL,
  token VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed

  -- DNS records
  txt_record_verified BOOLEAN DEFAULT FALSE,
  a_record_verified BOOLEAN DEFAULT FALSE,
  cname_record_verified BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Deployment logs table (optional)
CREATE TABLE deployment_logs (
  id SERIAL PRIMARY KEY,
  deployment_id INTEGER REFERENCES deployments(id),
  log_level VARCHAR(20), -- info, warning, error
  message TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Security Considerations

### 1. Subdomain Isolation

- Each deployment runs in isolated Vercel project
- No cross-contamination between deployments
- Separate environment variables per deployment

### 2. Domain Verification

- Require TXT record verification before connecting custom domains
- Prevent domain hijacking
- Expire verification tokens after 24 hours

### 3. Access Control

- Users can only deploy their own chats
- Users can only manage their own deployments
- Rate limiting on deployment creation

### 4. Environment Variables

- Encrypt env vars in database
- Never expose in logs or error messages
- Inject securely during deployment

---

## 💰 Cost Considerations

### Vercel Pricing

- **Pro Plan**: $20/month per member
  - Unlimited deployments
  - 100GB bandwidth
  - Custom domains
  - Team collaboration

- **Enterprise**: Custom pricing
  - Dedicated support
  - SLA guarantees
  - Advanced security

### Estimated Costs

- **100 deployments/month**: ~$20-50/month
- **1,000 deployments/month**: ~$100-200/month
- **10,000 deployments/month**: Enterprise plan

### Cost Optimization

1. **Deployment Limits**: Limit deployments per user tier
   - Free: 3 deployments
   - Pro: 50 deployments
   - Ultimate: Unlimited

2. **Cleanup**: Auto-delete inactive deployments after 30 days

3. **Shared Projects**: Use single Vercel project with multiple domains (if possible)

---

## 📈 Monitoring & Analytics

### Deployment Metrics

- Total deployments
- Success/failure rate
- Average deployment time
- Active deployments
- Bandwidth usage

### Domain Metrics

- Custom domains connected
- Domain verification success rate
- SSL certificate status
- DNS propagation time

### User Metrics

- Deployments per user
- Most deployed chats
- Popular subdomains
- Custom domain adoption rate

---

## 🚀 Implementation Timeline

### Week 1: Foundation

- [ ] Set up Vercel team and wildcard domain
- [ ] Create database schema
- [ ] Implement VercelAPI class
- [ ] Implement file download from v0 API

### Week 2: Core Deployment

- [ ] Implement VercelDeployer class
- [ ] Create deployment API routes
- [ ] Implement subdomain generation
- [ ] Add deployment tracking to database

### Week 3: UI Integration

- [ ] Add deployment button to chat interface
- [ ] Create deployment status component
- [ ] Build deployment management page
- [ ] Add deployment list to user dashboard

### Week 4: Custom Domains

- [ ] Implement domain verification
- [ ] Create domain connection flow
- [ ] Add DNS configuration UI
- [ ] Test custom domain setup

### Week 5: Testing & Polish

- [ ] End-to-end testing
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Documentation

---

## 🎯 Success Criteria

### Phase 1 Success (Subdomains)

- ✅ All new deployments use `*.aiwa.live` subdomains
- ✅ No more `*.vusercontent.net` URLs
- ✅ Deployment success rate > 95%
- ✅ Average deployment time < 2 minutes

### Phase 2 Success (Custom Domains)

- ✅ Users can connect custom domains
- ✅ Domain verification works reliably
- ✅ SSL certificates auto-provision
- ✅ Custom domain adoption rate > 10%

---

## 📝 Next Steps

1. **Review this strategy** with the team
2. **Set up Vercel account** and configure wildcard domain
3. **Create proof of concept** with single deployment
4. **Implement Phase 1** (subdomain deployment)
5. **Test thoroughly** before rolling out to users
6. **Implement Phase 2** (custom domains)
7. **Monitor and optimize** based on usage

---

**Document Version**: 1.0  
**Last Updated**: November 30, 2025  
**Author**: Alabs02  
**Status**: Ready for Implementation
