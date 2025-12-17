export const mod = (x:number, y:number) =>
{
    return x - y * Math.floor(x / y)
}

export const clamp = (x: number, min: number, max: number) =>
{
    return Math.min(max, Math.max(min, x))
}

export const smoothstep = (edge0: number, edge1: number, x: number) =>
{
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)
}

export const step = (x: number, y: number) =>
{
    return (y < x) ? 0.0 : 1.0
}

export const remap = (omin: number, omax: number, dmin: number, dmax: number, x: number) =>
{
    return dmin + (x - omin) * (dmax - dmin) / (omax - omin)
}

