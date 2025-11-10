import type Viewport from "./Experience/Utils/Viewport.ts"
import type Camera from "./Experience/Camera.ts"
import type Renderer from "./Experience/Renderer.ts"
import type Resources from "./Experience/Utils/Resources.ts"
import type Time from "./Experience/Utils/Time.ts"
import type Tweak from "./Experience/Utils/Tweak.ts"
import type Experience from "./Experience/Experience.ts";

declare global {
    type Nullable<T> = T | null
    type Optional<T> = T | undefined
    type IViewport = Viewport
    type IRenderer = Renderer
    type ICamera = Camera
    type IResources = Resources
    type ITime = Time
    type ITweak = Tweak

    interface Window{
        experience: Experience
    }
}
