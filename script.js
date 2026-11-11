var db = document.body;
var c = document.getElementById('oldSkool');
var $ = c.getContext('2d');
var w = (c.width = window.innerWidth);
var h = (c.height = window.innerHeight);

var resume;
var animId;
var _s = [];
var x = 0;
var y = 1;

// localStorage can throw (privacy mode, blocked site data); never let that break the app.
function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {}
}

function safeStorageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (e) {}
}

var DEFAULT_CUSTOM_CODE =
  '// CUSTOM SCRIPT RELAY INITIALIZED...\n\nfunction helloWorld() {\n  const message = "Welcome to the Retro CRT Terminal Studio!";\n  console.log(message);\n  return 42;\n}\n\nhelloWorld();\n// END RELAY _';

var studio = {
  initialized: false,
  lang: 'en',
  poweredOn: true,
  paused: false,
  finished: false,
  speed: 1,
  speedAccumulator: 0,
  theme: 'green',
  template: 'quine',
  cursorIndex: 0,
  cursors: ['█', '_', '▏'],
  syntaxEnabled: true,
  crtEnabled: true,
  soundEnabled: false,
  soundType: 'mech',
  volume: 0.5,
  glowBlur: 9,
  trailAlpha: 0.42,
  fontSize: 17,
  lineHeight: 16,
  marginX: 32,
  showLineNumbers: false,
  rawLines: [],
  telemetryVisible: true,
  humanized: false,
  humanDelayFrames: 0,
  typoChar: '',
  typoStage: 0,
  glitchFrames: 0,
  scrollY: 0,
  targetScrollY: 0,
  manualScroll: false,
  isDraggingScrollbar: false,
  customCode: safeStorageGet('oldSkoolCustomCode') || DEFAULT_CUSTOM_CODE,
  cliActive: false,
  cliInput: '',
  cliHistory: [],
  hackInterval: null,
  matrixColumns: [],
  matrixOverlay: false,
  hologramMode: 'f35',
  hologramModes: ['f35', 'globe', 'cube', 'off'],
  holoAngleY: 0.4,
  radarAngle: 0,
  radarBlips: [
    { a: 0.65, r: 0.46, label: 'MIG-29' },
    { a: 2.15, r: 0.72, label: 'UAV-X4' },
    { a: 3.85, r: 0.58, label: 'BOGEY' },
    { a: 5.15, r: 0.34, label: 'AWACS' }
  ],
  frameCount: 0,
  fps: 60,
  charsTypedThisSec: 0,
  cps: 0,
  lastSecTime: performance.now(),
  oscEnergy: 0,
  oscPhase: 0,
  snakeActive: false,
  snakeGridSize: 20,
  snake: [],
  snakeDir: { x: 1, y: 0 },
  snakeNextDir: { x: 1, y: 0 },
  snakeFood: { x: 10, y: 10 },
  snakeScore: 0,
  snakeHighScore: parseInt(safeStorageGet('oldSkoolSnakeHigh') || '0', 10),
  snakeTickCounter: 0,
  jetActive: false,
  jetX: 300,
  jetMoveLeft: false,
  jetMoveRight: false,
  jetBullets: [],
  jetEnemies: [],
  jetParticles: [],
  jetScore: 0,
  jetHighScore: parseInt(safeStorageGet('oldSkoolJetHigh') || '0', 10),
  jetHull: 100,
  jetWave: 1,
  jetTick: 0,
  audioCtx: null,
  masterGain: null,
  audioAnalyser: null,
  audioTimeData: null,
  musicPlaying: false,
  musicTimer: null,
  musicStep: 0,
  mediaRecorder: null,
  recordedChunks: [],
  isRecording: false
};

var THEMES = {
  green: {
    name: 'P1 Green',
    hudColor: '#00ff41',
    hudBg: 'rgba(0, 18, 6, 0.86)',
    hudBorder: 'rgba(0, 255, 65, 0.45)',
    hudGlow: 'rgba(0, 255, 65, 0.35)',
    glow: 'hsla(120, 100%, 50%, 0.55)',
    baseText: 'hsla(120, 100%, 28%, 1)',
    cursor: 'hsla(120, 100%, 55%, 1)',
    comment: 'hsla(120, 65%, 20%, 1)',
    keyword: 'hsla(135, 100%, 42%, 1)',
    string: 'hsla(95, 100%, 38%, 1)',
    number: 'hsla(150, 100%, 45%, 1)'
  },
  amber: {
    name: 'P3 Amber',
    hudColor: '#ffb000',
    hudBg: 'rgba(22, 12, 0, 0.86)',
    hudBorder: 'rgba(255, 176, 0, 0.45)',
    hudGlow: 'rgba(255, 176, 0, 0.35)',
    glow: 'hsla(40, 100%, 50%, 0.55)',
    baseText: 'hsla(38, 100%, 30%, 1)',
    cursor: 'hsla(42, 100%, 55%, 1)',
    comment: 'hsla(32, 80%, 20%, 1)',
    keyword: 'hsla(48, 100%, 42%, 1)',
    string: 'hsla(28, 100%, 38%, 1)',
    number: 'hsla(52, 100%, 45%, 1)'
  },
  cyan: {
    name: 'IBM Cyan',
    hudColor: '#00e5ff',
    hudBg: 'rgba(0, 16, 24, 0.86)',
    hudBorder: 'rgba(0, 229, 255, 0.45)',
    hudGlow: 'rgba(0, 229, 255, 0.35)',
    glow: 'hsla(188, 100%, 50%, 0.55)',
    baseText: 'hsla(188, 100%, 30%, 1)',
    cursor: 'hsla(188, 100%, 60%, 1)',
    comment: 'hsla(195, 70%, 20%, 1)',
    keyword: 'hsla(175, 100%, 42%, 1)',
    string: 'hsla(205, 100%, 42%, 1)',
    number: 'hsla(165, 100%, 45%, 1)'
  },
  synthwave: {
    name: 'Synthwave',
    hudColor: '#ff2a85',
    hudBg: 'rgba(20, 4, 18, 0.88)',
    hudBorder: 'rgba(255, 42, 133, 0.5)',
    hudGlow: 'rgba(255, 42, 133, 0.4)',
    glow: 'hsla(330, 100%, 55%, 0.55)',
    baseText: 'hsla(325, 100%, 34%, 1)',
    cursor: 'hsla(185, 100%, 55%, 1)',
    comment: 'hsla(280, 70%, 26%, 1)',
    keyword: 'hsla(185, 100%, 42%, 1)',
    string: 'hsla(50, 100%, 42%, 1)',
    number: 'hsla(340, 100%, 48%, 1)'
  },
  matrix: {
    name: 'Matrix Rain',
    hudColor: '#00ff66',
    hudBg: 'rgba(0, 14, 5, 0.88)',
    hudBorder: 'rgba(0, 255, 102, 0.5)',
    hudGlow: 'rgba(0, 255, 102, 0.4)',
    glow: 'hsla(135, 100%, 50%, 0.6)',
    baseText: 'hsla(130, 100%, 30%, 1)',
    cursor: 'hsla(130, 100%, 65%, 1)',
    comment: 'hsla(130, 70%, 20%, 1)',
    keyword: 'hsla(145, 100%, 44%, 1)',
    string: 'hsla(110, 100%, 38%, 1)',
    number: 'hsla(160, 100%, 45%, 1)'
  }
};

var TEMPLATES = {
  quine: [],
  bios: [
    '// ROM BIOS (C) 1989 OLD-SKOOL MICROSYSTEMS INC.',
    '// SYSTEM INITIALIZING...',
    '',
    'CPU: INTEL 80386DX-33 MHz PROCESSOR DETECTED',
    'CO-PROCESSOR: 80387 MATH UNIT INSTALLED',
    'BASE MEMORY: 640K OK',
    'EXTENDED MEMORY: 16384K OK',
    '',
    '/*',
    '      .__________________________.',
    '      | .______________________. |',
    '      | | > BIOS v4.02 READY   | |',
    '      | | > MEM CHECK: PASS    | |',
    '      | | > CRT SYNC: 60.0Hz   | |',
    '      | | > BOOT: C:\\DOS\\      | |',
    '      | !______________________! |',
    '      !__________________________!',
    '         /                    \\',
    '        /  [][][][][][][][][]  \\',
    '       /  [][][][][][][][][][]  \\',
    '      !__________________________!',
    '*/',
    '',
    'function initHardwareBus() {',
    '  const irqTable = [0x01, 0x03, 0x04, 0x07, 0x0E];',
    '  for (let i = 0; i < irqTable.length; i++) {',
    '    verifyChannel(irqTable[i], "READY");',
    '  }',
    '  return "PRIMARY MASTER: QUANTUM FIREBALL 540MB";',
    '}',
    '',
    '// LOADING BOOT SECTOR... COMPLETE _'
  ],
  hack: [
    '// NEURAL-NET MAINFRAME INTRUSION PROTOCOL v9.4',
    '// TARGET NODE: 192.0.2.254 [BYPASSING FIREWALL]',
    '',
    'const cipherKey = "0x7F4A9C2E1B8D00FF";',
    'let firewallLayers = 4;',
    '',
    '/*',
    '            .ed"""" """$$$$be.',
    '          -"           ^""**$$$e.',
    '        ."                   \'$$$c',
    '       /                      "4$$b',
    '      d  3                      $$$$',
    '      $  *                   .$$$$$$',
    '     .$  ^c           $$$$$e$$$$$$$$.',
    '     d$L  4.         4$$$$$$$$$$$$$$b',
    '     $$$$b ^ceeeee.  4$$ECL.F*$$$$$$$',
    '     $$$$P d$$$$F $ $$$$$$$$$- $$$$$$',
    '     3$$$F "$$$$b   $"$$$$$$$  $$$$*"',
    '      $$P"  "$$b   .$ $$$$$...e$$',
    '       *c    ..    $$ 3$$$$$$$$$$eF',
    '         %ce""    $$$  $$$$$$$$$$*',
    '          *$e.    *** d$$$$$"L$$',
    '           $$$      4J$$$$$% $$$',
    '          $"\'$e....$*$$**$cz$$"',
    '          $  *=%4.$ L L$ P3$$$F',
    '          $   "%*ebJLzb$e$$$$$b',
    '           %..      4$$$$$$$$$$',
    '            $$$e   z$$$$$$$$$$',
    '             "*$c  "$$$$$$$P"',
    '              ."""*$$$$$$$"',
    '*/',
    '',
    'async function decryptCore(node, key) {',
    '  const packets = await handshake(node, 443);',
    '  if (packets.status === 200) {',
    '    console.log("ROOT ACCESS GRANTED: CLEARANCE LEVEL 0");',
    '  }',
    '}',
    '',
    '// UPLINK ACTIVE — INTERACTIVE TERMINAL READY _'
  ],
  starship: [
    '// F-35 LIGHTNING II — 5TH GEN STEALTH FIGHTER 3-VIEW BLUEPRINT',
    '// RADAR: AN/APG-81 AESA ACTIVE // SPEED: MACH 1.6 // ALTITUDE: 45,000 FT',
    '',
    '/*',
    '  +----------------------------------------------------------------------------+',
    '  |   [TOP-DOWN PLANFORM]                        [FRONT VIEW — CANTED V-TAILS] |',
    '  |               ▄▄                                                           |',
    '  |              ███▄                                                          |',
    '  |              ████                           ▄               ▄              |',
    '  |              ████                           ▀▄             █               |',
    '  |            ▄▄████▄▄                          █    ▄██▄    █▀               |',
    '  |           ▄████████▄                          █▄▄███████▄██                |',
    '  |           ██████████            ▀▀▀▀▀▀▀▀▀▀▀██████████████████▀▀▀▀▀▀▀▀▀▀▀▀  |',
    '  |           ██████████                         ▀████████████▀                |',
    '  |           ██████████                           ▀▀▀▀▀▀▀▀▀▀                  |',
    '  |         ▄███████████▄▄                                                     |',
    '  |      ▄█████████████████▄▄                    [SIDE PROFILE — STEALTH CHINE]|',
    '  |   ▄████████████████████████▄                                               |',
    '  |  ████████████████████████████                                    ▄▄▄▄▄     |',
    '  |  ████████████████████████████                                  ▄█████▀     |',
    '  |  ▀▀▀▀████████████████████▀▀▀▀        ▄▄█████████▄▄▄▄▄▄▄▄▄▄▄▄▄▄██████       |',
    '  |         ▄████████████▄          ▄▄█████████████████████████████████████    |',
    '  |       ▄▄██████████████▄          ▀▀▀█▀▀█████████████████████████▀▀▀▀       |',
    '  |      ████████▀▀▀▀████████                                                  |',
    '  |      ▀▀██████    ██████▀▀                                                  |',
    '  +----------------------------------------------------------------------------+',
    '*/',
    '',
    'const f35Telemetry = {',
    '  aircraft: "F-35A LIGHTNING II STEALTH MULTIROLE FIGHTER (3-VIEW)",',
    '  engineThrust: "43,000 lbf (Pratt & Whitney F135-PW-100)",',
    '  radarCrossSection: "0.005 m2 (LOW OBSERVABLE STEALTH PROFILE)",',
    '  sensorFusion: "AN/APG-81 AESA + DAS 360-DEGREE + EOTS LOCK",',
    '  weaponsBay: "INTERNAL BAY READY — AIM-120D AMRAAM / SOM-J"',
    '};',
    '',
    'function engageSupersonicIntercept(machSpeed, targetBearing) {',
    '  const gForce = machSpeed * 5.625;',
    '  return gForce <= 9.0 ? "TARGET LOCKED — INTERCEPT VECTOR ACTIVE" : "G-LIMIT WARNING";',
    '}',
    '',
    '// F-35 TACTICAL AVIONICS STREAM COMPLETE _'
  ],
  cybermap: [
    '// GLOBAL CYBER THREAT & SATELLITE BACKBONE TELEMETRY MAP v5.2',
    '// CENTRAL COMMAND: ★ ANKARA [ANK-HQ] <==> [FRA] <==> [NYC] <==> [TYO] <==> [SYD]',
    '',
    '/*',
    '  120W          60W             0°            60E           120E            180E',
    '  +----------------------------------------------------------------------------+',
    '  |                   █▄██▄█▄▄▄█▄██▄█     ▄▄▄▄                                 | 75N',
    '  |              ▄▄▄▄ ███▀███████████    ████▀     ▀     ▀█                    |',
    '  |            █▄████▀███ ▀▀████████       ▀      █▄▀ ▄▄▄█▄████▄▄▄██▄          | 60N',
    '  |  ▄█▄███▄▄▄▄██████▄█▀██▄ ▀██████▀       ▄██▄▄▄ ██████████████████████▄█▄▄▄  |',
    '  |  ██████████████████▄███  ███▀  ██   ▄▄▄████▄██████████████████████████████ | 45N',
    '  | ▀████████████████  ███▄  ▀█       ▄ ▄███▀█████████████████████████▀█▀███▀  |',
    '  |  ██▀█ ▀▀███████████████▄         ▄██▄█████████████████████████████▄  ██    | 30N',
    '  | █▀▀     ██████[NYC]███▀█          ██[LON][FRA]████████████████████▀ ▀      |',
    '  |         █████████████▀            ██████★[ANK-HQ]███████████████▄█   [TYO] | 15N',
    '  |         ███████████               ██ █▄████████████████████████▀█ ▄█       |',
    '  |         ▀█████████▀              ▄█████▄▄█▄████████████████████▄ ▀         |  0°',
    '  |          ▀████ ▀▄▀▄▄            ███████████████▄███████████████▀           |',
    '  |            █████ ▀█▀▄         ▄ █████████████████   ████▀████  ▄           | 15S',
    '  |               ▀██▄▄▄█▄          █████████████▄█▄     █    ███   █▄         |',
    '  |                 ▀██████▄        ▀██▀███████████       ▀   ██ ▄█            | 30S',
    '  |                  ████████▄ ▄         ▄███████▀▀           ▀█[SGP] ▀ █      |',
    '  |                  ████[SAO]██          ███████               ▀▀  ▄▄ ▀█▀     | 45S',
    '  |                   █████████           ▄██████ █               ▄ █████▄▄    |',
    '  |                    ███████            ▀█[JNB] ██              ▄████████▀   | 60S',
    '  |                    ██████              ████   ▀              ██████[SYD]   |',
    '  |                    ████▀               ▀▀▀                   ▀▀▀ ▀████   █▀| 75S',
    '  +----------------------------------------------------------------------------+',
    '  |  [NYC-US] ══(68ms)══► [LON/FRA-EU] ══(19ms)══► ★[ANKARA-HQ] ══(134ms)══► [TYO-JP]  |',
    '  +----------------------------------------------------------------------------+',
    '*/',
    '',
    'const globalBackbone = [',
    '  { hop: 0, node: "★ ANKARA-HQ (TR)",  ip: "185.11.128.1",  latency: "1.2 ms",   traffic: "94.8 Gbps", status: "CORE SHIELD ACTIVE" },',
    '  { hop: 1, node: "FRANKFURT-IX (DE)", ip: "194.25.0.68",   latency: "19.4 ms",  traffic: "78.2 Gbps", status: "AES-512 TUNNEL OK" },',
    '  { hop: 2, node: "LONDON-LINX (UK)",  ip: "195.66.224.1",  latency: "34.1 ms",  traffic: "64.0 Gbps", status: "SYNCHRONIZED" },',
    '  { hop: 3, node: "NEWYORK-CORE (US)", ip: "198.32.160.12", latency: "88.6 ms",  traffic: "82.5 Gbps", status: "TRANSATLANTIC OK" },',
    '  { hop: 4, node: "TOKYO-UPLINK (JP)", ip: "203.181.248.5", latency: "134.2 ms", traffic: "71.9 Gbps", status: "TRANSPACIFIC OK" },',
    '  { hop: 5, node: "SYDNEY-SOUTH (AU)", ip: "202.12.29.1",   latency: "176.0 ms", traffic: "41.3 Gbps", status: "SATELLITE LINK OK" }',
    '];',
    '',
    'function traceGlobalRoute(nodes) {',
    '  return nodes.map(n => n.node + " [" + n.latency + "]").join(" ==> ");',
    '}',
    '',
    'console.log(traceGlobalRoute(globalBackbone));',
    '// GLOBAL SATELLITE & FIBER TELEMETRY ONLINE _'
  ]
};

