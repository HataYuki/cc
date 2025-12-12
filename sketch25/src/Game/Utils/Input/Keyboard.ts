import * as THREE from 'three'
import Game from '../../Game'
type keyboradConfig = typeof import('./Config/keyboardInputConfig').default
type Names = keyboradConfig[number]['name']
export type keyboradEventNames = `${Names}:down` | `${Names}:up` | 'down' | 'up'
export type KeyboradEvents = { [N in keyboradEventNames]: { _: undefined } }

export default class Keyboard extends THREE.EventDispatcher<KeyboradEvents>
{
    private config: KeyboardInputConf
    private value: { pressedKeys: Set<string>, pressedKeysStr: string }
        = { pressedKeys: new Set(), pressedKeysStr: '' }
    private game: Game
    private tweak: ITweak
    
    on = this.addEventListener.bind(this)
    constructor(config: KeyboardInputConf)
    {
        super()

        this.config = config
        this.game = Game.getInstance()
        this.tweak = this.game.tweak

        window.addEventListener('keydown', ({ code }) =>
        {
            this.value.pressedKeys.add(code)
            this.value.pressedKeysStr = [...this.value.pressedKeys].join(',')
            this.keyDown()
        })
        window.addEventListener('keyup', ({ code }) => 
        {
            this.value.pressedKeys.delete(code)
            this.value.pressedKeysStr = [...this.value.pressedKeys].join(',')
            this.keyUp()
        })

        if (this.tweak.gui)
        {
            const keyboardGui = this.tweak.gui.addFolder({ title: 'keyboard' })
            keyboardGui.addBinding(this.value, 'pressedKeysStr', { label: 'keys', readonly: true })
            keyboardGui.expanded = false
        }
    }

    private keyDown()
    {
        this.findAny()
            .forEach(input => this.dispatchEvent({
                type: `${input.name}:down`,
                _: undefined
            }))
        
        this.findComb()
            .forEach(input => this.dispatchEvent({
                type: `${input.name}:down`,
                _: undefined
            }))
    }

    private keyUp()
    {        
        this.findAny()
            .forEach(input => this.dispatchEvent({
                type: `${input.name}:up`,
                _s: undefined
            }))
    }

    private findAny()
    {
        return this.config.filter(obj =>
        {
            return obj.keys.some(key =>
            { 
                if(typeof key !== 'string') return false
                return this.value.pressedKeys.has(key)
            })
        })
    }

    private findComb()
    {
        return this.config.filter(obj =>
        {
            return obj.keys.some(key =>
            {
                if (typeof key === 'string') return false
                return key.every(key =>
                {
                    return this.value.pressedKeys.has(key)
                })
            })
        })
    }

    dispose()
    {
        window.removeEventListener('keydown', this.keyDown)
        window.removeEventListener('keyup', this.keyUp)
    }
}