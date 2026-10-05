using Microsoft.AspNetCore.Mvc;
using Pagos.Api.Datos;

namespace Pagos.Api.Controllers;

[ApiController]
[Route("api/pagos")]
public class PagosController(PagosRepositorio repo, ILogger<PagosController> logger) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id, CancellationToken ct)
    {
        var pago = await repo.ObtenerAsync(id, ct);
        return pago is null ? NotFound() : Ok(pago);
    }

    [HttpGet("cliente/{clienteId:int}")]
    public IActionResult BuscarPorCliente(int clienteId, [FromQuery] string estado = "PAGADO")
    {
        try
        {
            return Ok(repo.BuscarPorCliente(clienteId, estado));
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, string.Format("Error buscando pagos del cliente {0}", clienteId));
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:int}/anular")]
    public async Task<IActionResult> Anular(int id, CancellationToken ct)
    {
        if (HttpContext.Items["clienteId"] is null)
            return Unauthorized();

        var anulado = await repo.AnularAsync(id, ct);
        return anulado ? NoContent() : Conflict("El pago no existe o ya estaba anulado");
    }
}
