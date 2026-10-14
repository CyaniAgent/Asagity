# Termity Command List
| Root Command | Name | Description |
| :--- | :--- | :--- |
| `auth` | Account | 查看当前账号信息、设备、授权等账号相关内容 |
| `clear` | Clear | 清空终端输出 |
| `date` | Date | 显示当前日期和时间（格式：YYYY/MM/DD 星期 HH:mm:ss），支持 `--GMT=xx` 和 `--format=iso` |
| `exit` | Exit Termity | 退出此 Termity 会话 |
| `func` | Function Switch | 修改 Asagity 的一些可修改功能（含开发者模式、Portal Debugger 控制等） |
| `help` | Help | 帮助，查看所有可用的指令 |
| `info` | Server Information | 查看本 Asagity 实例的相关信息 |
| `remote` | Remote Instance | 通过 Bearer Token 连接到其他实例（开发中） |
| `time` | Time | 显示当前时间（HH:mm:ss），支持 `--GMT=xx` 查看其他时区 |
| `vnet` | Verse NET Config | Verse NET 监测、管理、配置 |
| `whoami` | Who Am I | 显示当前登录用户信息 |
| `webdbg` | Web Debugger | Portal Debugger 控制台指令的 Termity 入口（子命令：`theme`、`locale`、`notify`、`mock`、`inject`、`storage`、`dispatch`、`eval`、`fedo`；隶属 Develop 功能项，未启用开发者模式时不可用） |

Note: 带有子命令的指令（`auth`、`func`、`vnet`）在未提供有效子命令时会自动显示子命令帮助。也可以使用 `[Root Command] --help` 查看子指令帮助。