-- =====================================================================
-- Tugas 5: penyesuaian tabel AUDIT_LOGS
--  1) kolom ip_address dan user_agent (dipakai audit LOGIN / LOGOUT)
--  2) index untuk filter + urutan created_at DESC, id DESC
--  3) append-only: trigger menolak UPDATE/DELETE
--  4) hak akses user aplikasi dibatasi INSERT + SELECT pada AUDIT_LOGS
-- Skrip aman dijalankan berulang kali (idempotent).
-- Jalankan sebagai sa / admin SQL Server.
-- =====================================================================
USE review_kantin;
GO

-- 1) Kolom tambahan ----------------------------------------------------
IF COL_LENGTH('dbo.AUDIT_LOGS', 'ip_address') IS NULL
    ALTER TABLE dbo.AUDIT_LOGS ADD ip_address NVARCHAR(45) NULL;
GO

IF COL_LENGTH('dbo.AUDIT_LOGS', 'user_agent') IS NULL
    ALTER TABLE dbo.AUDIT_LOGS ADD user_agent NVARCHAR(255) NULL;
GO

-- 2) Index -------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AUDIT_LOGS_created_at'
               AND object_id = OBJECT_ID('dbo.AUDIT_LOGS'))
    CREATE INDEX IX_AUDIT_LOGS_created_at ON dbo.AUDIT_LOGS (created_at DESC, id DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AUDIT_LOGS_user_id'
               AND object_id = OBJECT_ID('dbo.AUDIT_LOGS'))
    CREATE INDEX IX_AUDIT_LOGS_user_id ON dbo.AUDIT_LOGS (user_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AUDIT_LOGS_target'
               AND object_id = OBJECT_ID('dbo.AUDIT_LOGS'))
    CREATE INDEX IX_AUDIT_LOGS_target ON dbo.AUDIT_LOGS (target_table, target_id);
GO

-- 3) Trigger append-only ----------------------------------------------
CREATE OR ALTER TRIGGER dbo.TR_AUDIT_LOGS_AppendOnly
ON dbo.AUDIT_LOGS
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 50010, 'AUDIT_LOGS bersifat append-only.', 1;
END;
GO

-- 4) Hak akses user aplikasi (login dari 01-create-database-and-user.sql)
--    db_datawriter memberi INSERT/UPDATE/DELETE ke semua tabel,
--    jadi UPDATE dan DELETE khusus AUDIT_LOGS ditolak dengan DENY.
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'syifa')
BEGIN
    GRANT SELECT, INSERT ON dbo.AUDIT_LOGS TO syifa;
    DENY UPDATE, DELETE ON dbo.AUDIT_LOGS TO syifa;
END
GO

-- 5) Verifikasi --------------------------------------------------------
SELECT name AS kolom, TYPE_NAME(user_type_id) AS tipe, max_length
FROM sys.columns
WHERE object_id = OBJECT_ID('dbo.AUDIT_LOGS')
ORDER BY column_id;

SELECT name AS trigger_name, is_disabled
FROM sys.triggers
WHERE parent_id = OBJECT_ID('dbo.AUDIT_LOGS');

SELECT pr.name AS principal, pe.permission_name, pe.state_desc
FROM sys.database_permissions pe
JOIN sys.database_principals pr ON pe.grantee_principal_id = pr.principal_id
WHERE pe.major_id = OBJECT_ID('dbo.AUDIT_LOGS')
ORDER BY pe.permission_name;
GO
