export default [
    { name: 'forward',    keys: ['ArrowUp', 'keyW']       },
    { name: 'backward',   keys: ['ArrowDown', 'keyS']     },
    { name: 'left',       keys: ['ArrowLeft', 'keyA']     },
    { name: 'right',      keys: ['ArrowRight', 'keyD']    },
    { name: 'fullscreen', keys: [['ControlLeft', 'KeyF']] }
] as const satisfies KeyboardInputConf