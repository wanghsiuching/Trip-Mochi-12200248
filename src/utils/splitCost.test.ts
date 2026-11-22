import { describe, it, expect } from 'vitest';
import { splitCost, calculateNights, splitTicketCost, resolveTransitDetails } from './splitCost';

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

describe('splitTicketCost', () => {
  it('1. 每張 CHF 17 × 4 張，4 人分攤、無手續費 -> subtotal=68, sum=68, perPerson=17', () => {
    const result = splitTicketCost({
      unitPrice: 17,
      ticketCount: 4,
      feeEnabled: false,
      feeRate: 0.015,
      people: 4,
    });

    expect(result.subtotal).toBe(68);
    expect(result.fee).toBe(0);
    expect(result.sum).toBe(68);
    expect(result.perPerson).toBe(17);
  });

  it('2. 每張 CHF 17 × 4 張，含 1.5% 手續費，4 人分攤 -> fee=1.02, sum=69.02, perPerson=17.26', () => {
    const result = splitTicketCost({
      unitPrice: 17,
      ticketCount: 4,
      feeEnabled: true,
      feeRate: 0.015,
      people: 4,
    });

    expect(result.subtotal).toBe(68);
    expect(result.fee).toBeCloseTo(1.02, 4);
    expect(result.sum).toBeCloseTo(69.02, 4);
    expect(result.perPerson).toBe(17.26);
    expect(result.exactPerPerson).toBeCloseTo(17.255, 4);
  });

  it('3. 每張 CHF 17 × 4 張，2 人分攤 -> sum=68, perPerson=34', () => {
    const result = splitTicketCost({
      unitPrice: 17,
      ticketCount: 4,
      feeEnabled: false,
      feeRate: 0,
      people: 2,
    });

    expect(result.sum).toBe(68);
    expect(result.perPerson).toBe(34);
  });

  it('4. people=0 -> perPerson=null', () => {
    const result = splitTicketCost({
      unitPrice: 17,
      ticketCount: 4,
      feeEnabled: false,
      feeRate: 0,
      people: 0,
    });

    expect(result.sum).toBe(68);
    expect(result.perPerson).toBeNull();
  });
});

describe('resolveTransitDetails', () => {
  const members = [
    { id: 'm1', name: 'A' },
    { id: 'm2', name: 'B' },
    { id: 'm3', name: 'C' },
    { id: 'm4', name: 'D' },
  ];

  it('resolves legacy fare where originalPrice=17 without discountedPrice and no ticketCount (defaults to 4 tickets)', () => {
    const resolved = resolveTransitDetails(
      {
        legs: [],
        fare: {
          originalPrice: '17',
          discountedPrice: '',
          currency: 'CHF',
        },
        participants: ['m1', 'm2', 'm3', 'm4'],
      },
      members
    );

    expect(resolved.unitPrice).toBe(17);
    expect(resolved.ticketCount).toBe(4);
    expect(resolved.split.sum).toBe(68);
    expect(resolved.split.perPerson).toBe(17);
  });

  it('respects pass_free as 0 even when originalPrice is entered', () => {
    const resolved = resolveTransitDetails(
      {
        legs: [],
        fare: {
          passUsed: 'pass_free',
          originalPrice: '17',
          discountedPrice: '0',
          currency: 'CHF',
        },
        participants: ['m1', 'm2', 'm3', 'm4'],
      },
      members
    );

    expect(resolved.unitPrice).toBe(0);
    expect(resolved.split.sum).toBe(0);
    expect(resolved.split.perPerson).toBe(0);
  });
});

