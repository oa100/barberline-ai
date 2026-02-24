# BarberLine AI -- Full Setup Guide

This guide walks you through setting up every external service that BarberLine AI depends on. Follow each section in order. By the end, you will have a fully working deployment.

**Time estimate:** 30-45 minutes

**Prerequisites:**
- A GitHub account (to deploy on Vercel)
- A credit card (some services require one even for free tiers)
- The project repository cloned and pushed to GitHub

---

## Table of Contents

1. [Supabase (Database)](#1-supabase-database)
2. [Clerk (Authentication)](#2-clerk-authentication)
3. [Square (Appointments & Payments)](#3-square-appointments--payments)
4. [Vapi (AI Voice Agent)](#4-vapi-ai-voice-agent)
5. [Twilio (SMS & Phone Numbers)](#5-twilio-sms--phone-numbers)
6. [Vercel (Deployment & Environment Variables)](#6-vercel-deployment--environment-variables)
7. [After Setup -- Testing & Troubleshooting](#7-after-setup----testing--troubleshooting)

---

## 1. Supabase (Database)

Supabase is an open-source Firebase alternative that provides a PostgreSQL database, authentication, and real-time subscriptions. BarberLine AI uses it as the primary database.

### Create your account and project

1. Go to [https://supabase.com](https://supabase.com) and click **Start your project**.
2. Sign up with your GitHub account (recommended) or email.
3. Once logged in, click **New Project**.
4. Fill in the project details:
   - **Name:** `barberline-ai` (or any name you prefer)
   - **Database Password:** Generate a strong password and **save it somewhere safe**. You will need it if you ever connect directly to the database.
   - **Region:** Pick the region closest to your users (e.g., `East US (Virginia)` for US-based barbershops).
   - **Pricing Plan:** The free tier is fine to start.
5. Click **Create new project**. It takes about 2 minutes to provision.

### Get your API keys

6. In the left sidebar, click **Project Settings** (the gear icon at the bottom).
7. Click **API** in the settings menu.
8. You will see three important values. Copy each one:

   | Value | Where to find it | Env variable |
   |-------|-------------------|--------------|
   | **Project URL** | Under "Project URL" | `NEXT_PUBLIC_SUPABASE_URL` |
   | **anon (public) key** | Under "Project API keys" | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | **service_role (secret) key** | Under "Project API keys" -- click "Reveal" | `SUPABASE_SERVICE_ROLE_KEY` |

   > **Warning:** The `service_role` key bypasses Row Level Security. Never expose it in client-side code or commit it to version control.

### Run the database migration

9. In the left sidebar, click **SQL Editor**.
10. Click **New Query**.
11. Open the file `supabase/migrations/00001_create_tables.sql` from this repository.
12. Copy the entire contents of that file and paste it into the SQL Editor.
13. Click **Run** (or press Cmd+Enter / Ctrl+Enter).
14. You should see a "Success" message. If you get errors, make sure you pasted the complete file and that you are running it against a fresh project.

### Verify

15. In the left sidebar, click **Table Editor**. You should see the tables that were created by the migration.

---

## 2. Clerk (Authentication)

Clerk handles user sign-up, sign-in, and session management. It provides pre-built UI components and supports social logins.

### Create your account and application

1. Go to [https://clerk.com](https://clerk.com) and click **Start building**.
2. Sign up with your GitHub account or email.
3. Once logged in, click **Create application**.
4. Give your application a name (e.g., `BarberLine AI`).
5. Under **Sign-in options**, enable:
   - **Email address** (required)
   - **Google** (recommended -- makes it easier for barbers to sign up)
   - Disable any other options you do not need.
6. Click **Create application**.

### Get your API keys

7. You will land on the **API Keys** page (or navigate there from the sidebar).
8. Copy these two values:

   | Value | Env variable |
   |-------|--------------|
   | **Publishable key** (starts with `pk_test_` or `pk_live_`) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
   | **Secret key** (starts with `sk_test_` or `sk_live_`) | `CLERK_SECRET_KEY` |

### Configure redirect URLs

9. In the Clerk dashboard sidebar, go to **Configure** (or **Settings**).
10. Find the **Paths** or **URLs** section.
11. Set the following URLs:

    | Setting | Value |
    |---------|-------|
    | Sign-in URL | `/sign-in` |
    | Sign-up URL | `/signup` |
    | After sign-in URL | `/dashboard` |
    | After sign-up URL | `/dashboard/onboarding` |

12. Click **Save** or **Apply changes**.

### (Optional) Configure for production

13. When you are ready to go live, switch from the **Development** instance to a **Production** instance in the Clerk dashboard. Clerk gives you separate keys for each environment.

---

## 3. Square (Appointments & Payments)

Square handles appointment booking, service catalog management, and payment processing. Barbers connect their existing Square account through BarberLine AI.

### Create your developer account

1. Go to [https://developer.squareup.com](https://developer.squareup.com).
2. Click **Sign up** if you do not have a Square account, or **Sign in** if you already do.
3. If signing up, fill in the required information and verify your email.

### Create a new application

4. Once logged in to the Developer Dashboard, click **+** (or **Create an Application**).
5. Name it `BarberLine AI` and click **Save**.
6. You will land on the application's **Credentials** tab.

### Get your credentials

7. Copy these values from the **Credentials** tab:

   | Value | Env variable |
   |-------|--------------|
   | **Application ID** (a.k.a. Client ID) | `SQUARE_APPLICATION_ID` |
   | **Sandbox Access Token** (for development) | `SQUARE_ACCESS_TOKEN` |

   > **Note:** The Sandbox Access Token is only for testing. In production, barbers will authenticate via OAuth and get their own access tokens.

8. Set `SQUARE_ENVIRONMENT` to `sandbox` during development, or `production` when going live.

### Configure OAuth settings

9. In your application settings, click the **OAuth** tab.
10. Under **Redirect URL**, add your production callback URL:
    ```
    https://your-app-domain.vercel.app/api/square/callback
    ```
    Replace `your-app-domain` with your actual Vercel deployment URL.

11. Under **OAuth Scopes** (or **Permissions**), enable the following scopes:
    - `APPOINTMENTS_READ` -- Read appointment and booking data
    - `APPOINTMENTS_WRITE` -- Create and manage appointments
    - `ITEMS_READ` -- Read the service catalog (haircut types, prices)
    - `MERCHANT_PROFILE_READ` -- Read business profile information

12. Click **Save**.

### Important: Square subscription requirement

> **For production use:** Each barber who connects their Square account must have a **Square Appointments Plus** subscription (approximately $29/month). This is a Square requirement for API access to their appointments features. The free tier of Square Appointments does not include API access.

---

## 4. Vapi (AI Voice Agent)

Vapi powers the AI phone agent that answers calls, books appointments, and handles customer inquiries on behalf of the barber.

### Create your account

1. Go to [https://vapi.ai](https://vapi.ai) and click **Sign Up** or **Get Started**.
2. Create your account with email or Google.
3. Once logged in, you will land on the Vapi dashboard.

### Get your API key

4. In the dashboard, find your **API Key** (usually displayed prominently on the main page or under **Account** / **Settings**).
5. Copy it:

   | Value | Env variable |
   |-------|--------------|
   | **API Key** | `VAPI_API_KEY` |

### Set the server secret

6. In the Vapi dashboard, go to **Settings** (or **Account Settings**).
7. Find the **Server** section (or **Webhooks** / **Security**).
8. Set a **Server Secret**. This is a value you make up yourself -- it should be a long, random string (at least 32 characters). You can generate one by running this in your terminal:
   ```bash
   openssl rand -hex 32
   ```
9. Paste the generated value into the Vapi dashboard and save.
10. Copy the same value for your environment variable:

    | Value | Env variable |
    |-------|--------------|
    | **Server Secret** (the string you just generated) | `VAPI_SERVER_SECRET` |

### No manual agent setup needed

> **Note:** You do **not** need to manually create a Vapi voice agent. BarberLine AI automatically creates and configures a Vapi agent for each barber during the onboarding flow. The agent is customized with the barber's name, services, hours, and greeting style.

---

## 5. Twilio (SMS & Phone Numbers)

Twilio provides the phone number and SMS capabilities. Each barbershop gets a dedicated phone number that customers can call or text.

### Create your account

1. Go to [https://www.twilio.com](https://www.twilio.com) and click **Sign up**.
2. Fill in your name, email, and password. Click **Start your free trial**.
3. Verify your email address by clicking the link Twilio sends you.
4. Verify your personal phone number (Twilio will send a verification code via SMS).

### Get your Account SID and Auth Token

5. After verification, you will land on the **Console Dashboard** (or navigate to [https://console.twilio.com](https://console.twilio.com)).
6. Your **Account SID** and **Auth Token** are displayed on the main dashboard page. Click "Show" to reveal the Auth Token.
7. Copy both:

   | Value | Env variable |
   |-------|--------------|
   | **Account SID** (starts with `AC`) | `TWILIO_ACCOUNT_SID` |
   | **Auth Token** | `TWILIO_AUTH_TOKEN` |

### Buy a phone number

8. In the left sidebar, navigate to **Phone Numbers** -> **Manage** -> **Buy a number** (or go to **Develop** -> **Phone Numbers** -> **Buy a number**).
9. Search for a number:
   - Choose your country.
   - Optionally filter by area code if you want a local number for the barbershop's area.
   - Make sure the number supports **Voice** and **SMS**.
10. Click **Buy** next to your chosen number and confirm.
11. Copy the phone number (in E.164 format, e.g., `+12125551234`):

    | Value | Env variable |
    |-------|--------------|
    | **Phone Number** (e.g., `+12125551234`) | `TWILIO_PHONE_NUMBER` |

    > **Note on trial accounts:** Twilio's free trial gives you a phone number and $15.50 in credit. Trial numbers will play a short Twilio message before connecting. Upgrade to a paid account to remove this.

---

## 6. Vercel (Deployment & Environment Variables)

Vercel hosts the Next.js application. All the API keys and secrets from the previous steps are stored as Vercel environment variables.

### Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Import the `barberline-ai` repository from your GitHub account.
4. Vercel will auto-detect that it is a Next.js project. Accept the default settings.
5. Before clicking **Deploy**, add the environment variables (next step).

### Add environment variables

6. On the project configuration page (or after deployment, go to **Settings** -> **Environment Variables**).
7. Add each of the following environment variables. For each one, set it for **Production**, **Preview**, and **Development** environments:

| Environment Variable | Service | Description |
|---------------------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Your Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | The `anon` public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | The `service_role` secret key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | Publishable key (starts with `pk_`) |
| `CLERK_SECRET_KEY` | Clerk | Secret key (starts with `sk_`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk | Set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk | Set to `/signup` |
| `VAPI_API_KEY` | Vapi | Your Vapi API key |
| `VAPI_SERVER_SECRET` | Vapi | The server secret you generated |
| `SQUARE_APPLICATION_ID` | Square | Your Square application ID |
| `SQUARE_ACCESS_TOKEN` | Square | Sandbox token (dev) or leave empty (prod, uses OAuth) |
| `SQUARE_ENVIRONMENT` | Square | `sandbox` for development, `production` for live |
| `TWILIO_ACCOUNT_SID` | Twilio | Account SID (starts with `AC`) |
| `TWILIO_AUTH_TOKEN` | Twilio | Auth token from console |
| `TWILIO_PHONE_NUMBER` | Twilio | Your Twilio number in E.164 format (e.g., `+12125551234`) |
| `NEXT_PUBLIC_APP_URL` | App | Your deployed URL (e.g., `https://your-app.vercel.app`) |

8. Click **Save** after adding all variables.

### Deploy

9. Click **Deploy** (or if you already deployed, go to **Deployments** and click **Redeploy**).

> **Important:** Every time you update an environment variable, you must **redeploy** for the changes to take effect. Go to **Deployments** -> click the three-dot menu on the latest deployment -> **Redeploy**.

### Local development

10. For local development, copy the example environment file and fill in the values:
    ```bash
    cp .env.local.example .env.local
    ```
11. Open `.env.local` and paste in all the same values from the table above.
12. Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`.
13. Run the dev server:
    ```bash
    npm install
    npm run dev
    ```

---

## 7. After Setup -- Testing & Troubleshooting

### How to test the full flow

1. **Sign up:** Open your deployed app and create a new account. You should be redirected to the onboarding page.
2. **Onboarding:** Complete the onboarding steps:
   - Enter your barbershop name and details.
   - Connect your Square account (you will be redirected to Square to authorize).
   - Customize the AI greeting and personality.
3. **Dashboard:** After onboarding, you should land on the dashboard with your shop's information.
4. **Test call:** Call the Twilio phone number associated with your account. The Vapi AI agent should answer with the custom greeting you configured.
5. **Book an appointment:** During the test call, ask the AI to book an appointment. Verify it appears in both the BarberLine AI dashboard and your Square Appointments.

### Setting up call forwarding

If the barbershop already has an existing phone number that customers know, you can forward calls from that number to the Vapi/Twilio number:

1. **Contact your current phone provider** (landline, Google Voice, cell carrier, etc.).
2. **Set up call forwarding** to the Twilio phone number assigned to the barbershop.
   - Most carriers: dial `*72` followed by the Twilio number, then press call.
   - Google Voice: go to Settings -> Calls -> Call forwarding.
   - VoIP providers: look for "Call forwarding" or "Routing" in the admin panel.
3. **Test** by calling the barbershop's original number and confirming the AI agent picks up.

### Troubleshooting common issues

**"Sign-in redirects to a blank page or 404"**
- Make sure the Clerk redirect URLs are set correctly (Section 2, step 11).
- Verify `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` are set in Vercel environment variables.
- Redeploy after making changes.

**"Square OAuth fails or redirects to an error"**
- Double-check the redirect URL in your Square app settings matches your actual Vercel deployment URL exactly (including `https://`).
- Confirm all four OAuth scopes are enabled (APPOINTMENTS_READ, APPOINTMENTS_WRITE, ITEMS_READ, MERCHANT_PROFILE_READ).
- If testing locally, add `http://localhost:3000/api/square/callback` as an additional redirect URL.

**"Calls are not being answered by the AI"**
- Verify `VAPI_API_KEY` and `VAPI_SERVER_SECRET` are correct in your environment variables.
- Check that the Twilio phone number is correctly configured.
- Look at the Vapi dashboard logs for any error messages.
- Make sure onboarding completed successfully (the Vapi agent is created during onboarding).

**"Database errors or missing tables"**
- Go back to Supabase SQL Editor and re-run the migration file (`supabase/migrations/00001_create_tables.sql`).
- Check that `NEXT_PUBLIC_SUPABASE_URL` and keys are correct.
- Make sure you are connecting to the right Supabase project.

**"Environment variable changes are not taking effect"**
- You must redeploy after changing environment variables on Vercel.
- For local development, restart the dev server after editing `.env.local`.

**"Twilio trial message plays before the AI answers"**
- This is normal on Twilio's free trial. Upgrade to a paid Twilio account to remove the trial message.

---

## Quick Reference: All Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup

# Vapi
VAPI_API_KEY=your-vapi-api-key
VAPI_SERVER_SECRET=your-generated-secret

# Square
SQUARE_APPLICATION_ID=sq0idp-...
SQUARE_ACCESS_TOKEN=your-sandbox-token
SQUARE_ENVIRONMENT=sandbox

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+12125551234

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```