var VIRTUAL_FS = {
  'readme.txt': [
    '============================================================',
    '  OLD-SCHOOL CRT OS v3.2 — OPERATOR HANDBOOK',
    '============================================================',
    '  • Use "ls" to inspect files in the virtual storage.',
    '  • Use "cat <filename>" to display file contents.',
    '  • Use "run <js>" to execute live JavaScript code.',
    '  • Use "3d <f35|globe|cube|off>" to switch 3D hologram.',
    '  • Use "jet" or "snake" to play retro CRT arcade games.',
    '  • Use "music" to toggle the 8-bit Synthwave sequencer.'
  ],
  'f35_specs.dat': [
    '============================================================',
    '  CLASSIFIED DOSSIER: F-35A LIGHTNING II (5TH GEN STEALTH)',
    '============================================================',
    '  CREW:          1 Pilot (HMDS Gen III Helmet Display)',
    '  MAX SPEED:     Mach 1.6 (1,975 km/h) at high altitude',
    '  COMBAT RADIUS: 1,239 km on internal fuel',
    '  POWERPLANT:    1x Pratt & Whitney F135-PW-100 (43,000 lbf)',
    '  RADAR:         AN/APG-81 AESA + AN/AAQ-37 DAS (360°)',
    '  STEALTH RCS:   ~0.005 m² (Frontal Low-Observable Profile)',
    '  ARMAMENT:      GAU-22/A 25mm + AIM-120D AMRAAM / SOM-J'
  ],
  'turk_bayragi.art': [
    '  +==================================================================+',
    '  |                     ▄▄▄▄▄                                        |',
    '  |               ▄▄█████████████▄▄                                  |',
    '  |            ▄████████▀▀▀       ▀▀▀▄                               |',
    '  |          ▄███████▀▀                                              |',
    '  |         ████████                        █▄                       |',
    '  |        ████████                         ███▄▄▄▄██                |',
    '  |        ███████                     ▄▄▄▄████████▀                 |',
    '  |        ███████                     ▀▀▀▀████████▄                 |',
    '  |        ████████                         ███▀▀▀▀██                |',
    '  |         ████████                        █▀                       |',
    '  |          ▀███████▄▄                                              |',
    '  |            ▀████████▄▄▄       ▄▄▄▀                               |',
    '  |               ▀▀█████████████▀▀                                  |',
    '  |                     ▀▀▀▀▀                                        |',
    '  |             * * *   A Y - Y I L D I Z   * * *                    |',
    '  +==================================================================+'
  ],
  'cyber_nodes.cfg': [
    '# GLOBAL RELAY ROUTING TABLE',
    'NODE_01 = 185.11.128.1   # ANKARA CENTRAL GATEWAY (ACTIVE)',
    'NODE_02 = 194.25.0.68    # FRANKFURT IX BACKBONE  (ACTIVE)',
    'NODE_03 = 198.32.160.12  # NEW YORK TRANSATLANTIC (ACTIVE)',
    'NODE_04 = 203.181.248.5  # TOKYO TRANSPACIFIC     (ACTIVE)'
  ]
};

var PIXEL_FONT = {
  A: [' ███ ', '█   █', '█████', '█   █', '█   █'],
  B: ['████ ', '█   █', '████ ', '█   █', '████ '],
  C: [' ████', '█    ', '█    ', '█    ', ' ████'],
  D: ['████ ', '█   █', '█   █', '█   █', '████ '],
  E: ['█████', '█    ', '████ ', '█    ', '█████'],
  F: ['█████', '█    ', '████ ', '█    ', '█    '],
  G: [' ████', '█    ', '█  ██', '█   █', ' ████'],
  H: ['█   █', '█   █', '█████', '█   █', '█   █'],
  I: ['█████', '  █  ', '  █  ', '  █  ', '█████'],
  J: ['  ███', '    █', '    █', '█   █', ' ███ '],
  K: ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
  L: ['█    ', '█    ', '█    ', '█    ', '█████'],
  M: ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
  N: ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
  O: [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
  P: ['████ ', '█   █', '████ ', '█    ', '█    '],
  Q: [' ███ ', '█   █', '█ █ █', '█  ██', ' ████'],
  R: ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
  S: [' ████', '█    ', ' ███ ', '    █', '████ '],
  T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
  U: ['█   █', '█   █', '█   █', '█   █', ' ███ '],
  V: ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
  W: ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
  X: ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
  Y: ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
  Z: ['█████', '   █ ', '  █  ', ' █   ', '█████'],
  0: [' ███ ', '█  ██', '█ █ █', '██  █', ' ███ '],
  1: ['  █  ', ' ██  ', '  █  ', '  █  ', '█████'],
  2: [' ███ ', '█   █', '  ██ ', ' █   ', '█████'],
  3: ['████ ', '    █', ' ███ ', '    █', '████ '],
  4: ['█   █', '█   █', '█████', '    █', '    █'],
  5: ['█████', '█    ', '████ ', '    █', '████ '],
  6: [' ███ ', '█    ', '████ ', '█   █', ' ███ '],
  7: ['█████', '    █', '   █ ', '  █  ', '  █  '],
  8: [' ███ ', '█   █', ' ███ ', '█   █', ' ███ '],
  9: [' ███ ', '█   █', ' ████', '    █', ' ███ '],
  '-': ['     ', '     ', '█████', '     ', '     '],
  '!': ['  █  ', '  █  ', '  █  ', '     ', '  █  '],
  ' ': ['   ', '   ', '   ', '   ', '   ']
};

function generateAsciiBannerLines(text) {
  var normalized = (text || 'OLD SKOOL')
    .toUpperCase()
    .replace(/Ç/g, 'C')
    .replace(/Ğ/g, 'G')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ş/g, 'S')
    .replace(/Ü/g, 'U');
  var rows = ['// ', '// ', '// ', '// ', '// '];
  for (var i = 0; i < normalized.length; i++) {
    var ch = normalized[i];
    var glyph = PIXEL_FONT[ch] || PIXEL_FONT[' '];
    for (var r = 0; r < 5; r++) {
      rows[r] += glyph[r] + '  ';
    }
  }
  return rows;
}

function initMatrixRain() {
  var cols = Math.floor(window.innerWidth / 18);
  studio.matrixColumns = [];
  for (var i = 0; i < cols; i++) {
    studio.matrixColumns.push({
      y: Math.random() * window.innerHeight,
      speed: 1.5 + Math.random() * 3,
      char: String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96))
    });
  }
}

function ensureAudio() {
  if (!studio.audioCtx) {
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      studio.audioCtx = new AudioContextClass();
      studio.masterGain = studio.audioCtx.createGain();
      studio.masterGain.gain.value = 1.0;
      studio.audioAnalyser = studio.audioCtx.createAnalyser();
      studio.audioAnalyser.fftSize = 128;
      studio.audioTimeData = new Uint8Array(studio.audioAnalyser.frequencyBinCount);
      studio.masterGain.connect(studio.audioAnalyser);
      studio.audioAnalyser.connect(studio.audioCtx.destination);
    }
  }
  if (studio.audioCtx && studio.audioCtx.state === 'suspended') {
    studio.audioCtx.resume();
  }
}

function getAudioDestination() {
  return studio.masterGain || (studio.audioCtx && studio.audioCtx.destination);
}

var SYNTH_BASS_NOTES = [110, 110, 87.31, 87.31, 130.81, 130.81, 98.0, 98.0];
var SYNTH_ARP_NOTES = [
  220, 261.63, 329.63, 440, 329.63, 261.63, 220, 329.63,
  174.61, 220, 261.63, 349.23, 261.63, 220, 174.61, 261.63,
  261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 261.63, 392.0,
  196.0, 246.94, 293.66, 392.0, 293.66, 246.94, 196.0, 293.66
];

function playSynthStep() {
  if (!studio.musicPlaying || !studio.poweredOn) return;
  ensureAudio();
  if (!studio.audioCtx) return;

  var dest = getAudioDestination();
  var now = studio.audioCtx.currentTime;
  var step = studio.musicStep % 32;
  var arpFreq = SYNTH_ARP_NOTES[step];
  var bassFreq = SYNTH_BASS_NOTES[Math.floor(step / 4) % SYNTH_BASS_NOTES.length];
  var vol = studio.volume * 0.055;

  var oscArp = studio.audioCtx.createOscillator();
  var gainArp = studio.audioCtx.createGain();
  oscArp.type = step % 2 === 0 ? 'square' : 'triangle';
  oscArp.frequency.setValueAtTime(arpFreq, now);
  gainArp.gain.setValueAtTime(vol, now);
  gainArp.gain.exponentialRampToValueAtTime(0.0008, now + 0.11);
  oscArp.connect(gainArp);
  gainArp.connect(dest);
  oscArp.start(now);
  oscArp.stop(now + 0.115);

  if (step % 2 === 0) {
    var oscBass = studio.audioCtx.createOscillator();
    var gainBass = studio.audioCtx.createGain();
    oscBass.type = 'sawtooth';
    oscBass.frequency.setValueAtTime(bassFreq, now);
    gainBass.gain.setValueAtTime(vol * 1.35, now);
    gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
    oscBass.connect(gainBass);
    gainBass.connect(dest);
    oscBass.start(now);
    oscBass.stop(now + 0.22);
  }

  studio.oscEnergy = Math.min(1, studio.oscEnergy + 0.35);
  studio.musicStep++;
}

function toggleSynthMusic() {
  studio.musicPlaying = !studio.musicPlaying;
  if (studio.musicTimer) {
    clearInterval(studio.musicTimer);
    studio.musicTimer = null;
  }
  if (studio.musicPlaying) {
    ensureAudio();
    studio.musicStep = 0;
    playSynthStep();
    studio.musicTimer = setInterval(playSynthStep, 125);
  }
  var btn = document.getElementById('btnMusic');
  if (btn) {
    btn.classList.toggle('active', studio.musicPlaying);
  }
}

function playKeySound(isNewline) {
  studio.oscEnergy = Math.min(1, studio.oscEnergy + (isNewline ? 0.85 : 0.45));
  if (!studio.soundEnabled || !studio.poweredOn) return;
  ensureAudio();
  if (!studio.audioCtx) return;

  var dest = getAudioDestination();
  var now = studio.audioCtx.currentTime;
  var osc = studio.audioCtx.createOscillator();
  var gain = studio.audioCtx.createGain();
  var vol = studio.volume * 0.08;

  if (isNewline) {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);
    gain.gain.setValueAtTime(vol * 1.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.05);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (studio.soundType === 'beep') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 + Math.random() * 160, now);
    gain.gain.setValueAtTime(vol * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.025);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.025);
  } else if (studio.soundType === 'typewriter') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320 + Math.random() * 90, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.028);
    gain.gain.setValueAtTime(vol * 1.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.03);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.03);
  } else {
    osc.type = 'square';
    var baseFreq = 680 + (Math.random() * 220 - 110);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.018);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.02);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.02);
  }
}

function playGlitchSound() {
  studio.oscEnergy = 1;
  if (!studio.soundEnabled || !studio.poweredOn) return;
  ensureAudio();
  if (!studio.audioCtx) return;

  var dest = getAudioDestination();
  var now = studio.audioCtx.currentTime;
  var osc = studio.audioCtx.createOscillator();
  var gain = studio.audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.linearRampToValueAtTime(880, now + 0.06);
  osc.frequency.linearRampToValueAtTime(95, now + 0.14);
  gain.gain.setValueAtTime(studio.volume * 0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.15);
}

function playDegaussSound() {
  studio.oscEnergy = 1;
  if (!studio.soundEnabled || !studio.poweredOn) return;
  ensureAudio();
  if (!studio.audioCtx) return;

  var dest = getAudioDestination();
  var now = studio.audioCtx.currentTime;
  var osc = studio.audioCtx.createOscillator();
  var gain = studio.audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.55);
  gain.gain.setValueAtTime(studio.volume * 0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.6);
}

function applyTheme(themeKey) {
  if (!THEMES[themeKey]) return;
  studio.theme = themeKey;
  var t = THEMES[themeKey];
  var root = document.documentElement;
  root.style.setProperty('--hud-color', t.hudColor);
  root.style.setProperty('--hud-bg', t.hudBg);
  root.style.setProperty('--hud-border', t.hudBorder);
  root.style.setProperty('--hud-glow', t.hudGlow);

  var sel = document.getElementById('selectTheme');
  if (sel && sel.value !== themeKey) {
    sel.value = themeKey;
  }
}

function getEffectiveFontSize() {
  var margin = Math.min(studio.marginX, Math.max(8, Math.floor(w * 0.03)));
  var lineNumSpace = studio.showLineNumbers ? 44 : 0;
  var availW = Math.max(180, w - margin * 2 - lineNumSpace - 18);
  var maxFitFont = Math.floor(availW / 50);
  return Math.max(7, Math.min(studio.fontSize, maxFitFont));
}

function getEffectiveLineHeight() {
  var ef = getEffectiveFontSize();
  return Math.max(8, Math.round(ef * 0.98));
}

function syncCanvasSize() {
  var frame = document.getElementById('screenFrame') || c.parentElement;
  if (frame) {
    var rect = frame.getBoundingClientRect();
    w = c.width = Math.max(240, Math.floor(rect.width));
    h = c.height = Math.max(140, Math.floor(rect.height));
  } else {
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
  }
  studio.lineHeight = getEffectiveLineHeight();
  $.textBaseline = 'top';
  $.font = getEffectiveFontSize() + 'px monospace';
}

function getLayoutMetrics() {
  var responsiveMargin = Math.min(studio.marginX, Math.max(8, Math.floor(w * 0.03)));
  var padLeft = responsiveMargin;
  var lineNumOffset = studio.showLineNumbers ? Math.max(36, Math.round(getEffectiveFontSize() * 3.1)) : 0;
  var textStartX = padLeft + lineNumOffset;
  var padRight = responsiveMargin + 18;
  var padTop = Math.max(14, Math.min(28, responsiveMargin));
  var padBottom = Math.max(18, Math.min(32, responsiveMargin));
  var maxTextWidth = Math.max(120, w - textStartX - padRight);
  return {
    padLeft: padLeft,
    textStartX: textStartX,
    padRight: padRight,
    padTop: padTop,
    padBottom: padBottom,
    maxTextWidth: maxTextWidth
  };
}

function wrapSingleLine(line, maxTextWidth) {
  if (!line) return [''];
  line = String(line).replace(/\r/g, '').replace(/\t/g, '  ');
  $.font = getEffectiveFontSize() + 'px monospace';
  if ($.measureText(line).width <= maxTextWidth) {
    return [line];
  }

  var indentMatch = line.match(/^(\s*)/);
  var indent = indentMatch ? indentMatch[1].slice(0, 8) : '';
  var result = [];
  var remaining = line;
  var isFirst = true;

  while (remaining.length > 0) {
    var currentPrefix = isFirst ? '' : indent;
    var candidate = currentPrefix + remaining;
    if ($.measureText(candidate).width <= maxTextWidth) {
      result.push(candidate);
      break;
    }

    var fitCount = 1;
    for (var i = 1; i <= remaining.length; i++) {
      if ($.measureText(currentPrefix + remaining.slice(0, i)).width > maxTextWidth) {
        fitCount = Math.max(1, i - 1);
        break;
      }
      fitCount = i;
    }

    var slicePart = remaining.slice(0, fitCount);
    var lastSpace = slicePart.lastIndexOf(' ');
    if (lastSpace > Math.floor(fitCount * 0.35)) {
      result.push(currentPrefix + remaining.slice(0, lastSpace));
      remaining = remaining.slice(lastSpace + 1);
    } else {
      result.push(currentPrefix + slicePart);
      remaining = remaining.slice(fitCount);
    }
    isFirst = false;
  }

  return result.length > 0 ? result : [''];
}

