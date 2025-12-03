# Implementation Plan: Custom Domain Management

## Task List

- [ ] 1. Database Schema & Setup
  - Create database tables for deployments and domains
  - Add necessary indexes for performance
  - Create TypeScript types from schema
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 1.1 Create deployments table schema
  - Define table with v0 identifiers, metadata, and URLs
  - Add foreign key to users table
  - Add unique constraint on v0_deployment_id
  - _Requirements: 9.1, 9.2_

- [ ] 1.2 Create deployment_domains table schema
  - Define table with domain, type, status, verification fields
  - Add foreign key to deployments with cascade delete
  - Add unique constraint on domain field
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 1.3 Create database migration script
  - Write SQL migration for both tables
  - Add indexes for deployment_id, domain, status, user_id
  - Test migration on local database
  - _Requirements: 6.1_

- [ ] 1.4 Update schema.ts with new types
  - Add deployments and deployment_domains table definitions
  - Export TypeScript types using InferSelectModel
  - Add to drizzle schema exports
  - _Requirements: 6.1_

- [ ] 2. Core Domain Service Implementation
  - Implement subdomain slug generation logic
  - Create domain validation functions
  - Build DomainService class with core methods
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 12.1, 12.2, 12.3_

- [ ] 2.1 Implement generateSubdomainSlug function
  - Convert to lowercase and replace spaces with hyphens
  - Remove special characters except hyphens
  - Truncate to 63 characters (DNS limit)
  - Check uniqueness and append random suffix if needed
  - Handle empty/invalid names with fallback
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 2.2 Write unit tests for slug generation
  - Test normalization (spaces, special chars, case)
  - Test uniqueness handling with conflicts
  - Test edge cases (empty, very long, special chars only)
  - Test DNS naming convention compliance
  - **Property 8: Slug Generation Determinism**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 2.3 Implement domain validation functions
  - Validate domain format (DNS naming conventions)
  - Check for invalid characters
  - Validate TLD existence
  - Reject reserved subdomains (www, api, admin, etc.)
  - _Requirements: 12.1, 12.2, 12.3_

- [ ]\* 2.4 Write unit tests for domain validation
  - Test valid domain formats
  - Test invalid formats (spaces, invalid TLDs, special chars)
  - Test reserved subdomain rejection
  - **Property 2: Domain Format Validity**
  - **Validates: Requirements 2.2, 12.2**

- [ ] 2.5 Create DomainService class
  - Implement assignAIWADomain method
  - Implement addCustomDomain method
  - Implement verifyDomain method
  - Implement removeDomain method
  - Add error handling with DomainError class
  - _Requirements: 1.4, 2.3, 2.4, 2.5, 2.8, 3.2, 3.3_

- [ ] 3. Database Query Functions
  - Create CRUD operations for deployments
  - Create CRUD operations for deployment_domains
  - Add specialized query functions
  - _Requirements: 6.6, 9.4, 9.5_

- [ ] 3.1 Implement deployment queries
  - createDeployment({ user_id, v0_deployment_id, ... })
  - getDeploymentById({ deploymentId })
  - getDeploymentByV0Id({ v0DeploymentId })
  - getDeploymentsByUserId({ userId })
  - updateDeployment({ deploymentId, updates })
  - deleteDeployment({ deploymentId })
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 3.2 Implement domain queries
  - createDomain({ deployment_id, domain, type, ... })
  - getDomainById({ domainId })
  - getDomainsByDeploymentId({ deploymentId })
  - getDomainByName({ domain })
  - updateDomainStatus({ domainId, status, ... })
  - deleteDomain({ domainId })
  - checkDomainExists({ domain })
  - _Requirements: 6.2, 6.5, 6.6, 8.1_

- [ ] 3.3 Implement specialized queries
  - getDeploymentWithDomains({ deploymentId })
  - getPrimaryDomain({ deploymentId })
  - getActiveDomainsByUserId({ userId })
  - getDomainsPendingVerification()
  - _Requirements: 9.4, 9.5_

