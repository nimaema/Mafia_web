# Persian Mafia Board - Build From Scratch Guide

App description: Persian Mafia Board is a role-based game management web app for Persian Mafia sessions. It supports account registration and email verification, moderator-created lobbies, scenario and role management, live player joins, game execution, night/day event logging, player role reveal, history dashboards, and PWA installation.

Tech stack: Next.js 16 App Router, React 19, TypeScript, Prisma 5 with PostgreSQL, NextAuth v5, Pusher, Tailwind CSS v4, Recharts, Serwist service worker, Nodemailer/Resend-compatible email delivery, Docker, and Render deployment metadata.

Scope note: The baseline tree below documents the tracked source baseline used to rebuild the app. Generated and local-only files such as `.next/`, `node_modules/`, `.env`, `.env.local`, `.DS_Store`, `tsconfig.tsbuildinfo`, `batch*.json`, `files_content.json`, `package_lock_push.json`, and `scratch/` are intentionally excluded because they are secrets, build outputs, local OS metadata, or scratch artifacts rather than reproducible source.

## Phase 0: The Complete Project Tree (Baseline Checklist)

```text
Mafia/
|-- .gitignore
|-- Dockerfile
|-- README.md
|-- docker-compose.yml
|-- docker-entrypoint.sh
|-- next-env.d.ts
|-- next.config.ts
|-- package-lock.json
|-- package.json
|-- postcss.config.mjs
|-- push_payload.json
|-- push_script.js
|-- render.yaml
|-- tailwind.config.ts
|-- tsconfig.json
|-- docs/
|   |-- DESIGN.md
|   `-- production_setup.md
|-- prisma/
|   |-- schema.prisma
|   `-- seed.ts
|-- public/
|   `-- .gitkeep
`-- src/
    |-- auth.ts
    |-- proxy.ts
    |-- sw.ts
    |-- actions/
    |   |-- admin.ts
    |   |-- auth.ts
    |   |-- dashboard.ts
    |   |-- game.ts
    |   |-- logout.ts
    |   |-- role.ts
    |   `-- user.ts
    |-- app/
    |   |-- apple-icon.tsx
    |   |-- globals.css
    |   |-- icon.tsx
    |   |-- layout.tsx
    |   |-- manifest.ts
    |   |-- not-found.tsx
    |   |-- page.tsx
    |   |-- providers.tsx
    |   |-- sw.ts
    |   |-- api/
    |   |   |-- auth/
    |   |   |   |-- [...nextauth]/
    |   |   |   |   `-- route.ts
    |   |   |   |-- forgot-password/
    |   |   |   |   `-- route.ts
    |   |   |   `-- reset-password/
    |   |   |       `-- route.ts
    |   |   |-- init-db/
    |   |   |   `-- route.ts
    |   |   |-- lobby/
    |   |   |   `-- route.ts
    |   |   |-- pusher/
    |   |   |   `-- auth/
    |   |   |       `-- route.ts
    |   |   |-- register/
    |   |   |   `-- route.ts
    |   |   `-- setup-admin/
    |   |       `-- route.ts
    |   |-- auth/
    |   |   |-- forgot-password/
    |   |   |   `-- page.tsx
    |   |   |-- login/
    |   |   |   `-- page.tsx
    |   |   |-- register/
    |   |   |   `-- page.tsx
    |   |   |-- reset-password/
    |   |   |   `-- page.tsx
    |   |   `-- verify-email/
    |   |       |-- VerifyEmailClient.tsx
    |   |       `-- page.tsx
    |   |-- dashboard/
    |   |   |-- layout.tsx
    |   |   |-- admin/
    |   |   |   |-- page.tsx
    |   |   |   |-- history/
    |   |   |   |   |-- AdminHistoryClient.tsx
    |   |   |   |   `-- page.tsx
    |   |   |   `-- users/
    |   |   |       `-- page.tsx
    |   |   |-- moderator/
    |   |   |   |-- page.tsx
    |   |   |   |-- game/
    |   |   |   |   `-- [id]/
    |   |   |   |       `-- page.tsx
    |   |   |   |-- lobby/
    |   |   |   |   `-- [id]/
    |   |   |   |       `-- page.tsx
    |   |   |   `-- scenarios/
    |   |   |       `-- page.tsx
    |   |   `-- user/
    |   |       |-- page.tsx
    |   |       |-- history/
    |   |       |   |-- HistoryClient.tsx
    |   |       |   `-- page.tsx
    |   |       `-- profile/
    |   |           |-- ProfileForm.tsx
    |   |           `-- page.tsx
    |   |-- game/
    |   |   `-- [id]/
    |   |       `-- page.tsx
    |   |-- join/
    |   |   `-- page.tsx
    |   `-- lobby/
    |       `-- [id]/
    |           `-- page.tsx
    |-- components/
    |   |-- InstallPWANotice.tsx
    |   |-- PopupProvider.tsx
    |   |-- ThemeToggle.tsx
    |   |-- ThemedPopups.tsx
    |   |-- admin/
    |   |   |-- AdminConfigPanel.tsx
    |   |   |-- ScenariosManager.tsx
    |   |   |-- UserManagementPanel.tsx
    |   |   `-- UsersTable.tsx
    |   |-- auth/
    |   |   `-- AuthShell.tsx
    |   |-- charts/
    |   |   |-- AdminCharts.tsx
    |   |   |-- AlignmentPieChart.tsx
    |   |   `-- WinLossBarChart.tsx
    |   |-- dashboard/
    |   |   `-- DashboardNavigation.tsx
    |   `-- game/
    |       `-- LobbyPreviewCard.tsx
    |-- lib/
    |   |-- email.ts
    |   |-- gameDisplay.ts
    |   |-- password.ts
    |   |-- prisma.ts
    |   |-- pusher-client.ts
    |   `-- pusher.ts
    `-- types/
        `-- next-auth.d.ts
```

## Phase 1: High-Level Architecture (The "Bigger Parts")

### Core Purpose

The application is a full-stack control room for Mafia games. Players register, verify email, join a lobby, receive their assigned secret role, and later see game history. Moderators create lobbies, choose scenarios, assign roles by starting games, manage night/day records, mark eliminations, publish final reports, and close or cancel games. Admins manage users, roles, scenarios, and complete game history.

### Major Modules/Components

**Authentication and identity**

`src/auth.ts`, the auth pages, and `src/proxy.ts` define account access. NextAuth uses a Prisma adapter, Google OAuth, credentials login, JWT sessions, ban checks, email verification behavior, and role data injected into sessions. The proxy redirects unauthenticated users to login and moves already-authenticated users away from login/register toward their role-specific dashboard.

**Database layer**

`prisma/schema.prisma` defines the canonical domain model: users, accounts, sessions, password reset tokens, roles, scenarios, games, players, histories, and night events. `src/lib/prisma.ts` creates the Prisma client through the PostgreSQL adapter and reuses it globally in development.

**Server actions**

`src/actions/*` is the main backend interface for React pages. Auth actions register/login/verify users. Admin actions manage users, roles, and scenarios. Game actions create lobbies, join games, choose scenarios, assign roles, record events, end games, and publish records. Dashboard actions transform raw database rows into UI-ready statistics/history.

**API handlers**

`src/app/api/*` contains endpoint-style behavior that is not purely server-action based: NextAuth route handlers, password reset email flows, bootstrap helpers, lobby event triggering, and private Pusher channel authorization.

**Realtime layer**

`src/lib/pusher.ts`, `src/lib/pusher-client.ts`, `/api/pusher/auth`, and many game actions coordinate realtime state. Server actions trigger Pusher events such as `player-joined`, `game-started`, `scenario-updated`, `player-status-updated`, `game-ended`, and `night-records-public`. Client pages subscribe to game/lobby channels and refresh server state after events.

**UI and routing**

`src/app/*` defines route-level screens using the App Router. Shared components under `src/components/*` provide navigation, popups, theme switching, PWA install notices, chart widgets, reusable auth layout, lobby previews, and admin panels.

**PWA and deployment**

`next.config.ts` wires Serwist, standalone output, and redirects. `src/app/sw.ts` and `src/sw.ts` configure service workers. Docker, Compose, Render config, and production docs describe how to run the app with PostgreSQL, migrations/seeding, and optional Cloudflare tunnel.

### High-Level Data Flow

1. A user registers through `registerUser`, receives a verification token by email, then verifies via `/auth/verify-email`.
2. The proxy and NextAuth callbacks enforce login, role-based session data, ban checks, and email verification.
3. A moderator creates a game. The game receives a six-digit code and appears in user dashboards through `getWaitingGames`.
4. Players join by code. `joinGame` creates `GamePlayer` rows and broadcasts `player-joined`.
5. The moderator picks a saved or custom scenario. `setGameScenario` validates capacity, stores the scenario, initializes active role abilities, and broadcasts the scenario update.
6. When player count matches scenario role count, `startGame` shuffles role IDs, assigns roles, marks the game in progress, and broadcasts `game-started`.
7. Players view only their own role through `getPlayerGameView`; moderators and admins see full game state through `getGameStatus`.
8. Moderators record night actions and day eliminations. These create `NightEvent` rows and optionally mutate player state or role conversions.
9. `endGame` finishes the game, calculates user win/loss histories from role alignment versus winning alignment, and broadcasts `game-ended`.
10. Histories and statistics are shown through dashboard actions; admins can delete complete game histories and publish night records.

## Phase 2: Directory & File Blueprint

**.gitignore** excludes dependency folders, Next build output, coverage, env files, OS files, generated Prisma clients, TypeScript build info, scratch directories, and batch payload dumps. It belongs at the repository root because it controls Git hygiene for the whole project.

**Dockerfile** defines the multi-stage container build. It installs Node dependencies, generates Prisma client, builds the standalone Next app, copies runtime files and Prisma schema/seed, and runs the entrypoint as a non-root user.

**README.md** is currently empty. It is reserved for a shorter project overview; this guide can be linked from it later.

**docker-compose.yml** defines local production-like services: the Next app, PostgreSQL, and Cloudflare Tunnel. It belongs at the root because it orchestrates the entire deployment stack.

**docker-entrypoint.sh** waits for PostgreSQL, runs `prisma db push`, seeds data, and starts `server.js`. It is root-level because the Dockerfile copies and runs it at container startup.

**next-env.d.ts** is the generated Next TypeScript declaration shim. It ensures TypeScript recognizes Next runtime types and generated route types.

**next.config.ts** configures Serwist, standalone output, Turbopack placeholder settings, and legacy admin redirects. It is root-level because Next reads it automatically.

**package-lock.json** locks exact npm dependency versions for reproducible installs.

**package.json** declares scripts, dependencies, Prisma seed command, and package metadata. It is the primary Node project manifest.

**postcss.config.mjs** enables the Tailwind CSS PostCSS plugin. It belongs at root for the Next/Tailwind build pipeline.

**push_payload.json** is a generated JSON payload used by the local `push_script.js` helper to package file contents for an external repository update. It is not part of runtime behavior.

**push_script.js** reads selected files and writes `push_payload.json`. It is a one-off local utility, not used by the app.

**render.yaml** describes Render deployment services and database/env var provisioning.

**tailwind.config.ts** extends Tailwind with RTL-friendly font, colors, radii, animations, and content paths. It is root-level build configuration.

**tsconfig.json** configures TypeScript compilation, JSX mode, strictness, module resolution, and the `@/*` alias.

**docs/DESIGN.md** stores design tokens, color decisions, typography, component specs, responsive behavior, and implementation priorities. It documents visual intent.

**docs/production_setup.md** documents server deployment with Docker and Cloudflare Tunnel. It is operational documentation.

**prisma/schema.prisma** defines the full PostgreSQL schema and Prisma client generator. It belongs in `prisma/` because Prisma tooling expects schema files there.

**prisma/seed.ts** seeds admin/moderator accounts, canonical Mafia roles, standard scenarios, and legacy cleanup. It is colocated with the schema because Prisma's seed script runs it.

**public/.gitkeep** keeps the `public/` directory in Git even when generated files such as `sw.js` are absent.

**src/auth.ts** centralizes NextAuth configuration, providers, Prisma adapter, callbacks, session shaping, and account creation behavior.

**src/proxy.ts** is the Next.js 16 proxy/middleware equivalent for route protection and role-aware redirects.

**src/sw.ts** is a Serwist service worker source variant. It configures precache and runtime cache behavior.

**src/actions/admin.ts** contains server actions for admin/moderator permission checks, user management, role CRUD, scenario CRUD, and standard scenario installation.

**src/actions/auth.ts** contains server actions for registration, verification email generation/resend, email token verification, login, and logout.

**src/actions/dashboard.ts** contains server actions that read and format user/admin dashboard statistics and history.

