# Authentication and Authorization Plan

This document proposes an approach for user login, role management, and access control in **Photo To Citation**. The goal is to follow well‑supported standards and libraries while keeping the codebase maintainable.

## 1. Authentication

- Use **NextAuth.js** for session management. It supports OAuth providers and email magic links.
- Store user records in the database via NextAuth's adapter with `User` and `Account` tables.
- Sessions use JWTs stored in secure HTTP‑only cookies.
- Password‑less login is preferred, but we can add password support later via `Credentials` provider.
- A super admin email is defined via `SUPER_ADMIN_EMAIL`. If unset, the first registered user becomes super admin.

## 2. User Roles

```
- user (default)
- admin
- superadmin
```

Roles are stored on the `User` record. The super admin can promote other users to admin or superadmin.

## 3. Access Control

- Use **Casbin** for a flexible permission matrix. Policies live in the database so admins can modify them at runtime.
- Policies define which roles may perform actions on resources. Examples:
  - `user` can read and update their own cases.
  - `collaborator` can comment on a case they have been invited to.
  - `admin` can manage any case and manage users.
  - `superadmin` can modify the policy matrix itself.
- Contextual checks (such as ownership) use Casbin's ABAC support.

## 4. Case Collaboration

- Introduce a `CaseMember` table linking users to cases with a role (`owner`, `collaborator`).
- A `public` flag on the `Case` record makes the case viewable by anyone without authentication.
- Casbin rules reference the `CaseMember` relationship to grant permissions.

## 5. Admin Interface

- A `/admin` section allows admins to view, invite, disable, and delete users.
- Super admins may edit the permission matrix through a simple UI that writes policies to the database.
- Changes to roles or policies take effect immediately because Casbin reloads them on update.

## 6. Standards and Protocols

- OAuth 2.0 / OIDC for third‑party sign in.
- JSON Web Tokens for stateless sessions.
- Argon2 for password hashing if password auth is enabled.

This approach uses well‑maintained libraries (NextAuth.js and Casbin) and keeps control of permissions in the database so that collaboration and public cases can be implemented consistently across features.

## 7. Implementation Tasks

A proposed sequence of milestones so each change can be merged and deployed independently:

1. **Add NextAuth.js with a basic email provider.**
   - Create `User` and `Account` tables using the NextAuth adapter.
   - Provide a sign‑in page and session hooks.
   - Confirm login/logout flow with tests.
2. **Introduce role support.**
   - Add a `role` column to the `User` table and seed the super admin based on `SUPER_ADMIN_EMAIL` or the first user.
   - Update session callbacks to expose the user role.
3. **Set up Casbin for authorization.**
   - Store policy rules in the database and load them at startup.
   - Implement a wrapper around Casbin to check permissions in API routes.
4. **Create the CaseMember model.**
   - Track ownership and collaborator roles for each case.
   - Write tests covering invitations and access checks.
5. **Add a public flag to cases.**
   - Expose read‑only endpoints for public cases without authentication.
   - Ensure Casbin rules allow anonymous access when this flag is true.
6. **Build the admin dashboard.**
   - Allow admins to list, invite, disable, and delete users.
   - Super admins can manage Casbin policies through this interface.
7. **Enforce permissions in the UI.**
   - Hide or disable actions the current user cannot perform.
   - Include integration tests for common user flows.

Each milestone is small enough to be reviewed and deployed on its own while steadily building up the full authentication and authorization feature set.
