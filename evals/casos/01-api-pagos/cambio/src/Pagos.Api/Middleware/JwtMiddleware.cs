using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Pagos.Api.Middleware;

public class JwtMiddleware(RequestDelegate next, IConfiguration config)
{
    public async Task Invoke(HttpContext context)
    {
        var token = context.Request.Headers.Authorization.FirstOrDefault()?.Split(" ").Last();
        if (token != null)
            await AdjuntarUsuario(context, token);

        await next(context);
    }

    private async Task AdjuntarUsuario(HttpContext context, string token)
    {
        try
        {
            var clave = Encoding.ASCII.GetBytes(config["Jwt:Clave"]!);
            new JwtSecurityTokenHandler().ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(clave),
                ValidateIssuer = false,
                ValidateAudience = false,
            }, out var validado);
            var jwt = (JwtSecurityToken)validado;
            context.Items["clienteId"] = int.Parse(jwt.Claims.First(c => c.Type == "clienteId").Value);
        }
        catch
        {
            // si el token no es válido seguimos sin usuario
            await next(context);
        }
    }
}
