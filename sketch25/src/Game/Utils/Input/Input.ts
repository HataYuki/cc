import Keyboard from './Keyboard'
import Navigate from './Navigate'
import Swipe from './Swipe'
import Cursor from "./Cursor"
import type { keyboradEventNames, KeyboradEvents} from './Keyboard'
import type { NavigateEventNames, NavigateEvents, NavigateOption} from './Navigate'
import type { SwipeEventNames, SwipeEvents } from './Swipe'
import type { CursorEventNames, CursorEvents } from './Cursor'
type InputEventMap = KeyboradEvents & NavigateEvents & SwipeEvents & CursorEvents
type InputEventNames = keyboradEventNames | NavigateEventNames | SwipeEventNames | CursorEventNames
interface InputOption {
    keyboard: KeyboardInputConf
    navigate: Partial<NavigateOption>
}

export default class Input
{
    private static instance: Input
    private rfId: number = -1

    startTime: number = performance.now()
    currentTime: number = this.startTime
    elapsedTime: number = 0
    deltaTime: number = 1000 / 120 // ms / fps

    option:InputOption = {
        keyboard: [{ name: '', keys: [] }],
        navigate: { wheelMul: 1, touchMul: 1}
    }
    keyboard: Keyboard
    navigate: Navigate
    swipe: Swipe
    cursor: Cursor

    private constructor(option: Partial<InputOption>) {
        Input.instance = this

        this.option = { ...this.option, ...option }
        
        this.keyboard = new Keyboard(this.option.keyboard)
        this.navigate = new Navigate(this.option.navigate)
        this.swipe = new Swipe()
        this.cursor = new Cursor()

        this.rfId = requestAnimationFrame(this.tick)
    }

    on<T extends InputEventNames>(name: T, callback: (arg: InputEventMap[T]) => void)
    {
        if (name === 'scroll')
        {
            this.navigate.on(name, callback as any)
        }
        else if(name === 'slidestart' || name === 'slideend')
        {
            this.swipe.on(name, callback as any)
        }
        else if (name === 'cursormove' || name === 'cursormovestart' || name === 'cursormovestop')
        {
            this.cursor.on(name, callback as any)
        }
        else
        {
            this.keyboard.on(name, callback as any)
        }
    }

    private tick = () =>
    {
        this.rfId = requestAnimationFrame(this.tick)

        const currentTime = performance.now()
        this.deltaTime = currentTime - this.currentTime
        this.currentTime = currentTime
        this.elapsedTime = this.currentTime - this.startTime

        this.navigate.update()
        this.swipe.update()
        this.cursor.update()
    }

    dispose()
    {
        this.keyboard.dispose()
        this.navigate.dispose()
        this.swipe.dispose()
        this.cursor.dispose()

        cancelAnimationFrame(this.rfId)
        this.rfId = -1
    }

    static getInstance(option?: Partial<InputOption>)
    {
        if (!Input.instance && option)
        {
            Input.instance = new Input(option)
        }
        
        return Input.instance
    }
}