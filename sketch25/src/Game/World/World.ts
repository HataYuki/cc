import Experience from '../Game';
import Environment from './Environment';
import Floor from "./Floor";
import Fox from "./Fox";

export default class World
{
    experience: Experience
    resources: IResources
    environment: Nullable<Environment> = null
    floor: Nullable<Floor> = null
    fox: Nullable<Fox> = null
    constructor()
    {
        this.experience = Experience.getInstance()
        this.resources = this.experience.resources

        this.resources.load(
            'foxModel',
            // 'environmentMapTexture',
            'grassColorTexture',
            'grassNormalTexture',
            'envTextureKtx',
        ).then(() => {
            // Setup
            this.environment = new Environment()
            this.floor = new Floor()
            this.fox = new Fox()
        })
    }

    update()
    {
        if (this.fox)
            this.fox.update()
    }
    
    dispose()
    {
        if (this.environment)
            this.environment?.dispose()
        if (this.fox)
            this.fox.dispose()
        if (this.floor)
            this.floor.dispose()
    }
}