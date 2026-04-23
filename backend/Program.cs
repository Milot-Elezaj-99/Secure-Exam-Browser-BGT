using Backend.Data;
using Backend.Services;
using Backend.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- KORRIGJIMI PËR RENDER (PORTI DHE IP) ---
// Merr portin automatikisht nga Render, ose përdor 5001 nëse po e teston lokalisht
var port = Environment.GetEnvironmentVariable("PORT") ?? "5001";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

// --- KORRIGJIMI I DATABAZËS ---
// Prioritet i jepet variablës së ambientit (për Render), pastaj appsettings.json, pastaj vlerës default
var connectionString = Environment.GetEnvironmentVariable("MYSQL_CONNECTION_STRING") 
                       ?? builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "server=localhost;user=root;password=;database=bgt_secure_exam";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Dependency Injection
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IExamService, ExamService>();

// Authentication (JWT)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SUPER_SECRET_KEY_123456789_MUST_BE_LONG_ENOUGH";
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; 
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false, 
        ValidateAudience = false,
        ValidateLifetime = true
    };
});

// --- KORRIGJIMI I CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000", 
                "http://localhost:5173", 
                "https://secure-exam-browser-bgt.onrender.com" // URL e Frontend-it në Render
              ) 
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); 
    });
});

var app = builder.Build();

// Sigurohu që databaza dhe tabelat janë krijuar
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
        Console.WriteLine("Database check: Success.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database check error: {ex.Message}");
    }
}

// Konfigurimi i Middleware
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ExamMonitorHub>("/examHub");

// Kjo duhet për Render që të dijë që aplikacioni është "Healthy"
app.MapGet("/", () => "Backend is running!");

app.Run();