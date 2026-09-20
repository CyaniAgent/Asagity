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
using Verse.Module.User;

var builder = WebApplication.CreateBuilder(args);

// Default API port: :2048 (mirrors Go config SERVER_PORT default).
var port = Environment.GetEnvironmentVariable("SERVER_PORT") ?? "2048";
builder.WebHost.UseUrls($"http://*:{port}");

AssetModule.AddServices(builder.Services);
AuthModule.AddServices(builder.Services);
DriveModule.AddServices(builder.Services);
FollowModule.AddServices(builder.Services);
InstanceModule.AddServices(builder.Services);
MusicModule.AddServices(builder.Services);
NoteModule.AddServices(builder.Services);
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
UserModule.Register(app);

app.Run();
