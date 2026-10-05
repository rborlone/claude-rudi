namespace Pagos.Tests;

public class AnulacionTests
{
    [Fact]
    public async Task Anular_un_pago_ya_anulado_responde_conflicto()
    {
        var api = await ApiDePrueba.CrearAsync(pagos: [new(1, clienteId: 7, monto: 1000, estado: "ANULADO")]);
        var respuesta = await api.Como(clienteId: 7).PostAsync("/api/pagos/1/anular", null);
        Assert.Equal(System.Net.HttpStatusCode.Conflict, respuesta.StatusCode);
    }
}
