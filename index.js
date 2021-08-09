const fs = require('fs');

const tcp = require('node-tcp-proxy');
const tcping = require('nodejs-tcp-ping')

const mc = require('minecraft-protocol');
const mcdata = require('minecraft-data');

const config = require('./config.json');

/** @type {tcp.TcpProxy} */
let tproxy;

// Set up fallback server

let favicon = undefined;
if(fs.existsSync(config.fallback.settings.favicon))
{
    console.log("Loading favicon...")
    favicon = "data:image/png;base64," + 
        fs.readFileSync(config.fallback.settings.favicon).toString('base64');
}

const version = mcdata(config.fallback.settings.version);
const minecraft = mc.createServer({
    'online-mode': false,
    port: config.fallback.port,
    version: config.fallback.settings.version,
    motd: config.fallback.settings.motd.split('&').join('§'),
    maxPlayers: config.fallback.settings.players.max,
    favicon: favicon
})
minecraft.playerCount = config.fallback.settings.players.online

minecraft.on('login', (client) => {
    client.end(config.fallback.settings.message.split('&').join('§'))
})

let lastState = "unknown";

async function verify()
{
    try {
        const data = await tcping.tcpPing({
            attempts: 1,
            host: config.server.ip,
            port: +config.server.port,
            timeout: +config.fallback.timeout
        })

        return data[0].ping != null;
    } catch (error) {
        return false;
    }
}

async function proxyLoop()
{
    const valid = await verify();


    if(valid != lastState)
    {
        if(valid)
        {
            console.log("Setting up production proxy");
            if(tproxy)
            {
                tproxy.end();
            }
            
            tproxy = tcp.createProxy(
                config.proxy.port,
                config.server.ip,
                config.server.port
            );
        }else{
            console.log("Setting up fallback proxy")
            if(tproxy)
            {
                tproxy.end();
            }
            
            tproxy = tcp.createProxy(
                config.proxy.port,
                "localhost",
                config.fallback.port
            );
        }
    
        lastState = valid;
    }

    setTimeout(() => {
        proxyLoop();
    }, config.fallback.interval);
}

proxyLoop();