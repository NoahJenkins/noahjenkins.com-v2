import { formatDate } from '../../../app/blog/format-date'

describe('formatDate', () => {
  beforeEach(() => {
    // Mock current date to ensure consistent tests
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-07-30T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('without relative time', () => {
    it('should format date without relative time by default', () => {
      const result = formatDate('2024-07-15')
      expect(result).toBe('July 15, 2024')
    })

    it('should handle dates with time component', () => {
      const result = formatDate('2024-07-15T10:30:00Z')
      expect(result).toBe('July 15, 2024')
    })

    it('should format dates from different years', () => {
      const result = formatDate('2023-12-25')
      expect(result).toBe('December 25, 2023')
    })

    it('should format dates from different months', () => {
      const result = formatDate('2024-01-01')
      expect(result).toBe('January 1, 2024')
    })
  })

  describe('with relative time', () => {
    it('should show years ago for old dates', () => {
      const result = formatDate('2022-07-30', true)
      expect(result).toBe('July 30, 2022 (2y ago)')
    })

    it('should show months ago for dates from earlier months', () => {
      const result = formatDate('2024-05-30', true)
      expect(result).toBe('May 30, 2024 (2mo ago)')
    })

    it('should show days ago for recent dates', () => {
      const result = formatDate('2024-07-25', true)
      expect(result).toBe('July 25, 2024 (5d ago)')
    })

    it('should show "Today" for current date', () => {
      const result = formatDate('2024-07-30', true)
      expect(result).toBe('July 30, 2024 (Today)')
    })

    it('should handle dates with time and show relative', () => {
      const result = formatDate('2024-07-28T15:30:00Z', true)
      expect(result).toBe('July 28, 2024 (2d ago)')
    })
  })

  describe('date format handling', () => {
    it('should add time component to dates without T', () => {
      const result = formatDate('2024-07-15')
      expect(result).toBe('July 15, 2024')
    })

    it('should preserve existing time component', () => {
      const result = formatDate('2024-07-15T14:30:00Z')
      expect(result).toBe('July 15, 2024')
    })

    it('should handle edge case of same date different year', () => {
      const result = formatDate('2023-07-30', true)
      expect(result).toBe('July 30, 2023 (1y ago)')
    })
  })

  describe('edge cases', () => {
    it('should handle February dates correctly', () => {
      const result = formatDate('2024-02-29', true) // Leap year
      expect(result).toBe('February 29, 2024 (5mo ago)')
    })

    it('should handle year boundaries', () => {
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'))
      const result = formatDate('2023-12-31', true)
      expect(result).toBe('December 31, 2023 (1y ago)')
    })

    it('should handle month boundaries', () => {
      jest.setSystemTime(new Date('2024-08-01T12:00:00Z'))
      const result = formatDate('2024-07-31', true)
      expect(result).toBe('July 31, 2024 (1mo ago)')
    })
  })
})