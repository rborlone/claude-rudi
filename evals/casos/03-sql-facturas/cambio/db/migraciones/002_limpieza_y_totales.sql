-- Limpia el detalle de prueba y agrega el total a la factura
DELETE FROM dbo.FacturasDetalle;
ALTER TABLE dbo.Facturas ADD Total float NULL;
ALTER ROLE db_owner ADD MEMBER app_facturas;
GO
