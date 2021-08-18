const fs = require('fs');
const { execSync } = require('child_process');

const tcping = require('nodejs-tcp-ping')

const mc = require('minecraft-protocol');
const mcdata = require('minecraft-data');

const config = require('./config.json');

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
            
            await unsetRedirect(config.proxy.port, config.fallback.port);
            await setRedirect(config.proxy.port, config.server.port);
            await applyRedirect();
        }else{
            console.log("Setting up fallback proxy")
            
            await unsetRedirect(config.proxy.port, config.fallback.port);
            await setRedirect(config.proxy.port, config.server.port);
            await applyRedirect();
        }
    
        lastState = valid;
    }

    setTimeout(() => {
        proxyLoop();
    }, config.fallback.interval);
}

async function shell(command)
{
    try {
        const stdout = await execSync(command).toString();
        console.log("  stdout:" + stdout);
    } catch (error) {
        console.log("  BASH ERR:" + error);
    }
}

function formatCommand(cmd, from, to)
{
    return cmd
        .split('{from}').join(from)
        .split('{to}').join(to);
}

async function runCommands(cmds, from, to)
{
    for(let cmd of cmds)
    {
        const fcmd = formatCommand(cmd, from, to);
        await shell(fcmd);
    }
}

async function setRedirect(from, to)
{
    console.log(` SET ${from} -> ${to}`);
    await runCommands(config.shell.set, from, to);
}
async function unsetRedirect(from, to)
{
    console.log(` UNSET ${from} -> ${to}`);
    await runCommands(config.shell.unset, from, to);
}
async function applyRedirect()
{
    console.log(` APPLY`);
    await runCommands(config.shell.apply, null,null);
}

proxyLoop();