function wrapLinesToCanvas(rawLines) {
  var metrics = getLayoutMetrics();
  var wrapped = [];
  var inAsciiBlock = false;
  for (var i = 0; i < rawLines.length; i++) {
    var raw = rawLines[i] || '';
    if (raw.indexOf('/*') !== -1) inAsciiBlock = true;
    if (inAsciiBlock) {
      wrapped.push(String(raw).replace(/\r/g, ''));
    } else {
      var parts = wrapSingleLine(raw, metrics.maxTextWidth);
      for (var j = 0; j < parts.length; j++) {
        wrapped.push(parts[j]);
      }
    }
    if (raw.indexOf('*/') !== -1) inAsciiBlock = false;
  }
  return wrapped.length > 0 ? wrapped : [''];
}

function reflowCurrentScript() {
  if (!studio.rawLines || studio.rawLines.length === 0) return;
  var wasFinished = studio.finished;
  var progressRatio = _s.length > 0 ? y / _s.length : 0;
  _s = wrapLinesToCanvas(studio.rawLines);
  if (wasFinished) {
    y = _s.length;
    x = 0;
  } else {
    y = Math.min(_s.length - 1, Math.max(0, Math.round(progressRatio * _s.length)));
    x = Math.min(x, (_s[y] || '').length);
  }
}

function loadRelayScript(linesArray) {
  if (studio.hackInterval) {
    clearInterval(studio.hackInterval);
    studio.hackInterval = null;
  }
  studio.snakeActive = false;
  studio.jetActive = false;
  var btnSnake = document.getElementById('btnSnake');
  var btnJet = document.getElementById('btnJet');
  if (btnSnake) btnSnake.classList.remove('active');
  if (btnJet) btnJet.classList.remove('active');
  syncCanvasSize();

  studio.rawLines = linesArray.slice();
  if (studio.rawLines.length === 0) studio.rawLines = [''];
  _s = wrapLinesToCanvas(studio.rawLines);
  x = 0;
  y = 0;
  studio.finished = false;
  studio.paused = false;
  studio.cliActive = false;
  studio.cliInput = '';
  studio.cliHistory = [];
  studio.scrollY = 0;
  studio.targetScrollY = 0;
  studio.manualScroll = false;

  if (studio.poweredOn) {
    document.body.classList.remove('crt-power-on', 'crt-power-off');
    void document.body.offsetWidth;
    document.body.classList.add('crt-power-on');
  }

  updatePlayPauseUI();
}

function getLineColor(lineText, inBlockComment, themeObj) {
  if (!studio.syntaxEnabled) return themeObj.baseText;
  var trimmed = lineText.trim();
  if (trimmed.indexOf('/*') === 0 || trimmed.indexOf('*/') !== -1 || trimmed.indexOf('//') === 0) {
    return themeObj.comment;
  }
  if (inBlockComment) {
    return themeObj.keyword;
  }
  if (/["'`]/.test(lineText)) {
    return themeObj.string;
  }
  if (/\b(function|var|let|const|if|else|for|return|async|await|window|document)\b/.test(lineText)) {
    return themeObj.keyword;
  }
  if (/\b\d+\b/.test(lineText)) {
    return themeObj.number;
  }
  return themeObj.baseText;
}

function drawMatrixRain() {
  $.save();
  $.globalCompositeOperation = 'source-over';
  $.shadowBlur = 0;
  $.font = '14px monospace';
  $.fillStyle = 'hsla(130, 100%, 35%, 0.22)';
  for (var i = 0; i < studio.matrixColumns.length; i++) {
    var col = studio.matrixColumns[i];
    $.fillText(col.char, i * 18, col.y);
    col.y += col.speed;
    if (Math.random() < 0.05) {
      col.char = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
    }
    if (col.y > h) {
      col.y = -20;
    }
  }
  $.restore();
}

function scrambleText(str) {
  var chars = '01#$%&*@!?<>[]{}';
  var out = '';
  for (var i = 0; i < str.length; i++) {
    if (str[i] !== ' ' && Math.random() < 0.22) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    } else {
      out += str[i];
    }
  }
  return out;
}

function getMaxScrollY() {
  var lh = studio.lineHeight;
  var metrics = getLayoutMetrics();
  var cliWrappedCount = 0;
  if (studio.cliActive) {
    for (var i = 0; i < studio.cliHistory.length; i++) {
      cliWrappedCount += wrapSingleLine(studio.cliHistory[i].text, metrics.maxTextWidth).length;
    }
    cliWrappedCount += wrapSingleLine('guest@oldskool:~$ ' + studio.cliInput, metrics.maxTextWidth).length + 1;
  }
  var visibleLines = studio.cliActive
    ? _s.length + cliWrappedCount
    : Math.min(y + 1, _s.length);
  var contentBottom = metrics.padTop + visibleLines * lh + metrics.padBottom;
  return Math.max(0, contentBottom - h);
}

function stepRelayCharacter() {
  if (studio.finished || studio.paused || !studio.poweredOn || studio.snakeActive || studio.jetActive) return;

  if (studio.humanized && studio.humanDelayFrames > 0) {
    studio.humanDelayFrames--;
    return;
  }

  if (studio.humanized && studio.typoStage > 0) {
    if (studio.typoStage === 1) {
      studio.typoStage = 2;
      studio.humanDelayFrames = 5;
      return;
    } else if (studio.typoStage === 2) {
      studio.typoChar = '';
      studio.typoStage = 0;
      playKeySound(false);
      studio.humanDelayFrames = 3;
      return;
    }
  }

  if (y >= _s.length) {
    studio.finished = true;
    studio.cliActive = true;
    updatePlayPauseUI();
    return;
  }

  var currentLine = _s[y] || '';

  if (
    studio.humanized &&
    x > 2 &&
    x < currentLine.length - 1 &&
    /[a-zA-Z]/.test(currentLine[x]) &&
    Math.random() < 0.025
  ) {
    var typoPool = 'qwertyuiopasdfghjklzxcvbnm';
    studio.typoChar = typoPool.charAt(Math.floor(Math.random() * typoPool.length));
    studio.typoStage = 1;
    playKeySound(false);
    studio.humanDelayFrames = 4;
    return;
  }

  x++;
  studio.charsTypedThisSec++;

  if (x >= currentLine.length) {
    playKeySound(true);
    y++;
    x = 0;
    if (studio.humanized) {
      studio.humanDelayFrames = 4 + Math.floor(Math.random() * 6);
    }

    if (y >= _s.length) {
      studio.finished = true;
      studio.cliActive = true;
      updatePlayPauseUI();
    }
  } else {
    var typedChar = currentLine[x - 1];
    if (typedChar !== ' ') {
      playKeySound(false);
    }
    if (studio.humanized) {
      if (/[;{},()]/.test(typedChar)) {
        studio.humanDelayFrames = 3 + Math.floor(Math.random() * 5);
      } else if (typedChar === ' ') {
        studio.humanDelayFrames = Math.floor(Math.random() * 3);
      } else {
        studio.humanDelayFrames = Math.random() < 0.35 ? 1 + Math.floor(Math.random() * 2) : 0;
      }
    }
  }

  if (!studio.manualScroll) {
    studio.targetScrollY = getMaxScrollY();
  }
}

function stepNextLine() {
  if (studio.finished || studio.snakeActive || studio.jetActive) return;
  studio.typoChar = '';
  studio.typoStage = 0;
  studio.humanDelayFrames = 0;
  playKeySound(true);
  y++;
  x = 0;
  if (y >= _s.length) {
    studio.finished = true;
    studio.cliActive = true;
  }
  if (!studio.manualScroll) {
    studio.targetScrollY = getMaxScrollY();
  }
  updatePlayPauseUI();
}

function startSnakeGame() {
  studio.jetActive = false;
  var btnJet = document.getElementById('btnJet');
  if (btnJet) btnJet.classList.remove('active');
  studio.snakeActive = true;
  studio.snakeScore = 0;
  studio.snakeDir = { x: 1, y: 0 };
  studio.snakeNextDir = { x: 1, y: 0 };
  studio.snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 }
  ];
  spawnSnakeFood();
}

function startJetGame() {
  studio.snakeActive = false;
  var btnSnake = document.getElementById('btnSnake');
  if (btnSnake) btnSnake.classList.remove('active');
  studio.jetActive = true;
  studio.jetX = Math.floor(w / 2);
  studio.jetMoveLeft = false;
  studio.jetMoveRight = false;
  studio.jetBullets = [];
  studio.jetEnemies = [];
  studio.jetParticles = [];
  studio.jetScore = 0;
  studio.jetHull = 100;
  studio.jetWave = 1;
  studio.jetTick = 0;
  spawnJetWave();
}

function spawnJetWave() {
  var cols = Math.min(8, 4 + studio.jetWave);
  var rows = Math.min(4, 2 + Math.floor(studio.jetWave / 2));
  var spacingX = Math.min(72, Math.floor((w - 140) / cols));
  var startX = Math.floor((w - (cols - 1) * spacingX) / 2);
  for (var r = 0; r < rows; r++) {
    for (var cIdx = 0; cIdx < cols; cIdx++) {
      studio.jetEnemies.push({
        x: startX + cIdx * spacingX,
        y: 74 + r * 38,
        vx: (studio.jetWave * 0.35 + 1.1) * (r % 2 === 0 ? 1 : -1),
        hp: r === 0 ? 2 : 1,
        type: r === 0 ? 'HEAVY' : 'DRONE'
      });
    }
  }
}

function fireJetWeapon() {
  if (!studio.jetActive) return;
  var metrics = getLayoutMetrics();
  var jetY = 52 + (h - 72 - metrics.padBottom) - 28;
  studio.jetBullets.push({ x: studio.jetX - 12, y: jetY - 10 });
  studio.jetBullets.push({ x: studio.jetX + 12, y: jetY - 10 });
  playKeySound(false);
}

function renderJetGame(themeObj) {
  var metrics = getLayoutMetrics();
  var offsetX = metrics.padLeft;
  var offsetY = 52;
  var arenaW = w - metrics.padLeft - metrics.padRight;
  var arenaH = h - 72 - metrics.padBottom;
  var jetY = offsetY + arenaH - 28;

  studio.jetTick++;
  if (studio.jetMoveLeft) studio.jetX -= 6.5;
  if (studio.jetMoveRight) studio.jetX += 6.5;
  studio.jetX = Math.max(offsetX + 28, Math.min(offsetX + arenaW - 28, studio.jetX));

  $.save();
  $.shadowColor = themeObj.glow;
  $.shadowBlur = studio.glowBlur;
  $.strokeStyle = themeObj.cursor;
  $.fillStyle = themeObj.cursor;
  $.font = '15px monospace';

  $.fillText(
    studio.lang === 'tr'
      ? '=== F-35 HAVA SAVUNMA ===  SKOR: ' +
          studio.jetScore +
          '  REKOR: ' +
          studio.jetHighScore +
          '  DALGA: ' +
          studio.jetWave +
          '  ZIRH: ' +
          studio.jetHull +
          '%  [OKLAR] Uçuş [SPACE] Ateş [ESC] Çıkış'
      : '=== F-35 INTERCEPTOR ===  SCORE: ' +
          studio.jetScore +
          '  HIGH: ' +
          studio.jetHighScore +
          '  WAVE: ' +
          studio.jetWave +
          '  HULL: ' +
          studio.jetHull +
          '%  [ARROWS/AD] Fly [SPACE] Fire [ESC] Exit',
    offsetX,
    offsetY - 28
  );

  $.strokeRect(offsetX, offsetY, arenaW, arenaH);

  $.beginPath();
  $.moveTo(studio.jetX, jetY - 18);
  $.lineTo(studio.jetX + 6, jetY - 6);
  $.lineTo(studio.jetX + 22, jetY + 6);
  $.lineTo(studio.jetX + 8, jetY + 8);
  $.lineTo(studio.jetX + 11, jetY + 16);
  $.lineTo(studio.jetX + 3, jetY + 13);
  $.lineTo(studio.jetX, jetY + 18);
  $.lineTo(studio.jetX - 3, jetY + 13);
  $.lineTo(studio.jetX - 11, jetY + 16);
  $.lineTo(studio.jetX - 8, jetY + 8);
  $.lineTo(studio.jetX - 22, jetY + 6);
  $.lineTo(studio.jetX - 6, jetY - 6);
  $.closePath();
  $.stroke();

  $.fillStyle = themeObj.keyword;
  for (var b = studio.jetBullets.length - 1; b >= 0; b--) {
    var bul = studio.jetBullets[b];
    bul.y -= 9.5;
    $.fillRect(bul.x - 1.5, bul.y, 3, 10);
    if (bul.y < offsetY + 4) {
      studio.jetBullets.splice(b, 1);
    }
  }

  for (var eIdx = studio.jetEnemies.length - 1; eIdx >= 0; eIdx--) {
    var en = studio.jetEnemies[eIdx];
    en.x += en.vx;
    if (en.x < offsetX + 26 || en.x > offsetX + arenaW - 26) {
      en.vx *= -1;
      en.y += 16;
    }

    $.fillStyle = en.type === 'HEAVY' ? themeObj.string : themeObj.baseText;
    $.font = '13px monospace';
    $.fillText(en.type === 'HEAVY' ? '<[██]>' : '/▲\\', en.x - 16, en.y - 6);

    for (var bIdx = studio.jetBullets.length - 1; bIdx >= 0; bIdx--) {
      var shot = studio.jetBullets[bIdx];
      if (Math.abs(shot.x - en.x) < 20 && Math.abs(shot.y - en.y) < 14) {
        studio.jetBullets.splice(bIdx, 1);
        en.hp--;
        if (en.hp <= 0) {
          studio.jetScore += en.type === 'HEAVY' ? 30 : 15;
          if (studio.jetScore > studio.jetHighScore) {
            studio.jetHighScore = studio.jetScore;
            safeStorageSet('oldSkoolJetHigh', String(studio.jetHighScore));
          }
          playKeySound(true);
          for (var p = 0; p < 8; p++) {
            studio.jetParticles.push({
              x: en.x,
              y: en.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 16
            });
          }
          studio.jetEnemies.splice(eIdx, 1);
        }
        break;
      }
    }

    // A destroyed enemy was already removed above; don't damage the hull or splice a second (wrong) enemy.
    if (en.hp > 0 && en.y >= jetY - 12) {
      studio.jetHull -= 25;
      studio.jetEnemies.splice(eIdx, 1);
      triggerGlitch();
      if (studio.jetHull <= 0) {
        startJetGame();
        $.restore();
        return;
      }
    }
  }

  $.fillStyle = themeObj.cursor;
  for (var pIdx = studio.jetParticles.length - 1; pIdx >= 0; pIdx--) {
    var pt = studio.jetParticles[pIdx];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.life--;
    $.fillRect(pt.x, pt.y, 3, 3);
    if (pt.life <= 0) studio.jetParticles.splice(pIdx, 1);
  }

  if (studio.jetEnemies.length === 0) {
    studio.jetWave++;
    spawnJetWave();
  }

  $.restore();
}

var HOLO_F35_VERTS = [
  [0, 0, 42],
  [-7, -3, 18],
  [7, -3, 18],
  [0, -8, 12],
  [-36, 2, -6],
  [36, 2, -6],
  [-12, 2, -24],
  [12, 2, -24],
  [-16, -15, -30],
  [16, -15, -30],
  [0, 1, -36],
  [-22, 3, -18],
  [22, 3, -18]
];