**src/actions/game.ts** contains core game lifecycle actions: lobby creation/join, waiting/moderator game lists, game state reads, scenario selection, custom scenario creation, role assignment, event recording, ending/canceling games, and stale game expiry.

**src/actions/logout.ts** is a small dedicated server action for sign-out from components that only need logout.

**src/actions/role.ts** fetches all Mafia roles. It is a narrow server action used by moderator lobby setup.

**src/actions/user.ts** contains profile and password change server actions.

**src/app/apple-icon.tsx** dynamically generates a 180x180 Apple touch icon using `ImageResponse`.

**src/app/globals.css** defines Tailwind imports, theme CSS variables, global app utility classes, form styles, scrollbar behavior, 3D card helpers, and responsive layout primitives.

**src/app/icon.tsx** dynamically generates the main 512x512 app icon using `ImageResponse`.

**src/app/layout.tsx** is the root HTML layout. It sets Persian RTL metadata, font loading, PWA metadata, and global providers.

**src/app/manifest.ts** returns the web app manifest for PWA installation.

**src/app/not-found.tsx** renders a styled 404 page.

**src/app/page.tsx** renders the marketing/home screen with sample lobby preview and entry links.

**src/app/providers.tsx** composes client-side providers: NextAuth session, theme, and popup context.

**src/app/sw.ts** is the Serwist service worker source used by `next.config.ts`.

**src/app/api/auth/[...nextauth]/route.ts** exposes NextAuth GET/POST route handlers.

**src/app/api/auth/forgot-password/route.ts** creates password reset tokens and sends/reset-preview emails.

**src/app/api/auth/reset-password/route.ts** validates reset tokens and stores new password hashes.

**src/app/api/init-db/route.ts** is a bootstrap endpoint that creates an admin and a minimal starter role set.

**src/app/api/lobby/route.ts** is a generic Pusher trigger endpoint for lobby-scoped events.

**src/app/api/pusher/auth/route.ts** authorizes authenticated users for private/presence Pusher channels.

**src/app/api/register/route.ts** provides a JSON registration endpoint with stricter Zod password validation.

**src/app/api/setup-admin/route.ts** creates an initial admin user if one does not exist.

**src/app/auth/forgot-password/page.tsx** renders the password reset request form.

**src/app/auth/login/page.tsx** renders credentials/Google login and routes successful users to their dashboard.

**src/app/auth/register/page.tsx** renders user registration and sends new users to verification.

**src/app/auth/reset-password/page.tsx** renders the token-based new password form.

**src/app/auth/verify-email/VerifyEmailClient.tsx** renders verification status and resend controls.

**src/app/auth/verify-email/page.tsx** validates verification query params on the server and passes status to the client component.

**src/app/dashboard/layout.tsx** protects all dashboard routes, calculates role access flags, renders navigation, and includes the PWA notice.

**src/app/dashboard/admin/page.tsx** renders the role/scenario admin panel and redirects legacy `tab=users` traffic.

**src/app/dashboard/admin/history/AdminHistoryClient.tsx** renders paginated admin history, final night/day reports, sample report layout, and deletion controls.

**src/app/dashboard/admin/history/page.tsx** server-checks admin access and loads initial admin history.

**src/app/dashboard/admin/users/page.tsx** server-checks admin access and renders user management.

**src/app/dashboard/moderator/page.tsx** renders moderator lobby management, active lobby list, lobby creation modal, and cancel controls.

**src/app/dashboard/moderator/game/[id]/page.tsx** renders the moderator in-game control room: timers, player status, night/day event forms, reports, final result, and public record publishing.

**src/app/dashboard/moderator/lobby/[id]/page.tsx** renders the moderator lobby setup room: scenario selection, custom role composition, active ability selection, live player list, and start button.

**src/app/dashboard/moderator/scenarios/page.tsx** loads roles/scenarios and renders the dedicated scenario manager.

**src/app/dashboard/user/page.tsx** renders the player dashboard with active games, current active game, recent history, role distribution, and shortcuts.

**src/app/dashboard/user/history/HistoryClient.tsx** renders paginated personal game history and detail modals.

**src/app/dashboard/user/history/page.tsx** server-loads the first page of personal history.

**src/app/dashboard/user/profile/ProfileForm.tsx** renders profile update, password update, and Google account connection controls.

**src/app/dashboard/user/profile/page.tsx** server-loads profile details and renders the profile shell.

**src/app/game/[id]/page.tsx** renders the player's in-progress game view, including role reveal card, scenario guide, public night records, and realtime end/cancel handling.

**src/app/join/page.tsx** renders the manual code/password join form.

**src/app/lobby/[id]/page.tsx** renders the player lobby waiting room with realtime player list and automatic transition to the game.

**src/components/InstallPWANotice.tsx** shows a dismissible install hint for non-standalone browser sessions.

**src/components/PopupProvider.tsx** provides global alert/confirm/toast APIs to client components.

**src/components/ThemeToggle.tsx** provides theme switching buttons for navigation and non-navigation contexts.

**src/components/ThemedPopups.tsx** renders the modal and toast primitives used by the popup provider.

**src/components/admin/AdminConfigPanel.tsx** is the large admin/moderator role and scenario management interface.

**src/components/admin/ScenariosManager.tsx** is the dedicated scenario library CRUD interface used by moderators.

**src/components/admin/UserManagementPanel.tsx** is the modern admin user management interface with filters, actions, and email composer.

**src/components/admin/UsersTable.tsx** is an older/simple user table component retained in the codebase.

**src/components/auth/AuthShell.tsx** provides shared auth page chrome, tabs, highlights, and layout.

**src/components/charts/AdminCharts.tsx** contains reusable Recharts line/area/bar chart wrappers.

**src/components/charts/AlignmentPieChart.tsx** renders a pie chart for alignment distribution.

**src/components/charts/WinLossBarChart.tsx** renders a bar chart for win/loss stats.

**src/components/dashboard/DashboardNavigation.tsx** renders role-aware desktop and mobile dashboard navigation.

**src/components/game/LobbyPreviewCard.tsx** renders reusable lobby status/players/role breakdown cards in compact and full modes.

**src/lib/email.ts** builds and sends password reset, verification, and admin emails through Resend API or SMTP, with safe local preview behavior.

**src/lib/gameDisplay.ts** normalizes generated game/scenario display names and hides temporary scenario internals.

**src/lib/password.ts** wraps bcrypt password hashing and verification.

**src/lib/prisma.ts** initializes the Prisma client with the PostgreSQL adapter and development singleton reuse.

**src/lib/pusher-client.ts** creates a singleton browser Pusher client with auth endpoint support.

**src/lib/pusher.ts** creates the server Pusher client and a non-singleton client helper.

**src/types/next-auth.d.ts** augments NextAuth `Session`, `User`, and JWT types with `id` and `role`.

## Phase 3: Step-by-Step Construction Guide

### Step 1: Create the project shell

Start with a Next.js App Router TypeScript project. Add React, NextAuth, Prisma, PostgreSQL driver/adapter, Pusher, Tailwind, Recharts, Serwist, Nodemailer, bcrypt, and deployment tooling. This must come first because every later module depends on TypeScript aliases, package scripts, and the app directory layout.

### Step 2: Configure TypeScript, Tailwind, PostCSS, and global CSS

