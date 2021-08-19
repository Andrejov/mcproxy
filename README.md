# mcproxy
### Useful tool to keep user informed about the server status even when it is under maintenance/offline

## Installation
Clone repository
```
git clone https://github.com/Andrejov/mcproxy.git
```
Run
```
cd mcproxy
node index.js
```
## Configuration
Configuration is stored in `config.json`
### Main entries
#### `proxy.port`
The main port
#### `server.port`
(Minecraft) server port
#### `server.ip`
(Minecraft) server ip
#### `fallback.timeout`
Time after which the proxy will switch to fallback server when the main server is not responding
#### `fallback.interval`
How often will the proxy ping the main server
#### `fallback.port`
The port at which headless minecraft server will be listening
#### `fallback.settings`
The fallback server settings
##### [...]`.favicon`
Favicon path (PNG file 64x64px)
##### [...]`.version`
Server version
##### [...]`.motd`
Server list entry message
##### [...]`.message`
Message sent by server when a client tries to join
##### [...]`.players`
Number of `online`/`max` players
#### `shell.set`
Shell command(s) to add port redirect rule (eg. iptables -A ...)  
Available placeholders: `{from}` and `{to}`
#### `shell.unset`
Shell command(s) to remove port redirect rule (eg. iptables -D ...)  
Available placeholders: `{from}` and `{to}`
#### `shell.apply`
Shell command(s) to apply port redirect rules (eq. iptables-save)
