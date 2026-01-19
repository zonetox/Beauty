-- List all tables in public schema
SELECT 
    schemaname, 
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Also get row counts
SELECT 
    schemaname, 
    relname as table_name, 
    n_live_tup as row_count 
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;
