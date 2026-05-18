# Identity Provider Configuration

Resume Builder supports OIDC authentication with role-based access control (RBAC). This document covers how to configure each supported identity provider so that admin users receive the correct role claim in their JWT token.

## How role claims work

Resume Builder distinguishes two roles:

| Role | Capabilities |
|---|---|
| **Admin** | Edit application settings, create and manage company (global) themes |
| **User** | Edit own resume, use personal themes, upload files, use AI / translation |

After signing in, the backend reads a configurable claim from the JWT access/ID token. If the claim matches the expected value, the user is granted admin access.

Configure the claim in **Settings → Authentication**:

| Setting | Description | Example |
|---|---|---|
| **Admin role claim** | The JWT payload key to inspect | `roles` |
| **Admin role value** | The expected string value (or one element of an array) | `resume-admin` |

The claim value can be a plain string **or** a JSON array of strings — both are handled.

### Bootstrap without a configured claim

Before you have the claim configured you can set the `ADMIN_SUB` environment variable to your OIDC subject (`sub`) value. This grants admin access for that specific user regardless of claims and lets you open Settings and fill in the claim fields. Remove the variable once the claim-based check is working.

---

## Microsoft Entra ID (formerly Azure AD)

Entra ID supports **App Roles**, which are emitted as a `roles` array in the token automatically once a user is assigned.

### 1 — Define an App Role

1. Open the **Azure Portal** → **App registrations** → your app.
2. Go to **App roles** → **Create app role**.
3. Fill in:
   - **Display name**: `Resume Admin`
   - **Allowed member types**: `Users/Groups`
   - **Value**: `resume-admin` ← this becomes the claim value
   - **Description**: anything
4. Click **Apply**.

### 2 — Assign users

1. Open **Enterprise applications** → your app → **Users and groups**.
2. Click **Add user/group**, select the users or groups that should be admins, choose the `Resume Admin` role, click **Assign**.

### 3 — Verify the token

After sign-in, the token payload will contain:

```json
{
  "roles": ["resume-admin"]
}
```

### Resume Builder settings

| Setting | Value |
|---|---|
| Admin role claim | `roles` |
| Admin role value | `resume-admin` |

---

## Zitadel

Zitadel emits project roles as an **object** (`{"resume-admin": {"orgId": "…"}}`) by default, which is not directly compatible with the string/array check. A [Zitadel Action](https://zitadel.com/docs/apis/actions/introduction) is needed to flatten this into a plain array claim.

### 1 — Create a project role

1. In the Zitadel Console, open your **Project** → **Roles** → **New Role**.
2. Set the **Key** to `resume-admin` (this is the role identifier in tokens).
3. Save.

### 2 — Assign the role to admin users

1. Open the **Project** → **Authorizations** (or go to the user and add a grant for this project).
2. Add a grant for each admin user with the `resume-admin` role.

### 3 — Enable role assertion

In your Zitadel **Project settings**, make sure **Assert Roles on Authentication** is enabled. This causes role data to be included in the token.

### 4 — Create a Zitadel Action to flatten roles

Zitadel's default role claim is an object; the Action below converts it to a flat array named `roles`.

1. Open **Actions** (top-level in the console) → **New Action**.
2. Name: `flattenRoles`, Trigger: **Pre Userinfo Creation** (and optionally **Pre Access Token Creation**).
3. Paste the following script:

```javascript
function flattenRoles(ctx, api) {
    const grants = ctx.v1.user.grants;
    if (!grants || grants.count === 0) return;

    const roles = [];
    for (const grant of grants.grants) {
        for (const role of grant.roles) {
            if (!roles.includes(role)) {
                roles.push(role);
            }
        }
    }

    if (roles.length > 0) {
        api.v1.claims.setClaim('roles', roles);
    }
}
```

4. Save and attach the action to your application's flow.

### 5 — Verify the token

After sign-in, the token payload will contain:

```json
{
  "roles": ["resume-admin"]
}
```

### Resume Builder settings

| Setting | Value |
|---|---|
| Admin role claim | `roles` |
| Admin role value | `resume-admin` |

---

## Authentik

Authentik uses **Property Mappings** (Python expressions) to add custom claims to tokens.

### 1 — Create an admin group

1. Go to **Directory → Groups** → **Create**.
2. Name: `resume-admins` (or any name you prefer — you will use this name as the role value).

### 2 — Add admin users to the group

Open the group → **Users** → add the users who should be admins.

### 3 — Create a Property Mapping

1. Go to **Customisation → Property Mappings** → **Create** → **Scope Mapping**.
2. Fill in:
   - **Name**: `Resume roles`
   - **Scope name**: `roles` (add this to the requested scopes in your provider, or append to `profile`)
   - **Expression**:

```python
return {
    "roles": [group.name for group in request.user.ak_groups.all()]
}
```

This emits every group the user belongs to as a `roles` array. Only admin group members will have `resume-admins` in that array.

3. Save.

### 4 — Attach the mapping to your provider

1. Go to **Applications → Providers** → your OIDC provider → **Edit**.
2. Under **Advanced protocol settings → Scopes**, add the `Resume roles` mapping (or the scope you named it).
3. Save and update the application.

### 5 — Verify the token

After sign-in, the token payload will contain:

```json
{
  "roles": ["resume-admins", "other-group", "…"]
}
```

### Resume Builder settings

| Setting | Value |
|---|---|
| Admin role claim | `roles` |
| Admin role value | `resume-admins` ← matches the group name |

---

## Generic OIDC

For any other OIDC-compliant provider, configure your provider to emit a custom claim (as a string or JSON array of strings) in the **ID token or access token** that the user presents on sign-in.

Common patterns:

| Provider type | Typical approach |
|---|---|
| Keycloak | Add a **Client Role** and use a mapper of type *User Client Role* to add a `roles` claim |
| Okta | Use a custom **Groups claim** expression or a **token inline hook** |
| Auth0 | Add a **Rule / Action** that sets `context.idToken['roles']` from user metadata or app metadata |
| Ping Identity | Use a **Token Claim** mapped from a group attribute |

Once your provider emits the claim, configure Resume Builder with the matching claim name and value.

### Resume Builder settings

| Setting | Value |
|---|---|
| Admin role claim | Whatever claim name your provider uses (e.g. `roles`, `groups`, `custom:role`) |
| Admin role value | The specific string that should match for admins |

---

## Troubleshooting

**Settings button is not visible after sign-in**

The `isAdmin` flag is derived from the token at login time. Check the decoded token (e.g. at [jwt.io](https://jwt.io)) to confirm:

1. The expected claim key is present.
2. The claim value matches exactly (case-sensitive).
3. For Zitadel: the Action is attached and the `roles` array is populated.

**403 Forbidden when saving settings via the API**

This means the frontend forwarded a valid token but the backend did not recognise the user as admin. Ensure both the claim name and value in Settings match what appears in the token. If you are bootstrapping with `ADMIN_SUB`, verify the value matches the `sub` field in your token exactly.

**`ADMIN_SUB` is set but the Settings button is still hidden**

`ADMIN_SUB` is enforced on the **backend** (returns 403 for non-admins on the API), but the frontend derives `isAdmin` from the `/api/settings` response. The GET `/api/settings` endpoint reads the token to determine `isAdmin` — it will be `true` when `ADMIN_SUB` matches your sub. If the button is hidden, check that the bearer token is being sent correctly and that your sub value has no extra whitespace.
