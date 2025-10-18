import "../styles/destyle.css";
import "../styles/tailwind.css";
import "../styles/style.scss";
import App from '../app'
import { domReady } from './__utils'
import { UAParser } from 'ua-parser-js';

const parser = new UAParser()
const app = new App(parser)

domReady(async () => {
    await app.__setup()

    // Lifecycle: ensure dispose is called on page transitions and HMR
    let disposed = false

    const dispose = () => {
        if (disposed) return
        disposed = true
        try { window.dispatchEvent(new CustomEvent('xdraw:dispose')) } catch (_) {}
        try { typeof app.dispose === 'function' && app.dispose() } catch (e) { console.error(e) }
        // remove listeners after disposing
        window.removeEventListener('pagehide', onPageHide)
        window.removeEventListener('beforeunload', onBeforeUnload)
        // document.removeEventListener('visibilitychange', onVisibilityChange)
    }

    const onPageHide = () => dispose()
    const onBeforeUnload = () => dispose()
    // const onVisibilityChange = () => {
    //     if (document.visibilityState === 'hidden') dispose()
    // }

    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    // document.addEventListener('visibilitychange', onVisibilityChange, { passive: true })

    // Vite HMR: dispose old instance before replacement
    if (import.meta && import.meta.hot) {
        import.meta.hot.dispose(() => dispose())
        // accept to allow hot updates without full reload
        if (typeof import.meta.hot.accept === 'function') import.meta.hot.accept()
    }
})
