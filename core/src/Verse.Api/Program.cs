// Asagity Verse API entrypoint (ASP.NET Core).
// Composition root: middleware + Verse.Modules + Verse.Data (see Arch.mermaid).
//
// Layering red line: the public API and the business modules live in .NET;
// the Go Verse.Engine keeps the core services (event bus, websocket push,
// search, federation). See docs/architecture/tech-stack-audit.md.

using Verse.Api.Infrastructure;
using Verse.Api.Middlewares;
using Verse.Data;
using Verse.Module.Asset;
using Verse.Module.Auth;
using Verse.Module.Drive;
using Verse.Module.Follow;
using Verse.Module.Instance;
using Verse.Module.Music;
using Verse.Module.Note;
using Verse.Module.Shell;
using Verse.Module.User;

// Load the repository .env before anything reads configuration, so the .NET
// API and the Go engine share the same secrets and ports.
DotEnv.Load();

var builder = WebApplication.CreateBuilder(args);

// Verse.Api listens on VERSE_API_PORT (set by `versetool start`; default 2050) so it
// never clashes with the Go verse-engine on SERVER_PORT (default 2048).
var port = Environment.GetEnvironmentVariable("VERSE_API_PORT")
    ?? Environment.GetEnvironmentVariable("SERVER_PORT")
    ?? "2050";
builder.WebHost.UseUrls($"http://*:{port}");

// Data layer: provider follows the runtime mode (SQLite for lite, PostgreSQL
// for production, none for databaseless).
var dataOptions = DataOptions.FromEnvironment();
builder.Services.AddSingleton(dataOptions);
builder.Services.AddVerseData(dataOptions);

AssetModule.AddServices(builder.Services);
AuthModule.AddServices(builder.Services);
DriveModule.AddServices(builder.Services);
FollowModule.AddServices(builder.Services);
InstanceModule.AddServices(builder.Services);
MusicModule.AddServices(builder.Services);
NoteModule.AddServices(builder.Services);
ShellModule.AddServices(builder.Services);
UserModule.AddServices(builder.Services);

var app = builder.Build();

// Authentication (optional Bearer) then authorization (scope requirements).
app.UseMiddleware<JwtMiddleware>();
app.UseMiddleware<ScopeGuardMiddleware>();

// Database initialization: built-in groups + administrator/developer account.
if (dataOptions.Mode != RuntimeMode.Databaseless)
{
    using var scope = app.Services.CreateScope();
    var seeder = scope.ServiceProvider.GetRequiredService<VerseDataSeeder>();
    if (await seeder.EnsureSeededAsync(dataOptions))
    {
        var username = dataOptions.Mode == RuntimeMode.Lite
            ? VerseDataSeeder.LiteDeveloperUsername
            : VerseDataSeeder.ProductionAdministratorUsername;
        app.Logger.LogInformation(
            "[db] seeded administrator account: {Username} (mode {Mode})", username, dataOptions.Mode);
    }
    else
    {
        app.Logger.LogInformation("[db] administrator account already present, skipping seed");
    }
}

AssetModule.Register(app);
AuthModule.Register(app);
DriveModule.Register(app);
FollowModule.Register(app);
InstanceModule.Register(app);
MusicModule.Register(app);
NoteModule.Register(app);
ShellModule.Register(app);
UserModule.Register(app);

app.Run();
