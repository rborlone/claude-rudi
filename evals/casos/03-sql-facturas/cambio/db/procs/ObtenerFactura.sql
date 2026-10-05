CREATE OR ALTER PROCEDURE dbo.ObtenerFactura
    @Id int
AS
BEGIN
    SET NOCOUNT ON;
    SELECT f.Id, f.Cliente, f.Fecha, f.Estado
    FROM dbo.Facturas f
    WHERE f.Id = @Id;
END
GO
