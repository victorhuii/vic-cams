import {it,expect} from 'vitest';
import {personAlpha,validBackground} from '../src/lib/camera/background';
it('keeps confident people opaque and background transparent with soft edges',()=>{expect(personAlpha(0)).toBe(0);expect(personAlpha(.2)).toBe(0);expect(personAlpha(.5)).toBe(128);expect(personAlpha(.8)).toBe(255);expect(personAlpha(1)).toBe(255);});
it('accepts solid colors and original without accepting URLs or CSS injection',()=>{expect(validBackground('#ffffff')).toBe(true);expect(validBackground('#ABCDEF')).toBe(true);expect(validBackground('original')).toBe(true);expect(validBackground('url(https://tracker.test)')).toBe(false);expect(validBackground('#fff; color:red')).toBe(false);});
