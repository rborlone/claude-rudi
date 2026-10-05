CREATE OR ALTER PROCEDURE dbo.RegistrarPago
    @FacturaId int,
    @Monto     float,
    @Anio      int
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Facturas SET Estado = 'PAGADA' WHERE Id = @FacturaId AND YEAR(Fecha) = @Anio;
    INSERT INTO dbo.FacturasDetalle (FacturaId, Descripcion, Monto) VALUES (@FacturaId, 'Pago recibido', -@Monto);
END
GO
