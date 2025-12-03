# Design Document: Custom Domain Management for AIWA Deployments

## Overview

This design implements a comprehensive custom domain management system for AIWA deployments. The system will:

- Automatically assign memorable subdomains on `*.aiwacodes.com`
- Allow users to add custom domains to their deployments
- Integrate with Vercel's domain API for DNS and SSL management
- Track domain status and provide verification workflows

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AIWA Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   Chat UI    │─────▶│ Deployment   │                     │
│  │              │      │   Creation   │                     │
│  └──────────────┘      └──────┬───────┘                     │
│                               │                              │
│                               ▼                              │
│                    ┌──────────────────┐                     │
│                    │  Domain Manager  │                     │
│                    │  - Generate slug │                     │
│                    │  - Assign domain │                     │
│                    │  - Track status  │                     │
│                    └────────┬─────────┘                     │
│                             │                                │
│         ┌───────────────────┼───────────────────┐          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │  Database   │   │  Vercel API  │   │  DNS Check   │   │
│  │  - domains  │   │  - Add domain│   │  - Verify    │   │
│  │  - deploys  │   │  - Get status│   │  - Monitor   │   │
│  └─────────────┘   └──────────────┘   └──────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend Components                      │
├────────────────────────────────────────────────────────────┤
│  - DeploymentDomainSettings                                │
│  - AddCustomDomainModal                                    │
│  - DomainStatusBadge                                       │
│  - DNSInstructionsPanel                                    │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                      API Routes                             │
├────────────────────────────────────────────────────────────┤
│  POST   /api/deployments/[id]/domains                      │
│  GET    /api/deployments/[id]/domains                      │
│  DELETE /api/deployments/[id]/domains/[domainId]           │
│  POST   /api/deployments/[id]/domains/[domainId]/verify    │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
├────────────────────────────────────────────────────────────┤
│  - DomainService                                           │
│    • generateSubdomainSlug()                               │
│    • assignAIWADomain()                                    │
│    • addCustomDomain()                                     │
│    • verifyDomain()                                        │
│    • removeDomain()                                        │
│  - VercelDomainClient                                      │
│    • addDomainToProject()                                  │
│    • getDomainStatus()                                     │
│    • removeDomainFromProject()                             │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
├────────────────────────────────────────────────────────────┤
│  - deployments table                                       │
│  - deployment_domains table                                │
│  - Domain queries (CRUD operations)                        │
└────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema

#### deployments table

```typescript
export const deployments = pgTable('deployments', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id),

  // V0 identifiers
  v0_deployment_id: varchar('v0_deployment_id', { length: 255 })
    .notNull()
    .unique(),
  v0_project_id: varchar('v0_project_id', { length: 255 }).notNull(),
  v0_chat_id: varchar('v0_chat_id', { length: 255 }).notNull(),
  v0_version_id: varchar('v0_version_id', { length: 255 }).notNull(),

  // Deployment metadata
  name: varchar('name', { length: 255 }),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('active'),

  // URLs
  inspector_url: varchar('inspector_url', { length: 512 }),
  default_url: varchar('default_url', { length: 512 }),

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})
```

#### deployment_domains table

```typescript
export const deployment_domains = pgTable('deployment_domains', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  deployment_id: uuid('deployment_id')
    .notNull()
    .references(() => deployments.id, { onDelete: 'cascade' }),

  // Domain details
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(), // 'aiwa' | 'custom'
  is_primary: varchar('is_primary', { length: 10 }).notNull().default('false'),

  // Status tracking
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // Status values: pending, verifying, active, error, removed

  // Verification
  verification_token: varchar('verification_token', { length: 255 }),
  verification_method: varchar('verification_method', { length: 50 }),
  verified_at: timestamp('verified_at'),

  // SSL
  ssl_status: varchar('ssl_status', { length: 20 }),
  ssl_issued_at: timestamp('ssl_issued_at'),

  // Error tracking
  error_message: text('error_message'),
  last_checked_at: timestamp('last_checked_at'),

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})
```

### 2. TypeScript Interfaces

