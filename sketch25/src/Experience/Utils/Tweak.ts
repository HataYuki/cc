import {Pane} from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import {type FpsGraphBladeApi} from "@tweakpane/plugin-essentials";

export default class Tweak
{
    instance!: Nullable<Pane>
    fps!: Nullable<FpsGraphBladeApi>
    constructor()
    {
        const activate = (location.hash === '#debug')
        if(activate)
        {
            this.instance = new Pane()
            this.instance.registerPlugin(EssentialsPlugin)
            this.fps = this.initFps()
        }
    }
    initFps(): FpsGraphBladeApi | null
    {
        if(!this.instance) return null

        return this.instance.addBlade({
            view: 'fpsgraph',
            label: 'fps'
        }) as FpsGraphBladeApi
    }
}