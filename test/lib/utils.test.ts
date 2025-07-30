import { cn } from '../../lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class', false && 'hidden-class'))
        .toBe('base-class conditional-class')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('', null, undefined)).toBe('')
    })

    it('should handle array inputs', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2')
    })

    it('should merge Tailwind conflicting classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })

    it('should handle object syntax', () => {
      expect(cn({
        'active': true,
        'disabled': false,
        'text-lg': true
      })).toBe('active text-lg')
    })
  })
})