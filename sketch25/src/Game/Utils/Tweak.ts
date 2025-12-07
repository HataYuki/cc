import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import { type FpsGraphBladeApi } from "@tweakpane/plugin-essentials";

export default class Tweak
{
    private monitor!: FpsGraphBladeApi
    gui: Nullable<Pane> = null

    fpsMonitorBegin: NullableFn<FpsGraphBladeApi['begin']> = () => {}
    fpsMonitorEnd: NullableFn<FpsGraphBladeApi['begin']> = () => {}
    
    constructor()
    {
        if (location.hash !== '#debug') return
            
        this.gui = new Pane()
        this.gui.registerPlugin(EssentialsPlugin)

        this.monitor = this.gui.addBlade({ view: 'fpsgraph', label: 'fps' }) as FpsGraphBladeApi
        this.fpsMonitorBegin = this.monitor.begin.bind(this.monitor)
        this.fpsMonitorEnd = this.monitor.end.bind(this.monitor)
    }
}