- [ ] 4. Vercel API Integration
  - Create VercelDomainClient class
  - Implement domain management API calls
  - Add error handling and retries
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 4.1 Create VercelDomainClient class
  - Initialize with API key and team ID from env vars
  - Create base fetch wrapper with auth headers
  - Add retry logic with exponential backoff
  - _Requirements: 5.1_

- [ ] 4.2 Implement addDomainToProject method
  - POST to /v9/projects/{projectId}/domains
  - Handle response with verification requirements
  - Parse DNS records from response
  - Handle Vercel API errors
  - _Requirements: 5.1, 5.2, 5.6_

- [ ] 4.3 Implement getDomainStatus method
  - GET from /v9/projects/{projectId}/domains/{domain}
  - Parse verification status
  - Parse SSL certificate status
  - Return structured status object
  - _Requirements: 5.3, 5.4, 5.7_

- [ ] 4.4 Implement removeDomainFromProject method
  - DELETE to /v9/projects/{projectId}/domains/{domain}
  - Handle 404 errors gracefully
  - Log removal for audit
  - _Requirements: 5.5_

- [ ] 4.5 Implement getDNSRecords method
  - Parse DNS records from domain status
  - Determine record type (A, CNAME, TXT)
  - Format for frontend display
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]\* 4.6 Write integration tests for Vercel client
  - Mock Vercel API responses
  - Test successful domain addition
  - Test error handling
  - Test retry logic
  - Test DNS record parsing

- [ ] 5. API Route: Add Domain
  - Create POST /api/deployments/[id]/domains endpoint
  - Implement request validation
  - Integrate with DomainService
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 10.1, 10.5, 10.6, 10.7_

- [ ] 5.1 Create API route file
  - Create app/api/deployments/[id]/domains/route.ts
  - Set up POST handler with auth middleware
  - Parse and validate request body
  - _Requirements: 10.1, 10.5_

- [ ] 5.2 Implement domain addition logic
  - Verify user owns deployment
  - Validate domain format
  - Check for domain conflicts
  - Call DomainService.addCustomDomain or assignAIWADomain
  - Return domain + DNS instructions
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 10.6, 10.7_

- [ ] 5.3 Add error handling
  - Handle validation errors (400)
  - Handle conflict errors (409)
  - Handle Vercel API errors (500)
  - Handle unauthorized errors (403)
  - _Requirements: 10.7_

- [ ] 6. API Route: List Domains
  - Create GET /api/deployments/[id]/domains endpoint
  - Return all domains for a deployment
  - _Requirements: 9.5, 10.2, 10.5, 10.6, 10.7_

- [ ] 6.1 Create GET handler
  - Verify user owns deployment
  - Query domains from database
  - Include status and verification info
  - Return formatted response
  - _Requirements: 9.5, 10.2, 10.6, 10.7_

- [ ] 7. API Route: Remove Domain
  - Create DELETE /api/deployments/[id]/domains/[domainId] endpoint
  - Implement domain removal logic
  - _Requirements: 2.8, 10.3, 10.5, 10.6, 10.7_

- [ ] 7.1 Create DELETE handler
  - Verify user owns deployment
  - Call DomainService.removeDomain
  - Remove from Vercel
  - Update database status
  - Return success response
  - _Requirements: 2.8, 10.3, 10.6, 10.7_

- [ ] 8. API Route: Verify Domain
  - Create POST /api/deployments/[id]/domains/[domainId]/verify endpoint
  - Check domain verification status
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.4, 10.5, 10.6, 10.7_

- [ ] 8.1 Create verify endpoint
  - Verify user owns deployment
  - Call DomainService.verifyDomain
  - Check Vercel domain status
  - Update database with verification result
  - Return updated domain status
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.4, 10.6, 10.7_

- [ ] 9. Integrate with Deployment Creation Flow
  - Modify chat API to create deployment records
  - Add automatic AIWA subdomain assignment
  - Update response to include domain info
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 9.1 Update chat API route
  - After V0 deployment creation, create deployment record in DB
  - Call DomainService.assignAIWADomain
  - Add retry logic for domain assignment failures
  - Include domain URL in response
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ]\* 9.2 Write integration test for deployment flow
  - Test full flow: chat → deployment → domain assignment
  - Verify deployment record created
  - Verify AIWA domain assigned and marked primary
  - Verify domain accessible
  - **Property 10: Automatic AIWA Domain Assignment**
  - **Validates: Requirements 11.1, 11.3**

