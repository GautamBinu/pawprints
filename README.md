# PawPrints

PawPrints is a petition platform built for the RIT Dubai community (based on the actual PawPrints) to bridge the gap between students and administration. It allows users to create, sign, and track petitions that matter to campus life. This project is built using **Next.js 15**, utilizing **PostgreSQL** for data persistence and **Firebase** for authentication.

## Getting Started

### Prerequisites

Make sure you have Node.js v20.x or higher installed. You will also need access to a PostgreSQL database and a Firebase project for authentication.

### 1. Clone the Repository

```bash
git clone https://github.com/ritsg/pawprints.git
cd pawprints
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
bun install # we love bun here at RIT Dubai
```

### 3. Environment Configuration

Clone the `.env.example` file to `.env` and fill in the required environment variables.

```bash
cp .env.example .env
```

**Note:** The application uses `next-firebase-auth-edge` for handling authentication via middleware, and a separate `firebase-admin` initialization for server-side logic. Make sure to populate the specific keys required for both.

### 4. Database Setup

Once your `.env` is configured with a valid `DATABASE_URL`, run the following commands to set up the database schema.

```bash
# Generate Prisma Client
npm run prisma:build

# Push schema to database (for development)
npx prisma db push
```

#### Seeding Data

To populate the database with initial tags, mock users, and example petitions (e.g., "Bring Back the Taco Bar"), run the seed script:

```bash
npx prisma db seed
```

This will run `prisma/seed.ts` and create standard tags (Housing, Dining, etc.), mock users (Student, Admin, Faculty), and mock petitions in various states (Published, In Progress, Expired, etc.). 
Make sure to remove or modify mock data before deploying to production.

### 5. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database & Prisma

We use Prisma as our ORM. The schema is located at `prisma/schema.prisma`.

After modifying `schema.prisma`, run:
```bash
npx prisma db push
npm run prisma:build
```

To view your database in a GUI:
```bash
npx prisma studio
```

To wipe the database and re-seed:
```bash
npx prisma migrate reset
```

## Firebase Setup

### Authentication
PawPrints uses **Firebase** to authenticate users. You must use the Google provider in your Firebase Console. Make sure to restrict the OAuth redirect domains to your development and production URLs. To make sure only RIT users can login, we also make sure the Google Cloud Project associated with the Firebase project only allows users from the same organization (g.rit.edu) to sign in. Checkout this [StackOverflow thread](https://stackoverflow.com/questions/64765394/how-can-i-enable-the-internal-option-in-the-oauth-consent-screen) on how to do that.

## UI & Theming

### Shadcn UI
This project uses [Shadcn UI](https://ui.shadcn.com/) components. These are reusable components built using Radix UI and Tailwind CSS. Components are located in `src/components/ui`.

To add a new component (e.g., button):
```bash
npx shadcn@latest add button
```

### Tailwind Configuration
Tailwind v4 is configured in `src/app/globals.css` using the `@theme` directive. We use CSS variables for theming (oklch color space). For dark mode, we modify the CSS variables supported via the `.dark` class strategy. As for the font, the Geist font family is used via `next/font`. To customize the theme, edit the `:root` and `.dark` variables in `src/app/globals.css`.

## Deploying to prod

Make sure to set your environment variables in production. Set `USE_SECURE_COOKIES` to `true` in production.

### Database Migrations in Prod
In production, it is recommended to use `prisma migrate deploy` instead of `db push` to apply schema changes safely.

```bash
npx prisma migrate deploy
```

## Contributing

Fork the repository and create a pull request for any changes or improvements. Please ensure code quality and consistency with existing patterns. 
- Ensure `npm run build` passes before pushing.
-   If you modify the database schema, include the necessary migration steps or update the seed script if data structures change.
-   Follow the existing Shadcn/Tailwind patterns for UI consistency.

Please see `CONTRIBUTING.md` for more details.
