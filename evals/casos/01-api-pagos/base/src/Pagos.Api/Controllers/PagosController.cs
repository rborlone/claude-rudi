using Microsoft.AspNetCore.Mvc;
using Pagos.Api.Datos;

namespace Pagos.Api.Controllers;

[ApiController]
[Route("api/pagos")]
public class PagosController(PagosRepositorio repo) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id, CancellationToken ct)
    {
        var pago = await repo.ObtenerAsync(id, ct);
        return pago is null ? NotFound() : Ok(pago);
    }
}
