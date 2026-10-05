CREATE PROCEDURE dbo.sp_BuscarFacturas
    @Cliente nvarchar(100),
    @Orden   nvarchar(50) = 'Fecha'
AS
BEGIN
    DECLARE @sql nvarchar(max) =
        'SELECT * FROM dbo.Facturas WHERE Cliente LIKE ''%' + @Cliente + '%'' ORDER BY ' + @Orden;
    EXEC (@sql);
END
GO
