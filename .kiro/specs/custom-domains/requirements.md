# Requirements Document: Custom Domain Management for AIWA Deployments

## Introduction

This document outlines the requirements for implementing custom domain management for AIWA-generated applications. Currently, all deployments use the default `vusercontent.net` domain. This feature will enable:

1. Automatic subdomain assignment on `*.aiwacodes.com` (e.g., `gravity.aiwacodes.com`)
2. Custom domain support for users who want to use their own domains
3. Seamless DNS management and SSL certificate provisioning

## Glossary

- **Deployment**: A V0-generated application deployed to Vercel
- **AIWA Domain**: The managed subdomain system on `*.aiwacodes.com`
- **Custom Domain**: A user-provided domain (e.g., `myapp.com` or `app.mydomain.com`)
- **DNS Provider**: The service managing DNS records (Vercel, Cloudflare, etc.)
- **SSL Certificate**: HTTPS certificate for secure connections
- **Subdomain Slug**: A URL-friendly identifier derived from project/chat name
- **Domain Verification**: Process to confirm domain ownership
- **Domain Status**: Current state of domain configuration (pending, active, error, etc.)

## Requirements

### Requirement 1: Automatic AIWA Subdomain Assignment

**User Story:** As a user deploying an application, I want my deployment to automatically receive a memorable subdomain on `aiwacodes.com`, so that I can share a professional URL instead of the default `vusercontent.net` domain.

#### Acceptance Criteria

1. WHEN a user creates a new deployment THEN the system SHALL generate a unique subdomain slug based on the project/chat name
2. WHEN generating a subdomain slug THEN the system SHALL ensure it is URL-safe, lowercase, and contains only alphanumeric characters and hyphens
3. WHEN a subdomain slug conflicts with an existing domain THEN the system SHALL append a unique identifier to ensure uniqueness
4. WHEN a deployment is created THEN the system SHALL automatically configure the subdomain on Vercel via API
5. WHEN the subdomain is configured THEN the system SHALL store the domain mapping in the database
6. WHEN a user views their deployment THEN the system SHALL display the `*.aiwacodes.com` URL as the primary URL
7. WHEN a user accesses the AIWA subdomain THEN the system SHALL serve the deployed application with a valid SSL certificate

### Requirement 2: Custom Domain Management Interface

**User Story:** As a user, I want to add my own custom domain to my deployment, so that I can use my brand's domain for the application.

#### Acceptance Criteria

1. WHEN a user navigates to deployment settings THEN the system SHALL display a custom domain management section
2. WHEN a user adds a custom domain THEN the system SHALL validate the domain format
3. WHEN a custom domain is added THEN the system SHALL provide DNS configuration instructions
4. WHEN a custom domain is added THEN the system SHALL initiate domain verification via Vercel API
5. WHEN domain verification is pending THEN the system SHALL display the verification status and required DNS records
6. WHEN a custom domain is verified THEN the system SHALL automatically provision an SSL certificate
7. WHEN a custom domain is active THEN the system SHALL display it as an additional URL for the deployment
8. WHEN a user removes a custom domain THEN the system SHALL delete the domain configuration from Vercel and the database

### Requirement 3: Domain Status Tracking

**User Story:** As a user, I want to see the status of my domain configuration, so that I can troubleshoot any issues with DNS or SSL.

#### Acceptance Criteria

1. WHEN a domain is being configured THEN the system SHALL track its status (pending, verifying, active, error)
2. WHEN domain verification fails THEN the system SHALL display specific error messages
3. WHEN SSL provisioning fails THEN the system SHALL display certificate-related errors
4. WHEN a user views domain settings THEN the system SHALL display the current status of all domains
5. WHEN a domain status changes THEN the system SHALL update the database record
6. WHEN a domain has been in pending state for more than 24 hours THEN the system SHALL mark it as potentially misconfigured

### Requirement 4: Subdomain Slug Generation

**User Story:** As a developer, I want the system to generate meaningful and unique subdomain slugs, so that users get memorable URLs.

#### Acceptance Criteria

1. WHEN generating a slug from a project name THEN the system SHALL convert to lowercase and replace spaces with hyphens
2. WHEN generating a slug THEN the system SHALL remove special characters except hyphens
3. WHEN generating a slug THEN the system SHALL truncate to a maximum of 63 characters
4. WHEN a slug already exists THEN the system SHALL append a short random identifier (4-6 characters)
5. WHEN a project name is empty or invalid THEN the system SHALL generate a slug from the chat ID
6. WHEN a slug is generated THEN the system SHALL validate it against DNS naming conventions

### Requirement 5: Vercel Domain API Integration

**User Story:** As the system, I need to integrate with Vercel's domain API, so that domains are automatically configured on the deployment platform.

#### Acceptance Criteria

1. WHEN adding a domain THEN the system SHALL call Vercel's domain API to add the domain to the project
2. WHEN a domain is added to Vercel THEN the system SHALL receive verification requirements
3. WHEN checking domain status THEN the system SHALL query Vercel's API for current verification state
4. WHEN a domain is verified on Vercel THEN the system SHALL update the local database status
5. WHEN removing a domain THEN the system SHALL call Vercel's API to remove the domain configuration
6. WHEN Vercel API calls fail THEN the system SHALL log errors and display user-friendly messages
7. WHEN SSL certificate provisioning completes THEN the system SHALL update the domain status to active

### Requirement 6: Database Schema for Domain Management

**User Story:** As the system, I need to persist domain configurations, so that domain mappings are maintained across deployments.