- [ ] 10. Frontend: Domain Settings Component
  - Create deployment domain management UI
  - Display current domains with status
  - Add domain addition interface
  - _Requirements: 2.1, 2.3, 2.4, 2.6, 3.4, 9.5_

- [ ] 10.1 Create DeploymentDomainSettings component
  - Display list of domains with status badges
  - Show primary domain prominently
  - Add "Add Custom Domain" button
  - Show loading states
  - _Requirements: 2.1, 3.4, 9.5_

- [ ] 10.2 Create DomainStatusBadge component
  - Display status with appropriate color (pending, verifying, active, error)
  - Show SSL status indicator
  - Show verification status
  - Add tooltips for status explanations
  - _Requirements: 3.4_

- [ ] 10.3 Create AddCustomDomainModal component
  - Input field for domain name
  - Domain format validation
  - Submit button with loading state
  - Error display
  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 10.4 Create DNSInstructionsPanel component
  - Display DNS records in table format
  - Show record type, name, value
  - Add copy-to-clipboard buttons
  - Show estimated propagation time
  - Add "Verify Domain" button
  - _Requirements: 2.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 11. Frontend: Integrate with Deployment Details
  - Add domain management to deployment details page
  - Show domains in deployment overview
  - Add domain management tab/section
  - _Requirements: 9.5_

- [ ] 11.1 Update deployment details page
  - Add "Domains" section to deployment details
  - Render DeploymentDomainSettings component
  - Add loading and error states
  - _Requirements: 9.5_

- [ ] 11.2 Add domain info to deployment cards
  - Show primary domain URL
  - Add "View Domains" link
  - Show domain count badge
  - _Requirements: 1.6, 9.5_

- [ ] 12. Background Job: Domain Verification
  - Create scheduled job to check pending domains
  - Update domain status based on verification
  - Send notifications on status changes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 12.1 Create domain verification cron job
  - Query domains with status "verifying" or "pending"
  - Call VercelDomainClient.getDomainStatus for each
  - Update database with new status
  - Mark domains as error if pending > 24 hours
  - _Requirements: 3.1, 3.2, 3.5, 3.6_

- [ ]\* 12.2 Add monitoring and logging
  - Log verification attempts
  - Track success/failure rates
  - Alert on high failure rates
  - Monitor SSL provisioning

- [ ] 13. Testing & Quality Assurance
  - Ensure all tests pass
  - Ask user if questions arise

- [ ]\* 13.1 Write end-to-end tests
  - Test full deployment creation with domain
  - Test custom domain addition flow
  - Test domain verification flow
  - Test domain removal flow

- [ ]\* 13.2 Perform manual testing
  - Test with real Vercel project
  - Test with real domain
  - Verify DNS instructions are correct
  - Verify SSL certificates provision correctly

- [ ] 13.3 Code review and cleanup
  - Review all code for best practices
  - Add JSDoc comments
  - Clean up console.logs
  - Ensure error messages are user-friendly

- [ ] 14. Documentation
  - Create user documentation
  - Create developer documentation
  - Update API documentation
  - _Requirements: All_

- [ ] 14.1 Write user documentation
  - How to add custom domain
  - How to configure DNS
  - Troubleshooting guide
  - FAQ section

- [ ] 14.2 Write developer documentation
  - Architecture overview
  - API reference
  - Database schema
  - Deployment guide

- [ ] 15. Deployment & Monitoring
  - Deploy to staging
  - Test in staging environment
  - Deploy to production
  - Set up monitoring

- [ ] 15.1 Deploy to staging
  - Run database migrations
  - Deploy code changes
  - Test all functionality
  - Verify Vercel integration works

- [ ] 15.2 Deploy to production
  - Run production migrations
  - Deploy code with feature flag
  - Gradually enable for users
  - Monitor for errors

- [ ] 15.3 Set up monitoring
  - Add metrics for domain operations
  - Set up alerts for failures
  - Monitor Vercel API usage
  - Track domain verification success rate