```typescript
// Domain types
export type DomainType = 'aiwa' | 'custom'
export type DomainStatus =
  | 'pending'
  | 'verifying'
  | 'active'
  | 'error'
  | 'removed'
export type SSLStatus = 'pending' | 'issued' | 'failed'

export interface DeploymentDomain {
  id: string
  deployment_id: string
  domain: string
  type: DomainType
  is_primary: boolean
  status: DomainStatus
  verification_token?: string
  verification_method?: string
  verified_at?: Date
  ssl_status?: SSLStatus
  ssl_issued_at?: Date
  error_message?: string
  last_checked_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Deployment {
  id: string
  user_id: string
  v0_deployment_id: string
  v0_project_id: string
  v0_chat_id: string
  v0_version_id: string
  name?: string
  description?: string
  status: string
  inspector_url?: string
  default_url?: string
  created_at: Date
  updated_at: Date
  domains?: DeploymentDomain[]
}

// API request/response types
export interface AddDomainRequest {
  domain: string
  type: DomainType
}

export interface AddDomainResponse {
  domain: DeploymentDomain
  dns_instructions?: DNSInstructions
}

export interface DNSInstructions {
  records: DNSRecord[]
  estimated_propagation_time: string
}

export interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
  ttl?: number
}
```

### 3. Service Layer

#### DomainService

```typescript
export class DomainService {
  /**
   * Generates a URL-safe subdomain slug from a name
   */
  generateSubdomainSlug(name: string, existingSlugs: string[]): string {
    // 1. Convert to lowercase
    // 2. Replace spaces with hyphens
    // 3. Remove special characters
    // 4. Truncate to 63 characters
    // 5. Check uniqueness, append random suffix if needed
  }

  /**
   * Assigns an AIWA subdomain to a deployment
   */
  async assignAIWADomain(
    deploymentId: string,
    projectName: string,
  ): Promise<DeploymentDomain> {
    // 1. Generate slug
    // 2. Create domain record in DB
    // 3. Configure domain on Vercel
    // 4. Update status to active
  }

  /**
   * Adds a custom domain to a deployment
   */
  async addCustomDomain(
    deploymentId: string,
    domain: string,
    userId: string,
  ): Promise<{ domain: DeploymentDomain; instructions: DNSInstructions }> {
    // 1. Validate domain format
    // 2. Check for conflicts
    // 3. Create domain record in DB
    // 4. Add domain to Vercel project
    // 5. Generate DNS instructions
    // 6. Return domain + instructions
  }

  /**
   * Verifies domain ownership and checks SSL status
   */
  async verifyDomain(domainId: string): Promise<DeploymentDomain> {
    // 1. Get domain from DB
    // 2. Check Vercel domain status
    // 3. Update DB with verification status
    // 4. Check SSL certificate status
    // 5. Return updated domain
  }

  /**
   * Removes a domain from a deployment
   */
  async removeDomain(domainId: string, userId: string): Promise<void> {
    // 1. Verify ownership
    // 2. Remove from Vercel
    // 3. Update DB status to 'removed'
  }
}
```

#### VercelDomainClient

```typescript
export class VercelDomainClient {
  private apiKey: string
  private teamId?: string

  /**
   * Adds a domain to a Vercel project
   */
  async addDomainToProject(
    projectId: string,
    domain: string,
  ): Promise<VercelDomainResponse> {
    // POST https://api.vercel.com/v9/projects/{projectId}/domains
  }

  /**
   * Gets domain configuration and verification status
   */
  async getDomainStatus(
    projectId: string,
    domain: string,
  ): Promise<VercelDomainStatus> {
    // GET https://api.vercel.com/v9/projects/{projectId}/domains/{domain}
  }

  /**
   * Removes a domain from a Vercel project
   */
  async removeDomainFromProject(
    projectId: string,
    domain: string,
  ): Promise<void> {
    // DELETE https://api.vercel.com/v9/projects/{projectId}/domains/{domain}
  }

  /**
   * Gets DNS records required for domain verification
   */
  async getDNSRecords(projectId: string, domain: string): Promise<DNSRecord[]> {
    // Parse from domain status response
  }
}
```

## Data Models

### Domain Status State Machine