#### Acceptance Criteria

1. WHEN the system starts THEN the database SHALL have a `deployment_domains` table
2. WHEN a domain is added THEN the system SHALL store deployment_id, domain, type (aiwa/custom), status, and timestamps
3. WHEN a domain is the AIWA subdomain THEN the system SHALL mark it as `is_primary: true`
4. WHEN storing domain records THEN the system SHALL include verification_token and verification_method
5. WHEN a domain status changes THEN the system SHALL update the `updated_at` timestamp
6. WHEN querying domains THEN the system SHALL support filtering by deployment_id, user_id, and status
7. WHEN a deployment is deleted THEN the system SHALL cascade delete associated domain records

### Requirement 7: DNS Configuration Instructions

**User Story:** As a user adding a custom domain, I want clear DNS configuration instructions, so that I can correctly point my domain to the deployment.

#### Acceptance Criteria

1. WHEN a user adds a custom domain THEN the system SHALL display required DNS records (A, CNAME, TXT)
2. WHEN displaying DNS instructions THEN the system SHALL show the record type, name, and value
3. WHEN a domain is an apex domain (e.g., `example.com`) THEN the system SHALL provide A record instructions
4. WHEN a domain is a subdomain (e.g., `app.example.com`) THEN the system SHALL provide CNAME record instructions
5. WHEN verification is required THEN the system SHALL display the TXT record for domain ownership verification
6. WHEN DNS records are displayed THEN the system SHALL include a "Copy" button for each value
7. WHEN DNS propagation is in progress THEN the system SHALL display estimated wait time (typically 24-48 hours)

### Requirement 8: Domain Conflict Resolution

**User Story:** As the system, I need to handle domain conflicts, so that multiple users cannot claim the same domain.

#### Acceptance Criteria

1. WHEN a user attempts to add a domain THEN the system SHALL check if it already exists in the database
2. WHEN a domain is already claimed by another user THEN the system SHALL reject the request with an error message
3. WHEN a domain is already claimed by the same user THEN the system SHALL allow re-verification
4. WHEN an AIWA subdomain is generated THEN the system SHALL ensure uniqueness across all deployments
5. WHEN a domain conflict occurs THEN the system SHALL log the conflict for audit purposes

### Requirement 9: Deployment-Domain Relationship

**User Story:** As a user, I want to manage domains per deployment, so that each of my applications can have its own custom domain.

#### Acceptance Criteria

1. WHEN a deployment is created THEN the system SHALL create a deployment record in the database
2. WHEN storing a deployment THEN the system SHALL include v0_deployment_id, v0_project_id, v0_chat_id, and v0_version_id
3. WHEN a deployment has domains THEN the system SHALL support one-to-many relationship (one deployment, multiple domains)
4. WHEN querying a deployment THEN the system SHALL include all associated domains
5. WHEN a user views deployment details THEN the system SHALL display all configured domains with their statuses
6. WHEN a deployment is deleted THEN the system SHALL remove all associated domains from Vercel

### Requirement 10: API Endpoints for Domain Management

**User Story:** As a frontend developer, I need API endpoints for domain management, so that I can build the domain configuration UI.

#### Acceptance Criteria

1. WHEN the API is available THEN the system SHALL provide `POST /api/deployments/[id]/domains` to add a domain
2. WHEN the API is available THEN the system SHALL provide `GET /api/deployments/[id]/domains` to list domains
3. WHEN the API is available THEN the system SHALL provide `DELETE /api/deployments/[id]/domains/[domainId]` to remove a domain
4. WHEN the API is available THEN the system SHALL provide `POST /api/deployments/[id]/domains/[domainId]/verify` to check verification status
5. WHEN calling domain APIs THEN the system SHALL require authentication
6. WHEN calling domain APIs THEN the system SHALL verify the user owns the deployment
7. WHEN API calls succeed THEN the system SHALL return appropriate status codes and response bodies

### Requirement 11: Automatic Subdomain on Deployment Creation

**User Story:** As a user, I want my deployment to automatically get an AIWA subdomain when created, so that I don't have to manually configure it.

#### Acceptance Criteria

1. WHEN a deployment is created via the chat interface THEN the system SHALL automatically generate and assign an AIWA subdomain
2. WHEN the V0 deployment API returns a deployment ID THEN the system SHALL immediately configure the AIWA subdomain
3. WHEN subdomain configuration succeeds THEN the system SHALL store the domain record with status "active"
4. WHEN subdomain configuration fails THEN the system SHALL retry up to 3 times with exponential backoff
5. WHEN all retries fail THEN the system SHALL log the error and notify the user
6. WHEN a deployment is created THEN the system SHALL return the AIWA subdomain URL in the response

### Requirement 12: Domain Validation and Security

**User Story:** As the system, I need to validate and secure domain configurations, so that malicious actors cannot hijack domains.

#### Acceptance Criteria

1. WHEN a user adds a domain THEN the system SHALL validate it matches DNS naming conventions
2. WHEN validating a domain THEN the system SHALL reject domains with invalid characters
3. WHEN validating a domain THEN the system SHALL reject reserved subdomains (www, api, admin, etc.)
4. WHEN a domain is added THEN the system SHALL require domain ownership verification
5. WHEN verification is required THEN the system SHALL generate a unique verification token
6. WHEN checking verification THEN the system SHALL query DNS records for the verification token
7. WHEN verification succeeds THEN the system SHALL mark the domain as verified and activate it
