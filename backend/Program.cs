using Backend.Data;
using Backend.Services;
using Backend.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
// Force the app to listen on a different port to avoid conflicts with services
// (useful when port 5000 is already reserved by the system)
// builder.WebHost.UseUrls("http://127.0.0.1:5001");

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

// Database (MySQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "server=localhost;user=root;password=;database=bgt_secure_exam";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Dependency Injection
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IExamService, ExamService>();

// Authentication (JWT)
var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Key"] ?? "SUPER_SECRET_KEY_123456789_MUST_BE_LONG_ENOUGH");
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
        ValidateIssuer = false, // Set to true in prod
        ValidateAudience = false,
        ValidateLifetime = true
    };
});

// CORS (Allow Frontend)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "https://secure-exam-browser-bgt.onrender.com") // React, Vite and Production URL
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Better for Auth
    });
});

var app = builder.Build();

// Sigurohu që databaza dhe tabelat janë krijuar (EnsureCreated)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
        Console.WriteLine("Database and tables ensured.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred while creating the database: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ExamMonitorHub>("/examHub");

app.Run();