```
┌─────────┐
│ pending │ ──────────────────────────────────┐
└────┬────┘                                    │
     │                                         │
     │ User adds domain                        │
     ▼                                         │
┌──────────┐                                   │
│verifying │                                   │
└────┬─────┘                                   │
     │                                         │
     │ DNS records detected                    │
     ▼                                         │
┌────────┐                                     │
│ active │                                     │
└────┬───┘                                     │
     │                                         │
     │ Error occurs                            │
     ▼                                         │
┌───────┐                                      │
│ error │ ─────────────────────────────────────┘
└───────┘      Retry or remove
```

### Subdomain Slug Generation Algorithm

```typescript
function generateSubdomainSlug(name: string, existingSlugs: string[]): string {
  // Step 1: Normalize
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // remove special chars
    .replace(/^-+|-+$/g, '') // trim hyphens
    .substring(0, 63) // DNS limit

  // Step 2: Handle empty slug
  if (!slug) {
    slug = 'app-' + generateRandomId(8)
  }

  // Step 3: Ensure uniqueness
  if (existingSlugs.includes(slug)) {
    const suffix = generateRandomId(6)
    slug = `${slug.substring(0, 57)}-${suffix}`
  }

  return slug
}
```

## Error Handling

### Error Types

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public code: DomainErrorCode,
    public details?: any,
  ) {
    super(message)
  }
}

