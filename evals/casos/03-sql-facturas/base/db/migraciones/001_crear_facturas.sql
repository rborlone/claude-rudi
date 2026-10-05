IF OBJECT_ID('dbo.Facturas') IS NULL
CREATE TABLE dbo.Facturas (
    Id          int IDENTITY PRIMARY KEY,
    Cliente     nvarchar(100) NOT NULL,
    Fecha       date          NOT NULL,
    Estado      varchar(20)   NOT NULL CONSTRAINT DF_Facturas_Estado DEFAULT 'EMITIDA'
);
IF OBJECT_ID('dbo.FacturasDetalle') IS NULL
CREATE TABLE dbo.FacturasDetalle (
    Id          int IDENTITY PRIMARY KEY,
    FacturaId   int           NOT NULL REFERENCES dbo.Facturas(Id),
    Descripcion nvarchar(200) NOT NULL,
    Monto       decimal(18,2) NOT NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Facturas_Cliente_Fecha')
CREATE INDEX IX_Facturas_Cliente_Fecha ON dbo.Facturas (Cliente, Fecha);
GO
