import * as THREE from "three"
import Input from './Input'

export type SwipeEventNames = 'slidestart' | 'slideend' 
export type SwipeEvents = { [N in SwipeEventNames] : { axis: 'x' | 'y', dir: 1 | -1 | 0 } }

export default class Swipe extends THREE.EventDispatcher<SwipeEvents>
{
    private static MAX_HISTORY_LEN = 5
    private deltaXHistory:number[] = new Array(Swipe.MAX_HISTORY_LEN).fill(0)
    private deltaYHistory:number[] = new Array(Swipe.MAX_HISTORY_LEN).fill(0)
    private smoothDeltaXHistory:number[] = new Array(Swipe.MAX_HISTORY_LEN).fill(0)
    private smoothDeltaYHistory: number[] = new Array(Swipe.MAX_HISTORY_LEN).fill(0)
    private xSwiped = false
    private ySwiped = false

    private input: Input
    private navigate: INavigate

    on = this.addEventListener.bind(this)

    constructor()
    {
        super()

        this.input = Input.getInstance()
        this.navigate = this.input.navigate
    }

    private smoothDelta()
    {        
        this.deltaXHistory.push(Math.abs(this.navigate.delta.x))
        this.deltaYHistory.push(Math.abs(this.navigate.delta.y))
        
        const xLen = this.deltaXHistory.length
        const yLen = this.deltaYHistory.length
        const maxLen = Swipe.MAX_HISTORY_LEN

        if (xLen > maxLen) this.deltaXHistory.shift()
        if (yLen > maxLen) this.deltaYHistory.shift()
        
        const smoothX = this.deltaXHistory.reduce((a, c) => a + c, 0) / maxLen
        const smoothY = this.deltaYHistory.reduce((a, c) => a + c, 0) / maxLen
        
        return {
            x: smoothX,
            y: smoothY
        }
    }

    private speedTrend(smoothX:number, smoothY:number)
    {
        this.smoothDeltaXHistory.push(smoothX)
        this.smoothDeltaYHistory.push(smoothY)

        const xLen = this.smoothDeltaXHistory.length
        const yLen = this.smoothDeltaYHistory.length
        const maxLen = Swipe.MAX_HISTORY_LEN

        if (xLen > maxLen) this.smoothDeltaXHistory.shift()
        if (yLen > maxLen) this.smoothDeltaYHistory.shift()
        
        const xSpeedUp = this.smoothDeltaXHistory
            .every((v, i, a) => i === 0 || v > a[i - 1])
        const xSpeedDown = this.smoothDeltaXHistory
            .every((v, i, a) => i === 0 || v < a[i - 1])
        
        const ySpeedUp = this.smoothDeltaYHistory
            .every((v, i, a) => i === 0 || v > a[i - 1])
        const ySpeedDown = this.smoothDeltaYHistory
            .every((v, i, a) => i === 0 || v < a[i - 1])
        
        
        return {
            changeX:    (xSpeedUp) ? 1 :
                        (xSpeedDown) ? -1 :
                        0, 
                        
            changeY:    (ySpeedUp) ? 1 :
                        (ySpeedDown) ? -1 :
                        0
        }
    }

    update()
    {
        const { x, y } = this.smoothDelta()
        const { changeX, changeY } = this.speedTrend(x, y)
        const delta = this.navigate.delta

        const dirX = (delta.x > 0) ? 1 :
                     (delta.x < 0) ? -1:
                     0
        const dirY = (delta.y > 0) ? 1 :
                     (delta.y < 0) ? -1:
                     0
        
        if (changeX === 1 && !this.xSwiped)
        {
            this.xSwiped = true
            this.dispatchEvent( { type: 'slidestart', axis: 'x', dir: dirX})
        }
        else if (changeX === -1 && this.xSwiped)
        {
            this.xSwiped = false
            this.dispatchEvent( { type: 'slideend', axis: 'x', dir: dirX })
        }
    

        if (changeY === 1 && !this.ySwiped)
        {
            this.ySwiped = true
            this.dispatchEvent( { type: 'slidestart', axis: 'y', dir: dirY })
        }
        else if (changeY === -1 && this.ySwiped)
        {
            this.ySwiped = false
            this.dispatchEvent( { type: 'slideend', axis: 'y', dir: dirY })
        }    
    }

    dispose()
    {
        this.deltaXHistory.fill(0)
        this.deltaYHistory.fill(0)
        this.smoothDeltaXHistory.fill(0)
        this.smoothDeltaYHistory.fill(0)
    }
}