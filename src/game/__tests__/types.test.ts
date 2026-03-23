import { describe, it, expect } from 'vitest'
import { hexToRgba, lerp, clamp, wrap, dist, randRange } from '../types'

describe('hexToRgba', () => {
  it('converts a hex color to rgba with given alpha', () => {
    expect(hexToRgba('#ff0000', 1)).toBe('rgba(255,0,0,1)')
    expect(hexToRgba('#00ff00', 0.5)).toBe('rgba(0,255,0,0.5)')
    expect(hexToRgba('#0000ff', 0)).toBe('rgba(0,0,255,0)')
  })

  it('handles mixed hex values', () => {
    expect(hexToRgba('#1a2b3c', 0.8)).toBe('rgba(26,43,60,0.8)')
  })

  it('handles white and black', () => {
    expect(hexToRgba('#ffffff', 1)).toBe('rgba(255,255,255,1)')
    expect(hexToRgba('#000000', 1)).toBe('rgba(0,0,0,1)')
  })
})

describe('lerp', () => {
  it('returns a when t is 0', () => {
    expect(lerp(10, 20, 0)).toBe(10)
  })

  it('returns b when t is 1', () => {
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('returns midpoint when t is 0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50)
  })

  it('works with negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0)
  })

  it('extrapolates beyond 0-1 range', () => {
    expect(lerp(0, 10, 2)).toBe(20)
    expect(lerp(0, 10, -1)).toBe(-10)
  })
})

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to min when value is below', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to max when value is above', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('returns min/max when value equals boundary', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('wrap', () => {
  it('returns value unchanged when within range', () => {
    expect(wrap(5, 10)).toBe(5)
  })

  it('wraps values exceeding max', () => {
    expect(wrap(12, 10)).toBe(2)
  })

  it('wraps negative values', () => {
    expect(wrap(-1, 10)).toBe(9)
    expect(wrap(-3, 10)).toBe(7)
  })

  it('returns 0 when value equals max', () => {
    expect(wrap(10, 10)).toBe(0)
  })

  it('handles multiple wraps', () => {
    expect(wrap(25, 10)).toBe(5)
    expect(wrap(-15, 10)).toBe(5)
  })
})

describe('dist', () => {
  it('returns 0 for same point', () => {
    expect(dist(5, 5, 5, 5)).toBe(0)
  })

  it('computes horizontal distance', () => {
    expect(dist(0, 0, 3, 0)).toBe(3)
  })

  it('computes vertical distance', () => {
    expect(dist(0, 0, 0, 4)).toBe(4)
  })

  it('computes diagonal distance (3-4-5 triangle)', () => {
    expect(dist(0, 0, 3, 4)).toBe(5)
  })

  it('is commutative', () => {
    expect(dist(1, 2, 4, 6)).toBe(dist(4, 6, 1, 2))
  })
})

describe('randRange', () => {
  it('returns a value within the specified range', () => {
    for (let i = 0; i < 100; i++) {
      const value = randRange(5, 10)
      expect(value).toBeGreaterThanOrEqual(5)
      expect(value).toBeLessThan(10)
    }
  })

  it('returns min when range is zero-width', () => {
    expect(randRange(7, 7)).toBe(7)
  })
})
