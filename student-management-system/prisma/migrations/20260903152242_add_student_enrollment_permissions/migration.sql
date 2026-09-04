-- Add Student and Enrollment permissions without changing existing role assignments.
INSERT INTO "permissions" ("id", "key", "description", "updated_at") VALUES
    ('00000000-0000-4000-8000-000000000105', 'student:create', 'Create students', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000106', 'student:read', 'Read students', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000107', 'student:update', 'Update students', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000108', 'student:delete', 'Delete students', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000109', 'enrollment:create', 'Create enrollments', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000110', 'enrollment:read', 'Read enrollments', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000111', 'enrollment:delete', 'Delete enrollments', CURRENT_TIMESTAMP);

-- ADMIN remains the built-in role with every application permission.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT
    '00000000-0000-4000-8000-000000000002',
    "id"
FROM "permissions"
WHERE "key" IN (
    'student:create',
    'student:read',
    'student:update',
    'student:delete',
    'enrollment:create',
    'enrollment:read',
    'enrollment:delete'
);