var HOLO_F35_EDGES = [
  [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [1, 2],
  [1, 4], [2, 5], [4, 11], [5, 12], [11, 6], [12, 7],
  [1, 6], [2, 7], [3, 10], [6, 10], [7, 10], [6, 7],
  [6, 8], [10, 8], [7, 9], [10, 9]
];

var HOLO_CUBE_VERTS = [
  [-20, -20, -20], [20, -20, -20], [20, 20, -20], [-20, 20, -20],
  [-20, -20, 20],  [20, -20, 20],  [20, 20, 20],  [-20, 20, 20],
  [-10, -10, -10], [10, -10, -10], [10, 10, -10], [-10, 10, -10],
  [-10, -10, 10],  [10, -10, 10],  [10, 10, 10],  [-10, 10, 10]
];

var HOLO_CUBE_EDGES = [
  [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7],
  [8,9],[9,10],[10,11],[11,8],[12,13],[13,14],[14,15],[15,12],[8,12],[9,13],[10,14],[11,15],
  [0,8],[1,9],[2,10],[3,11],[4,12],[5,13],[6,14],[7,15]
];

function project3DPoint(pt, ax, ay, cx, cy, scale) {
  var x = pt[0], y = pt[1], z = pt[2];
  var cosY = Math.cos(ay), sinY = Math.sin(ay);
  var x1 = x * cosY - z * sinY;
  var z1 = z * cosY + x * sinY;
  var cosX = Math.cos(ax), sinX = Math.sin(ax);
  var y2 = y * cosX - z1 * sinX;
  var z2 = z1 * cosX + y * sinX;
  var fov = 140 / (140 + z2 + 40);
  return {
    x: cx + x1 * fov * scale,
    y: cy + y2 * fov * scale
  };
}

function draw3DHologram(themeObj) {
  if (studio.hologramMode === 'off' || w < 320 || h < 180) return;
  var osdPanel = document.getElementById('osdPanel');
  if (osdPanel && !osdPanel.classList.contains('hidden')) return;

  var sc = w < 780 ? 0.78 : 1;
  var cx = w - Math.round(94 * sc);
  var cy = Math.round(80 * sc);
  studio.holoAngleY += 0.022;

  $.save();
  $.setTransform(1, 0, 0, 1, 0, 0);
  $.strokeStyle = themeObj.cursor;
  $.fillStyle = themeObj.cursor;
  $.shadowColor = themeObj.glow;
  $.shadowBlur = 8;
  $.lineWidth = 1.25;
  $.globalAlpha = 0.78;

  $.strokeStyle = themeObj.comment;
  $.strokeRect(cx - 64 * sc, cy - 58 * sc, 128 * sc, 118 * sc);
  $.strokeStyle = themeObj.cursor;

  if (studio.hologramMode === 'f35') {
    $.beginPath();
    for (var i = 0; i < HOLO_F35_EDGES.length; i++) {
      var e = HOLO_F35_EDGES[i];
      var p1 = project3DPoint(HOLO_F35_VERTS[e[0]], 0.35, studio.holoAngleY, cx, cy - 4 * sc, 1.35 * sc);
      var p2 = project3DPoint(HOLO_F35_VERTS[e[1]], 0.35, studio.holoAngleY, cx, cy - 4 * sc, 1.35 * sc);
      $.moveTo(p1.x, p1.y);
      $.lineTo(p2.x, p2.y);
    }
    $.stroke();
  } else if (studio.hologramMode === 'cube') {
    $.beginPath();
    for (var cIdx = 0; cIdx < HOLO_CUBE_EDGES.length; cIdx++) {
      var ce = HOLO_CUBE_EDGES[cIdx];
      var cp1 = project3DPoint(HOLO_CUBE_VERTS[ce[0]], studio.holoAngleY * 0.6, studio.holoAngleY, cx, cy - 4 * sc, 1.35 * sc);
      var cp2 = project3DPoint(HOLO_CUBE_VERTS[ce[1]], studio.holoAngleY * 0.6, studio.holoAngleY, cx, cy - 4 * sc, 1.35 * sc);
      $.moveTo(cp1.x, cp1.y);
      $.lineTo(cp2.x, cp2.y);
    }
    $.stroke();
  } else if (studio.hologramMode === 'globe') {
    var r = 34;
    $.beginPath();
    for (var lat = -60; lat <= 60; lat += 30) {
      var latRad = (lat * Math.PI) / 180;
      var ringR = Math.cos(latRad) * r;
      var ringY = Math.sin(latRad) * r;
      for (var deg = 0; deg <= 360; deg += 20) {
        var lonRad = (deg * Math.PI) / 180;
        var gp = project3DPoint(
          [Math.cos(lonRad) * ringR, ringY, Math.sin(lonRad) * ringR],
          0.25,
          studio.holoAngleY,
          cx,
          cy - 4 * sc,
          1.25 * sc
        );
        if (deg === 0) $.moveTo(gp.x, gp.y);
        else $.lineTo(gp.x, gp.y);
      }
    }
    for (var lon = 0; lon < 180; lon += 45) {
      var lRad = (lon * Math.PI) / 180;
      for (var d = 0; d <= 360; d += 20) {
        var aRad = (d * Math.PI) / 180;
        var mp = project3DPoint(
          [Math.sin(aRad) * Math.cos(lRad) * r, Math.cos(aRad) * r, Math.sin(aRad) * Math.sin(lRad) * r],
          0.25,
          studio.holoAngleY,
          cx,
          cy - 4 * sc,
          1.25 * sc
        );
        if (d === 0) $.moveTo(mp.x, mp.y);
        else $.lineTo(mp.x, mp.y);
      }
    }
    $.stroke();
  }

  $.font = Math.max(8, Math.round(10 * sc)) + 'px monospace';
  var labelMap = {
    f35: '3D HOLO: F-35A',
    globe: '3D HOLO: GLOBE',
    cube: '3D HOLO: HYPERCUBE'
  };
  $.fillText(labelMap[studio.hologramMode] || '3D HOLO', cx - 46 * sc, cy + 44 * sc);
  $.restore();
}

function drawTacticalRadar(themeObj) {
  if (!studio.telemetryVisible || w < 320 || h < 220) return;
  var sc = w < 780 ? 0.78 : 1;
  var cx = w - Math.round(94 * sc);
  var cy = h - Math.round(76 * sc);
  var rad = Math.round(50 * sc);
  studio.radarAngle = (studio.radarAngle + 0.04) % (Math.PI * 2);

  $.save();
  $.setTransform(1, 0, 0, 1, 0, 0);
  $.strokeStyle = themeObj.cursor;
  $.fillStyle = themeObj.cursor;
  $.shadowColor = themeObj.glow;
  $.shadowBlur = 6;
  $.lineWidth = 1.1;
  $.globalAlpha = 0.78;

  $.beginPath();
  $.arc(cx, cy, rad, 0, Math.PI * 2);
  $.stroke();
  $.beginPath();
  $.arc(cx, cy, rad * 0.55, 0, Math.PI * 2);
  $.stroke();

  $.globalAlpha = 0.35;
  $.beginPath();
  $.moveTo(cx - rad, cy);
  $.lineTo(cx + rad, cy);
  $.moveTo(cx, cy - rad);
  $.lineTo(cx, cy + rad);
  $.stroke();

  for (var s = 0; s < 10; s++) {
    var trailAngle = studio.radarAngle - s * 0.055;
    $.globalAlpha = (10 - s) * 0.045;
    $.beginPath();
    $.moveTo(cx, cy);
    $.lineTo(cx + Math.cos(trailAngle) * rad, cy + Math.sin(trailAngle) * rad);
    $.stroke();
  }

  $.font = Math.max(8, Math.round(9 * sc)) + 'px monospace';
  for (var b = 0; b < studio.radarBlips.length; b++) {
    var blip = studio.radarBlips[b];
    var bx = cx + Math.cos(blip.a) * (rad * blip.r);
    var by = cy + Math.sin(blip.a) * (rad * blip.r);
    var diff = (studio.radarAngle - blip.a + Math.PI * 4) % (Math.PI * 2);
    var intensity = diff < 1.2 ? 1 - diff / 1.2 : 0.25;
    $.globalAlpha = 0.3 + intensity * 0.7;
    $.fillRect(bx - 2, by - 2, 4, 4);
    if (intensity > 0.55) {
      $.fillText(blip.label, bx + 5, by - 4);
    }
  }

  $.globalAlpha = 0.85;
  $.font = Math.max(8, Math.round(10 * sc)) + 'px monospace';
  $.fillText('AESA RADAR 360°', cx - 44 * sc, cy - rad - 14 * sc);
  $.restore();
}

function spawnSnakeFood() {
  var metrics = getLayoutMetrics();
  var gs = studio.snakeGridSize;
  var cols = Math.max(10, Math.floor((w - metrics.padLeft - metrics.padRight) / gs));
  var rows = Math.max(8, Math.floor((h - 70 - metrics.padBottom) / gs));
  studio.snakeFood = {
    x: 1 + Math.floor(Math.random() * Math.max(1, cols - 2)),
    y: 1 + Math.floor(Math.random() * Math.max(1, rows - 2))
  };
}

function renderSnakeGame(themeObj) {
  var metrics = getLayoutMetrics();
  var gs = studio.snakeGridSize;
  var cols = Math.max(10, Math.floor((w - metrics.padLeft - metrics.padRight) / gs));
  var rows = Math.max(8, Math.floor((h - 70 - metrics.padBottom) / gs));
  var offsetX = metrics.padLeft;
  var offsetY = 52;

  studio.snakeTickCounter++;
  if (studio.snakeTickCounter >= 5) {
    studio.snakeTickCounter = 0;
    studio.snakeDir = { x: studio.snakeNextDir.x, y: studio.snakeNextDir.y };
    var head = {
      x: studio.snake[0].x + studio.snakeDir.x,
      y: studio.snake[0].y + studio.snakeDir.y
    };

    if (head.x < 0) head.x = cols - 1;
    if (head.x >= cols) head.x = 0;
    if (head.y < 0) head.y = rows - 1;
    if (head.y >= rows) head.y = 0;

    for (var s = 0; s < studio.snake.length; s++) {
      if (studio.snake[s].x === head.x && studio.snake[s].y === head.y) {
        triggerGlitch();
        startSnakeGame();
        return;
      }
    }

    studio.snake.unshift(head);
    if (head.x === studio.snakeFood.x && head.y === studio.snakeFood.y) {
      studio.snakeScore += 10;
      if (studio.snakeScore > studio.snakeHighScore) {
        studio.snakeHighScore = studio.snakeScore;
        safeStorageSet('oldSkoolSnakeHigh', String(studio.snakeHighScore));
      }
      playKeySound(true);
      spawnSnakeFood();
    } else {
      studio.snake.pop();
    }
  }

  $.save();
  $.shadowColor = themeObj.glow;
  $.shadowBlur = studio.glowBlur;
  $.strokeStyle = themeObj.cursor;
  $.fillStyle = themeObj.cursor;
  $.font = '15px monospace';

  $.fillText(
    studio.lang === 'tr'
      ? '=== RETRO CRT SNAKE ===   SKOR: ' +
          studio.snakeScore +
          '   REKOR: ' +
          studio.snakeHighScore +
          '   [YÖN TUŞLARI / WASD] Oynat | [ESC] Çıkış'
      : '=== RETRO CRT SNAKE ===   SCORE: ' +
          studio.snakeScore +
          '   HIGH: ' +
          studio.snakeHighScore +
          '   [ARROWS / WASD] Move | [ESC] Exit',
    offsetX,
    offsetY - 28
  );

  $.strokeRect(offsetX, offsetY, cols * gs, rows * gs);

  $.fillStyle = themeObj.keyword;
  $.fillRect(offsetX + studio.snakeFood.x * gs + 2, offsetY + studio.snakeFood.y * gs + 2, gs - 4, gs - 4);

  for (var i = 0; i < studio.snake.length; i++) {
    $.fillStyle = i === 0 ? themeObj.cursor : themeObj.baseText;
    $.fillRect(offsetX + studio.snake[i].x * gs + 1, offsetY + studio.snake[i].y * gs + 1, gs - 2, gs - 2);
  }
  $.restore();
}

function drawRetroScrollbar(themeObj, maxScroll) {
  if (maxScroll <= 0) return;
  var trackX = w - 12;
  var trackY = 16;
  var trackH = h - 32;
  if (trackH < 40) return;

  $.save();
  $.setTransform(1, 0, 0, 1, 0, 0);
  $.shadowBlur = 0;
  $.fillStyle = 'rgba(255, 255, 255, 0.08)';
  $.fillRect(trackX, trackY, 6, trackH);

  var thumbH = Math.max(24, Math.min(trackH * 0.5, (h / (maxScroll + h)) * trackH));
  var ratio = Math.max(0, Math.min(1, studio.scrollY / maxScroll));
  var thumbY = trackY + ratio * (trackH - thumbH);

  $.shadowColor = themeObj.glow;
  $.shadowBlur = 6;
  $.fillStyle = themeObj.cursor;
  $.fillRect(trackX, thumbY, 6, thumbH);
  $.restore();
}

function updateTelemetryAndOscilloscope(themeObj) {
  var now = performance.now();
  studio.frameCount++;
  if (now - studio.lastSecTime >= 1000) {
    studio.fps = Math.round((studio.frameCount * 1000) / (now - studio.lastSecTime));
    studio.cps = studio.charsTypedThisSec;
    studio.frameCount = 0;
    studio.charsTypedThisSec = 0;
    studio.lastSecTime = now;

    var elFps = document.getElementById('telemetryFps');
    var elCps = document.getElementById('telemetryCps');
    if (elFps) elFps.textContent = studio.fps + ' FPS';
    if (elCps) {
      elCps.textContent =
        studio.lang === 'tr'
          ? 'HIZ: ' + studio.cps + ' KAR/SN'
          : 'RATE: ' + studio.cps + ' CHAR/S';
    }
  }

  var pct = _s.length > 0 ? Math.min(100, Math.round(((y + 1) / _s.length) * 100)) : 100;
  if (studio.finished) pct = 100;
  var elPct = document.getElementById('telemetryPct');
  var elFill = document.getElementById('telemetryBarFill');
  if (elPct) elPct.textContent = pct + '%';
  if (elFill) elFill.style.width = pct + '%';

  if (!studio.telemetryVisible) return;
  var osc = document.getElementById('oscCanvas');
  if (!osc) return;
  var octx = osc.getContext('2d');
  var ow = osc.width;
  var oh = osc.height;

  octx.fillStyle = 'rgba(0, 6, 2, 0.35)';
  octx.fillRect(0, 0, ow, oh);

  octx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  octx.beginPath();
  octx.moveTo(0, oh / 2);
  octx.lineTo(ow, oh / 2);
  octx.stroke();

  octx.strokeStyle = themeObj.hudColor;
  octx.lineWidth = 1.6;
  octx.beginPath();
  studio.oscPhase += 0.28;

  var hasAudioSignal = false;
  if (studio.audioAnalyser && studio.audioTimeData && (studio.musicPlaying || studio.oscEnergy > 0.05)) {
    studio.audioAnalyser.getByteTimeDomainData(studio.audioTimeData);
    for (var checkIdx = 0; checkIdx < studio.audioTimeData.length; checkIdx++) {
      if (Math.abs(studio.audioTimeData[checkIdx] - 128) > 2) {
        hasAudioSignal = true;
        break;
      }
    }
  }

  if (hasAudioSignal) {
    var sliceWidth = ow / studio.audioTimeData.length;
    var xPos = 0;
    for (var aIdx = 0; aIdx < studio.audioTimeData.length; aIdx++) {
      var v = (studio.audioTimeData[aIdx] - 128) / 128.0;
      var pyAudio = oh / 2 + v * (oh * 0.85);
      if (aIdx === 0) octx.moveTo(xPos, pyAudio);
      else octx.lineTo(xPos, pyAudio);
      xPos += sliceWidth;
    }
  } else {
    var amp = 3 + studio.oscEnergy * (oh * 0.42);
    for (var px = 0; px < ow; px += 2) {
      var wave =
        Math.sin(px * 0.12 + studio.oscPhase) *
        Math.cos(px * 0.04 - studio.oscPhase * 0.5) *
        amp;
      var py = oh / 2 + wave;
      if (px === 0) octx.moveTo(px, py);
      else octx.lineTo(px, py);
    }
  }
  octx.stroke();

  studio.oscEnergy *= 0.88;
}

// Background world map for the Global Cyber Map template (world-map.svg, 1256x972).
// The SVG has ~2200 paths with filters, so it is rasterized and phosphor-tinted once
// per size/theme into an offscreen canvas instead of being drawn every frame.
var WORLD_MAP_SRC = 'world-map.svg';
var worldMap = { img: null, ready: false, failed: false, cache: null, cacheKey: '' };

function loadWorldMap() {
  if (worldMap.img) return;
  worldMap.img = new Image();
  worldMap.img.onload = function () {
    worldMap.ready = true;
  };
  worldMap.img.onerror = function () {
    worldMap.failed = true;
  };
  worldMap.img.src = WORLD_MAP_SRC;
}

function getTintedWorldMap(mapW, mapH, color) {
  if (!worldMap.ready) return null;
  var cw = Math.max(1, Math.round(mapW));
  var ch = Math.max(1, Math.round(mapH));
  var key = cw + 'x' + ch + '|' + color;
  if (worldMap.cache && worldMap.cacheKey === key) return worldMap.cache;
  var off = document.createElement('canvas');
  off.width = cw;
  off.height = ch;
  var octx = off.getContext('2d');
  octx.drawImage(worldMap.img, 0, 0, cw, ch);
  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = color;
  octx.fillRect(0, 0, cw, ch);
  worldMap.cache = off;
  worldMap.cacheKey = key;
  return off;
}

function drawCyberMapArcs(themeObj) {
  if (studio.template !== 'cybermap') return;
  $.save();
  $.setTransform(1, 0, 0, 1, 0, 0);
  // Fit the map inside the screen in both directions so it is never cropped.
  var mapW = Math.min(w * 0.78, 920, Math.max(120, h - 40) * (1256 / 972));
  var mapH = mapW * (972 / 1256);
  var mapX = (w - mapW) * 0.5;
  var mapY = Math.max(20, (h - mapH) * 0.5);

  loadWorldMap();
  var mapLayer = getTintedWorldMap(mapW, mapH, themeObj.hudColor);
  if (mapLayer) {
    $.globalAlpha = 0.16;
    $.shadowBlur = 0;
    $.drawImage(mapLayer, mapX, mapY, mapW, mapH);
  }

  var nodes = [
    { name: 'NYC', x: mapX + mapW * 0.25, y: mapY + mapH * 0.34 },
    { name: 'LON', x: mapX + mapW * 0.46, y: mapY + mapH * 0.28 },
    { name: 'FRA', x: mapX + mapW * 0.50, y: mapY + mapH * 0.30 },
    { name: '★ANK-HQ', x: mapX + mapW * 0.56, y: mapY + mapH * 0.35 },
    { name: 'TYO', x: mapX + mapW * 0.85, y: mapY + mapH * 0.36 },
    { name: 'SYD', x: mapX + mapW * 0.86, y: mapY + mapH * 0.74 },
    { name: 'SAO', x: mapX + mapW * 0.33, y: mapY + mapH * 0.66 },
    { name: 'JNB', x: mapX + mapW * 0.54, y: mapY + mapH * 0.70 }
  ];

  var links = [
    [3, 2], [2, 1], [1, 0], [3, 4], [4, 5], [0, 6], [3, 7]
  ];

  $.globalAlpha = 0.32;
  $.strokeStyle = themeObj.cursor;
  $.shadowColor = themeObj.glow;
  $.shadowBlur = 10;
  $.lineWidth = 1.3;
  var pulseT = (Date.now() * 0.0012) % 1;

  for (var i = 0; i < links.length; i++) {
    var n1 = nodes[links[i][0]];
    var n2 = nodes[links[i][1]];
    var midX = (n1.x + n2.x) * 0.5;
    var midY = Math.min(n1.y, n2.y) - 34;

    $.beginPath();
    $.moveTo(n1.x, n1.y);
    $.quadraticCurveTo(midX, midY, n2.x, n2.y);
    $.stroke();

    var t = (pulseT + i * 0.17) % 1;
    var invT = 1 - t;
    var px = invT * invT * n1.x + 2 * invT * t * midX + t * t * n2.x;
    var py = invT * invT * n1.y + 2 * invT * t * midY + t * t * n2.y;
    $.fillStyle = '#ffffff';
    $.fillRect(px - 2, py - 2, 4, 4);
  }

  for (var n = 0; n < nodes.length; n++) {
    $.fillStyle = themeObj.cursor;
    $.beginPath();
    $.arc(nodes[n].x, nodes[n].y, 3.5, 0, Math.PI * 2);
    $.fill();
  }

  $.restore();
}

function renderStudioFrame() {
  var themeObj = THEMES[studio.theme] || THEMES.green;
  var effFont = getEffectiveFontSize();
  var lh = getEffectiveLineHeight();
  studio.lineHeight = lh;

  $.save();
  $.setTransform(1, 0, 0, 1, 0, 0);
  $.globalCompositeOperation = 'source-over';
  $.shadowBlur = 0;
  $.fillStyle = 'hsla(0, 0%, 0%, ' + (1 - studio.trailAlpha * 0.7) + ')';
  $.fillRect(0, 0, w, h);
  $.restore();

  if (!studio.poweredOn) {
    updateTelemetryAndOscilloscope(themeObj);
    return;
  }

  if (studio.theme === 'matrix' || studio.matrixOverlay) {
    drawMatrixRain();
  }
  // The world map is the cyber map template's backdrop; keep it off the Snake/Jet game screens.
  if (studio.template === 'cybermap' && !studio.snakeActive && !studio.jetActive) {
    drawCyberMapArcs(themeObj);
  }

  if (studio.snakeActive) {
    renderSnakeGame(themeObj);
    updateTelemetryAndOscilloscope(themeObj);
    updateStatusBar();
    return;
  }
  if (studio.jetActive) {
    renderJetGame(themeObj);
    updateTelemetryAndOscilloscope(themeObj);
    updateStatusBar();
    return;
  }

  if (!studio.paused && !studio.finished) {
    studio.speedAccumulator += studio.speed;
    while (studio.speedAccumulator >= 1 && !studio.finished) {
      stepRelayCharacter();
      studio.speedAccumulator -= 1;
    }
  }

  var maxScroll = getMaxScrollY();
  studio.targetScrollY = Math.max(0, Math.min(maxScroll, studio.targetScrollY));
  studio.scrollY += (studio.targetScrollY - studio.scrollY) * 0.15;

  $.save();
  var glitchOffsetX = 0;
  var glitchOffsetY = 0;
  if (studio.glitchFrames > 0) {
    glitchOffsetX = (Math.random() - 0.5) * 14;
    glitchOffsetY = (Math.random() - 0.5) * 6;
    studio.glitchFrames--;
  }

  $.translate(glitchOffsetX, -studio.scrollY + glitchOffsetY);
  $.textBaseline = 'top';
  $.font = effFont + 'px monospace';
  $.shadowColor = themeObj.glow;
  $.shadowBlur = studio.glowBlur;
  $.globalCompositeOperation = 'lighter';

  var metrics = getLayoutMetrics();
  var textStartX = metrics.textStartX;
  var padTop = metrics.padTop;

  var inBlockComment = false;
  var maxLine = Math.min(y, _s.length - 1);

  for (var i = 0; i <= maxLine; i++) {
    var rawLine = _s[i] || '';
    if (rawLine.indexOf('/*') !== -1) inBlockComment = true;

    var drawLine =
      i === y && !studio.finished
        ? rawLine.substr(0, x) + (studio.typoChar || '')
        : rawLine;
    if (studio.glitchFrames > 0 && Math.random() < 0.35) {
      drawLine = scrambleText(drawLine);
    }

    var lineY = padTop + i * lh;
    if (lineY - studio.scrollY > -30 && lineY - studio.scrollY < h + 30) {
      if (studio.showLineNumbers) {
        var numStr = String(i + 1).padStart(3, '0') + ' │';
        $.fillStyle = themeObj.comment;
        $.fillText(numStr, metrics.padLeft, lineY);
      }

      $.fillStyle = getLineColor(rawLine, inBlockComment, themeObj);
      $.fillText(drawLine, textStartX, lineY);

      if (i === y && !studio.finished && drawLine.length > 0) {
        var glowCount = Math.min(4, drawLine.length);
        var prefixPart = drawLine.slice(0, drawLine.length - glowCount);
        var hotPart = drawLine.slice(drawLine.length - glowCount);
        var hotX = textStartX + $.measureText(prefixPart).width;
        $.save();
        $.fillStyle = '#ffffff';
        $.globalAlpha = 0.72;
        $.shadowColor = themeObj.cursor;
        $.shadowBlur = studio.glowBlur * 1.8;
        $.fillText(hotPart, hotX, lineY);
        $.restore();
      }

      if (studio.glitchFrames > 0) {
        $.fillStyle = 'hsla(0, 100%, 50%, 0.6)';
        $.fillText(drawLine, textStartX - 4, lineY);
        $.fillStyle = 'hsla(200, 100%, 50%, 0.6)';
        $.fillText(drawLine, textStartX + 4, lineY);
      }
    }

    if (rawLine.indexOf('*/') !== -1) inBlockComment = false;
  }

  var blinkVisible = Math.floor(Date.now() / 380) % 2 === 0 || (!studio.paused && !studio.finished);
  var cursorSymbol = studio.cursors[studio.cursorIndex];

  if (!studio.finished && y < _s.length) {
    var activeSub = (_s[y] || '').substr(0, x) + (studio.typoChar || '');
    var cursorX = textStartX + $.measureText(activeSub).width;
    var cursorY = padTop + y * lh;
    if (blinkVisible) {
      $.fillStyle = themeObj.cursor;
      if (studio.cursorIndex === 0) {
        $.fillRect(cursorX + 1, cursorY + 1, Math.max(6, Math.round(effFont * 0.58)), effFont - 2);
      } else {
        $.fillText(cursorSymbol, cursorX, cursorY);
      }
    }
  } else if (studio.cliActive) {
    var cliLineCursor = _s.length + 1;
    for (var hIdx = 0; hIdx < studio.cliHistory.length; hIdx++) {
      var wrappedHist = wrapSingleLine(studio.cliHistory[hIdx].text, metrics.maxTextWidth);
      $.fillStyle = studio.cliHistory[hIdx].isCmd ? themeObj.cursor : themeObj.baseText;
      for (var wIdx = 0; wIdx < wrappedHist.length; wIdx++) {
        var histY = padTop + cliLineCursor * lh;
        $.fillText(wrappedHist[wIdx], textStartX, histY);
        cliLineCursor++;
      }
    }

    var promptFullText = 'guest@oldskool:~$ ' + studio.cliInput;
    var wrappedPrompt = wrapSingleLine(promptFullText, metrics.maxTextWidth);
    $.fillStyle = themeObj.cursor;
    for (var pIdx = 0; pIdx < wrappedPrompt.length; pIdx++) {
      var promptLineY = padTop + (cliLineCursor + pIdx) * lh;
      $.fillText(wrappedPrompt[pIdx], textStartX, promptLineY);
    }

    if (blinkVisible) {
      var lastPromptLine = wrappedPrompt[wrappedPrompt.length - 1] || '';
      var lastPromptY = padTop + (cliLineCursor + wrappedPrompt.length - 1) * lh;
      var cliCursorX = textStartX + $.measureText(lastPromptLine).width;
      if (studio.cursorIndex === 0) {
        $.fillRect(cliCursorX + 2, lastPromptY + 1, Math.max(6, Math.round(effFont * 0.58)), effFont - 2);
      } else {
        $.fillText(cursorSymbol, cliCursorX + 2, lastPromptY);
      }
    }
  }

  $.restore();

  $.save();
  $.setTransform(1, 0, 0, 1, 0, 0);
  $.strokeStyle = themeObj.comment;
  $.lineWidth = 1;
  $.globalAlpha = 0.25;
  $.strokeRect(
    Math.max(6, metrics.padLeft - 10),
    Math.max(6, metrics.padTop - 10),
    w - Math.max(6, metrics.padLeft - 10) - Math.max(18, metrics.padRight - 6),
    h - Math.max(6, metrics.padTop - 10) - Math.max(6, metrics.padBottom - 12)
  );
  $.restore();

  draw3DHologram(themeObj);
  drawTacticalRadar(themeObj);
  drawRetroScrollbar(themeObj, maxScroll);
  updateTelemetryAndOscilloscope(themeObj);
  updateStatusBar();
}

function relay() {
  if (!studio.initialized) {
    studio.initialized = true;
    syncCanvasSize();
    TEMPLATES.quine = _s.slice();
    studio.rawLines = _s.slice();
    _s = wrapLinesToCanvas(studio.rawLines);
    initMatrixRain();
    bindStudioUI();
    applyTheme('green');
    applyLanguage('en');
    loadStateFromUrlHash();
  }
  animId = window.requestAnimationFrame(relay);
  renderStudioFrame();
}

function runJavaScriptSandbox(codeStr) {
  var logs = [];
  var customConsole = {
    log: function () {
      logs.push(Array.prototype.slice.call(arguments).map(String).join(' '));
    },
    info: function () {
      logs.push('[INFO] ' + Array.prototype.slice.call(arguments).map(String).join(' '));
    },
    warn: function () {
      logs.push('[WARN] ' + Array.prototype.slice.call(arguments).map(String).join(' '));
    },
    error: function () {
      logs.push('[ERR] ' + Array.prototype.slice.call(arguments).map(String).join(' '));
    }
  };

  try {
    var fn = new Function('console', codeStr);
    var retVal = fn(customConsole);
    if (retVal !== undefined) {
      logs.push('=> ' + String(retVal));
    }
    if (logs.length === 0) {
      logs.push(studio.lang === 'tr' ? '[✓ Kod çalıştırıldı — çıktı yok]' : '[✓ Code executed — no console output]');
    }
  } catch (err) {
    logs.push('[JS EXCEPTION] ' + err.message);
  }
  return logs;
}

function sharePermalink() {
  try {
    var statePayload = {
      t: studio.theme,
      tpl: studio.template,
      s: studio.speed,
      l: studio.lang,
      h: studio.hologramMode
    };
    if (studio.template === 'custom' && studio.customCode) {
      statePayload.c = studio.customCode.slice(0, 1800);
    }
    var jsonStr = JSON.stringify(statePayload);
    var encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    window.location.hash = 'crt=' + encoded;
    var fullUrl = window.location.href;
    var btnShare = document.getElementById('btnShare');
    var dict = I18N[studio.lang];
    var showShareResult = function (ok) {
      if (!btnShare) return;
      btnShare.textContent = ok ? dict.copied : dict.copyFailed;
      btnShare.classList.add('active');
      setTimeout(function () {
        btnShare.textContent = dict.share;
        btnShare.classList.remove('active');
      }, 1800);
    };
    var legacyCopy = function () {
      try {
        var ta = document.createElement('textarea');
        ta.value = fullUrl;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (err) {
        return false;
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // writeText rejects on insecure origins / unfocused documents; fall back instead of throwing.
      navigator.clipboard.writeText(fullUrl).then(
        function () {
          showShareResult(true);
        },
        function () {
          showShareResult(legacyCopy());
        }
      );
    } else {
      showShareResult(legacyCopy());
    }
    return fullUrl;
  } catch (e) {
    return window.location.href;
  }
}

function loadStateFromUrlHash() {
  var hash = window.location.hash || '';
  if (hash.indexOf('#crt=') !== 0) return;
  try {
    var encoded = hash.slice(5);
    var jsonStr = decodeURIComponent(escape(atob(encoded)));
    var data = JSON.parse(jsonStr);
    if (data.t && THEMES[data.t]) applyTheme(data.t);
    if (data.l) applyLanguage(data.l);
    if (data.s && !isNaN(parseFloat(data.s))) {
      studio.speed = parseFloat(data.s);
      var selSpd = document.getElementById('selectSpeed');
      if (selSpd) selSpd.value = String(studio.speed);
    }
    if (data.h && studio.hologramModes.indexOf(data.h) !== -1) {
      studio.hologramMode = data.h;
      var btnHoloHash = document.getElementById('btnHologram');
      if (btnHoloHash) btnHoloHash.classList.toggle('active', data.h !== 'off');
    }
    if (data.tpl === 'custom' && data.c) {
      studio.customCode = data.c;
      studio.template = 'custom';
      var selTpl = document.getElementById('selectTemplate');
      if (selTpl) selTpl.value = 'custom';
      loadRelayScript(studio.customCode.split('\n'));
    } else if (data.tpl && TEMPLATES[data.tpl]) {
      studio.template = data.tpl;
      var selTpl2 = document.getElementById('selectTemplate');
      if (selTpl2) selTpl2.value = data.tpl;
      loadRelayScript(TEMPLATES[data.tpl]);
    }
  } catch (e) {
  }
}

function executeCliCommand(rawCmd) {
  var cmdLine = rawCmd.trim();
  studio.cliHistory.push({ text: 'guest@oldskool:~$ ' + cmdLine, isCmd: true });

  if (!cmdLine) return;

  var parts = cmdLine.split(/\s+/);
  var cmd = parts[0].toLowerCase();
  var arg = parts[1] ? parts[1].toLowerCase() : '';
  var restText = parts.slice(1).join(' ');

  var isTr = studio.lang === 'tr';

  switch (cmd) {
    case 'help':
      if (isTr) {
        studio.cliHistory.push({ text: 'Kullanılabilir Terminal Komutları:', isCmd: false });
        studio.cliHistory.push({ text: '  ls | cat <dosya>                          - Sanal dosya sistemini görüntüler', isCmd: false });
        studio.cliHistory.push({ text: '  run [js_kodu] | calc <işlem>              - Canlı JS kodu / Matematik çalıştırır', isCmd: false });
        studio.cliHistory.push({ text: '  3d <f35|globe|cube|off>                   - 3B Tel-Kafes hologram modelini seçer', isCmd: false });
        studio.cliHistory.push({ text: '  jet | snake                               - F-35 Hava Savunma / Yılan oyunu', isCmd: false });
        studio.cliHistory.push({ text: '  music | sound | matrix                    - Synthwave müzik / Ses / Matrix yağmuru', isCmd: false });
        studio.cliHistory.push({ text: '  theme <green|amber|cyan|synthwave|matrix> - Renk temasını değiştirir', isCmd: false });
        studio.cliHistory.push({ text: '  template <quine|bios|hack|starship|cybermap> - Senaryo şablonunu yükler', isCmd: false });
        studio.cliHistory.push({ text: '  banner <metin> | hack <hedef> | export | rec | share | clear', isCmd: false });
        studio.cliHistory.push({ text: '  speed <n> | glitch | degauss | replay | whoami | date', isCmd: false });
      } else {
        studio.cliHistory.push({ text: 'Available Terminal Commands:', isCmd: false });
        studio.cliHistory.push({ text: '  ls | cat <file>                           - Browse virtual filesystem', isCmd: false });
        studio.cliHistory.push({ text: '  run [js_code] | calc <expr>               - Execute live JS / Math expression', isCmd: false });
        studio.cliHistory.push({ text: '  3d <f35|globe|cube|off>                   - Switch 3D wireframe hologram model', isCmd: false });
        studio.cliHistory.push({ text: '  jet | snake                               - Launch F-35 Interceptor / Snake game', isCmd: false });
        studio.cliHistory.push({ text: '  music | sound | matrix                    - Toggle Synthwave music / Audio / Matrix', isCmd: false });
        studio.cliHistory.push({ text: '  theme <green|amber|cyan|synthwave|matrix> - Switch CRT color palette', isCmd: false });
        studio.cliHistory.push({ text: '  template <quine|bios|hack|starship|cybermap> - Load script template', isCmd: false });
        studio.cliHistory.push({ text: '  banner <text> | hack <target> | export | rec | share | clear', isCmd: false });
        studio.cliHistory.push({ text: '  speed <n> | glitch | degauss | replay | whoami | date', isCmd: false });
      }
      break;
    case 'ls':
    case 'dir':
      studio.cliHistory.push({
        text: isTr ? 'Sanal Dizin (/home/guest):' : 'Virtual Directory (/home/guest):',
        isCmd: false
      });
      var fileNames = Object.keys(VIRTUAL_FS);
      for (var fIdx = 0; fIdx < fileNames.length; fIdx++) {
        var fn = fileNames[fIdx];
        var byteLen = VIRTUAL_FS[fn].join('\n').length;
        studio.cliHistory.push({
          text: '  -rw-r--r--  1 root  operator   ' + String(byteLen).padStart(4, ' ') + 'B   ' + fn,
          isCmd: false
        });
      }
      break;
    case 'cat':
      if (arg && VIRTUAL_FS[arg]) {
        var fileLines = VIRTUAL_FS[arg];
        for (var fl = 0; fl < fileLines.length; fl++) {
          studio.cliHistory.push({ text: fileLines[fl], isCmd: false });
        }
      } else {
        studio.cliHistory.push({
          text:
            (isTr ? 'Dosya bulunamadı. Mevcut dosyalar: ' : 'File not found. Available files: ') +
            Object.keys(VIRTUAL_FS).join(', '),
          isCmd: false
        });
      }
      break;
    case 'run':
    case 'eval':
      var codeToRun = restText || studio.customCode;
      var outLines = runJavaScriptSandbox(codeToRun);
      for (var o = 0; o < outLines.length; o++) {
        studio.cliHistory.push({ text: '  ' + outLines[o], isCmd: false });
      }
      break;
    case 'calc':
      if (!restText) {
        studio.cliHistory.push({ text: isTr ? 'Kullanım: calc 256 * 16' : 'Usage: calc 256 * 16', isCmd: false });
      } else {
        var calcOut = runJavaScriptSandbox('return (' + restText + ');');
        for (var co = 0; co < calcOut.length; co++) {
          studio.cliHistory.push({ text: '  ' + calcOut[co], isCmd: false });
        }
      }
      break;
    case '3d':
    case 'holo':
      if (studio.hologramModes.indexOf(arg) !== -1) {
        studio.hologramMode = arg;
      } else {
        var nextIdx = (studio.hologramModes.indexOf(studio.hologramMode) + 1) % studio.hologramModes.length;
        studio.hologramMode = studio.hologramModes[nextIdx];
      }
      var btnHolo = document.getElementById('btnHologram');
      if (btnHolo) btnHolo.classList.toggle('active', studio.hologramMode !== 'off');
      studio.cliHistory.push({
        text: (isTr ? '3B Hologram modu: ' : '3D Hologram mode: ') + studio.hologramMode.toUpperCase(),
        isCmd: false
      });
      break;
    case 'jet':
    case 'invaders':
      startJetGame();
      var btnJetEl = document.getElementById('btnJet');
      if (btnJetEl) btnJetEl.classList.add('active');
      return;
    case 'music':
      toggleSynthMusic();
      studio.cliHistory.push({
        text: isTr
          ? 'Synthwave Müzik: ' + (studio.musicPlaying ? 'AÇIK (125 BPM)' : 'KAPALI')
          : 'Synthwave Music: ' + (studio.musicPlaying ? 'ON (125 BPM)' : 'OFF'),
        isCmd: false
      });
      break;
    case 'matrix':
      studio.matrixOverlay = !studio.matrixOverlay;
      studio.cliHistory.push({
        text: isTr
          ? 'Matrix Dijital Yağmur: ' + (studio.matrixOverlay ? 'AKTİF' : 'KAPALI')
          : 'Matrix Digital Rain: ' + (studio.matrixOverlay ? 'ENABLED' : 'DISABLED'),
        isCmd: false
      });
      break;
    case 'rec':
    case 'record':
      toggleVideoRecording();
      studio.cliHistory.push({
        text: studio.isRecording
          ? isTr
            ? '[🎥 WEBM VİDEO KAYDI BAŞLATILDI]'
            : '[🎥 WEBM VIDEO RECORDING STARTED]'
          : isTr
          ? '[⏹ VİDEO KAYDI TAMAMLANDI VE İNDİRİLDİ]'
          : '[⏹ VIDEO RECORDING SAVED & DOWNLOADED]',
        isCmd: false
      });
      break;
    case 'share':
      var sharedUrl = sharePermalink();
      studio.cliHistory.push({
        text: (isTr ? '[🔗 Paylaşım linki panoya kopyalandı]: ' : '[🔗 Shareable URL copied to clipboard]: ') + sharedUrl,
        isCmd: false
      });
      break;
    case 'banner':
      var bannerRows = generateAsciiBannerLines(restText || 'RETRO');
      for (var b = 0; b < bannerRows.length; b++) {
        studio.cliHistory.push({ text: bannerRows[b], isCmd: false });
      }
      break;
    case 'hack':
      var targetHost = restText || '192.0.2.99';
      studio.cliHistory.push({
        text: isTr ? '[*] Hedef taranıyor: ' + targetHost + ' ...' : '[*] Scanning target: ' + targetHost + ' ...',
        isCmd: false
      });
      var step = 0;
      if (studio.hackInterval) clearInterval(studio.hackInterval);
      studio.hackInterval = setInterval(function () {
        step += 25;
        playKeySound(false);
        if (step <= 100) {
          var bars = '████████'.slice(0, (step / 25) * 2) + '░░░░░░░░'.slice(0, 8 - (step / 25) * 2);
          studio.cliHistory.push({
            text: isTr
              ? '  [' + bars + '] ' + step + '% — Paket şifresi çözülüyor (SSH-2048)...'
              : '  [' + bars + '] ' + step + '% — Decrypting packet stream (SSH-2048)...',
            isCmd: false
          });
        } else {
          clearInterval(studio.hackInterval);
          studio.hackInterval = null;
          triggerGlitch();
          studio.cliHistory.push({
            text: isTr ? '[✓] ERİŞİM ONAYLANDI: root@' + targetHost : '[✓] ACCESS GRANTED: root@' + targetHost,
            isCmd: true
          });
        }
        studio.manualScroll = false;
        studio.targetScrollY = getMaxScrollY();
      }, 320);
      break;
    case 'snake':
      startSnakeGame();
      return;
    case 'degauss':
      triggerDegauss();
      studio.cliHistory.push({
        text: isTr ? '[MANYETİK DEGAUSS BOBİNİ TETİKLENDİ]' : '[MAGNETIC DEGAUSS COIL TRIGGERED]',
        isCmd: false
      });
      break;
    case 'export':
      takeCanvasScreenshot();
      studio.cliHistory.push({
        text: isTr ? '[PNG EKRAN GÖRÜNTÜSÜ İNDİRİLDİ]' : '[PNG SCREENSHOT DOWNLOADED]',
        isCmd: false
      });
      break;
    case 'theme':
      if (THEMES[arg]) {
        applyTheme(arg);
        studio.cliHistory.push({
          text: (isTr ? 'Tema değiştirildi: ' : 'Theme switched to: ') + THEMES[arg].name,
          isCmd: false
        });
      } else {
        studio.cliHistory.push({
          text: isTr ? 'Seçenekler: green, amber, cyan, synthwave, matrix' : 'Options: green, amber, cyan, synthwave, matrix',
          isCmd: false
        });
      }
      break;
    case 'template':
      if (TEMPLATES[arg]) {
        studio.template = arg;
        if (studio.hologramMode !== 'off') {
          if (arg === 'cybermap') studio.hologramMode = 'globe';
          else if (arg === 'starship') studio.hologramMode = 'f35';
          else if (arg === 'hack') studio.hologramMode = 'cube';
        }
        var selTpl = document.getElementById('selectTemplate');
        if (selTpl) selTpl.value = arg;
        loadRelayScript(TEMPLATES[arg]);
        return;
      } else {
        studio.cliHistory.push({
          text: isTr
            ? 'Seçenekler: quine, bios, hack, starship, cybermap'
            : 'Options: quine, bios, hack, starship, cybermap',
          isCmd: false
        });
      }
      break;
    case 'speed':
      var spd = parseFloat(arg);
      if (!isNaN(spd) && spd > 0) {
        studio.speed = spd;
        studio.cliHistory.push({
          text: (isTr ? 'Hız ayarlandı: ' : 'Speed set to: ') + spd + 'x',
          isCmd: false
        });
      } else {
        studio.cliHistory.push({
          text: isTr ? 'Kullanım: speed <0.5 | 1 | 2 | 5 | 50>' : 'Usage: speed <0.5 | 1 | 2 | 5 | 50>',
          isCmd: false
        });
      }
      break;
    case 'glitch':
      triggerGlitch();
      studio.cliHistory.push({
        text: isTr ? '[SİNYAL BOZULMASI TETİKLENDİ]' : '[SIGNAL GLITCH TRIGGERED]',
        isCmd: false
      });
      break;
    case 'sound':
      toggleSound();
      studio.cliHistory.push({
        text: isTr
          ? 'Ses durumu: ' + (studio.soundEnabled ? 'AÇIK' : 'KAPALI')
          : 'Audio status: ' + (studio.soundEnabled ? 'ON' : 'OFF'),
        isCmd: false
      });
      break;
    case 'replay':
      loadRelayScript(studio.rawLines.length ? studio.rawLines : _s);
      return;
    case 'clear':
      studio.rawLines = [
        isTr
          ? '// INTERACTIVE CRT TERMINAL READY — Komutlar için "help" yazın.'
          : '// INTERACTIVE CRT TERMINAL READY — Type "help" for commands.'
      ];
      _s = wrapLinesToCanvas(studio.rawLines);
      y = 1;
      x = 0;
      studio.finished = true;
      studio.cliHistory = [];
      studio.scrollY = 0;
      studio.targetScrollY = 0;
      break;
    case 'whoami':
      studio.cliHistory.push({ text: 'guest@oldskool — Retro CRT Script Relay Operator', isCmd: false });
      break;
    case 'date':
      studio.cliHistory.push({ text: new Date().toString(), isCmd: false });
      break;
    default:
      studio.cliHistory.push({
        text: isTr
          ? 'Komut bulunamadı: "' + cmd + '". Yardım için "help" yazın.'
          : 'Command not found: "' + cmd + '". Type "help" for available commands.',
        isCmd: false
      });
  }

  studio.manualScroll = false;
  studio.targetScrollY = getMaxScrollY();
}

function triggerGlitch() {
  studio.glitchFrames = 18;
  playGlitchSound();
}

function triggerDegauss() {
  playDegaussSound();
  document.body.classList.remove('crt-degauss');
  void document.body.offsetWidth;
  document.body.classList.add('crt-degauss');
  setTimeout(function () {
    document.body.classList.remove('crt-degauss');
  }, 700);
}

function togglePower() {
  studio.poweredOn = !studio.poweredOn;
  var btn = document.getElementById('btnPower');
  document.body.classList.remove('crt-power-on', 'crt-power-off');
  void document.body.offsetWidth;
  if (studio.poweredOn) {
    document.body.classList.add('crt-power-on');
    if (btn) btn.classList.remove('active');
    playKeySound(true);
  } else {
    document.body.classList.add('crt-power-off');
    if (btn) btn.classList.add('active');
    playGlitchSound();
  }
}

function takeCanvasScreenshot() {
  var dataUrl = c.toDataURL('image/png');
  var a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'old-school-crt-' + Date.now() + '.png';
  a.click();
}

function convertImageFileToAscii(file, callback) {
  var reader = new FileReader();
  reader.onload = function (evt) {
    var img = new Image();
    img.onload = function () {
      var targetWidth = 68;
      var aspect = img.height / img.width;
      var targetHeight = Math.max(12, Math.min(60, Math.round(targetWidth * aspect * 0.5)));
      var offCanvas = document.createElement('canvas');
      offCanvas.width = targetWidth;
      offCanvas.height = targetHeight;
      var octx = offCanvas.getContext('2d');
      octx.drawImage(img, 0, 0, targetWidth, targetHeight);
      var imgData = octx.getImageData(0, 0, targetWidth, targetHeight).data;
      var ramp = '@%#*+=-:. ';
      var headerComment =
        studio.lang === 'tr'
          ? '// GÖRSELDEN ASCII SANATINA DÖNÜŞTÜRÜLDÜ (' + file.name + ')'
          : '// CONVERTED FROM IMAGE TO ASCII ART (' + file.name + ')';
      var footerComment = studio.lang === 'tr' ? '// SON _' : '// END _';
      var lines = [headerComment, '/*'];

      for (var row = 0; row < targetHeight; row++) {
        var line = '  ';
        for (var col = 0; col < targetWidth; col++) {
          var idx = (row * targetWidth + col) * 4;
          var r = imgData[idx];
          var g = imgData[idx + 1];
          var b = imgData[idx + 2];
          var a = imgData[idx + 3];
          if (a < 40) {
            line += ' ';
          } else {
            var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            var charIdx = Math.floor((1 - lum) * (ramp.length - 1));
            line += ramp.charAt(charIdx);
          }
        }
        lines.push(line);
      }
      lines.push('*/', footerComment);
      callback(lines.join('\n'));
    };
    img.onerror = function () {
      callback(null);
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

var I18N = {
  en: {
    step: '⏭ Step',
    restart: '↺ Restart',
    speed: 'Speed',
    instant: 'Instant',
    theme: 'Theme',
    template: 'Template',
    tplQuine: 'Self-Relay (Turkish Flag)',
    tplBios: '1989 BIOS Boot',
    tplHack: 'Cyberpunk Mainframe',
    tplStarship: 'F-35 Fighter Telemetry',
    tplCybermap: 'Global Cyber Map',
    tplCustom: 'Custom Code / Text...',
    studioBtn: '✎ Studio',
    human: '🤖 Human',
    cursorPrefix: 'Cursor: ',
    syntax: 'Syntax',
    degauss: '🧲 Degauss',
    glitch: '⚡ Glitch',
    soundOn: '🔊 Sound',
    soundOff: '🔇 Mute',
    music: '🎵 Music',
    osd: '⚙ OSD',
    holo: '🌐 3D',
    radar: '📡 Radar',
    jet: '✈️ Jet',
    recStart: '⏺ Rec',
    recStop: '⏹ Stop',
    share: '🔗 Share',
    copied: '✓ Copied!',
    copyFailed: '⚠ Copy URL from address bar',
    runJs: '⚡ Run JS',
    pause: '⏸ Pause',
    resume: '▶ Resume',
    done: '✓ Done',
    oscTitle: 'OSCILLOSCOPE',
    osdTitle: '[CRT MONITOR OSD SETUP v2.4]',
    osdGlow: 'PHOSPHOR GLOW',
    osdTrail: 'TRAIL PERSISTENCE',
    osdFont: 'FONT SIZE',
    osdMargin: 'SCREEN MARGIN',
    osdVolume: 'AUDIO VOLUME',
    osdSoundType: 'SOUND PROFILE',
    sndMech: 'Mechanical Key',
    sndBeep: '8-Bit Terminal Beep',
    sndType: 'Classic Typewriter',
    osdLineNums: 'LINE NUMBERS (001 |)',
    on: 'ON',
    off: 'OFF',
    shortcuts: 'SHORTCUTS: [SPACE] Pause | [N] Step | [R] Restart | [G] Glitch | [M] Sound | [CLI: help, ls, cat, jet, 3d, run]',
    modalTitle: 'CUSTOM CODE & ASCII ART STUDIO',
    bannerPlaceholder: 'Banner text (e.g. HELLO)',
    insertBanner: '🔤 Add ASCII Banner',
    imgAscii: '🖼️ Image to ASCII',
    saveLocal: '💾 Save',
    resetCustom: '↺ Reset',
    textareaPlaceholder: 'Paste or type custom code or ASCII art to relay onto the CRT screen...',
    cancel: 'Cancel',
    apply: '▶ Relay to Screen',
    bannerAdded: '✓ ASCII Banner inserted',
    convertingImg: 'Converting image...',
    imgConverted: '✓ Image converted to ASCII art!',
    imgFailed: '⚠ Could not read this file as an image.',
    savedLocal: '💾 Saved to browser storage!',
    resetDone: '↺ Default code restored!'
  },
  tr: {
    step: '⏭ Adım',
    restart: '↺ Başa Sar',
    speed: 'Hız',
    instant: 'Anında',
    theme: 'Tema',
    template: 'Şablon',
    tplQuine: 'Self-Relay (Türk Bayrağı)',
    tplBios: '1989 BIOS Boot',
    tplHack: 'Cyberpunk Mainframe',
    tplStarship: 'F-35 Savaş Uçağı',
    tplCybermap: 'Küresel Siber Harita',
    tplCustom: 'Özel Kod / Metin...',
    studioBtn: '✎ Stüdyo',
    human: '🤖 İnsansı',
    cursorPrefix: 'İmleç: ',
    syntax: 'Renkli Kod',
    degauss: '🧲 Degauss',
    glitch: '⚡ Glitch',
    soundOn: '🔊 Ses',
    soundOff: '🔇 Ses',
    music: '🎵 Müzik',
    osd: '⚙ OSD',
    holo: '🌐 3B',
    radar: '📡 Radar',
    jet: '✈️ F-35',
    recStart: '⏺ Kayıt',
    recStop: '⏹ Bitir',
    share: '🔗 Paylaş',
    copied: '✓ Kopyalandı!',
    copyFailed: '⚠ Adres çubuğundan kopyalayın',
    runJs: '⚡ JS Çalıştır',
    pause: '⏸ Duraklat',
    resume: '▶ Devam Et',
    done: '✓ Tamamlandı',
    oscTitle: 'OSİLOSKOP',
    osdTitle: '[CRT MONİTÖR OSD AYARLARI v2.4]',
    osdGlow: 'FOSFOR PARLAKLIĞI',
    osdTrail: 'İZ SÜRESİ (PERSISTENCE)',
    osdFont: 'YAZI BOYUTU',
    osdMargin: 'KENAR BOŞLUĞU',
    osdVolume: 'SES SEVİYESİ',
    osdSoundType: 'SES PROFİLİ',
    sndMech: 'Mekanik Klavye',
    sndBeep: '8-Bit Terminal Bip',
    sndType: 'Klasik Daktilo',
    osdLineNums: 'SATIR NUMARALARI (001 |)',
    on: 'AÇIK',
    off: 'KAPALI',
    shortcuts: 'KISAYOLLAR: [SPACE] Duraklat | [N] Adım | [R] Başa Sar | [G] Glitch | [M] Ses | [CLI: help, ls, cat, jet, 3d, run]',
    modalTitle: 'ÖZEL KOD & ASCII SANAT STÜDYOSU',
    bannerPlaceholder: 'Banner metni (ör: MERHABA)',
    insertBanner: '🔤 ASCII Banner Ekle',
    imgAscii: '🖼️ Resimden ASCII',
    saveLocal: '💾 Kaydet',
    resetCustom: '↺ Sıfırla',
    textareaPlaceholder: 'Ekranda daktilo edilmesini istediğiniz kodu veya ASCII sanatını buraya yapıştırın...',
    cancel: 'İptal',
    apply: '▶ Ekrana Yazdır',
    bannerAdded: '✓ ASCII Banner eklendi',
    convertingImg: 'Resim dönüştürülüyor...',
    imgConverted: '✓ Resim ASCII sanatına dönüştürüldü!',
    imgFailed: '⚠ Bu dosya resim olarak okunamadı.',
    savedLocal: '💾 Tarayıcı hafızasına kaydedildi!',
    resetDone: '↺ Varsayılan kod geri yüklendi!'
  }
};

function applyLanguage(lang) {
  studio.lang = lang === 'tr' ? 'tr' : 'en';
  document.documentElement.lang = studio.lang;
  var dict = I18N[studio.lang];

  function setTxt(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  setTxt('btnStep', dict.step);
  setTxt('btnRestart', dict.restart);
  setTxt('lblSpeed', dict.speed);
  setTxt('optInstant', dict.instant);
  setTxt('lblTheme', dict.theme);
  setTxt('lblTemplate', dict.template);
  setTxt('optTplQuine', dict.tplQuine);
  setTxt('optTplBios', dict.tplBios);
  setTxt('optTplHack', dict.tplHack);
  setTxt('optTplStarship', dict.tplStarship);
  setTxt('optTplCybermap', dict.tplCybermap);
  setTxt('optTplCustom', dict.tplCustom);
  setTxt('btnCustomCode', dict.studioBtn);
  setTxt('btnHuman', dict.human);
  setTxt('btnCursor', dict.cursorPrefix + studio.cursors[studio.cursorIndex]);
  setTxt('btnSyntax', dict.syntax);
  setTxt('btnDegauss', dict.degauss);
  setTxt('btnGlitch', dict.glitch);
  setTxt('btnSound', studio.soundEnabled ? dict.soundOn : dict.soundOff);
  setTxt('btnMusic', dict.music);
  setTxt('btnOsd', dict.osd);
  setTxt('btnHologram', dict.holo);
  setTxt('btnTelemetry', dict.radar);
  setTxt('btnJet', dict.jet);
  setTxt('btnRecord', studio.isRecording ? dict.recStop : dict.recStart);
  setTxt('btnShare', dict.share);
  setTxt('btnRunJs', dict.runJs);

  setTxt('lblOscTitle', dict.oscTitle);
  setTxt('lblOsdTitle', dict.osdTitle);
  setTxt('lblOsdGlow', dict.osdGlow);
  setTxt('lblOsdTrail', dict.osdTrail);
  setTxt('lblOsdFont', dict.osdFont);
  setTxt('lblOsdMargin', dict.osdMargin);
  setTxt('lblOsdVolume', dict.osdVolume);
  setTxt('lblOsdSoundType', dict.osdSoundType);
  setTxt('optSndMech', dict.sndMech);
  setTxt('optSndBeep', dict.sndBeep);
  setTxt('optSndType', dict.sndType);
  setTxt('lblOsdLineNums', dict.osdLineNums);
  setTxt('btnLineNums', studio.showLineNumbers ? dict.on : dict.off);

  setTxt('statusShortcuts', dict.shortcuts);
  setTxt('lblModalTitle', dict.modalTitle);
  setTxt('btnInsertBanner', dict.insertBanner);
  setTxt('txtImageAscii', dict.imgAscii);
  setTxt('btnSaveLocal', dict.saveLocal);
  setTxt('btnResetCustom', dict.resetCustom);
  setTxt('btnCancelModal', dict.cancel);
  setTxt('btnApplyModal', dict.apply);

  var bannerInp = document.getElementById('bannerInput');
  if (bannerInp) bannerInp.placeholder = dict.bannerPlaceholder;
  var customTa = document.getElementById('customTextarea');
  if (customTa) customTa.placeholder = dict.textareaPlaceholder;

  var btnLang = document.getElementById('btnLang');
  if (btnLang) {
    btnLang.textContent = studio.lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR';
    btnLang.classList.toggle('active', studio.lang === 'tr');
  }

  updatePlayPauseUI();
  updateStatusBar();
}

function toggleSound() {
  studio.soundEnabled = !studio.soundEnabled;
  if (studio.soundEnabled) ensureAudio();
  var btn = document.getElementById('btnSound');
  var dict = I18N[studio.lang];
  if (btn) {
    btn.textContent = studio.soundEnabled ? dict.soundOn : dict.soundOff;
    btn.classList.toggle('active', studio.soundEnabled);
  }
}

function updatePlayPauseUI() {
  var btn = document.getElementById('btnPlayPause');
  if (!btn) return;
  var dict = I18N[studio.lang];
  if (studio.finished) {
    btn.textContent = dict.done;
    btn.classList.remove('active');
  } else if (studio.paused) {
    btn.textContent = dict.resume;
    btn.classList.add('active');
  } else {
    btn.textContent = dict.pause;
    btn.classList.remove('active');
  }
}

function updateStatusBar() {
  var stState = document.getElementById('statusState');
  var stPos = document.getElementById('statusPos');
  var isTr = studio.lang === 'tr';
  if (stState) {
    if (!studio.poweredOn) {
      stState.textContent = isTr ? 'DURUM: STANDBY (KAPALI)' : 'STATUS: STANDBY (OFF)';
    } else if (studio.snakeActive) {
      stState.textContent = isTr ? 'DURUM: RETRO SNAKE OYUNU (ESC Çıkış)' : 'STATUS: RETRO SNAKE GAME (ESC to Exit)';
    } else if (studio.jetActive) {
      stState.textContent = isTr ? 'DURUM: F-35 HAVA SAVUNMA (ESC Çıkış)' : 'STATUS: F-35 INTERCEPTOR (ESC to Exit)';
    } else if (studio.finished) {
      stState.textContent = isTr ? 'DURUM: CLI AKTİF (Komut: help)' : 'STATUS: CLI ACTIVE (Type: help)';
    } else if (studio.paused) {
      stState.textContent = isTr ? 'DURUM: DURAKLATILDI' : 'STATUS: PAUSED';
    } else {
      stState.textContent = isTr ? 'DURUM: YAZILIYOR (' + studio.speed + 'x)' : 'STATUS: TYPING (' + studio.speed + 'x)';
    }
  }
  if (stPos) {
    var curLine = Math.min(y + 1, _s.length);
    stPos.textContent = isTr
      ? 'SATIR: ' + curLine + '/' + _s.length + ' | SÜTUN: ' + x
      : 'LINE: ' + curLine + '/' + _s.length + ' | COL: ' + x;
  }
}

function toggleVideoRecording() {
  var btn = document.getElementById('btnRecord');
  var dict = I18N[studio.lang];
  if (!studio.isRecording) {
    if (!c.captureStream || typeof MediaRecorder === 'undefined') {
      alert(studio.lang === 'tr' ? 'Tarayıcınız kanvas video kaydını desteklemiyor.' : 'Your browser does not support canvas video recording.');
      return;
    }
    var stream = c.captureStream(60);
    studio.recordedChunks = [];
    // Safari has no WebM support, so pick the first container the browser can actually record.
    var candidates = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
    var mime = '';
    for (var mIdx = 0; mIdx < candidates.length; mIdx++) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidates[mIdx])) {
        mime = candidates[mIdx];
        break;
      }
    }
    try {
      studio.mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (err) {
      alert(studio.lang === 'tr' ? 'Video kaydı başlatılamadı: ' + err.message : 'Could not start video recording: ' + err.message);
      return;
    }
    studio.mediaRecorder.ondataavailable = function (e) {
      if (e.data && e.data.size > 0) {
        studio.recordedChunks.push(e.data);
      }
    };
    studio.mediaRecorder.onstop = function () {
      var outType = (studio.mediaRecorder && studio.mediaRecorder.mimeType) || mime || 'video/webm';
      var ext = outType.indexOf('mp4') !== -1 ? '.mp4' : '.webm';
      var blob = new Blob(studio.recordedChunks, { type: outType.split(';')[0] });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'old-school-script-relay-' + Date.now() + ext;
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);
    };
    studio.mediaRecorder.start();
    studio.isRecording = true;
    if (btn) {
      btn.textContent = dict.recStop;
      btn.classList.add('recording');
    }
  } else {
    if (studio.mediaRecorder && studio.mediaRecorder.state !== 'inactive') {
      studio.mediaRecorder.stop();
    }
    studio.isRecording = false;
    if (btn) {
      btn.textContent = dict.recStart;
      btn.classList.remove('recording');
    }
  }
}

function bindStudioUI() {
  var hudPanel = document.getElementById('hudPanel');
  var btnToggleHud = document.getElementById('btnToggleHud');
  var btnPower = document.getElementById('btnPower');
  var btnPlayPause = document.getElementById('btnPlayPause');
  var btnStep = document.getElementById('btnStep');
  var btnRestart = document.getElementById('btnRestart');
  var selectSpeed = document.getElementById('selectSpeed');
  var selectTheme = document.getElementById('selectTheme');
  var selectTemplate = document.getElementById('selectTemplate');
  var btnCustomCode = document.getElementById('btnCustomCode');
  var btnHuman = document.getElementById('btnHuman');
  var btnCursor = document.getElementById('btnCursor');
  var btnSyntax = document.getElementById('btnSyntax');
  var btnCrt = document.getElementById('btnCrt');
  var btnDegauss = document.getElementById('btnDegauss');
  var btnGlitch = document.getElementById('btnGlitch');
  var btnSound = document.getElementById('btnSound');
  var btnMusic = document.getElementById('btnMusic');
  var btnOsd = document.getElementById('btnOsd');
  var btnHologram = document.getElementById('btnHologram');
  var btnTelemetry = document.getElementById('btnTelemetry');
  var btnCli = document.getElementById('btnCli');
  var btnSnake = document.getElementById('btnSnake');
  var btnJet = document.getElementById('btnJet');
  var btnScreenshot = document.getElementById('btnScreenshot');
  var btnRecord = document.getElementById('btnRecord');
  var btnShare = document.getElementById('btnShare');
  var btnLang = document.getElementById('btnLang');
  var btnRunJs = document.getElementById('btnRunJs');

  var osdPanel = document.getElementById('osdPanel');
  var btnCloseOsd = document.getElementById('btnCloseOsd');
  var rngGlow = document.getElementById('rngGlow');
  var valGlow = document.getElementById('valGlow');
  var rngTrail = document.getElementById('rngTrail');
  var valTrail = document.getElementById('valTrail');
  var rngFont = document.getElementById('rngFont');
  var valFont = document.getElementById('valFont');
  var rngMargin = document.getElementById('rngMargin');
  var valMargin = document.getElementById('valMargin');
  var rngVolume = document.getElementById('rngVolume');
  var valVolume = document.getElementById('valVolume');
  var selSoundType = document.getElementById('selSoundType');
  var btnLineNums = document.getElementById('btnLineNums');
  var telemetryWidget = document.getElementById('telemetryWidget');

  var customModal = document.getElementById('customModal');
  var customTextarea = document.getElementById('customTextarea');
  var bannerInput = document.getElementById('bannerInput');
  var btnInsertBanner = document.getElementById('btnInsertBanner');
  var imageAsciiInput = document.getElementById('imageAsciiInput');
  var btnSaveLocal = document.getElementById('btnSaveLocal');
  var btnResetCustom = document.getElementById('btnResetCustom');
  var saveStatusHint = document.getElementById('saveStatusHint');
  var btnCloseModal = document.getElementById('btnCloseModal');
  var btnCancelModal = document.getElementById('btnCancelModal');
  var btnApplyModal = document.getElementById('btnApplyModal');

  if (btnToggleHud && hudPanel) {
    btnToggleHud.addEventListener('click', function () {
      hudPanel.classList.toggle('minimized');
      btnToggleHud.textContent = hudPanel.classList.contains('minimized') ? '[+]' : '[–]';
      syncCanvasSize();
      reflowCurrentScript();
    });
  }

  if (btnPower) btnPower.addEventListener('click', togglePower);

  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', function () {
      if (studio.finished) {
        loadRelayScript(studio.rawLines.length ? studio.rawLines : _s);
      } else {
        studio.paused = !studio.paused;
        updatePlayPauseUI();
      }
    });
  }

  if (btnStep) btnStep.addEventListener('click', stepNextLine);

  if (btnHuman) {
    btnHuman.addEventListener('click', function () {
      studio.humanized = !studio.humanized;
      studio.typoChar = '';
      studio.typoStage = 0;
      studio.humanDelayFrames = 0;
      btnHuman.classList.toggle('active', studio.humanized);
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', function () {
      loadRelayScript(studio.rawLines.length ? studio.rawLines : _s);
    });
  }

  if (selectSpeed) {
    selectSpeed.addEventListener('change', function (e) {
      studio.speed = parseFloat(e.target.value) || 1;
    });
  }

  if (selectTheme) {
    selectTheme.addEventListener('change', function (e) {
      applyTheme(e.target.value);
    });
  }

  function openCustomModal() {
    if (!customModal || !customTextarea) return;
    if (!studio.customCode || !studio.customCode.trim()) {
      studio.customCode = DEFAULT_CUSTOM_CODE;
    }
    customTextarea.value = studio.customCode;
    if (saveStatusHint) saveStatusHint.textContent = '';
    customModal.classList.remove('hidden');
    customTextarea.focus();
  }

  function closeCustomModal() {
    if (!customModal) return;
    customModal.classList.add('hidden');
    // If the modal was cancelled, keep the dropdown in sync with what is actually on screen.
    if (selectTemplate && selectTemplate.value !== studio.template) {
      selectTemplate.value = studio.template;
    }
  }

  if (selectTemplate) {
    selectTemplate.addEventListener('change', function (e) {
      var val = e.target.value;
      // 'custom' only becomes the active template once the user presses "Relay to Screen".
      if (val !== 'custom') studio.template = val;
      if (studio.hologramMode !== 'off') {
        if (val === 'cybermap') studio.hologramMode = 'globe';
        else if (val === 'starship') studio.hologramMode = 'f35';
        else if (val === 'hack') studio.hologramMode = 'cube';
      }
      if (val === 'custom') {
        openCustomModal();
      } else if (TEMPLATES[val]) {
        loadRelayScript(TEMPLATES[val]);
      }
    });
  }

  if (btnCustomCode) btnCustomCode.addEventListener('click', openCustomModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeCustomModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeCustomModal);

  if (btnInsertBanner && customTextarea) {
    btnInsertBanner.addEventListener('click', function () {
      var txt = bannerInput && bannerInput.value ? bannerInput.value : 'RETRO';
      var bannerBlock = generateAsciiBannerLines(txt).join('\n');
      customTextarea.value = bannerBlock + '\n\n' + customTextarea.value;
      if (saveStatusHint) saveStatusHint.textContent = I18N[studio.lang].bannerAdded;
    });
  }

  if (imageAsciiInput && customTextarea) {
    imageAsciiInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      // Reset so picking the same file again still fires 'change'.
      e.target.value = '';
      if (!file) return;
      if (saveStatusHint) saveStatusHint.textContent = I18N[studio.lang].convertingImg;
      convertImageFileToAscii(file, function (asciiText) {
        if (asciiText === null) {
          if (saveStatusHint) saveStatusHint.textContent = I18N[studio.lang].imgFailed;
          return;
        }
        customTextarea.value = asciiText;
        if (saveStatusHint) saveStatusHint.textContent = I18N[studio.lang].imgConverted;
      });
    });
  }

  if (btnSaveLocal && customTextarea) {
    btnSaveLocal.addEventListener('click', function () {
      studio.customCode = customTextarea.value.trim() ? customTextarea.value : DEFAULT_CUSTOM_CODE;
      customTextarea.value = studio.customCode;
      safeStorageSet('oldSkoolCustomCode', studio.customCode);
      if (saveStatusHint) saveStatusHint.textContent = I18N[studio.lang].savedLocal;
    });
  }

  if (btnResetCustom && customTextarea) {
    btnResetCustom.addEventListener('click', function () {
      studio.customCode = DEFAULT_CUSTOM_CODE;
      customTextarea.value = DEFAULT_CUSTOM_CODE;
      safeStorageRemove('oldSkoolCustomCode');
      if (saveStatusHint) saveStatusHint.textContent = I18N[studio.lang].resetDone;
      if (studio.template === 'custom') {
        loadRelayScript(studio.customCode.split('\n'));
      }
    });
  }

  if (btnRunJs && customTextarea) {
    btnRunJs.addEventListener('click', function () {
      studio.customCode = customTextarea.value.trim() ? customTextarea.value : DEFAULT_CUSTOM_CODE;
      customTextarea.value = studio.customCode;
      var out = runJavaScriptSandbox(studio.customCode);
      if (saveStatusHint) {
        saveStatusHint.textContent = '▶ ' + out.join(' | ').slice(0, 68);
      }
      studio.cliHistory.push({ text: 'guest@oldskool:~$ run [Studio Script]', isCmd: true });
      for (var i = 0; i < out.length; i++) {
        studio.cliHistory.push({ text: '  ' + out[i], isCmd: false });
      }
    });
  }

  if (btnApplyModal) {
    btnApplyModal.addEventListener('click', function () {
      if (customTextarea) {
        studio.customCode = customTextarea.value.trim() ? customTextarea.value : DEFAULT_CUSTOM_CODE;
        customTextarea.value = studio.customCode;
        studio.template = 'custom';
        if (selectTemplate) selectTemplate.value = 'custom';
        loadRelayScript(studio.customCode.split('\n'));
      }
      closeCustomModal();
    });
  }

  if (btnCursor) {
    btnCursor.addEventListener('click', function () {
      studio.cursorIndex = (studio.cursorIndex + 1) % studio.cursors.length;
      btnCursor.textContent = I18N[studio.lang].cursorPrefix + studio.cursors[studio.cursorIndex];
    });
  }

  if (btnSyntax) {
    btnSyntax.addEventListener('click', function () {
      studio.syntaxEnabled = !studio.syntaxEnabled;
      btnSyntax.classList.toggle('active', studio.syntaxEnabled);
    });
  }

  if (btnCrt) {
    btnCrt.addEventListener('click', function () {
      studio.crtEnabled = !studio.crtEnabled;
      document.body.classList.toggle('crt-enabled', studio.crtEnabled);
      btnCrt.classList.toggle('active', studio.crtEnabled);
    });
  }

  if (btnDegauss) btnDegauss.addEventListener('click', triggerDegauss);
  if (btnGlitch) btnGlitch.addEventListener('click', triggerGlitch);
  if (btnSound) btnSound.addEventListener('click', toggleSound);
  if (btnMusic) btnMusic.addEventListener('click', toggleSynthMusic);
  if (btnHologram) {
    btnHologram.addEventListener('click', function () {
      var nextIdx = (studio.hologramModes.indexOf(studio.hologramMode) + 1) % studio.hologramModes.length;
      studio.hologramMode = studio.hologramModes[nextIdx];
      btnHologram.classList.toggle('active', studio.hologramMode !== 'off');
    });
  }
  if (btnCli) {
    btnCli.addEventListener('click', function () {
      studio.snakeActive = false;
      studio.jetActive = false;
      if (btnSnake) btnSnake.classList.remove('active');
      if (btnJet) btnJet.classList.remove('active');
      y = _s.length;
      x = 0;
      studio.finished = true;
      studio.cliActive = true;
      studio.manualScroll = false;
      studio.targetScrollY = getMaxScrollY();
      updatePlayPauseUI();
    });
  }
  if (btnSnake) {
    btnSnake.addEventListener('click', function () {
      if (studio.snakeActive) {
        studio.snakeActive = false;
      } else {
        startSnakeGame();
      }
      btnSnake.classList.toggle('active', studio.snakeActive);
    });
  }
  if (btnJet) {
    btnJet.addEventListener('click', function () {
      if (studio.jetActive) {
        studio.jetActive = false;
      } else {
        startJetGame();
      }
      btnJet.classList.toggle('active', studio.jetActive);
    });
  }
  if (btnScreenshot) btnScreenshot.addEventListener('click', takeCanvasScreenshot);
  if (btnRecord) btnRecord.addEventListener('click', toggleVideoRecording);
  if (btnShare) btnShare.addEventListener('click', sharePermalink);

  if (btnOsd && osdPanel) {
    btnOsd.addEventListener('click', function () {
      osdPanel.classList.toggle('hidden');
      btnOsd.classList.toggle('active', !osdPanel.classList.contains('hidden'));
    });
  }
  if (btnCloseOsd && osdPanel) {
    btnCloseOsd.addEventListener('click', function () {
      osdPanel.classList.add('hidden');
      if (btnOsd) btnOsd.classList.remove('active');
    });
  }
  if (rngGlow) {
    rngGlow.addEventListener('input', function (e) {
      studio.glowBlur = parseInt(e.target.value, 10);
      if (valGlow) valGlow.textContent = studio.glowBlur + 'px';
    });
  }
  if (rngTrail) {
    rngTrail.addEventListener('input', function (e) {
      var v = parseInt(e.target.value, 10);
      studio.trailAlpha = v / 100;
      if (valTrail) valTrail.textContent = v + '%';
    });
  }
  if (rngFont) {
    rngFont.addEventListener('input', function (e) {
      studio.fontSize = parseInt(e.target.value, 10);
      studio.lineHeight = Math.round(studio.fontSize * 0.96);
      if (valFont) valFont.textContent = studio.fontSize + 'px';
      reflowCurrentScript();
    });
  }
  if (rngMargin) {
    rngMargin.addEventListener('input', function (e) {
      studio.marginX = parseInt(e.target.value, 10);
      if (valMargin) valMargin.textContent = studio.marginX + 'px';
      reflowCurrentScript();
    });
  }
  if (rngVolume) {
    rngVolume.addEventListener('input', function (e) {
      var v = parseInt(e.target.value, 10);
      studio.volume = v / 100;
      if (valVolume) valVolume.textContent = v + '%';
    });
  }
  if (selSoundType) {
    selSoundType.addEventListener('change', function (e) {
      studio.soundType = e.target.value;
    });
  }
  if (btnLineNums) {
    btnLineNums.addEventListener('click', function () {
      studio.showLineNumbers = !studio.showLineNumbers;
      var dict = I18N[studio.lang];
      btnLineNums.textContent = studio.showLineNumbers ? dict.on : dict.off;
      btnLineNums.classList.toggle('active', studio.showLineNumbers);
      reflowCurrentScript();
    });
  }
  if (btnLang) {
    btnLang.addEventListener('click', function () {
      applyLanguage(studio.lang === 'en' ? 'tr' : 'en');
      syncCanvasSize();
      reflowCurrentScript();
    });
  }
  if (btnTelemetry && telemetryWidget) {
    btnTelemetry.addEventListener('click', function () {
      studio.telemetryVisible = !studio.telemetryVisible;
      telemetryWidget.classList.toggle('hidden', !studio.telemetryVisible);
      btnTelemetry.classList.toggle('active', studio.telemetryVisible);
      syncCanvasSize();
      reflowCurrentScript();
    });
  }

  c.addEventListener('mousedown', function (e) {
    var rect = c.getBoundingClientRect();
    var localX = e.clientX - rect.left;
    if (localX >= w - 24) {
      studio.isDraggingScrollbar = true;
      updateScrollFromMouseY(e.clientY);
    }
  });
  window.addEventListener('mousemove', function (e) {
    if (studio.isDraggingScrollbar) {
      updateScrollFromMouseY(e.clientY);
    }
  });
  window.addEventListener('mouseup', function () {
    studio.isDraggingScrollbar = false;
  });

  function updateScrollFromMouseY(clientY) {
    var maxScroll = getMaxScrollY();
    if (maxScroll <= 0) return;
    var rect = c.getBoundingClientRect();
    var trackY = rect.top + 16;
    var trackH = Math.max(40, h - 32);
    var ratio = Math.max(0, Math.min(1, (clientY - trackY) / trackH));
    studio.targetScrollY = ratio * maxScroll;
    studio.scrollY = studio.targetScrollY;
    studio.manualScroll = studio.targetScrollY < maxScroll - 4;
  }

  window.addEventListener(
    'wheel',
    function (e) {
      if (customModal && !customModal.classList.contains('hidden')) return;
      var maxScroll = getMaxScrollY();
      var nextTarget = studio.targetScrollY + e.deltaY * 0.6;
      studio.targetScrollY = Math.max(0, Math.min(maxScroll, nextTarget));
      studio.manualScroll = studio.targetScrollY < maxScroll - 4;
    },
    { passive: true }
  );

  var touchLastY = null;
  c.addEventListener(
    'touchstart',
    function (e) {
      if (e.touches && e.touches.length === 1) {
        touchLastY = e.touches[0].clientY;
      }
    },
    { passive: true }
  );
  c.addEventListener(
    'touchmove',
    function (e) {
      if (touchLastY !== null && e.touches && e.touches.length === 1) {
        var curY = e.touches[0].clientY;
        var dy = touchLastY - curY;
        touchLastY = curY;
        var maxScroll = getMaxScrollY();
        var nextTarget = studio.targetScrollY + dy * 1.1;
        studio.targetScrollY = Math.max(0, Math.min(maxScroll, nextTarget));
        studio.manualScroll = studio.targetScrollY < maxScroll - 4;
      }
    },
    { passive: true }
  );
  c.addEventListener(
    'touchend',
    function () {
      touchLastY = null;
    },
    { passive: true }
  );

  window.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (tag === 'textarea' || tag === 'input' || tag === 'select') return;
    // While the Studio modal is open, keys belong to it: Escape closes it, nothing else
    // may leak to the CLI or shortcuts (e.g. "R" restarting the relay behind the modal).
    if (customModal && !customModal.classList.contains('hidden')) {
      if (e.key === 'Escape') closeCustomModal();
      return;
    }

    if (studio.snakeActive) {
      if (e.key === 'Escape') {
        studio.snakeActive = false;
        if (btnSnake) btnSnake.classList.remove('active');
        studio.cliHistory.push({
          text:
            studio.lang === 'tr'
              ? '[SNAKE OYUNU SONLANDIRILDI — SKOR: ' + studio.snakeScore + ']'
              : '[SNAKE GAME TERMINATED — SCORE: ' + studio.snakeScore + ']',
          isCmd: false
        });
        return;
      }
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && studio.snakeDir.y === 0) {
        studio.snakeNextDir = { x: 0, y: -1 };
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && studio.snakeDir.y === 0) {
        studio.snakeNextDir = { x: 0, y: 1 };
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && studio.snakeDir.x === 0) {
        studio.snakeNextDir = { x: -1, y: 0 };
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && studio.snakeDir.x === 0) {
        studio.snakeNextDir = { x: 1, y: 0 };
      }
      return;
    }

    if (studio.jetActive) {
      if (e.key === 'Escape') {
        studio.jetActive = false;
        if (btnJet) btnJet.classList.remove('active');
        studio.cliHistory.push({
          text:
            studio.lang === 'tr'
              ? '[F-35 HAVA SAVUNMA SONLANDIRILDI — SKOR: ' + studio.jetScore + ']'
              : '[F-35 INTERCEPTOR TERMINATED — SCORE: ' + studio.jetScore + ']',
          isCmd: false
        });
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        studio.jetMoveLeft = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        studio.jetMoveRight = true;
      } else if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        fireJetWeapon();
      }
      return;
    }

    if (studio.cliActive) {
      if (e.key === 'Enter') {
        e.preventDefault();
        playKeySound(true);
        executeCliCommand(studio.cliInput);
        studio.cliInput = '';
        return;
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        studio.cliInput = studio.cliInput.slice(0, -1);
        playKeySound(false);
        return;
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        studio.cliInput += e.key;
        playKeySound(false);
        return;
      }
    }

    if (e.code === 'Space') {
      e.preventDefault();
      studio.paused = !studio.paused;
      updatePlayPauseUI();
    } else if (e.key === 'n' || e.key === 'N') {
      stepNextLine();
    } else if (e.key === 'r' || e.key === 'R') {
      loadRelayScript(studio.rawLines.length ? studio.rawLines : _s);
    } else if (e.key === 'g' || e.key === 'G') {
      triggerGlitch();
    } else if (e.key === 'm' || e.key === 'M') {
      toggleSound();
    }
  });

  window.addEventListener('keyup', function (e) {
    if (!studio.jetActive) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      studio.jetMoveLeft = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      studio.jetMoveRight = false;
    }
  });
}

window.addEventListener('resize', function () {
  syncCanvasSize();
  reflowCurrentScript();
  initMatrixRain();
});

if (typeof ResizeObserver !== 'undefined') {
  var frameEl = document.getElementById('screenFrame');
  if (frameEl) {
    var ro = new ResizeObserver(function () {
      syncCanvasSize();
      reflowCurrentScript();
    });
    ro.observe(frameEl);
  }
}

