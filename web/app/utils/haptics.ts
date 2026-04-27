import { UAParser } from 'ua-parser-js'

export enum MotorType {
  LINEAR = 'LINEAR', // LRA (Linear Resonant Actuator)
  ROTOR = 'ROTOR',   // ERM (Eccentric Rotating Mass)
  ROTOR_HUAWEI = 'ROTOR_HUAWEI', // Special 300ms requirement for Huawei
  UNKNOWN = 'UNKNOWN'
}

let cachedMotorType: MotorType | null = null

export function initHaptics() {
  if (typeof navigator === 'undefined') return
  cachedMotorType = getMotorType()
  console.log(`Haptics: Initialized with motor type ${cachedMotorType}`)
}

export function getMotorType(): MotorType {
  if (cachedMotorType) return cachedMotorType
  if (typeof navigator === 'undefined') return MotorType.UNKNOWN

  const parser = new UAParser(navigator.userAgent)
  const device = parser.getDevice()
  const vendor = device.vendor?.toLowerCase() || ''
  const model = device.model?.toUpperCase() || ''
  const uaStr = navigator.userAgent.toUpperCase()

  // 1. Explicit Xiaomi 10 Series / 10S -> Linear
  const mi10Models = ['M2001J2G', 'M2001J2I', 'M2001J2C', 'M2001J1G', 'M2001J1C', 'M2007J1SC', 'M2102J2SC']
  if (mi10Models.some(m => model.includes(m) || uaStr.includes(m))) {
    return MotorType.LINEAR
  }

  // 2. Apple Devices -> Linear
  if (vendor === 'apple' || /IPHONE|IPAD|IPOD/.test(uaStr)) {
    return MotorType.LINEAR
  }

  // 3. Huawei / Honor Logic
  const isHuaweiVendor = vendor === 'huawei' || vendor === 'honor'
  // Check for XXX-XXXX format (e.g., CMR-AL09)
  const isHuaweiFormat = /^[A-Z0-9]{3,4}-[A-Z0-9]{3,4}$/.test(model)

  if (isHuaweiVendor || isHuaweiFormat) {
    // High-end Huawei series often use linear motors. 
    // We infer linear if the model name or code implies a flagship (Mate, P, Magic, etc.)
    const highEndCodes = ['TAS', 'LIO', 'ELS', 'ANA', 'NOH', 'NOP', 'ALN', 'BRA', 'PGT', 'MGE', 'BVL']
    const isLinearHeuristic = /MATE|P\d0|MAGIC|PRO|PLUS|RS|ULTIMATE/i.test(model) ||
      highEndCodes.some(code => model.startsWith(code))

    if (isLinearHeuristic) {
      return MotorType.LINEAR
    } else {
      // User specific requirement: Huawei rotor motors vibrate for 300ms
      return MotorType.ROTOR_HUAWEI
    }
  }

  // 4. General High-end Android Heuristic
  const isHighEndAndroid = /pixel|samsung|sony/i.test(vendor) && !/lite|core/i.test(model)
  if (isHighEndAndroid) {
    return MotorType.LINEAR
  }

  return MotorType.ROTOR
}

/**
 * Triggers haptic feedback based on motor type
 */
export function triggerHapticError() {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    console.warn('Haptics: Navigation Vibrate API not supported on this device.')
    return
  }

  const motor = getMotorType()

  if (motor === MotorType.LINEAR) {
    // 4 Crisp pulses for Linear Motors (High-end feel)
    navigator.vibrate([10, 50, 10, 50, 10, 50, 10])
    console.log('Haptics: Triggered 4-pulse linear haptics.')
  } else if (motor === MotorType.ROTOR_HUAWEI) {
    // Specific 300ms continuous vibration for Huawei Rotor Motors
    navigator.vibrate(300)
    console.log('Haptics: Triggered 300ms Huawei rotor vibration.')
  } else {
    // 150ms continuous vibration for standard Rotor Motors
    navigator.vibrate(150)
    console.log('Haptics: Triggered 150ms standard rotor vibration.')
  }
}
