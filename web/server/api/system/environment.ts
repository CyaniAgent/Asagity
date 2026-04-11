import os from 'os'
import { defineEventHandler } from 'h3'
import si from 'systeminformation'

const startupTime = new Date().getTime()

export default defineEventHandler(async (event) => {
  // Try to use process.env mapping for Docker, else fallback to OS defaults or systeminformation
  
  // systeminformation OS info can take a bit so we'll fetch basic stuff
  const osInfo = await si.osInfo()
  const cpuInfo = await si.cpu()

  // Prioritize HOST_* env variables for Docker pass-through
  const hostname = process.env.HOST_HOSTNAME || osInfo.hostname || os.hostname()
  const platform = process.env.HOST_OS || osInfo.distro || os.type()
  const release = process.env.HOST_OS_VERSION || osInfo.release || os.release()
  const arch = process.env.HOST_ARCH || osInfo.arch || os.arch()
  
  const uptimeSeconds = (new Date().getTime() - startupTime) / 1000

  return {
    hostname,
    platform: `${platform} ${release}`,
    arch,
    cpu: `${cpuInfo.manufacturer} ${cpuInfo.brand}`,
    node_version: process.version,
    startup_time: startupTime,
    uptime_seconds: uptimeSeconds,
    docker: process.env.HOST_HOSTNAME !== undefined // Just an indicator if it runs in docker with our env passed
  }
})
