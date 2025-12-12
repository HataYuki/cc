import * as THREE from 'three'
import Experience from "../Game.ts";

export default class Floor
{
    private experience: Experience
    private scene: THREE.Scene
    private resources: IResources
    geometry: THREE.CircleGeometry
    material: THREE.MeshStandardMaterial
    texture: {
        color:Datatype<'ktx2'>,
        normal:Datatype<'ktx2'>,
    }
    mesh: THREE.Mesh
    constructor()
    {
        this.experience = Experience.getInstance()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        this.geometry = this.initGeometry()
        this.texture = this.initTexture()
        this.material = this.initMaterial()
        this.mesh = this.initMesh()
    }
    initGeometry()
    {
        return new THREE.CircleGeometry(5, 64)
    }
    initMaterial()
    {
        return new THREE.MeshStandardMaterial({
            map: this.texture.color,
            normalMap: this.texture.normal,
            roughness: 1.0,
            metalness: 0.0
        })
    }
    initTexture()
    {
        const color = this.resources.items.grassColorTexture
        color.colorSpace = THREE.SRGBColorSpace
        color.repeat.set(1.5, 1.5)
        color.wrapS = THREE.RepeatWrapping
        color.wrapT = THREE.RepeatWrapping

        const normal = this.resources.items.grassNormalTexture
        normal.repeat.set(1.5, 1.5)
        normal.wrapS = THREE.RepeatWrapping
        normal.wrapT = THREE.RepeatWrapping

        return {
            color,
            normal
        }
    }
    initMesh()
    {
        const mesh = new THREE.Mesh(this.geometry, this.material)
        mesh.rotation.x = -Math.PI / 2
        mesh.receiveShadow = true
        this.scene.add(mesh)
        return mesh
    }
    dispose()
    {
        this.geometry.dispose()
        this.material.dispose()
        this.texture.color.dispose()
        this.texture.normal.dispose()
        this.mesh.traverse(obj =>
        {
            if (obj instanceof THREE.Mesh)
            {
                for (const key in obj.material)
                {
                    const value = obj.material[key]
                    if (
                        value &&
                        value.dispose === 'function'
                    )
                    {
                        value.dispose()
                    }
                }
            }
        })
        this.scene.remove(this.mesh)
    }
}