Add `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, and `src/app/globals.css`. Define the `@/*` alias before writing imports. Add RTL/Persian-friendly typography and reusable UI classes before building pages so all UI work uses one design language.

### Step 3: Model the database

Create `prisma/schema.prisma` with auth tables, role/scenario tables, game lifecycle tables, player records, histories, password reset tokens, and night event logs. Run Prisma generate and push/migrate. Build the schema before actions because all backend behavior depends on these relationships.

### Step 4: Seed roles, scenarios, and bootstrap accounts

Add `prisma/seed.ts` to create admin/moderator users, canonical Mafia roles, and standard scenarios. This makes local development meaningful immediately and ensures moderator flows have roles and scenarios to choose from.

### Step 5: Add database, password, email, Pusher, and display helpers

Create `src/lib/prisma.ts`, `password.ts`, `email.ts`, `pusher.ts`, `pusher-client.ts`, and `gameDisplay.ts`. These isolate infrastructure concerns from routes and actions.

### Step 6: Build authentication

Create `src/auth.ts`, NextAuth route handlers, the auth pages, `src/types/next-auth.d.ts`, and `src/proxy.ts`. Do this before dashboards because every protected page expects `session.user.id` and `session.user.role`.

### Step 7: Build server actions

Implement `src/actions/auth.ts`, `user.ts`, `admin.ts`, `role.ts`, `dashboard.ts`, `game.ts`, and `logout.ts`. The UI should call these actions rather than duplicating backend logic inside pages.

### Step 8: Build API endpoints that are better as routes

Add password reset routes, bootstrap routes, NextAuth routes, lobby trigger route, and Pusher auth route. These support external clients, fetch-based forms, and Pusher private channel authorization.

### Step 9: Build shared providers and primitives

Add `Providers`, `PopupProvider`, `ThemedPopups`, `ThemeToggle`, `InstallPWANotice`, `AuthShell`, chart wrappers, navigation, and `LobbyPreviewCard`. Building these early prevents copy/paste UI across pages.

### Step 10: Build role-specific dashboards

Build dashboard layout, user dashboard/history/profile, moderator dashboard/lobby/game/scenario pages, and admin users/history/config pages. This order follows permissions: shared dashboard shell first, then player flows, then moderator game operations, then admin-only controls.

### Step 11: Add realtime transitions

Wire Pusher subscriptions into user dashboard, player lobby, player game view, moderator lobby, and moderator game pages. Trigger events from game server actions. Realtime comes after the core actions because clients should refresh authoritative server state rather than trusting event payloads alone.

### Step 12: Add PWA and deployment

Configure Serwist in `next.config.ts`, add service worker files, app manifest/icons, Dockerfile, Compose, Render config, and production setup docs. Deployment should be last because it packages the already-working app.

### Step 13: Verify end-to-end behavior

Run dependency install, Prisma generate/db push, seed, lint/build, then manually test registration, verification, login, role redirects, lobby creation, player join, scenario selection, start game, role reveal, event logging, end game, history display, and admin management.

## Phase 4: Granular Code Breakdown (Module by Module, Function by Function)

### Root configuration and scripts

#### `next.config.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `redirects` | Defines compatibility redirects for old admin URLs. | None. | Array of redirect records. | Returns two non-permanent redirects from legacy admin management URLs to `/dashboard/admin/users`. | Next.js config API. |

No custom classes or hooks are declared in this file. `withSerwistInit` wraps the config to produce service worker output from `src/app/sw.ts`.

#### `tailwind.config.ts`

No functions, classes, or hooks are declared. The file exports a Tailwind configuration object with dark mode, content globs, font family, colors, border radius, animation, keyframes, and spacing extensions.

#### `postcss.config.mjs`

No functions, classes, or hooks are declared. The file exports a PostCSS config that enables `@tailwindcss/postcss`.

#### `package.json`

No functions, classes, or hooks are declared. Important scripts are `dev`, `build`, `start`, `lint`, `db:push`, and `db:seed`. Prisma seed is configured as `npx tsx prisma/seed.ts`.

#### `package-lock.json`

No functions, classes, or hooks are declared. It locks dependency versions and transitive package metadata.

#### `Dockerfile`

No JavaScript functions, classes, or hooks are declared. Its build stages install dependencies, generate Prisma client, build Next, copy standalone output, copy Prisma assets and entrypoint, and run as `nextjs`.

#### `docker-compose.yml`

No functions, classes, or hooks are declared. It defines the app, PostgreSQL, Cloudflare Tunnel, environment variables, port mappings, and database volume.

#### `docker-entrypoint.sh`

No application functions are declared. The shell script waits for `db:5432`, runs `prisma db push --accept-data-loss`, runs `prisma db seed`, then starts `node server.js`.

#### `render.yaml`

No functions, classes, or hooks are declared. It provisions a Render web service and PostgreSQL database with sync/generate env var declarations.

#### `.gitignore`, `README.md`, `next-env.d.ts`, `push_payload.json`, `public/.gitkeep`

No functions, classes, or hooks are declared. `.gitignore` controls source hygiene, `README.md` is empty, `next-env.d.ts` references generated Next types, `push_payload.json` is generated payload data, and `.gitkeep` preserves the public directory.

#### `push_script.js`

No named functions or classes are declared. The top-level script imports `fs`, declares a file list, maps each file to `{ path, content }`, and writes the JSON payload to `push_payload.json`. Its inline `files.map` callback reads file contents with `fs.readFileSync`.

### Prisma schema and seed

#### `prisma/schema.prisma`

No executable functions/classes/hooks are declared, but this file defines the application's data types.

| Schema element | Purpose | Inputs/Fields | Outputs/Relations | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `Role` enum | Defines app permissions. | `USER`, `MODERATOR`, `ADMIN`. | Used by `User.role`. | Role checks in auth/actions rely on these values. | Prisma enum. |
| `Alignment` enum | Defines Mafia side/alignment. | `CITIZEN`, `MAFIA`, `NEUTRAL`. | Used by roles, games, events. | Win/loss calculation compares role alignment to winning alignment. | Prisma enum. |
| `GameStatus` enum | Defines lifecycle state. | `WAITING`, `IN_PROGRESS`, `FINISHED`. | Used by `Game.status`. | Actions gate joins/start/end based on status. | Prisma enum. |
| `GameResult` enum | Defines personal result. | `WIN`, `LOSS`. | Used by `GameHistory.result`. | Histories are created when game ends. | Prisma enum. |
| `User` model | Stores app users and auth profile. | Identity fields, password hash, role, ban flag. | Accounts, sessions, scenarios, hosted games, histories, players, reset tokens. | Central subject for auth and access checks. | NextAuth/Prisma. |
| `Account`, `Session`, `VerificationToken` | Store NextAuth provider/session/verification records. | Provider tokens, session token, email token. | Related to `User` or standalone token. | Used by NextAuth adapter and verification flow. | NextAuth Prisma adapter. |
| `PasswordResetToken` | Stores reset tokens. | Token, userId, expiresAt. | Belongs to user. | Reset route validates then deletes token. | Password reset API. |
| `MafiaRole` | Stores playable roles. | Name, description, alignment, permanence, `nightAbilities` JSON. | Scenario roles, histories, players. | Defines role cards, scenario capacity, and moderator night actions. | Admin/game actions. |
| `Scenario` | Stores role compositions. | Name, description, creator, timestamps. | ScenarioRole, games. | Used to build lobbies and role assignments. | Admin/game actions. |
| `ScenarioRole` | Join table for scenario role counts. | scenarioId, roleId, count. | Scenario and role relations. | Expands into one role ID per player at start. | Prisma relation. |
| `Game` | Stores lobby/game state. | Name, code, moderator, password, status, scenario, winner, public night flag, active abilities. | Histories, players, night events. | Central aggregate for all game flow. | Game actions/Pusher. |
| `GameHistory` | Stores each user's finished-game result. | gameId, userId, roleId, result. | Game, user, role. | Unique per game/user. | Dashboard actions. |
| `GamePlayer` | Stores player membership and assigned role. | gameId, userId, name, roleId, alive state. | Game, user, role, actor/target events. | Lobby players become role-bearing players after start. | Game actions. |
| `NightEvent` | Stores moderator night/day log records. | Night number, ability metadata, actor/target, details JSON, public flag. | Game and player relations. | Supports private moderator reports and public post-game records. | Game/history actions. |

#### `prisma/seed.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `main` | Seeds baseline users, roles, scenarios, and cleanup rules. | None directly; reads `INITIAL_ADMIN_PASSWORD`. | Resolves when seeding completes. | Upserts admin/moderator users; renames legacy roles; upserts all canonical roles; finds role IDs; upserts standard scenarios and scenario roles; removes obsolete scenarios; marks non-current permanent roles as non-permanent; disconnects Prisma in `finally`. | `PrismaClient`, `Alignment`, `bcrypt`, environment variables. |
| `id` | Looks up a role ID by Persian role name during seeding. | `name: string`. | Role ID string or `undefined`. | Searches fetched `dbRoles`, warns if missing, returns `r?.id`. | Seed-local `dbRoles`. |

### Authentication and access

#### `src/auth.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `authorize` | Validates credentials login. | `credentials` with email/password. | User object or `null`; throws if banned. | Rejects missing fields; finds user by email; rejects missing password hash; rejects banned users; compares password; returns user on success. | NextAuth Credentials provider, `prisma`, `verifyPassword`. |
| `signIn` callback | Controls sign-in after provider auth. | `{ user, account, profile }`. | `true`, redirect path, or throws. | Finds DB user by email; blocks banned users; for Google marks email verified and syncs image; for credentials redirects unverified users to verify page. | NextAuth callbacks, Prisma. |
| `jwt` callback | Keeps JWT synchronized with DB user fields. | `{ token, user, trigger, session }`. | Updated token. | On initial sign-in copies user fields; on later calls fetches latest user name/email/image/role by `token.sub`; handles manual session update fallback. | Prisma, NextAuth JWT. |
| `session` callback | Copies token data into client session. | `{ session, token }`. | Updated session. | Sets `session.user.id`, `role`, `name`, `email`, and `image` if present. | NextAuth session API, type augmentation. |
| `createUser` event | Marks newly-created OAuth users verified. | `{ user }`. | Promise resolving after optional update. | If user has email, updates `emailVerified` to current date. | NextAuth event, Prisma. |

The module exports `handlers`, `auth`, `signIn`, and `signOut` returned by `NextAuth(...)`.

#### `src/proxy.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `requestUrl` | Builds absolute redirect URLs that respect forwarded host/proto headers. | `req: NextRequest`, `path: string`. | `URL`. | Reads `x-forwarded-proto`, `x-forwarded-host`, and `host`; builds a URL relative to forwarded origin or request URL. | NextRequest. |
| default auth proxy callback | Protects routes and redirects users by auth state/role. | `req` extended with `auth`. | `NextResponse.next()` or redirect response. | Allows `/api/auth`; redirects logged-in users away from login/register to role dashboards; redirects anonymous users away from protected routes; passes all other requests through. | `auth` wrapper from `src/auth.ts`, `NextResponse`, `requestUrl`. |

`config.matcher` excludes API/static/image/icon/manifest/service-worker paths from proxy matching.

#### `src/types/next-auth.d.ts`

No executable functions/classes/hooks are declared. It augments NextAuth `Session.user` with `id` and `role`, augments `User.role`, and augments JWT with `role`.

### Infrastructure helpers

#### `src/lib/prisma.ts`

No declared functions or classes. Top-level logic reads `DATABASE_URL`, creates a `pg` pool, wraps it with `PrismaPg`, creates a Prisma client with query/error/warn logs in development, and stores it on `globalThis` outside production to avoid hot-reload client leaks.

#### `src/lib/password.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `hashPassword` | Hashes plaintext passwords. | `password: string`. | Bcrypt hash string. | Generates salt with cost 10 and hashes the password. | `bcryptjs`. |
| `saltAndHashPassword` | Alias for older code paths. | Same as `hashPassword`. | Same as `hashPassword`. | Direct export alias. | `hashPassword`. |
| `verifyPassword` | Checks plaintext against stored hash. | `password: string`, `hash: string`. | Boolean. | Calls bcrypt compare. | `bcryptjs`. |

#### `src/lib/pusher.ts`

| Function/Value | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `pusherServer` | Server-side Pusher client. | Env vars for app id, key, secret, cluster. | Configured `PusherServer` instance. | Instantiates Pusher with TLS and local fallbacks. | `pusher`. |
| `getPusherClient` | Creates a browser Pusher client. | None. | New `PusherClient`. | Reads public key/cluster from env and creates a client. | `pusher-js`. |

#### `src/lib/pusher-client.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `getPusherClient` | Provides a singleton browser Pusher client. | None. | `PusherClient`. | If no client exists, creates one with public key/cluster and `/api/pusher/auth`; returns the cached client. | `pusher-js`, browser env vars. |

#### `src/lib/gameDisplay.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `isTemporaryScenario` | Detects temporary/custom one-lobby scenarios. | `scenario?: ScenarioLike \| null`. | Boolean. | Checks description prefix or legacy temporary description text. | `TEMP_SCENARIO_DESCRIPTION_PREFIX`. |
| `scenarioPlayerCount` | Counts total players in a scenario. | `scenario?: ScenarioLike \| null`. | Number. | Reduces scenario roles by `count`; returns 0 if absent. | None. |
| `scenarioDisplayName` | Produces user-friendly scenario name. | `scenario`, optional `fallback`. | String. | Returns fallback if missing; uses original name for permanent scenarios; for temporary scenarios returns custom label with player count. | `isTemporaryScenario`, `scenarioPlayerCount`. |
| `scenarioDisplayDescription` | Hides temporary scenario internal description. | `scenario`. | String. | Returns empty for missing/temporary scenarios, otherwise scenario description or empty string. | `isTemporaryScenario`. |
| `withScenarioDisplayName` | Rewrites a game's temporary scenario name for UI. | Generic `game` with optional scenario. | Same shape `game`. | If scenario is temporary, returns a shallow copy with display name and null description. | `scenarioDisplayName`, `isTemporaryScenario`. |
| `gameDisplayName` | Normalizes generated game names. | `game`, optional fallback. | String. | Trims name; falls back for empty names, names equal to generated `بازی {code}`, or six-digit generated game names. | Regex, game code. |
| `withGameDisplayName` | Rewrites a game object's `name`. | Generic game. | Same shape game. | Returns shallow copy with `name: gameDisplayName(game)`. | `gameDisplayName`. |

#### `src/lib/email.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `withTimeout` | Adds a timeout to async mail/fetch operations. | `promise`, `milliseconds`. | Promise that resolves/rejects first. | Starts a timeout reject; clears it on promise resolve/reject. | Native Promise/timers. |
| `getMailConfig` | Reads email settings from environment. | None. | Mail config object. | Reads SMTP/Email aliases, secure mode, from address, and Resend API key detection. | `process.env`. |
| `buildResetUrl` | Builds reset-password URL. | `baseUrl`, `token`. | URL string. | Removes trailing slash and appends `/auth/reset-password?token=...`. | None. |
| `buildVerifyUrl` | Builds email verification URL. | `baseUrl`, `token`, `email`. | URL string. | Removes trailing slash and appends token/email query params with encoded email. | `encodeURIComponent`. |
| `getTransporter` | Creates SMTP transporter or disables unsafe local relay. | Optional mail config. | Nodemailer transporter or `null`. | Returns null without host; blocks local Mailhog-style relay in production; creates transporter with timeouts and optional auth. | `nodemailer`, `getMailConfig`. |
| `escapeHtml` | Escapes unsafe HTML characters. | `value: string`. | Escaped string. | Replaces `&`, `<`, `>`, `"`, and `'`. | String APIs. |
| `renderEmailRows` | Renders key/value rows in auth emails. | `EmailDetailRow[]`. | HTML string. | Maps rows to RTL table rows, escaping labels/values and respecting LTR values. | `escapeHtml`, email constants. |
| `renderEmailSteps` | Renders numbered helper steps. | `steps`, `theme`. | HTML string. | Returns empty without steps; maps steps to table rows with Persian digits. | `PERSIAN_DIGITS`, `escapeHtml`. |
| `buildAuthEmailHtml` | Builds full HTML for reset/verification emails. | `AuthEmailHtmlOptions`. | HTML document string. | Escapes CTA/title/body content; composes hero, CTA, details, optional steps, notice, fallback URL, and footer. | `renderEmailRows`, `renderEmailSteps`, `escapeHtml`. |
| `buildResetMessage` | Builds reset email message object. | `email`, `resetUrl`, `from`. | Nodemailer/Resend message object. | Supplies reset theme, subject, HTML, text fallback, details, and warning notice. | `buildAuthEmailHtml`. |
| `buildVerificationMessage` | Builds verification email message object. | `email`, `verifyUrl`, `from`. | Message object. | Supplies verification theme, subject, HTML, steps, and text fallback. | `buildAuthEmailHtml`. |
| `renderInlineEmailText` | Supports bold markup in admin email body. | `value: string`. | HTML string. | Escapes HTML and converts `**text**` to `<strong>`. | `escapeHtml`, regex. |
| `buildAdminEmailBodyHtml` | Converts admin-written plain text to styled email blocks. | `body: string`. | HTML string. | Splits lines; flushes paragraph/list buffers; supports blank lines, `---`, `# heading`, `> note`, `- list`, inline bold; emits fallback block if empty. | `renderInlineEmailText`. |
| `buildAdminUserMessage` | Builds admin-to-user email message. | `email`, `subject`, `body`, `from`. | Message object. | Renders admin body, wraps it in branded HTML, adds notice and plain text fallback. | `buildAdminEmailBodyHtml`, `escapeHtml`. |
| `sendWithResendApi` | Sends message through Resend HTTP API. | `message`, `apiKey`, `resetUrl`/debug identifier. | `{ delivered, reason? }`. | POSTs to Resend with timeout; returns delivered on OK; logs warnings and returns failure otherwise. | `fetch`, `withTimeout`. |
| `sendPasswordResetEmail` | Sends or previews password reset email. | `email`, `token`, `baseUrl`. | `PasswordResetEmailResult`. | Builds URL/message; uses Resend if configured; else SMTP transporter; without transporter returns preview URL; catches failures and returns preview in development. | `getMailConfig`, `buildResetUrl`, `buildResetMessage`, `sendWithResendApi`, `getTransporter`, `withTimeout`. |
| `sendVerificationEmail` | Sends or previews verification email. | `email`, `token`, `baseUrl`. | `PasswordResetEmailResult`. | Builds URL/message; uses Resend or SMTP; without transporter returns preview; catches failure. | `buildVerifyUrl`, `buildVerificationMessage`, mail helpers. |
| `sendAdminUserEmail` | Sends admin-authored message to a user. | `email`, `subject`, `body`. | `PasswordResetEmailResult`. | Builds message with admin from address; sends through Resend or SMTP; returns failure if unconfigured or send fails. | `buildAdminUserMessage`, mail helpers. |

### Server actions

#### `src/actions/auth.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `getBaseUrl` | Builds origin for verification links. | None. | Base URL string. | Reads request headers and fallback env vars; prepends protocol if needed. | `headers` from Next. |
| `createVerificationToken` | Creates a fresh 24-hour email verification token. | `email: string`. | Token string. | Generates random hex token; deletes prior tokens for email; creates new verification token with 24h expiry. | `crypto.randomBytes`, Prisma. |
| `registerUser` | Creates a credentials user and sends verification email. | `FormData` with name/email/password. | `{ success }` or `{ error }`. | Normalizes email; validates required fields; rejects duplicate email; hashes password; creates user; creates token; sends verification email. | `saltAndHashPassword`, Prisma, email helper, `getBaseUrl`. |
| `resendVerificationEmail` | Re-sends verification email with rate limit. | `email: string`. | Success/verified or error object. | Normalizes email; finds user; returns verified if already verified; checks existing unexpired token and enforces 2-minute wait; creates token and sends email. | Prisma, `createVerificationToken`, `sendVerificationEmail`. |
| `verifyEmailToken` | Verifies email token. | `token`, `email`. | Success or error object. | Normalizes email; finds token; validates identifier and expiry; updates user's `emailVerified`; deletes email tokens. | Prisma. |
| `loginUser` | Performs credentials login from server action. | `FormData` email/password. | Success/role or error object. | Normalizes email; looks up user role/verification; blocks missing/unverified users; calls NextAuth credentials `signIn` with redirect false. | Prisma, `signIn`. |
| `logout` | Signs out current session. | None. | Promise<void>. | Calls NextAuth `signOut`. | `signOut`. |

#### `src/actions/logout.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `logoutAction` | Signs out and redirects home. | None. | Promise<void>. | Calls `signOut({ redirectTo: "/" })`. | NextAuth `signOut`. |

#### `src/actions/user.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `updateProfile` | Updates current user's name/email. | `FormData` with name/email. | Success or error object. | Requires session; validates name/email; enforces max 25 chars per name part; detects email changes and clears verification; updates user; revalidates dashboard/profile. | `auth`, Prisma, `revalidatePath`. |
| `changePassword` | Sets or changes current user's password. | `FormData` currentPassword/newPassword/confirmPassword. | Success or error object. | Requires session; validates new/confirm; fetches user; if password exists, verifies current password; hashes new password; updates `password_hash`. | `auth`, Prisma, `verifyPassword`, `hashPassword`. |

#### `src/actions/role.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `getRoles` | Fetches all Mafia roles. | None. | Array of roles sorted by name. | Calls `prisma.mafiaRole.findMany({ orderBy: { name: "asc" } })`. | Prisma. |

#### `src/actions/dashboard.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `isCurrentAdmin` | Checks current session is active admin. | None. | Boolean. | Reads session, fetches user role/ban status, returns true only for non-banned admin. | `auth`, Prisma. |
| `formatHistoryRecord` | Converts a `GameHistory` include graph into UI data. | `rg: any`. | Plain history object. | Computes display names/date/player count; maps players and public night events; hides private night events. | `gameDisplayName`, scenario display helpers. |
| `getUserStats` | Loads player dashboard stats. | None. | Dashboard data or `null`. | Disables cache; requires session; counts games/wins/losses; groups top roles; fetches recent histories; finds active game; returns chart/history-ready data. | `auth`, Prisma, `formatHistoryRecord`, `noStore`. |
| `getUserStatsSafe` | Safe wrapper for user stats. | None. | `{ success, data, error? }`. | Calls `getUserStats` and catches/logs failures with user-friendly error. | `getUserStats`. |
| `getAllUserHistory` | Loads all history for current user. | None. | Array of formatted records. | Requires session; fetches all histories with role/game/player/public-night includes; formats each. | Prisma, `formatHistoryRecord`. |
| `getUserHistoryPage` | Loads paginated current-user history. | `page = 0`, `pageSize = 10`. | Page object with items/total/page flags. | Requires session; clamps page size/page; counts total and fetches page in parallel; formats rows; calculates pagination flags. | Prisma, `formatHistoryRecord`. |
| `deleteGameHistory` | Admin-deletes a full game and all histories. | `gameId: string`. | Success or error object. | Requires admin; deletes game histories then game; cascades related rows; returns error on failure. | `isCurrentAdmin`, Prisma. |
| `getAdminGameHistoryPage` | Loads paginated game history for admins. | `page = 0`, `pageSize = 10`. | Page object or access error page. | Requires admin; clamps page; counts games that have histories; fetches games with scenario, moderator, histories, players, events; maps to UI records. | Prisma, display helpers, `noStore`. |

#### `src/actions/admin.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `checkAdmin` | Enforces admin access. | None. | Current user ID or throws. | Requires session; fetches role/ban; throws unless non-banned admin. | `auth`, Prisma. |
| `checkModerator` | Enforces moderator-or-admin access. | None. | Current user ID or throws. | Requires session; fetches role/ban; throws unless non-banned admin/moderator. | `auth`, Prisma. |
| `normalizeNightAbilities` | Sanitizes role night ability input into JSON. | Optional `RoleNightAbilityInput[]`. | Prisma JSON value or `JsonNull`. | Rejects non-arrays; uses local helpers to clamp limits, self-target limit, and slugs; trims labels; requires enough choices for multi-target abilities; returns clean JSON or null. | Prisma JSON types. |
| `cleanLimit` | Local helper inside `normalizeNightAbilities` for numeric limits. | `value`, optional `max`. | Number or null. | Treats empty/null as null; clamps between 1 and max. | `Number`, `Math`. |
| `cleanSelfLimit` | Local helper for self-target limits. | `value`. | Number. | Treats empty/null as 0; clamps between 0 and 5. | `Number`, `Math`. |
| `cleanId` | Local helper for ability/choice IDs. | `value`, `fallback`. | Slug string. | Lowercases, strips invalid characters, trims hyphens, slices to 50 chars, falls back if empty. | Regex. |
| `validateNightAbilities` | Validates multi-target abilities before save. | Optional abilities. | Void or throws. | For each filled ability with `targetsPerUse > 1`, counts filled choices and throws if fewer than target count. | None. |
| `getAllUsers` | Lists users for admin management. | None. | User list with account/count/current game data. | Requires admin; includes auth providers, history/host counts, most recent active game; normalizes game names. | `checkAdmin`, Prisma, `gameDisplayName`. |
| `getAllUsersSafe` | Safe wrapper for user list. | None. | `{ success, data, error? }`. | Calls `getAllUsers`, catches/logs errors. | `getAllUsers`. |
| `updateUserRole` | Changes a user's app role. | `userId`, `role`. | Void. | Requires admin; prevents self-demotion; updates user; revalidates users page. | Prisma, `revalidatePath`. |
| `banUser` | Sets ban status. | `userId`, `isBanned`. | Void. | Requires admin; prevents self-ban; updates `isBanned`; revalidates users page. | Prisma. |
| `deleteUser` | Deletes a user. | `userId`. | Void. | Requires admin; prevents self-delete; deletes user; revalidates users page. | Prisma. |
| `verifyUserEmail` | Manually marks user's email verified. | `userId`. | Void. | Requires admin; updates `emailVerified` to current date; revalidates users page. | Prisma. |
| `sendEmailToUser` | Sends admin-composed email to a user. | `userId`, `{ subject, body }`. | `{ success: true }` or throws. | Requires admin; validates subject/body length; finds recipient email; sends email; throws if delivery fails. | Prisma, `sendAdminUserEmail`. |
| `getMafiaRoles` | Lists Mafia roles for admin/moderator pages. | None. | Role array. | Requires moderator/admin; fetches roles ordered by alignment. | Prisma. |
| `getMafiaRolesSafe` | Safe wrapper for roles. | None. | `{ success, data, error? }`. | Calls `getMafiaRoles`, catches/logs failures. | `getMafiaRoles`. |
| `createMafiaRole` | Creates a custom role. | Role data with optional night abilities. | Created role. | Requires moderator/admin; validates and normalizes abilities; creates non-permanent role; revalidates admin page. | Prisma, validation helpers. |
| `updateMafiaRole` | Updates role data. | `id`, role data. | Updated role. | Requires moderator/admin; validates/normalizes abilities; updates role; revalidates admin page. | Prisma. |
| `deleteMafiaRole` | Deletes a role. | `id`. | Void. | Requires moderator/admin; deletes `ScenarioRole` links first; deletes role; revalidates admin page. | Prisma. |
| `getScenarios` | Lists saved scenarios. | None. | Scenario array with role details. | Requires moderator/admin; excludes temporary descriptions; includes role relations; orders newest first. | Prisma, `TEMP_SCENARIO_DESCRIPTION_PREFIX`. |
| `getScenariosSafe` | Safe wrapper for scenarios. | None. | `{ success, data, error? }`. | Calls `getScenarios`, catches/logs failures. | `getScenarios`. |
| `createScenario` | Creates saved scenario. | `{ name, description, roles }`. | Created scenario with roles. | Requires moderator/admin; creates scenario and nested scenario-role rows; revalidates moderator scenarios. | Prisma. |
| `updateScenario` | Replaces a scenario composition. | `id`, scenario data. | Updated scenario with roles. | Requires moderator/admin; deletes old scenario roles; updates fields and creates new links; revalidates scenarios. | Prisma. |
| `installStandardScenarios` | Upserts the built-in scenario library. | None. | `{ success: true }`. | Requires moderator/admin; loads roles; maps role names to IDs; iterates standard definitions; creates or updates scenarios and role links; revalidates scenarios. | Prisma, local `id`. |
| `id` | Local helper in `installStandardScenarios`. | Role `name`. | Role ID or `undefined`. | Finds role by name in loaded `allRoles`. | `allRoles`. |
| `deleteScenario` | Deletes a scenario. | `id`. | Void. | Requires moderator/admin; deletes scenario; revalidates scenarios. | Prisma. |

#### `src/actions/game.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `checkModerator` | Enforces moderator/admin access. | None. | Current user ID or throws. | Requires session; fetches user role/ban; allows non-banned admin/moderator only. | `auth`, Prisma. |
| `checkModeratorForGame` | Enforces moderator/admin access to a specific game. | `gameId`. | `{ userId, role, game }` or throws. | Checks user access; fetches game; allows admin or owning moderator; returns minimal game state. | `auth`, Prisma. |
| `isAlignment` | Runtime type guard for alignments. | Unknown value. | Boolean type predicate. | Returns true for `CITIZEN`, `MAFIA`, or `NEUTRAL`. | Prisma `Alignment`. |
| `normalizeEffectType` | Sanitizes ability effect type. | Unknown value. | Ability effect type. | Allows special values, otherwise returns `NONE`. | None. |
| `inferEffectTypeFromLabel` | Infers special effect from labels. | `label: string`. | Ability effect type. | Normalizes Persian Arabic letters/lowercase; detects yakuza, convert, and inquiry keywords. | Regex/string APIs. |
| `normalizeRoleAbilityIds` | Extracts ability IDs from role JSON. | Unknown JSON. | String array. | Rejects non-arrays; maps records with label/id; filters invalid. | None. |
| `normalizeRoleAbilityDefinitions` | Extracts ability definitions from role JSON. | Unknown JSON. | `{ id, label, effectType }[]`. | Rejects non-arrays; trims label/id; normalizes effect type; filters invalid. | `normalizeEffectType`. |
| `normalizeActiveRoleAbilityConfig` | Cleans game-level active ability config. | Unknown config, optional allowed map. | `Record<roleId, abilityIds[]>`. | Rejects non-object/arrays; dedupes string IDs; optionally filters by allowed ability IDs. | `Map`, `Set`. |
| `buildDefaultActiveRoleAbilities` | Initializes active abilities from a scenario. | Scenario with roles/abilities. | Prisma JSON value or `JsonNull`. | For roles with one ability, enables it; for roles with multiple abilities, stores an empty list requiring moderator selection. | `normalizeRoleAbilityIds`, Prisma JSON. |
| `sanitizeNightEvents` | Removes excess player relation data from event payloads. | Event array. | Sanitized event array. | Maps actor/target players to id/name/isAlive/role only. | None. |
| `expireStaleGames` | Auto-finishes old non-finished games. | None. | Promise<void>. | Finds games older than 8 hours; marks them finished with unknown winner; creates pending histories for registered players; broadcasts `game-ended`; revalidates dashboards. | Prisma transactions, Pusher, `revalidatePath`. |
| `joinGame` | Adds current user as a player to a waiting lobby. | `code`, `playerName`, optional `password`. | Success with game/player IDs or error. | Validates inputs; expires stale games; requires session; finds waiting game; validates password/capacity; picks account name; creates `GamePlayer`; broadcasts `player-joined`; handles duplicate names. | `auth`, Prisma, Pusher. |
| `createGame` | Creates a new waiting lobby. | Optional `name`, `password`. | Success with gameId or error. | Requires moderator/admin; generates six-digit code; creates game; broadcasts lobby `game-created`; revalidates user/moderator dashboards. | Prisma, Pusher. |
| `getWaitingGames` | Lists waiting games for players. | Optional timestamp cache-buster. | Waiting games array. | Disables cache; expires stale games; fetches waiting games with moderator/scenario/count; normalizes display names. | Prisma, display helpers. |
| `getWaitingGamesSafe` | Safe wrapper for waiting games. | Optional timestamp. | `{ success, data, error? }`. | Calls `getWaitingGames`, catches/logs failures. | `getWaitingGames`. |
| `getModeratorGames` | Lists active games visible to moderator/admin. | Optional timestamp. | Games array. | Expires stale games; requires session and role; admins see all active/waiting, moderators see owned games; normalizes names. | Prisma, `auth`. |
| `getModeratorGamesSafe` | Safe wrapper for moderator game list. | Optional timestamp. | `{ success, data, error? }`. | Calls `getModeratorGames`, catches/logs failures. | `getModeratorGames`. |
| `getGameStatus` | Loads authoritative game state. | `gameId`. | Safe game object or `null`. | Expires stale games; fetches game with players/roles/events; determines whether current user can see private night events; loads mafia conversion roles for moderators/admins; strips password; returns `hasPassword`. | Prisma, `auth`, `sanitizeNightEvents`, display helpers. |
| `getPlayerGameView` | Loads player-safe game state. | `gameId`. | Player-safe game object or `null`. | Requires session; fetches game with public events; finds current player's row; strips password and other players' roles; includes only current player's role. | Prisma, `auth`, display helpers. |
| `startGame` | Assigns roles and starts a game. | `gameId`. | Success or error object. | Requires game moderator/admin; loads players/scenario; expands role IDs by counts; validates exact player count; shuffles IDs; updates players in transaction; marks game in progress; broadcasts `game-started`; revalidates paths. | Prisma, Pusher. |
| `setGameScenario` | Sets/clears scenario for waiting lobby. | `gameId`, `scenarioId`. | Success or error object. | Requires moderator/admin for game; blocks non-waiting games; validates scenario capacity against current players; suggests matching scenarios if too small; stores scenario and default ability config; broadcasts update. | Prisma, Pusher, `buildDefaultActiveRoleAbilities`. |
| `setGameRoleAbilities` | Stores active ability choices for a waiting game. | `gameId`, `activeRoleAbilities`. | Success with config or error. | Requires waiting game; loads scenario roles; builds allowed ability map; normalizes config; updates game JSON; broadcasts `ability-config-updated`. | Prisma, Pusher, config helpers. |
| `createCustomGameScenario` | Creates a scenario from lobby role counts and applies it. | `gameId`, role counts, `saveToLibrary`, optional `scenarioName`. | Result of `setGameScenario` or error. | Requires waiting game; validates role count equals player count; requires name when saving; creates temporary or saved scenario; revalidates library if saved; applies scenario to game. | Prisma, `setGameScenario`. |
| `setPlayerAliveStatus` | Toggles player alive/eliminated state. | `gameId`, `playerId`, `isAlive`. | Success with updated player or error. | Requires moderator/admin; validates player belongs to game; updates alive/eliminatedAt; broadcasts `player-status-updated`; revalidates game pages. | Prisma, Pusher. |
| `recordNightEvent` | Records a night ability/action and applies special effects. | `gameId`, `NightEventInput`. | Success with event or error. | Requires active/non-finished game; sanitizes fields; validates active ability config, player IDs, target counts, duplicate targets, special effect rules, and conversion role; transactionally converts target roles or eliminates yakuza sacrifice; creates event; broadcasts state/status updates; revalidates pages. | Prisma, Pusher, all effect/config helpers. |
| `recordDayElimination` | Records a day elimination and marks target dead. | `gameId`, `DayEliminationInput`. | Success with event or error. | Requires non-finished game; validates target/method; transactionally marks player eliminated and creates `NightEvent` with day-phase details; broadcasts status/state updates. | Prisma, Pusher. |
| `deleteNightEvent` | Deletes a moderator event record. | `gameId`, `eventId`. | Success or error. | Requires moderator/admin; validates event belongs to game; deletes it; revalidates moderator game. | Prisma. |
| `publishNightRecords` | Makes night/day records public after game ends. | `gameId`. | Success or error. | Requires moderator/admin; requires finished game; updates game public flag and all event `isPublic`; broadcasts `night-records-public`; revalidates history/game pages. | Prisma transaction, Pusher. |
| `endGame` | Finishes game and writes histories. | `gameId`, winning alignment or unknown. | Success or error. | Requires moderator/admin; normalizes winner; loads players/roles; marks game finished; creates histories for registered players with role IDs; computes WIN/LOSS by alignment; broadcasts `game-ended`; revalidates dashboards. | Prisma, Pusher. |
| `cancelGame` | Deletes an active/waiting game. | `gameId`. | Success or error. | Requires moderator/admin; finds game; deletes it; broadcasts `game-cancelled`; revalidates dashboards. | Prisma, Pusher. |

### API routes

#### `src/app/api/auth/[...nextauth]/route.ts`

Exports `GET` and `POST` from `handlers`. No custom functions are declared here; request handling is delegated to `src/auth.ts`.

#### `src/app/api/auth/forgot-password/route.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `getErrorCode` | Extracts nested error code. | `error: unknown`. | String code or empty string. | Recurses through `cause` and returns `code` if present. | None. |
| `isValidEmail` | Validates email shape. | Unknown value. | Boolean type predicate. | Checks string type and simple email regex. | Regex. |
| `getBaseUrl` | Chooses reset link origin. | `Request`. | Base URL string. | Reads env base URL, request origin, forwarded host/proto; keeps localhost in development; otherwise prefers env URL. | URL API, request headers. |
| `POST` | Creates password reset token and sends reset email. | JSON request with `email`. | JSON `ok`, optional preview URL, or error status. | Validates email; returns ok for missing user to avoid enumeration; deletes prior tokens; creates 24h token; sends email; in production deletes token and returns 503 if delivery fails; handles DB connection errors. | Prisma, `crypto`, `sendPasswordResetEmail`, `NextResponse`. |

#### `src/app/api/auth/reset-password/route.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `POST` | Resets a password by token. | JSON with `token` and `password`. | JSON `{ ok: true }` or error status. | Zod-validates token/password complexity; finds reset token with user; rejects missing/expired token and deletes expired token; hashes password; transactionally updates user and deletes token; handles Zod and DB connection errors. | Zod, Prisma, `hashPassword`, `NextResponse`. |

#### `src/app/api/register/route.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `POST` | JSON registration endpoint. | JSON name/email/password. | Created user JSON or error status. | Zod-validates name, email, and password complexity; rejects duplicate email; hashes password; creates user selecting safe fields; handles Zod/server errors. | Zod, Prisma, `hashPassword`, `NextResponse`. |

#### `src/app/api/init-db/route.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `GET` | Bootstraps minimal DB data. | None. | JSON success/error. | Hashes default admin password; upserts admin; upserts a minimal set of legacy roles; returns success or 500. | Prisma, `hashPassword`, Prisma enums, `NextResponse`. |

#### `src/app/api/setup-admin/route.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `GET` | Creates an admin if absent. | None. | JSON message/status. | Finds `admin@mafia.com`; returns 200 if exists; hashes env/default password; creates admin; returns email/password in response; catches errors. | Prisma, `bcryptjs`, `NextResponse`. |

#### `src/app/api/lobby/route.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `POST` | Triggers arbitrary lobby Pusher event. | JSON `{ action, lobbyId, data }`. | JSON success or 500. | Parses request, triggers `lobby-${lobbyId}` with action/data, catches errors. | `pusherServer`, `NextResponse`. |

#### `src/app/api/pusher/auth/route.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `POST` | Authorizes private/presence Pusher channel subscription. | FormData `socket_id`, `channel_name`. | Pusher auth JSON or 401. | Requires session; reads socket/channel; calls `pusherServer.authorizeChannel` with user id/name/email. | `auth`, `pusherServer`, `NextResponse`. |

### App shell, PWA, and static routes

#### `src/app/layout.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `RootLayout` | Defines global HTML/body layout. | `children: React.ReactNode`. | JSX document. | Sets `lang=fa`, `dir=rtl`, hydration warning suppression, Material Symbols stylesheet, Vazirmatn font variable, and wraps children in `Providers`. | Next font, `Providers`, global CSS. |

No client hooks are used; this is a server component.

#### `src/app/providers.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `Providers` | Composes client providers. | `children`. | JSX provider tree. | Wraps children with `SessionProvider`, `ThemeProvider`, and `PopupProvider`. | `next-auth/react`, `next-themes`, popup provider. |

#### `src/app/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `Home` | Renders home/landing page. | None. | JSX. | Displays brand header, theme/login controls, hero section, sample `LobbyPreviewCard`, and feature signal cards. | `Link`, `ThemeToggle`, `LobbyPreviewCard`. |

#### `src/app/not-found.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `NotFound` | Renders custom 404. | None. | JSX. | Shows a styled missing-page message and navigation link back to home. | `Link`. |

#### `src/app/manifest.ts`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `manifest` | Supplies PWA manifest. | None. | `MetadataRoute.Manifest`. | Returns Persian app name, short name, description, start URL, standalone display, theme/background colors, RTL/lang, and icon declarations. | Next MetadataRoute. |

#### `src/app/icon.tsx` and `src/app/apple-icon.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `Icon` | Dynamically renders app icon PNG. | None. | `ImageResponse`. | Uses edge runtime constants for size/content type and returns styled icon markup. | `next/og`. |

`src/app/icon.tsx` creates a 512x512 icon. `src/app/apple-icon.tsx` creates a 180x180 Apple icon.

#### `src/app/sw.ts` and `src/sw.ts`

No declared application functions/classes/hooks. Each file declares service worker global types, instantiates `Serwist` with precache entries, skip waiting, clients claim, navigation preload, and `defaultCache`, then calls `serwist.addEventListeners()`.

#### `src/app/globals.css`

No JavaScript functions/classes/hooks. It defines global CSS variables, app containers, UI button/card/input utilities, RTL/Persian typography, scrollbar styling, 3D flip helpers, and responsive/safe-area behavior.

### Auth pages

#### `src/app/auth/login/page.tsx`

| Function/Hook | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `LoginPage` | Renders login form and OAuth button. | None. | JSX. | Uses `useActionState` to validate credentials, call `loginUser`, route users by role, route unverified users to verification, and render errors. Includes Google sign-in button. | `useRouter`, `useActionState`, `loginUser`, `signIn`, `AuthShell`, `usePopup`. |

Hooks: `useRouter`, `usePopup`, and `useActionState` manage navigation, alerts, and form submission state.

#### `src/app/auth/register/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `RegisterPage` | Renders registration page. | None. | JSX. | Provides form, Google sign-in, and submit handler inside `AuthShell`. | `registerUser`, router, popup context, `signIn`. |
| `handleRegister` | Handles credentials registration submit. | `React.FormEvent<HTMLFormElement>`. | Promise<void>. | Prevents default; reads FormData; validates name/email/password; calls `registerUser`; navigates to verify page on success or shows alert on failure. | `registerUser`, `useRouter`, `usePopup`. |

#### `src/app/auth/forgot-password/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `ForgotPasswordPage` | Renders forgot-password form. | None. | JSX. | Tracks email/message/error/preview/submitting state; renders preview link in development if returned. | `useState`, `AuthShell`, `fetch`. |
| `handleSubmit` | Sends reset request. | `React.FormEvent<HTMLFormElement>`. | Promise<void>. | Prevents default; clears prior state; validates email; POSTs `/api/auth/forgot-password`; parses JSON if present; sets error/message/preview; handles network failure; toggles submitting. | Fetch API. |

#### `src/app/auth/reset-password/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `ResetPasswordForm` | Renders token-based password reset form. | None. | JSX. | Reads `token` from search params; tracks password/confirm/error/submitting; renders `AuthShell`. | `useRouter`, `useSearchParams`, `useState`. |
| `handleSubmit` | Sends new password to API. | `React.FormEvent<HTMLFormElement>`. | Promise<void>. | Validates token, password presence, length, match; POSTs `/api/auth/reset-password`; redirects to login on success; displays errors. | Fetch API, router. |
| `ResetPasswordPage` | Suspense wrapper for search params usage. | None. | JSX. | Renders `ResetPasswordForm` inside `<Suspense fallback={null}>`. | React `Suspense`. |

#### `src/app/auth/verify-email/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `VerifyEmailPage` | Server-validates verification link query. | `searchParams` promise with token/email. | JSX. | Awaits params; when token/email exist calls `verifyEmailToken`; passes email, verified flag, or error into `VerifyEmailClient`. | `verifyEmailToken`, `VerifyEmailClient`. |

#### `src/app/auth/verify-email/VerifyEmailClient.tsx`

| Function/Hook | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `VerifyEmailClient` | Shows verification result and resend controls. | `{ email?, verified?, error? }`. | JSX. | Starts a 120-second resend cooldown, renders verified/error/waiting states, and exposes resend button. | `useEffect`, `useState`, `useTransition`, popup context. |
| `resend` | Re-sends verification email. | None. | Void. | Validates email exists; starts transition; calls `resendVerificationEmail`; resets cooldown and toasts on success; alerts on failure. | `resendVerificationEmail`, `usePopup`. |

### Dashboard route components

#### `src/app/dashboard/layout.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `DashboardLayout` | Protects and wraps dashboard pages. | `children`. | JSX. | Gets session; redirects anonymous users; computes admin/moderator flags; defines server logout action; renders `DashboardNavigation`, main content, and `InstallPWANotice`. | `auth`, `signOut`, `redirect`, dashboard components. |
| `handleLogout` | Server action for dashboard logout. | None. | Promise<void>. | Calls `signOut({ redirectTo: "/" })`. | NextAuth `signOut`. |

#### `src/app/dashboard/user/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `EmptyState` | Reusable empty-state block. | `{ icon, title, text }`. | JSX. | Renders icon, title, and helper text in dashed panel. | Material Symbols. |
| `PanelHeader` | Reusable dashboard panel header. | `{ icon, title, subtitle?, action? }`. | JSX. | Renders icon/title/subtitle/action with consistent border/background. | React. |
| `resultMeta` | Maps game result to label/icon/classes. | `result: string`. | Metadata object. | Returns win, loss, or pending styling. | None. |
| `alignmentLabel` | Maps alignment enum to Persian label. | `alignment`. | String. | Returns citizen/mafia/neutral label. | None. |
| `alignmentClass` | Maps alignment to badge classes. | `alignment`. | CSS class string. | Returns tone-specific class for citizen, mafia, or neutral. | None. |
| `effectLabel` | Maps night event effect type to label. | Optional effect type. | String. | Returns labels for convert, yakuza, two-name inquiry, or simple record. | None. |
| `UserDashboard` | Renders player dashboard. | None. | JSX. | On mount loads stats and waiting games; subscribes to `lobby` Pusher channel; computes wins/losses/win rate/status/most-played role; renders active game, waiting lobbies, shortcuts, recent histories, role chart, and detail modal. | `useSession`, `useEffect`, `useState`, Recharts, `getUserStatsSafe`, `getWaitingGamesSafe`, Pusher. |
| `refreshData` | Refreshes dashboard stats and active games. | None. | Promise<void>. | Calls safe stats action then updates data/error; calls `refreshActiveGames`. | Dashboard/game actions. |
| `refreshActiveGames` | Loads waiting lobbies. | None. | Promise<void>. | Calls `getWaitingGamesSafe(Date.now())`, updates list and error string. | Game action. |

Hooks: `useEffect` handles initial load and Pusher subscription; local state tracks mounted/data/errors/modal.

#### `src/app/dashboard/user/history/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `UserHistoryPage` | Server-loads initial personal history. | None. | JSX. | Calls `getUserHistoryPage(0, 10)` and renders `HistoryClient`. | Dashboard action. |

#### `src/app/dashboard/user/history/HistoryClient.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `effectLabel` | Labels night event effect types. | Optional string. | String. | Returns convert/yakuza/inquiry/simple Persian label. | None. |
| `resultMeta` | Maps result to display metadata. | `WIN`, `LOSS`, or `PENDING`. | Label/icon/class object. | Chooses win/loss/pending styling. | None. |
| `alignmentLabel` | Maps alignment to Persian label. | Alignment string. | String. | Returns citizen/mafia/neutral. | None. |
| `alignmentClass` | Maps alignment to CSS classes. | Alignment string. | CSS class string. | Returns color classes. | None. |
| `HistoryClient` | Renders paginated personal history. | `{ initialData }`. | JSX. | Tracks page data, selected game, pending transition; renders cards, pagination, and modal with player/night details. | `useState`, `useTransition`, `getUserHistoryPage`. |
| `loadPage` | Loads another history page. | `page: number`. | Void. | Starts transition; fetches page with existing pageSize; clears selected game; scrolls top. | `getUserHistoryPage`, `window.scrollTo`. |

#### `src/app/dashboard/user/profile/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `ProfilePage` | Server-loads current profile. | None. | JSX. | Requires session; finds Google account and user profile/password/verification; computes role text and profile image; renders profile summary and `ProfileForm`. | `auth`, Prisma, `redirect`, `ProfileForm`. |

#### `src/app/dashboard/user/profile/ProfileForm.tsx`

| Function/Hook | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `ProfileForm` | Renders profile/password/account forms. | `{ user, hasGoogleProvider?, hasPassword? }`. | JSX. | Uses action states for profile/password updates; validates forms before submit; shows success/error popups; allows Google connect if absent. | `useActionState`, `useState`, `useEffect`, `useSession`, `updateProfile`, `changePassword`, `signIn`, popup context. |
| `checkName` | Warns for long name parts. | `value: string`. | Void. | Splits trimmed name and sets warning if any part exceeds 25 chars. | `setNameWarning`. |

#### `src/app/dashboard/moderator/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `statusLabel` | Labels game status. | `status: string`. | String. | Maps waiting/in-progress/other statuses to Persian labels. | None. |
| `scenarioCapacity` | Counts capacity from game scenario roles. | `game: any`. | Number. | Reduces scenario role counts or returns 0. | None. |
| `ModeratorDashboard` | Renders moderator lobby center. | None. | JSX. | Loads active games on mount; tracks creation modal fields; computes stats; renders create modal, active game cards, and cancel buttons. | `useEffect`, `useState`, router, popup context, game actions. |
| `refreshGames` | Refreshes visible moderator games. | None. | Promise<void>. | Sets loading; calls `getModeratorGamesSafe(Date.now())`; updates games or error; clears loading. | Game action. |
| `handleCreateGame` | Creates a lobby. | None. | Promise<void>. | Validates private password; calls `createGame`; resets modal state; routes to moderator lobby on success; shows errors. | `createGame`, router, popup context. |
| `handleCancelGame` | Confirms and cancels lobby/game. | `gameId`. | Promise via confirm callback. | Opens confirmation; calls `cancelGame`; refreshes games and toasts on success; alerts on failure. | `cancelGame`, `showConfirm`. |

#### `src/app/dashboard/moderator/lobby/[id]/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `alignmentClass`, `alignmentLabel` | Format alignments. | Alignment string. | CSS class or label. | Map citizen/mafia/neutral to color and text. | None. |
| `normalizeEffectType`, `effectLabel`, `inferEffectTypeFromLabel` | Normalize/label ability special effects. | Unknown value or label. | Effect type or Persian label. | Allow known values; infer from yakuza/convert/inquiry words; label for UI. | String APIs. |
| `normalizeRoleAbilities` | Cleans ability JSON for UI. | Unknown JSON. | `RoleNightAbility[]`. | Rejects non-array; trims labels; normalizes numeric limits, effect type, and choices. | `normalizeEffectType`. |
| `normalizeActiveRoleAbilityConfig` | Cleans active ability config for UI state. | Unknown JSON. | `Record<string,string[]>`. | Rejects non-object; maps role IDs to trimmed ability IDs. | None. |
| `defaultAbilityConfigForScenario` | Computes default ability selections. | Scenario object. | Active ability config. | Enables single-ability roles; leaves multi-ability roles empty. | `normalizeRoleAbilities`. |
| `abilityConfigForGame` | Chooses stored config or scenario default. | Game object. | Active ability config. | Normalizes stored `activeRoleAbilities`; if empty, derives default from scenario. | Config helpers. |
| `abilityLimitLabel` | Describes ability limits. | `RoleNightAbility`. | String. | Combines usage, target count, self-target limit, special behavior, and choice count. | `effectLabel`, inference helper. |
| `GameLobbyPage` | Renders moderator lobby setup. | Dynamic route `id`. | JSX. | Loads game/scenarios/roles; subscribes to Pusher updates; computes required players, recommendations, scenario roles, active ability roles, custom role filters, start disabled reason; renders scenario selection, ability config, preview card, and custom scenario modal. | React hooks, game/admin/role actions, Pusher, `LobbyPreviewCard`. |
| `handleSelectScenario` | Applies selected scenario. | `scenarioId`. | Promise<void>. | Sets loading; calls `setGameScenario`; refreshes game; updates ability config; shows toast/error. | Game actions. |
| `handleStartGame` | Starts the game. | None. | Promise<void>. | Calls `startGame`; routes to moderator game page on success; alerts and clears loading on failure. | Game action, router. |
| `handleCustomRoleChange` | Adjusts custom scenario role count. | `roleId`, `delta`. | Void. | Adds role at count 1, increments/decrements existing role, removes at zero. | State setter. |
| `handleCreateCustomScenario` | Creates/applies custom scenario. | None. | Promise<void>. | Validates role count/name; calls `createCustomGameScenario`; refreshes game/config/scenario list if saved; resets modal; shows context-specific toast. | Game/admin actions. |
| `toggleAbilityForRole` | Toggles a role ability ID for this game. | `roleId`, `abilityId`. | Void. | Adds/removes ability ID in `abilityConfig`. | State setter. |
| `handleSaveAbilityConfig` | Persists active ability config. | None. | Promise<void>. | Calls `setGameRoleAbilities`; updates local config/game; shows toast/error. | Game action. |
| `copyJoinLink` | Copies player lobby URL. | None. | Promise<void>. | Builds URL from `window.location.origin`; writes clipboard; falls back to alert with link. | Clipboard API, popup context. |

Hooks: initial `useEffect` loads state and Pusher subscriptions; `useMemo` computes capacity, recommendations, ability roles, filtered roles, selected custom roles, and start validation.

#### `src/app/dashboard/moderator/game/[id]/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `normalizeEffectType`, `effectLabel`, `inferEffectTypeFromLabel` | Normalize/label/infer special ability behavior. | Unknown values/labels. | Effect type or label. | Same effect pipeline as server/lobby page. | String APIs. |
| `alignmentLabel`, `alignmentClass`, `alignmentIcon` | Format alignment labels, classes, and icons. | Optional alignment. | String. | Maps citizen/mafia/neutral/unknown. | None. |
| `normalizeRoleAbilities` | Cleans role ability JSON. | Unknown JSON. | `RoleNightAbility[]`. | Trims labels, normalizes numeric limits, effect types, and choices. | `normalizeEffectType`. |
| `normalizeActiveRoleAbilityConfig` | Cleans active ability config. | Unknown JSON. | Record of role IDs to ability IDs. | Rejects invalid config; maps arrays to trimmed strings. | None. |
| `usageLabel` | Labels per-game usage cap. | `usesPerGame`. | String. | Returns capped usage or no global cap. | None. |
| `abilityLimitLabel` | Describes action option limits. | `NightActionOption`. | String. | Combines per-game/per-night caps, target count, self-target limit, effect label, and choices. | `effectLabel`. |
| `formatTimer` | Formats seconds as `m:ss`. | `seconds`. | String. | Clamps to zero, divides minutes/remainder, pads seconds. | Math/string APIs. |
| `createTimerAudioContext` | Creates browser audio context if supported. | None. | `AudioContext` or `null`. | Uses `window.AudioContext` or `webkitAudioContext`. | Browser Web Audio API. |
| `playTimerAlarm` | Plays a short alarm sequence. | Optional existing audio context. | Void. | Resumes context if needed; creates three oscillator/gain beeps; closes temporary context after playback. | Web Audio API, `createTimerAudioContext`. |
| `SpeechTimer` | Reusable speech/challenge timer. | title/subtitle/icon/defaultSeconds/tone. | JSX. | Tracks duration/remaining/running; interval decrements; plays alarm at zero; supports start/pause/reset/duration select. | `useState`, `useEffect`, `useRef`, timer/audio helpers. |
| `primeAlarm` | Prepares audio context before timer starts. | None. | Void. | Creates/resumes audio context so later alarm can play after user gesture. | `createTimerAudioContext`. |
| `toggleRunning` | Starts/pauses timer. | None. | Void. | Primes alarm; pauses if running; otherwise resets alarm flag, restores remaining if zero, and starts. | Timer state. |
| `reset` | Resets timer. | None. | Void. | Clears alarm flag, stops running, restores remaining to duration. | Timer state. |
| `ModeratorTimerBoard` | Renders two timers. | None. | JSX. | Renders `SpeechTimer` for main turn and challenge durations. | `SpeechTimer`. |
| `getInitial` | Gets avatar initial. | `name`. | String. | Trims and returns first char or `?`. | None. |
| `isDayEvent` | Detects day-phase report rows. | `NightEventRecord`. | Boolean. | Checks `details.phase === "DAY"` or `abilityKey` prefix `day:`. | None. |
| `reportEventTitle` | Builds display title for report event. | Event. | String. | Uses day method label for day events; otherwise ability label plus choice label. | `isDayEvent`. |
| `reportActorTargetLine` | Builds actor-to-target text. | Event. | String. | Chooses actor name/source/alignment and target; returns `without target` text when unused. | `alignmentLabel`. |
| `ReportEventRow` | Renders one event row with delete action. | `{ event, busy, onDelete }`. | JSX. | Determines day/used tone; displays title, usage, effect, actor-target line, details, note, and delete button. | Report helpers. |
| `ModeratorGamePage` | Renders full moderator game control room. | Dynamic route `id`. | JSX. | Loads game; computes players, alive/eliminated, active abilities, action options, selected action/effect/targets, report rounds; renders timers, player status, night/day forms, report rows, end-game controls, and public record button. | React hooks, game actions, popup context, router. |
| `refreshGame` | Loads latest game state. | Optional `showLoader`. | Promise<void>. | Calls `getGameStatus`; redirects if missing; stores game; advances night/day number to latest event; clears loading. | Game action, router. |
| `handleTogglePlayer` | Confirms alive/dead toggle. | `PlayerRecord`. | Void. | Calculates next state; confirms; calls `setPlayerAliveStatus`; refreshes and toasts/alerts. | Game action, popup context. |
| `handleRecordNightEvent` | Validates and records a night action. | None. | Promise<void>. | Validates selected action/actor/targets/conversion role/usage caps/self-target limits; calls `recordNightEvent` with full payload; resets form and refreshes on success. | `recordNightEvent`, computed action/effect state. |
| `handleRecordDayElimination` | Records a day elimination. | None. | Promise<void>. | Validates target and custom method; calls `recordDayElimination`; resets fields and refreshes on success. | Game action. |
| `handleDeleteNightEvent` | Confirms and deletes event. | `NightEventRecord`. | Void. | Opens confirm; calls `deleteNightEvent`; refreshes and toasts/alerts. | Game action, popup context. |
| `handleEndGame` | Confirms and ends game. | Winner alignment or `UNKNOWN`. | Void. | Confirms with winner label; calls `endGame`; refreshes and toasts/alerts. | Game action. |
| `handlePublishNightRecords` | Publishes private records. | None. | Void. | Confirms; calls `publishNightRecords`; refreshes and toasts/alerts. | Game action. |

Hooks: `useEffect` loads the game, synchronizes selected action/choice/effect/conversion role/target slots, and `useMemo` builds active ability config, action options, and report rounds.

#### `src/app/dashboard/moderator/scenarios/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `ModeratorScenariosPage` | Server-loads scenario management data. | None. | JSX. | Fetches roles and scenarios through server actions and renders `ScenariosManager`. | `getMafiaRoles`, `getScenarios`, `ScenariosManager`. |

#### `src/app/dashboard/admin/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `AdminDashboardPage` | Renders admin config panel. | `{ searchParams? }`. | JSX or redirect. | Awaits params; redirects `tab=users` to users route; otherwise renders `AdminConfigPanel`. | `redirect`, `AdminConfigPanel`. |

#### `src/app/dashboard/admin/users/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `AdminUsersPage` | Protects/render admin user management. | None. | JSX or redirect. | Gets session; loads current user role/ban; redirects non-admins to moderator/user dashboards; renders `UserManagementPanel`. | `auth`, Prisma, `redirect`. |

#### `src/app/dashboard/admin/history/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `AdminHistoryPage` | Protects/render admin history. | None. | JSX or redirect. | Checks admin like users page; loads first history page; renders `AdminHistoryClient`. | `auth`, Prisma, `getAdminGameHistoryPage`, `redirect`. |

#### `src/app/dashboard/admin/history/AdminHistoryClient.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `effectLabel`, `alignmentLabel` | Format effects and alignments. | Optional effect/alignment. | String. | Return Persian labels with unknown fallback. | None. |
| `isDayReportEvent` | Detects day report rows. | `NightReportEvent`. | Boolean. | Checks detail phase or `abilityLabel` prefix. | None. |
| `groupNightEvents` | Groups report rows by round/night number. | Event array. | Sorted `[nightNumber, events][]`. | Adds events to a `Map`, then sorts entries by number. | `Map`. |
| `NightReportBlock` | Renders sample or real final reports. | `{ events, sample?, isPublic? }`. | JSX or `null`. | Returns null if empty; groups events; counts day/night rows; renders status badges, titles, details, conversions, and notes. | `groupNightEvents`, report helpers. |
| `AdminHistoryClient` | Renders paginated admin history. | `{ initialData }`. | JSX. | Tracks page data; renders sample report, game cards, real reports, delete buttons, and pagination. | `useState`, `useTransition`, `usePopup`. |
| `loadPage` | Loads another admin history page. | `page`. | Void. | Starts transition; fetches page; scrolls top. | `getAdminGameHistoryPage`. |
| `removeGame` | Confirms and deletes whole game history. | `gameId`. | Void. | Uses popup confirmation; calls `deleteGameHistory`; refreshes current page and toasts or alerts. | Dashboard action, popup context. |

### Public game/lobby pages

#### `src/app/join/page.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `JoinGamePage` | Renders manual join form. | None. | JSX. | Tracks loading; defaults name from session; renders code/name/password form. | `useState`, `useRouter`, `useSession`, popup context. |
| `handleJoin` | Submits join form. | Form event. | Promise<void>. | Prevents default; reads code/name/password; validates fields; calls `joinGame`; routes to lobby on success; shows errors; toggles loading. | `joinGame`, router, popup context. |

#### `src/app/lobby/[id]/page.tsx`

| Function/Hook | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `UserLobbyPage` | Renders player waiting room. | Dynamic route `id`. | JSX. | Loads game status; redirects missing/finished/in-progress cases; subscribes to Pusher `player-joined` and `game-started`; renders `LobbyPreviewCard` with join/password controls. | `useEffect`, `useMemo`, `useSession`, `getGameStatus`, `joinGame`, Pusher. |
| `syncGameStatus` | Loads and reconciles lobby state. | None. | Promise<void>. | Calls `getGameStatus`; redirects based on status; maps players; detects whether current user joined; updates state. | Game action, router, session. |
| `handleJoin` | Joins current user into lobby. | None. | Promise<void>. | Uses account name/email as player name; validates name/game code; calls `joinGame`; updates joined/player list on success; alerts on error. | `joinGame`, popup context. |

Hooks: `useMemo` computes capacity, player items, and role breakdown.

#### `src/app/game/[id]/page.tsx`

| Function/Hook | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `alignmentLabel`, `alignmentClass`, `effectLabel` | Format alignment/effect display. | Optional alignment/effect. | Label or class string. | Map known values to Persian labels/classes. | None. |
| `UserGamePage` | Renders player's in-game screen. | Dynamic route `id`. | JSX. | Requires session; syncs player-safe game view; subscribes to game end/status/state/public-record/cancel events; renders flip card role reveal, scenario guide, player status, and public records. | `useEffect`, `useMemo`, `useState`, Pusher, game action, popup context. |
| `syncGameView` | Loads player-safe game view. | None. | Promise<void>. | Calls `getPlayerGameView`; redirects to lobby/dashboard when not in progress; stores game and current player info. | Game action, router. |

Hooks: `useMemo` derives scenario roles, alignment counts, and grouped public night events.

### Shared components

#### `src/components/PopupProvider.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `PopupProvider` | Provides modal/toast API to children. | `children`. | JSX provider. | Tracks modal and toast state; defines alert/confirm/toast helpers; renders `Modal` and all `Toast`s. | React context/state, `Modal`, `Toast`. |
| `showAlert` | Opens informational modal. | `title`, `message`, optional type. | Void. | Sets modal state without confirm callback. | State setter. |
| `showConfirm` | Opens confirmation modal. | `title`, `message`, `onConfirm`, optional type. | Void. | Sets modal state with confirm callback. | State setter. |
| `showToast` | Adds toast. | `message`, optional type. | Void. | Uses `Date.now()` id and appends toast to state. | State setter. |
| `removeToast` | Removes toast by id. | `id: number`. | Void. | Filters toast list. | State setter. |
| `usePopup` | Reads popup context. | None. | Popup API. | Calls `useContext`; throws if provider is missing. | React context. |

#### `src/components/ThemedPopups.tsx`

| Function/Hook | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `Modal` | Renders themed modal/confirm dialog. | `ModalProps`. | JSX or `null`. | Returns null when closed; chooses accent by type; renders backdrop, title, message, confirm/cancel buttons; confirm calls `onConfirm` then closes. | React, popup props. |
| `Toast` | Renders auto-dismiss toast. | `{ message, type, onClose }`. | JSX. | Sets 5s timeout in `useEffect`; renders icon, message, close button, and progress animation. | `useEffect`. |

#### `src/components/ThemeToggle.tsx`

| Function/Hook | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `ThemeToggle` | Renders theme switcher in compact/nav/full variants. | `{ compact?, nav? }`. | JSX. | Waits for client mount to avoid hydration mismatch; renders disabled placeholder before mount; after mount toggles between dark/light and adapts layout for nav vs normal use. | `useTheme`, `useEffect`, `useState`. |

#### `src/components/InstallPWANotice.tsx`

| Function/Hook | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `isStandaloneDisplay` | Detects installed PWA mode. | None. | Boolean. | Checks display-mode media query or iOS `navigator.standalone`. | Browser APIs. |
| `InstallPWANotice` | Shows install hint once per session. | None. | JSX or `null`. | On mount skips standalone/seen sessions; schedules show/hide timers; listens for `beforeinstallprompt`; stores seen flag; renders dismissible notice with progress animation. | `useEffect`, `useState`, sessionStorage. |
| `handleBeforeInstallPrompt` | Local event handler for install prompt. | `Event`. | Void. | Prevents default prompt, shows notice, marks seen, hides after duration. | Browser event API. |

#### `src/components/auth/AuthShell.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `AuthShell` | Shared wrapper for auth screens. | `icon`, `title`, `subtitle`, `activeTab?`, `children`, `footer?`. | JSX. | Renders brand header, theme toggle, home link, desktop highlights, tab links, auth card heading, child form content, and optional footer. | `Link`, `ThemeToggle`. |

#### `src/components/dashboard/DashboardNavigation.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `cx` | Joins conditional class strings. | Class values. | String. | Filters falsey values and joins with spaces. | None. |
| `roleLabel` | Labels app role. | Optional role. | String. | Maps admin/moderator/default user. | None. |
| `userInitial` | Gets fallback avatar initial. | Optional name. | String. | Returns first trimmed char or Persian fallback. | None. |
| `iconTone` | Chooses icon classes for tone/active state. | Tone and active boolean. | Class string. | Returns active/inactive color sets for sky/lime/zinc. | None. |
| `activeDot` | Chooses active dot color. | Tone. | Class string. | Returns tone-specific background class. | None. |
| `DashboardNavigation` | Renders role-aware sidebar/mobile nav. | `isAdmin`, `isModerator`, `user`, `logoutAction`. | JSX. | Builds nav sections by role; derives active state from pathname/search params; renders desktop sidebar and mobile bottom nav with theme toggle and logout. | `usePathname`, `useSearchParams`, `Link`, `ThemeToggle`. |
| `isActive` | Determines active nav item. | `NavItem`. | Boolean. | Matches pathname and admin `tab` query against each item key. | Router hooks. |
| `renderDesktopLink` | Renders sidebar link. | `NavItem`. | JSX. | Computes active state and classes; returns icon/label/dot link. | `isActive`, `cx`, `iconTone`. |
| `renderMobileLink` | Renders bottom-nav link. | `NavItem`. | JSX. | Computes active state and renders stacked icon/label. | `isActive`, `cx`, `iconTone`. |

#### `src/components/game/LobbyPreviewCard.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `alignmentClass` | Returns role badge color classes. | Optional `Alignment`. | Class string. | Maps citizen/mafia/neutral/default. | Prisma `Alignment` type. |
| `alignmentLabel` | Returns role alignment label. | Optional `Alignment`. | String. | Maps citizen/mafia/neutral/default. | None. |
| `getInitial` | Gets player avatar initial. | `name`. | String. | Trims and returns first uppercase char or `?`. | String APIs. |
| `LobbyPreviewCard` | Renders reusable lobby state card. | Full `LobbyPreviewCardProps`. | JSX. | Computes progress, seats left, alignment counts; in compact mode renders condensed preview; otherwise renders full lobby header, capacity, players, role breakdown, optional action/footer. | React props, helper functions. |

#### Chart components

| File | Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|---|
| `src/components/charts/AdminCharts.tsx` | `UsersOverTimeChart` | Renders line chart. | `{ data, color? }`. | JSX chart. | Uses month/count axes, grid, tooltip, and monotone line. | Recharts. |
| `src/components/charts/AdminCharts.tsx` | `GamesAreaChart` | Renders area chart. | `{ data }`. | JSX chart. | Defines lime gradient and area series. | Recharts. |
| `src/components/charts/AdminCharts.tsx` | `TopScenariosChart` | Renders vertical bar chart. | `{ data: { name, count }[] }`. | JSX chart. | Uses vertical layout with scenario names on Y axis and counts on X axis. | Recharts. |
| `src/components/charts/AlignmentPieChart.tsx` | `CustomLabel` | Renders pie percentage labels. | Recharts label props. | SVG text or null. | Calculates midpoint from angles/radii; hides labels under 5%. | Recharts geometry props. |
| `src/components/charts/AlignmentPieChart.tsx` | `AlignmentPieChart` | Renders alignment pie chart. | `{ data }`. | JSX chart or empty state. | Shows fallback if no data; renders pie cells with provided colors, tooltip, legend, and custom label. | Recharts. |
| `src/components/charts/WinLossBarChart.tsx` | `WinLossBarChart` | Renders win/loss bar chart. | `{ data }`. | JSX chart. | Uses bar chart with axes, tooltip, grid, and colored bars. | Recharts. |

### Admin components

#### `src/components/admin/AdminConfigPanel.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `normalizeEffectType`, `alignmentLabel`, `alignmentClass`, `alignmentIcon`, `alignmentAccentClass` | Normalize/format effect and alignment UI. | Effect/alignment values. | Effect type, label, icon, or class. | Map known values to stable display metadata. | Prisma `Alignment`. |
| `normalizeRoleAbilities` | Converts stored role ability JSON into UI state. | Unknown JSON. | `RoleNightAbility[]`. | Rejects invalid data; trims labels; normalizes limits/effect/choices; filters empty records. | `normalizeEffectType`. |
| `nightLimitLabel`, `abilityUsageLabel`, `abilityNeedsChoices`, `requiredChoiceCount` | Describe/validate ability limits. | Role ability or limit value. | String/boolean/number. | Compose labels and calculate required choices for multi-target abilities. | Ability types. |
| `scenarioTotalPlayers`, `scenarioAlignmentCounts`, `scenarioDominantAlignment` | Compute scenario summary statistics. | `ScenarioRecord`. | Number/count map/alignment. | Reduce role counts and choose dominant side. | Scenario data. |
| `AdminDashboard` | Renders role/scenario admin UI. | None. | JSX. | Syncs tab from query string; loads roles/scenarios; manages role form, scenario form, filters, stats, selected scenario, and CRUD actions. | React hooks, admin actions, router/search params/session, popup context. |
| `refreshData` | Loads roles and scenarios safely. | None. | Promise<void>. | Calls `getMafiaRolesSafe` and `getScenariosSafe` in parallel; updates data/error/loading. | Admin actions. |
| `switchTab` | Switches admin tab and URL. | `tab`. | Void. | Sets active tab and `router.replace` query without scrolling. | Router. |
| `resetRoleForm`, `resetScenarioForm` | Clears form state. | None. | Void. | Resets editing IDs and form fields/searches. | State setters. |
| `handleAddRole` | Creates or updates a role. | Form event. | Promise<void>. | Validates role name and multi-target choices; calls create/update action; resets form; refreshes data; shows toast/error. | Admin actions, popup context. |
| `handleEditRole` | Loads role into edit form. | `MafiaRoleRecord`. | Void. | Sets editing ID/name/desc/alignment/abilities and scrolls top. | `normalizeRoleAbilities`. |
| `handleDeleteRole` | Confirms/deletes role. | `roleId`. | Promise through confirm callback. | Confirms; calls `deleteMafiaRole`; refreshes data; shows toast/error. | Admin action, popup context. |
| `handleAddScenario` | Creates or updates scenario. | Form event. | Promise<void>. | Validates name and selected roles; calls create/update; resets form; refreshes; toasts/errors. | Admin actions. |
| `handleEditScenario` | Loads scenario into edit form. | `ScenarioRecord`. | Void. | Copies name/description/role counts into state and scrolls top. | State setters. |
| `handleDeleteScenario` | Confirms/deletes scenario. | `scenarioId`. | Promise through confirm callback. | Confirms; calls `deleteScenario`; clears selected scenario; refreshes. | Admin action. |
| `toggleRoleInScenario` | Adds/removes a role from scenario form. | `roleId`. | Void. | If present removes role; otherwise appends with count 1. | State setter. |
| `updateRoleCount` | Adjusts scenario role count. | `roleId`, `delta`. | Void. | Updates selected role count clamped to at least 1. | State setter. |
| `updateRoleAbility` | Patches an ability in the role form. | `abilityId`, patch. | Void. | Maps ability list and merges patch into matching ability. | State setter. |
| `updateAbilityTargetsPerUse` | Adjusts target count and choice slots. | `abilityId`, numeric value. | Void. | Clamps count 1-5; clears choices if single-target; ensures enough choice placeholders for multi-target. | `abilityNeedsChoices`, `requiredChoiceCount`. |
| `updateAbilityChoice` | Patches one ability choice. | `abilityId`, `choiceId`, patch. | Void. | Maps abilities and nested choices, merging patch into matching choice. | State setter. |

Hooks: `useEffect` syncs URL tab and loads data; `useMemo` computes stats, standard scenario install status, visible roles/groups/scenarios, and scenario role options.

#### `src/components/admin/ScenariosManager.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `alignmentLabel`, `alignmentClass`, `alignmentIcon`, `alignmentAccentClass` | Format alignment display. | `Alignment`. | String. | Map alignment to label, class, icon, or gradient. | Prisma `Alignment`. |
| `scenarioTotalPlayers`, `scenarioAlignmentCounts`, `scenarioDominantAlignment` | Compute scenario summaries. | `ScenarioRecord`. | Number/count map/alignment. | Reduce role counts and compare counts. | Scenario data. |
| `ScenariosManager` | Renders dedicated scenario CRUD. | `{ initialRoles, initialScenarios }`. | JSX. | Tracks scenarios, form modal, selected scenario, filters, stats; renders library and create/edit form. | React hooks, admin actions, popup context. |
| `openForm` | Opens create or edit scenario form. | Optional scenario. | Void. | Copies scenario fields/counts when editing; otherwise clears form; resets role search and shows form. | State setters. |
| `closeForm` | Closes and resets form state. | None. | Void. | Hides form, clears editing scenario, clears role search. | State setters. |
| `updateRoleCount` | Adjusts role count in scenario form. | `roleId`, `delta`. | Void. | Adds role when incrementing absent role; decrements/removes at zero; otherwise updates count. | State setter. |
| `handleSubmit` | Creates or updates scenario. | Form event. | Promise<void>. | Validates name and role selection; calls update/create action; updates local list; toasts; closes form. | Admin actions, popup context. |
| `handleDelete` | Confirms and deletes scenario. | `id`. | Void. | Opens confirmation; calls `deleteScenario`; removes local item; clears selected scenario; toasts/alerts. | Admin action. |

Hooks: `useMemo` computes stats, filtered scenarios, and filtered roles.

#### `src/components/admin/UserManagementPanel.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `getInitial`, `roleLabel`, `roleClass`, `roleAccentClass` | Format user identity/role. | User name/email or role. | Initial/label/class. | Map role and fallback display values. | Prisma `Role`. |
| `getUserPresence` | Derives current lobby/game presence. | `UserRecord`. | Presence metadata. | Finds in-progress or waiting game from latest player records; returns online/offline label, detail, icon, class. | User included data. |
| `parseEmailPreviewBlocks` | Parses admin email body into preview blocks. | `body: string`. | `EmailPreviewBlock[]`. | Uses local flush helpers; supports blank lines, `---`, `#`, `>`, `-`, and paragraphs. | String parsing. |
| `flushParagraph`, `flushList` | Local helpers inside parser. | None. | Void. | Push accumulated paragraphs/lists into block array and clear buffers. | Parser state. |
| `renderPreviewText` | Renders inline bold preview. | `text`. | React nodes. | Splits on `**...**`, returns `<strong>` for bold segments. | React. |
| `UserManagementPanel` | Renders admin user management interface. | None. | JSX. | Loads users, filters/sorts by search/role/status/sort mode, computes counts, tracks selected user and email composer, and renders admin actions. | React hooks, NextAuth session, admin actions, popup context. |
| `refreshUsers` | Loads users safely. | None. | Promise<void>. | Calls `getAllUsersSafe`, updates users/error/loading. | Admin action. |
| `handleRoleChange` | Changes user role. | `userId`, `nextRole`. | Promise<void>. | Prevents self-demotion; sets busy; calls action; refreshes; toasts/alerts. | `updateUserRole`. |
| `handleBanToggle` | Toggles ban state with confirmation. | `UserRecord`. | Void. | Prevents self-ban; confirms; calls `banUser`; refreshes; toasts/alerts. | `banUser`. |
| `handleDelete` | Deletes user with confirmation. | `UserRecord`. | Void. | Prevents self-delete; confirms destructive delete; calls `deleteUser`; refreshes. | `deleteUser`. |
| `handleVerifyEmail` | Manually verifies user email. | `UserRecord`. | Void. | Validates email exists and not already verified; confirms; calls `verifyUserEmail`; refreshes. | `verifyUserEmail`. |
| `openEmailComposer` | Opens admin email composer for user. | `UserRecord`. | Void. | Requires email; sets composer user, clears subject/body, switches to write mode. | State setters. |
| `insertEmailSnippet` | Appends snippet to email body. | `snippet`. | Void. | Adds blank-line separator if needed and clamps to 4000 chars. | State setter. |
| `addEmailFormatBlock` | Appends formatting block to email body. | `value`. | Void. | Same append/clamp behavior for formatting helpers. | State setter. |
| `handleSendEmail` | Sends composed admin email. | None. | Promise<void>. | Validates selected user, subject, body length; sets busy; calls `sendEmailToUser`; closes composer/toasts or alerts. | Admin action. |

Hooks: `useEffect` loads users after session status resolves; `useDeferredValue` smooths search; `useMemo` filters and sorts users.

#### `src/components/admin/UsersTable.tsx`

| Function | Purpose | Inputs/Parameters | Outputs/Returns | Internal Logic | Dependencies |
|---|---|---|---|---|---|
| `UsersTable` | Older tabular user management component. | `{ users, currentUserId }`. | JSX. | Tracks row loading ID; renders table with role select and delete button. | `useState`, admin actions, popup context. |
| `handleRoleChange` | Changes role from table. | `userId`, new role. | Promise<void>. | Prevents self-demotion; sets loading; calls `updateUserRole`; toasts/alerts; clears loading. | Admin action. |
| `handleDelete` | Deletes user from table. | `userId`, `name`. | Void. | Prevents self-delete; confirms; calls `deleteUser`; toasts/alerts; clears loading. | Admin action, popup context. |

### Remaining docs

#### `docs/DESIGN.md`

No executable functions/classes/hooks. It documents design tokens and UI requirements.

#### `docs/production_setup.md`

No executable functions/classes/hooks. It documents deployment steps and operational guidance.

## Phase 5: Final Verification (Mandatory)

Verification Complete: I have cross-referenced the breakdown against the project tree and confirmed that every file and function has been thoroughly documented.