export enum DomainErrorCode {
  INVALID_FORMAT = 'invalid_format',
  ALREADY_EXISTS = 'already_exists',
  VERIFICATION_FAILED = 'verification_failed',
  SSL_PROVISIONING_FAILED = 'ssl_provisioning_failed',
  VERCEL_API_ERROR = 'vercel_api_error',
  UNAUTHORIZED = 'unauthorized',
  NOT_FOUND = 'not_found',
}
```

### Error Handling Strategy

1. **Validation Errors**: Return 400 with specific error message
2. **Conflict Errors**: Return 409 when domain already exists
3. **Vercel API Errors**: Log full error, return user-friendly message
4. **Verification Failures**: Store error in DB, allow retry
5. **SSL Failures**: Mark domain as active but show SSL warning

## Testing Strategy

### Unit Tests

1. **Subdomain Slug Generation**
   - Test normalization (spaces, special chars, case)
   - Test uniqueness handling
   - Test edge cases (empty, very long names)
   - Test DNS naming convention compliance

2. **Domain Validation**
   - Test valid domain formats
   - Test invalid formats (spaces, invalid TLDs)
   - Test reserved subdomains

3. **Vercel Client**
   - Mock API responses
   - Test error handling
   - Test retry logic

### Integration Tests

1. **Full Domain Assignment Flow**
   - Create deployment
   - Assign AIWA subdomain
   - Verify domain in DB
   - Check Vercel configuration

2. **Custom Domain Flow**
   - Add custom domain
   - Get DNS instructions
   - Simulate DNS verification
   - Check SSL provisioning

### Property-Based Tests

None required for this feature (primarily CRUD and API integration).

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Subdomain Uniqueness

_For any_ generated subdomain slug, it should not conflict with any existing domain in the `deployment_domains` table.
**Validates: Requirements 1.3, 4.4**

### Property 2: Domain Format Validity

_For any_ domain added to the system, it should match DNS naming conventions (lowercase, alphanumeric, hyphens, valid TLD).
**Validates: Requirements 2.2, 12.2**

### Property 3: Ownership Verification

_For any_ domain operation (add, remove, verify), the requesting user should own the associated deployment.
**Validates: Requirements 10.6, 12.4**

### Property 4: Status Consistency

_For any_ domain record, if status is "active", then `verified_at` should not be null.
**Validates: Requirements 3.1, 3.5**

### Property 5: Primary Domain Uniqueness

_For any_ deployment, there should be at most one domain marked as `is_primary: true`.
**Validates: Requirements 1.6, 9.3**

### Property 6: Cascade Deletion

_For any_ deployment deletion, all associated domain records should be removed from both database and Vercel.
**Validates: Requirements 6.7, 9.6**

### Property 7: DNS Record Completeness

_For any_ custom domain in "verifying" status, the system should provide all required DNS records (A/CNAME + TXT for verification).
**Validates: Requirements 7.1, 7.2, 7.5**

### Property 8: Slug Generation Determinism

_For any_ given project name and set of existing slugs, the slug generation function should produce the same result when called multiple times.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 9: Domain Conflict Prevention

_For any_ domain being added, if it already exists in the system for a different user, the operation should fail with a conflict error.
**Validates: Requirements 8.2, 12.4**

### Property 10: Automatic AIWA Domain Assignment

_For any_ new deployment created, an AIWA subdomain should be automatically assigned and marked as primary.
**Validates: Requirements 11.1, 11.3**

## Implementation Plan

### Phase 1: Database Schema & Migrations (Week 1)

1. Create `deployments` table
2. Create `deployment_domains` table
3. Add indexes for performance
4. Create migration scripts
5. Update schema.ts with new types

### Phase 2: Core Domain Service (Week 1-2)

1. Implement `generateSubdomainSlug()`
2. Implement domain validation functions
3. Create `DomainService` class
4. Add database query functions
5. Write unit tests for slug generation

### Phase 3: Vercel API Integration (Week 2)

1. Create `VercelDomainClient` class
2. Implement domain addition API call
3. Implement domain status checking
4. Implement domain removal
5. Add error handling and retries
6. Write integration tests with mocked Vercel API

### Phase 4: API Routes (Week 2-3)

1. Create `POST /api/deployments/[id]/domains`
2. Create `GET /api/deployments/[id]/domains`
3. Create `DELETE /api/deployments/[id]/domains/[domainId]`
4. Create `POST /api/deployments/[id]/domains/[domainId]/verify`
5. Add authentication middleware
6. Add ownership verification
7. Write API integration tests

### Phase 5: Automatic Domain Assignment (Week 3)

1. Modify deployment creation flow
2. Add automatic AIWA subdomain assignment
3. Update chat API to trigger domain assignment
4. Add retry logic for failures
5. Test end-to-end deployment flow

### Phase 6: Frontend Components (Week 3-4)

1. Create `DeploymentDomainSettings` component
2. Create `AddCustomDomainModal` component
3. Create `DomainStatusBadge` component
4. Create `DNSInstructionsPanel` component
5. Add domain management to deployment details page
6. Implement copy-to-clipboard for DNS records
7. Add loading states and error handling

### Phase 7: Domain Verification & Monitoring (Week 4)

1. Create background job for domain verification
2. Implement DNS record checking
3. Add SSL certificate status monitoring
4. Create webhook handler for Vercel domain events (if available)
5. Add email notifications for domain status changes

### Phase 8: Testing & Documentation (Week 4-5)

1. Write comprehensive unit tests
2. Write integration tests
3. Perform end-to-end testing
4. Create user documentation
5. Create developer documentation
6. Test with real domains

### Phase 9: Deployment & Monitoring (Week 5)

1. Deploy to staging environment
2. Test with real Vercel projects
3. Monitor for errors
4. Deploy to production
5. Set up monitoring and alerts

## Security Considerations

### 1. Domain Hijacking Prevention

- Require TXT record verification for custom domains
- Check domain ownership before allowing addition
- Prevent subdomain takeover by checking existing records

### 2. Rate Limiting

- Limit domain additions per user (e.g., 10 per deployment)
- Rate limit verification checks (e.g., 1 per minute)
- Prevent abuse of slug generation

### 3. Input Validation

- Sanitize all domain inputs
- Validate against DNS naming conventions
- Reject reserved subdomains (www, api, admin, etc.)

### 4. Authorization

- Verify user owns deployment before any domain operation
- Check user permissions for domain management
- Audit log all domain changes

## Performance Considerations

### 1. Database Indexes

```sql
CREATE INDEX idx_deployment_domains_deployment_id ON deployment_domains(deployment_id);
CREATE INDEX idx_deployment_domains_domain ON deployment_domains(domain);
CREATE INDEX idx_deployment_domains_status ON deployment_domains(status);
CREATE INDEX idx_deployments_user_id ON deployments(user_id);
CREATE INDEX idx_deployments_v0_deployment_id ON deployments(v0_deployment_id);
```

### 2. Caching Strategy

- Cache domain status for 5 minutes
- Cache DNS instructions for 1 hour
- Invalidate cache on domain updates

### 3. Async Operations

- Domain verification runs in background
- SSL provisioning is async
- Use job queue for retries

## Monitoring & Observability

### Metrics to Track

1. Domain assignment success rate
2. Average time to domain verification
3. SSL provisioning success rate
4. Vercel API error rate
5. Domain conflicts per day

### Logging

- Log all domain operations (add, remove, verify)
- Log Vercel API calls and responses
- Log verification attempts and results
- Log errors with full context

### Alerts

- Alert on high Vercel API error rate (>5%)
- Alert on domain verification failures (>10%)
- Alert on SSL provisioning failures
- Alert on domain conflicts

## Migration Strategy

### Existing Deployments

1. Create deployment records for existing V0 deployments
2. Backfill AIWA subdomains for active deployments
3. Migrate existing custom domains (if any)
4. Verify all domains are accessible

### Rollback Plan

1. Keep old domain system running in parallel
2. Feature flag for new domain system
3. Ability to revert to old URLs if needed
4. Database backup before migration

## Future Enhancements

1. **Wildcard Subdomains**: Support `*.myapp.aiwacodes.com`
2. **Domain Analytics**: Track visits per domain
3. **Custom SSL Certificates**: Allow users to upload their own certs
4. **Domain Marketplace**: Allow users to buy domains through AIWA
5. **Automatic DNS Configuration**: Integrate with DNS providers (Cloudflare, Route53)
6. **Domain Aliases**: Multiple domains pointing to same deployment
7. **Redirect Rules**: Custom redirects between domains
8. **Preview Domains**: Automatic domains for preview deployments

## Dependencies

### External Services

- Vercel API (domain management)
- DNS providers (for verification)
- SSL certificate authorities (via Vercel)

### Internal Dependencies

- V0 SDK (deployment creation)
- Database (PostgreSQL)
- Authentication system
- Job queue (for background tasks)

### Environment Variables

```bash
VERCEL_API_TOKEN=<token>
VERCEL_TEAM_ID=<team-id>
AIWA_DOMAIN=aiwacodes.com
VERCEL_PROJECT_ID=<project-id>
```

## API Documentation

### POST /api/deployments/[id]/domains

Add a domain to a deployment.

**Request:**

```json
{
  "domain": "myapp.aiwacodes.com",
  "type": "custom"
}
```

**Response:**

```json
{
  "domain": {
    "id": "uuid",
    "domain": "myapp.aiwacodes.com",
    "type": "custom",
    "status": "verifying",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "dns_instructions": {
    "records": [
      {
        "type": "CNAME",
        "name": "myapp",
        "value": "cname.vercel-dns.com"
      },
      {
        "type": "TXT",
        "name": "_vercel",
        "value": "vc-domain-verify=..."
      }
    ],
    "estimated_propagation_time": "24-48 hours"
  }
}
```

### GET /api/deployments/[id]/domains

List all domains for a deployment.

**Response:**

```json
{
  "domains": [
    {
      "id": "uuid",
      "domain": "gravity.aiwacodes.com",
      "type": "aiwa",
      "is_primary": true,
      "status": "active",
      "verified_at": "2024-01-01T00:00:00Z",
      "ssl_status": "issued"
    },
    {
      "id": "uuid",
      "domain": "myapp.com",
      "type": "custom",
      "is_primary": false,
      "status": "verifying",
      "error_message": null
    }
  ]
}
```

### DELETE /api/deployments/[id]/domains/[domainId]

Remove a domain from a deployment.

**Response:**

```json
{
  "success": true,
  "message": "Domain removed successfully"
}
```

### POST /api/deployments/[id]/domains/[domainId]/verify

Check verification status of a domain.

**Response:**

```json
{
  "domain": {
    "id": "uuid",
    "status": "active",
    "verified_at": "2024-01-01T00:00:00Z",
    "ssl_status": "issued",
    "ssl_issued_at": "2024-01-01T00:05:00Z"
  }
}
```

## Summary

This design provides a comprehensive solution for custom domain management in AIWA. Key features include:

1. **Automatic AIWA Subdomains**: Every deployment gets a memorable `*.aiwacodes.com` URL
2. **Custom Domain Support**: Users can add their own domains with full DNS guidance
3. **Vercel Integration**: Seamless integration with Vercel's domain API
4. **Status Tracking**: Real-time monitoring of domain verification and SSL status
5. **Security**: Domain ownership verification and conflict prevention
6. **Scalability**: Efficient database design with proper indexing

The implementation follows AIWA's existing patterns and integrates cleanly with the V0 SDK and deployment workflow.
