# Environment Setup for mySync

## Required Environment Variables

To run mySync, you need to set up the following environment variables in a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional but recommended for database seeding
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## How to Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Navigate to Settings → API
4. You'll find:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secure!)

## Creating the .env.local File

1. In the root of your mySync project, create a file named `.env.local`
2. Copy the template above
3. Replace the placeholder values with your actual Supabase credentials
4. Save the file

## Security Notes

- Never commit `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` has full access to your database - keep it secure
- Only use the service role key in server-side code or scripts, never expose it to the client

## Verifying Your Setup

After creating the `.env.local` file, you can verify it's working by running:

```bash
npm run seed
```

This should now load your environment variables and connect to your Supabase database. 