export {}

declare global {
    type KeysPattern<T extends string> = readonly T[] | readonly (readonly T[])[]

    
    interface KeyInput<Name extends string = string> {
        name: Name,
        keys: readonly KeysPattern<KeyboardEvent['code']>
    }

    type KeyboardInputConf<Name extends string = string> = readonly KeyInput<Name>[]
}