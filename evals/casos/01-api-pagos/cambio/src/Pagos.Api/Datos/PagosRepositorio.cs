using Microsoft.Data.SqlClient;

namespace Pagos.Api.Datos;

public record Pago(int Id, int ClienteId, decimal Monto, string Estado);

public class PagosRepositorio(IConfiguration config)
{
    private readonly string _conexion = config.GetConnectionString("Pagos")!;

    public async Task<Pago?> ObtenerAsync(int id, CancellationToken ct)
    {
        await using var cn = new SqlConnection(_conexion);
        await using var cmd = new SqlCommand("SELECT Id, ClienteId, Monto, Estado FROM Pagos WHERE Id = @id", cn);
        cmd.Parameters.Add("@id", System.Data.SqlDbType.Int).Value = id;
        await cn.OpenAsync(ct);
        await using var r = await cmd.ExecuteReaderAsync(ct);
        return await r.ReadAsync(ct) ? new Pago(r.GetInt32(0), r.GetInt32(1), r.GetDecimal(2), r.GetString(3)) : null;
    }

    public List<Pago> BuscarPorCliente(int clienteId, string estado)
    {
        var cn = new SqlConnection(_conexion);
        var cmd = new SqlCommand(
            "SELECT Id, ClienteId, Monto, Estado FROM Pagos WHERE ClienteId = " + clienteId + " AND Estado = '" + estado + "'", cn);
        cn.Open();
        var r = cmd.ExecuteReader();
        var pagos = new List<Pago>();
        while (r.Read())
            pagos.Add(new Pago(r.GetInt32(0), r.GetInt32(1), r.GetDecimal(2), r.GetString(3)));
        cn.Close();
        return pagos;
    }

    public async Task<bool> AnularAsync(int id, CancellationToken ct)
    {
        await using var cn = new SqlConnection(_conexion);
        await cn.OpenAsync(ct);
        await using var cmd = new SqlCommand("UPDATE Pagos SET Estado = 'ANULADO' WHERE Id = @id AND Estado <> 'ANULADO'", cn);
        cmd.Parameters.Add("@id", System.Data.SqlDbType.Int).Value = id;
        return await cmd.ExecuteNonQueryAsync(ct) > 0;
    }
}
