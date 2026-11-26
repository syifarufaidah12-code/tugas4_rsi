-- =====================================================================
-- Pengujian append-only AUDIT_LOGS (Tugas 5).
-- Bagian A: jalankan sebagai sa  -> ditolak oleh TRIGGER (error 50010).
-- Bagian B: jalankan sebagai user aplikasi (syifa) -> ditolak oleh PERMISSION (DENY).
-- Jumlah baris sebelum dan sesudah harus sama.
-- =====================================================================
USE review_kantin;
GO

SELECT COUNT(*) AS jumlah_sebelum FROM dbo.AUDIT_LOGS;
GO

-- A1. UPDATE langsung -> ditolak trigger
BEGIN TRY
    UPDATE dbo.AUDIT_LOGS SET action = N'DIUBAH' WHERE id = 1;
    PRINT 'GAGAL UJI: UPDATE berhasil dijalankan';
END TRY
BEGIN CATCH
    SELECT 'UPDATE' AS uji, ERROR_NUMBER() AS error_number, ERROR_MESSAGE() AS error_message;
END CATCH;
GO

-- A2. DELETE langsung -> ditolak trigger
BEGIN TRY
    DELETE FROM dbo.AUDIT_LOGS WHERE id = 1;
    PRINT 'GAGAL UJI: DELETE berhasil dijalankan';
END TRY
BEGIN CATCH
    SELECT 'DELETE' AS uji, ERROR_NUMBER() AS error_number, ERROR_MESSAGE() AS error_message;
END CATCH;
GO

-- B. Sebagai user aplikasi (izin dibatasi INSERT + SELECT)
EXECUTE AS USER = 'syifa';
BEGIN TRY
    UPDATE dbo.AUDIT_LOGS SET action = N'DIUBAH' WHERE id = 1;
END TRY
BEGIN CATCH
    SELECT 'UPDATE sebagai syifa' AS uji, ERROR_NUMBER() AS error_number, ERROR_MESSAGE() AS error_message;
END CATCH;
BEGIN TRY
    DELETE FROM dbo.AUDIT_LOGS WHERE id = 1;
END TRY
BEGIN CATCH
    SELECT 'DELETE sebagai syifa' AS uji, ERROR_NUMBER() AS error_number, ERROR_MESSAGE() AS error_message;
END CATCH;
REVERT;
GO

SELECT COUNT(*) AS jumlah_sesudah FROM dbo.AUDIT_LOGS;
SELECT TOP 1 id, action FROM dbo.AUDIT_LOGS WHERE id = 1;
GO
