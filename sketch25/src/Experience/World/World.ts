import Experience from '../Experience.ts';
import Environment from './Environment.ts';
import Floor from "./Floor.ts";
import Fox from "./Fox.ts";

export default class World
{
    experience: Experience
    resources: IResources
    environment!: Environment
    floor!: Floor
    fox!: Fox
    constructor()
    {
        this.experience = Experience.getInstance()
        this.resources = this.experience.resources

        this.resources.on('ready', ()=>
        {
            // Setup
            this.environment = new Environment()
            this.floor = new Floor()
            this.fox = new Fox()
        })
    }

    update()
    {
        if(this.fox) this.fox.update()
    }
}