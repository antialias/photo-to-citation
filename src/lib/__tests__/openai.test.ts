import { describe, it, expect } from 'vitest';
import { openai } from '../openai';

describe('openai client', () => {
  it('exports a client instance', () => {
    expect(openai).toBeDefined();
  });
});
