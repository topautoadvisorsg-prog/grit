[x] 1. Install the required packages
[•] 2. Restart the workflow to see if the project is working
[•] 3. Migrate Supabase to Neon Postgres
  [x] 1. Install Replit Auth packages (passport, express-session, connect-pg-simple)
  [x] 2. Create Replit Auth integration module (server/replit_integrations/auth/)
  [•] 3. Replace Supabase auth in server/index.ts with Replit Auth
  [ ] 4. Update all server routes to use Replit Auth middleware
  [ ] 5. Rewrite badgeRoutes and userSettingsRoutes to use Drizzle instead of Supabase client
  [ ] 6. Replace frontend AuthContext with Replit Auth hook
  [ ] 7. Remove supabase.auth.getSession() from all frontend components
  [ ] 8. Add user_settings table to Drizzle schema
  [ ] 9. Remove Supabase code and dependencies
  [ ] 10. Push the database schema using `npm run db:push`
[ ] 4. Verify the project is working
[ ] 5. Inform user the import is completed and they can start building, mark the import as completed using the complete_project_import tool