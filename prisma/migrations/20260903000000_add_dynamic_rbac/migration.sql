-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed stable authorization data used by application code.
INSERT INTO "roles" ("id", "name", "description", "is_system", "updated_at") VALUES
    ('00000000-0000-4000-8000-000000000001', 'USER', 'Default application user', true, CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000002', 'ADMIN', 'Built-in administrator', true, CURRENT_TIMESTAMP);

INSERT INTO "permissions" ("id", "key", "description", "updated_at") VALUES
    ('00000000-0000-4000-8000-000000000101', 'course:create', 'Create courses', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000102', 'course:update', 'Update courses', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000103', 'course:delete', 'Delete courses', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000104', 'rbac:manage', 'Manage roles and role assignments', CURRENT_TIMESTAMP);

-- Give existing accounts the same default role as newly registered accounts.
INSERT INTO "user_roles" ("user_id", "role_id")
SELECT
    "id",
    '00000000-0000-4000-8000-000000000001'
FROM "users";

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT
    '00000000-0000-4000-8000-000000000002',
    "id"
FROM "permissions";
