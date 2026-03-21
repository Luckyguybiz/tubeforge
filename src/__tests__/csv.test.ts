import { describe, it, expect } from 'vitest';
import { arrayToCSV } from '@/lib/csv';

const columns = [
  { key: 'name' as const, label: 'Name' },
  { key: 'email' as const, label: 'Email' },
  { key: 'age' as const, label: 'Age' },
];

describe('arrayToCSV', () => {
  it('generates correct CSV from simple data', () => {
    const data = [
      { name: 'Alice', email: 'alice@example.com', age: 30 },
      { name: 'Bob', email: 'bob@example.com', age: 25 },
    ];

    const csv = arrayToCSV(data, columns);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[0]).toBe('"Name","Email","Age"');
    expect(lines[1]).toBe('"Alice","alice@example.com",30');
    expect(lines[2]).toBe('"Bob","bob@example.com",25');
  });

  it('escapes special characters: double quotes, commas, and handles null/undefined', () => {
    const data = [
      { name: 'Jane "J" Doe', email: 'jane@example.com', age: null as unknown as number },
      { name: 'With, Comma', email: undefined as unknown as string, age: 40 },
    ];

    const csv = arrayToCSV(data, columns);
    const lines = csv.split('\n');

    // Double quotes inside strings get doubled per CSV spec
    expect(lines[1]).toBe('"Jane ""J"" Doe","jane@example.com",');
    // Commas inside quoted strings are fine; undefined renders as empty
    expect(lines[2]).toBe('"With, Comma",,40');
  });

  it('returns only the header row when data is empty', () => {
    const csv = arrayToCSV([], columns);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('"Name","Email","Age"');
  });
});
