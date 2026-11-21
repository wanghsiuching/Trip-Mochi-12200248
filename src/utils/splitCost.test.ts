import { describe, it, expect } from 'vitest';
import { splitCost, calculateNights } from './splitCost';

describe('splitCost', () => {
  it('1. total=67869.6, feeEnabled=true, feeRate=0.015, people=4, nights=8 -> fee≈1018.04, sum≈68887.64, perPerson=17222, perPersonPerNight=2153', () => {
    const result = splitCost({
      total: 67869.6,
      feeEnabled: true,
      feeRate: 0.015,
      people: 4,
      nights: 8,
    });

    expect(result.fee).toBeCloseTo(1018.044, 2);
    expect(Number(result.fee.toFixed(2))).toBe(1018.04);
    expect(result.sum).toBeCloseTo(68887.644, 2);
    expect(Number(result.sum.toFixed(2))).toBe(68887.64);
    expect(result.perPerson).toBe(17222);
    expect(result.perPersonPerNight).toBe(2153);
  });

  it('2. total=67869.6, feeEnabled=true, feeRate=0.015, people=3, nights=8 -> perPerson=22963', () => {
    const result = splitCost({
      total: 67869.6,
      feeEnabled: true,
      feeRate: 0.015,
      people: 3,
      nights: 8,
    });

    expect(result.perPerson).toBe(22963);
  });

  it('3. total=67869.6, feeEnabled=false, people=4 -> perPerson=16968 (67869.6÷4=16967.4 無條件進位)', () => {
    const result = splitCost({
      total: 67869.6,
      feeEnabled: false,
      feeRate: 0.015,
      people: 4,
      nights: 8,
    });

    expect(result.fee).toBe(0);
    expect(result.sum).toBe(67869.6);
    expect(result.perPerson).toBe(16968);
  });

  it('4. people=0 -> perPerson=null, perPersonPerNight=null', () => {
    const result = splitCost({
      total: 67869.6,
      feeEnabled: true,
      feeRate: 0.015,
      people: 0,
      nights: 8,
    });

    expect(result.perPerson).toBeNull();
    expect(result.perPersonPerNight).toBeNull();
  });

  it('5. nights=0 -> perPersonPerNight=null', () => {
    const result = splitCost({
      total: 67869.6,
      feeEnabled: true,
      feeRate: 0.015,
      people: 4,
      nights: 0,
    });

    expect(result.perPerson).toBe(17222);
    expect(result.perPersonPerNight).toBeNull();
  });

  it('6. total=0 -> perPerson=0', () => {
    const result = splitCost({
      total: 0,
      feeEnabled: true,
      feeRate: 0.015,
      people: 4,
      nights: 8,
    });

    expect(result.fee).toBe(0);
    expect(result.sum).toBe(0);
    expect(result.perPerson).toBe(0);
  });
});

describe('calculateNights', () => {
  it('calculates exact nights between checkIn and checkOut', () => {
    expect(calculateNights('2027-10-16', '2027-10-24')).toBe(8);
    expect(calculateNights('2027-10-16', '2027-10-16')).toBe(0);
    expect(calculateNights('2027-10-24', '2027-10-16')).toBe(0);
  });
});
