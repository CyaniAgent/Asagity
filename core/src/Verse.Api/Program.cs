// Asagity Verse API entrypoint.
// Composition root: wires middleware + Verse.Modules (see Arch.mermaid).

using Verse.Api.Middlewares;
using Verse.Module.Asset;
using Verse.Module.Auth;
using Verse.Module.Drive;
using Verse.Module.Follow;
using Verse.Module.Instance;
using Verse.Module.Music;
using Verse.Module.Note;
using Verse.Module.Shell;
using Verse.Module.User;

var builder = WebApplication.CreateBuilder(args);

// Verse.Api listens on VERSE_API_PORT (set by `verse start`; default 2050) so it
// never clashes with the Go verse-engine on SERVER_PORT (default 2048).
var port = Environment.GetEnvironmentVariable("VERSE_API_PORT")
    ?? Environment.GetEnvironmentVariable("SERVER_PORT")
    ?? "2050";
builder.WebHost.UseUrls($"http://*:{port}");

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

app.UseMiddleware<JwtMiddleware>();

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
