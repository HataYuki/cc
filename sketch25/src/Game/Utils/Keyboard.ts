import * as THREE from 'three'
type Conf = typeof import('../keyboardInputConfig.ts').default
type Names = Conf[number]['name']
type EventNames = `${Names}:down` | `${Names}:up` | 'down' | 'up'
type EventMap = { [N in EventNames]: any }

export default class Keyboard extends THREE.EventDispatcher<EventMap>
{
    private config: Conf
    private pressedKeys = new Set()

    on = this.addEventListener.bind(this)
    constructor(config: Conf)
    {
        super()

        this.config = config

        window.addEventListener('keydown', ({ code }) =>
        {
            this.pressedKeys.add(code)
            this.keyDown()
        })
        window.addEventListener('keyup', ({ code }) => 
        {
            this.pressedKeys.delete(code)
            this.keyUp()
        })
    }

    get pressedKeysStr()
    {
        return [...this.pressedKeys].join(',')
    }

    private keyDown()
    {
        this.findAny()
            .forEach(input => this.dispatchEvent({
                type: `${input.name}:down`,
                message: undefined
            }))
        
        this.findComb()
            .forEach(input => this.dispatchEvent({
                type: `${input.name}:down`,
                message: undefined
            }))
    }

    private keyUp()
    {        
        this.findAny()
            .forEach(input => this.dispatchEvent({
                type: `${input.name}:up`,
                messages: undefined
            }))
    }

    private findAny()
    {
        return this.config.filter(obj =>
        {
            return obj.keys.some(key =>
            { 
                if(typeof key !== 'string') return false
                return this.pressedKeys.has(key)
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
                    return this.pressedKeys.has(key)
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