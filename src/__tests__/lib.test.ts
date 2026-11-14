import { describe, expect, it } from 'vitest';
import { looksLikeNationalId, looksLikePhone, renderTemplate, unknownPlaceholders } from '../lib';

describe('renderTemplate', () => {
  it('fills every placeholder', () => {
    const out = renderTemplate('Hi {patient}, {doctor} at {hospital} on {date} {time}', { patient: 'Ravi', doctor: 'Dr. Meera', hospital: 'Sunrise', date: 'Mon', time: '10:00 AM' });
    expect(out).toBe('Hi Ravi, Dr. Meera at Sunrise on Mon 10:00 AM');
  });
  it('fills a placeholder used twice', () => {
    expect(renderTemplate('{time} / {time}', { time: '9:00 AM' })).toBe('9:00 AM / 9:00 AM');
  });
  it('leaves unknown placeholders as they are', () => {
    expect(renderTemplate('Hello {nobody}', { patient: 'x' })).toBe('Hello {nobody}');
  });
  it('returns plain text unchanged', () => {
    expect(renderTemplate('No placeholders here', {})).toBe('No placeholders here');
  });
});

describe('unknownPlaceholders', () => {
  it('finds nothing in a good message', () => {
    expect(unknownPlaceholders('Hi {patient}, see {doctor} at {time} on {date} at {hospital}')).toEqual([]);
  });
  it('lists each unknown placeholder once', () => {
    expect(unknownPlaceholders('Hi {name} {name} {time} {oops}')).toEqual(['name', 'oops']);
  });
  it('ignores braces that are not placeholders', () => {
    expect(unknownPlaceholders('a { b } c')).toEqual([]);
  });
});

describe('looksLikePhone', () => {
  it.each([
    ['IN', '9000000001', true],
    ['IN', '+91 90000 00001', true],
    ['IN', '919000000001', true],
    ['US', '(404) 555-0101', true],
    ['US', '14045550101', true],
    ['IN', '90000', false],
    ['IN', '', false],
    ['IN', '900000000012345', false],
    ['US', '919000000001', false],
  ] as const)('%s %s -> %s', (country, raw, expected) => {
    expect(looksLikePhone(country, raw)).toBe(expected);
  });
});

describe('looksLikeNationalId', () => {
  it.each([
    ['IN', '358813998697', true],
    ['IN', '3588 1399 8697', true],
    ['IN', '35881399869', false],
    ['IN', '123456789', false],
    ['US', '123-45-6789', true],
    ['US', '123456789', true],
    ['US', '12345678', false],
    ['US', '358813998697', false],
  ] as const)('%s %s -> %s', (country, raw, expected) => {
    expect(looksLikeNationalId(country, raw)).toBe(expected);
  });
});
