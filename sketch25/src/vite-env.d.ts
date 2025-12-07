import type Game from './Game/Game.ts'
import type Viewport from "./Game/Utils/Viewport.ts"
import type Camera from "./Game/Camera.ts"
import type Renderer from "./Game/Renderer.ts"
import type Resources from "./Game/Utils/Resources.ts"
import type Tweak from "./Game/Utils/Tweak.ts"
import type Game from "./Geom/Game.ts";

declare global {
    type Nullable<T> = T | null
    type Optional<T> = T | undefined
    type AnyFn = (...args: any[]) => any;
    type NullableFn<T> = T | AnyFn
    type IViewport = Viewport
    type IRenderer = Renderer
    type ICamera = Camera
    type IResources = Resources
    type ITweak = Tweak

    interface Window{
        game: Game
    }
}
