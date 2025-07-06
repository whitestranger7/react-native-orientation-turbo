import { LandscapeDirection, Orientation } from '../constants';

describe('Constants should be defined correctly', () => {
  describe('LandscapeDirection enum', () => {
    it('should have correct LEFT value', () => {
      expect(LandscapeDirection.LEFT).toBe('LEFT');
    });

    it('should have correct RIGHT value', () => {
      expect(LandscapeDirection.RIGHT).toBe('RIGHT');
    });

    it('should have only 2 values', () => {
      expect(Object.keys(LandscapeDirection)).toHaveLength(2);
    });
  });

  describe('Orientation enum', () => {
    it('should have correct PORTRAIT value', () => {
      expect(Orientation.PORTRAIT).toBe('PORTRAIT');
    });

    it('should have correct LANDSCAPE_LEFT value', () => {
      expect(Orientation.LANDSCAPE_LEFT).toBe('LANDSCAPE_LEFT');
    });

    it('should have correct LANDSCAPE_RIGHT value', () => {
      expect(Orientation.LANDSCAPE_RIGHT).toBe('LANDSCAPE_RIGHT');
    });

    it('should have only 3 values', () => {
      expect(Object.keys(Orientation)).toHaveLength(3);
    });
  });
});
