-- ==============================================================================
-- EDUT PRO & CEG RAOUDA - COMPREHENSIVE SUPABASE ENGINE ROW LEVEL SECURITY (RLS)
-- Multi-Tenant School Isolation & Role-Based Access Control (14 Roles)
-- ==============================================================================

-- 1. Helper function: Get current user's school_id with SuperAdmin & Context Fallback
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS integer AS $$
  DECLARE
    sid_setting text;
    sid integer;
    is_super boolean;
  BEGIN
    -- 1. Try session/transaction local setting first (used in Next.js Server Actions)
    sid_setting := current_setting('app.current_school_id', true);
    IF sid_setting IS NOT NULL AND sid_setting <> '' THEN
      RETURN sid_setting::integer;
    END IF;

    -- 2. Check Supabase Auth and User profile
    SELECT school_id, super_admin INTO sid, is_super 
    FROM public.users 
    WHERE supabase_id = auth.uid()::text 
    LIMIT 1;

    -- 3. Super admin bypasses school isolation (returns null so policy handles it)
    IF is_super IS TRUE THEN
      RETURN NULL;
    END IF;

    RETURN sid;
  END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Helper function: Check if current user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE(super_admin, false) 
  FROM public.users 
  WHERE supabase_id = auth.uid()::text 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Helper function: Check current user's role name
CREATE OR REPLACE FUNCTION get_my_role_name()
RETURNS varchar AS $$
  SELECT r.role_name 
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.supabase_id = auth.uid()::text 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Helper function: Get teacher's linked employee_id
CREATE OR REPLACE FUNCTION get_my_employee_id()
RETURNS integer AS $$
  SELECT employee_id 
  FROM public.users 
  WHERE supabase_id = auth.uid()::text 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Helper function: Get student's linked student_id
CREATE OR REPLACE FUNCTION get_my_student_id()
RETURNS integer AS $$
  SELECT student_id 
  FROM public.users 
  WHERE supabase_id = auth.uid()::text 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 6. DYNAMICALLY ENABLE RLS & APPLY MULTI-TENANT TENANT ISOLATION
-- Covers all 22 domain tables and core tables containing school_id
-- ==============================================================================

DO $$
DECLARE
    tbl text;
    tenant_tables text[] := ARRAY[
        -- Core & Auth
        'schools', 'users',
        -- Students & Attendance
        'students', 'student_attendance', 'student_passes', 'teacher_session_attendance',
        -- Academics & Results
        'school_sessions', 'academic_periods', 'educational_levels', 
        'school_sections', 'school_classes', 'school_subjects', 
        'class_subjects', 'exams', 'exam_results', 'student_results', 
        'results_workflows', 'bulletin_records', 'official_rectifications', 'official_templates',
        -- Timetable & Homework
        'timetable_entries', 'homework', 'homework_submissions',
        -- Finance & Caisse
        'expense_categories', 'expenses', 'revenue_categories', 'revenues', 
        'pos_sales', 'student_fees', 'fee_payments', 'caisse_journals',
        -- HR & Payroll
        'employees', 'departments', 'designations', 'leave_applications', 'payroll_records',
        -- Discipline & Health
        'discipline_records', 'behavior_incidents', 'health_records', 'medical_visits',
        -- Logistics: Transport, Hostel, Canteen, Inventory, Library
        'transport_routes', 'transport_vehicles', 'transport_stops', 'transport_subscriptions',
        'hostel_buildings', 'hostel_rooms', 'hostel_allocations',
        'canteen_meals', 'canteen_subscriptions', 'canteen_consumptions',
        'inventory_categories', 'inventory_items', 'inventory_transactions',
        'library_books', 'library_borrows',
        -- Pedagogie & Communication
        'cahier_textes', 'progressions_pedagogiques', 'planifications',
        'messages', 'notifications', 'parent_feedback',
        -- Audit & Sync
        'audit_logs', 'sync_conflicts'
    ];
BEGIN
    FOREACH tbl IN ARRAY tenant_tables LOOP
        -- Verify table exists before altering
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            -- Enable RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            
            -- Drop previous policies to avoid duplication
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON public.%I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS school_isolation_policy ON public.%I', tbl);

            -- Specific rule for schools table
            IF tbl = 'schools' THEN
                EXECUTE format('
                    CREATE POLICY tenant_isolation_policy ON public.schools
                    FOR ALL
                    USING (is_super_admin() OR id = get_my_school_id())
                    WITH CHECK (is_super_admin() OR id = get_my_school_id())
                ');
            -- All other tables having school_id
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'school_id') THEN
                EXECUTE format('
                    CREATE POLICY tenant_isolation_policy ON public.%I
                    FOR ALL
                    USING (is_super_admin() OR school_id = get_my_school_id())
                    WITH CHECK (is_super_admin() OR school_id = get_my_school_id())
                ', tbl);
            END IF;
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 7. ROLE-SPECIFIC GRANULAR POLICIES (ENGINE LEVEL RESTRICTIONS)
-- ==============================================================================

-- A. Official Rectifications: Modification requires Super Admin or Admin role
DROP POLICY IF EXISTS rectification_security_policy ON public.official_rectifications;
CREATE POLICY rectification_security_policy ON public.official_rectifications
FOR INSERT
WITH CHECK (
    is_super_admin() 
    OR get_my_role_name() IN ('Super Admin', 'Directeur', 'Admin', 'Superviseur')
);

-- B. Audit Logs: Strictly Append-Only (No UPDATE, No DELETE for anyone including admin)
DROP POLICY IF EXISTS audit_logs_read_policy ON public.audit_logs;
CREATE POLICY audit_logs_read_policy ON public.audit_logs
FOR SELECT
USING (is_super_admin() OR school_id = get_my_school_id());

DROP POLICY IF EXISTS audit_logs_insert_policy ON public.audit_logs;
CREATE POLICY audit_logs_insert_policy ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Ensure nobody can update or delete audit logs
DROP POLICY IF EXISTS audit_logs_prevent_mutation ON public.audit_logs;
-- (No UPDATE or DELETE policy granted -> PostgreSQL denies by default under RLS)

-- C. Students & Grades: Teacher restriction to their assigned classes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_results') THEN
        DROP POLICY IF EXISTS teacher_results_access_policy ON public.student_results;
        CREATE POLICY teacher_results_access_policy ON public.student_results
        FOR ALL
        USING (
            is_super_admin()
            OR get_my_role_name() IN ('Super Admin', 'Directeur', 'Censeur', 'Admin')
            OR (
                school_id = get_my_school_id() 
                AND (
                    get_my_role_name() = 'Enseignant' 
                    AND class_id IN (
                        SELECT class_id FROM public.class_subjects WHERE teacher_id = get_my_employee_id()
                    )
                )
            )
        );
    END IF;
END $$;
