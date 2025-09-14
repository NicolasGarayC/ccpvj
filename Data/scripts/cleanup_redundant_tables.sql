-- Cleanup script to remove redundant user tables and establish single source of truth
-- WARNING: This script will remove .NET backend user tables
-- Ensure frontend authentication is working before running

-- Step 1: Verify frontend user table has data
SELECT 'Frontend users:', COUNT(*) FROM user;

-- Step 2: Create backup of .NET backend user data before cleanup
CREATE TABLE IF NOT EXISTS Usuario_final_backup AS 
SELECT 
    IdUsuario,
    NombreUsuario,
    Nombre,
    Apellido, 
    Telefono,
    IdRol,
    FechaRegistro,
    'migrated_to_user_table' as migration_status
FROM Usuario;

-- Step 3: Drop .NET backend authentication tables
-- These are no longer needed as we use session-based auth in frontend
DROP TABLE IF EXISTS RefreshToken;
DROP TABLE IF EXISTS RefreshTokens; 
DROP TABLE IF EXISTS TokenBlacklist;
DROP TABLE IF EXISTS Usuario;
DROP TABLE IF EXISTS Rol;

-- Step 4: Update any remaining references that might point to old tables
-- MediaEntity should reference user table, not Usuario
UPDATE MediaEntity SET CreatedBy = 'admin' WHERE CreatedBy NOT IN (SELECT id FROM user);

-- Step 5: Verify cleanup
SELECT name FROM sqlite_master 
WHERE type='table' 
AND (name LIKE '%Usuario%' OR name LIKE '%Rol%' OR name LIKE '%Token%');

-- Step 6: Show remaining user-related tables (should only be user and session)
SELECT name FROM sqlite_master 
WHERE type='table' 
AND (name LIKE '%user%' OR name LIKE '%session%');

-- Final verification: Ensure user table is the single source of truth
SELECT 'Final user count:', COUNT(*) FROM user;