import { parse } from '../subs/Parser';

describe('Parser.parse', () => {
  it('parses strict JSON', () => {
    const result = parse('{"1200": 3, "2400": 1}');
    expect(result).toEqual({ '1200': 3, '2400': 1 });
  });

  it('parses relaxed JSON with unquoted keys', () => {
    const result = parse('{1200: 3, 2400: 1}');
    expect(result).toEqual({ '1200': 3, '2400': 1 });
  });

  it('parses JSON with single-quoted keys', () => {
    const result = parse("{'1200': 3, '2400': 1}");
    expect(result).toEqual({ '1200': 3, '2400': 1 });
  });

  it('strips whitespace before parsing', () => {
    const result = parse('{ "1200" : 3 , "2400" : 1 }');
    expect(result).toEqual({ '1200': 3, '2400': 1 });
  });

  it('parses empty object', () => {
    const result = parse('{}');
    expect(result).toEqual({});
  });

  it('parses object with dotted keys', () => {
    const result = parse('{foo.bar: 5}');
    expect(result).toEqual({ 'foo.bar': 5 });
  });

  it('parses object with underscore keys', () => {
    const result = parse('{some_key: 42}');
    expect(result).toEqual({ some_key: 42 });
  });

  it('throws on completely invalid JSON', () => {
    expect(() => parse('not json at all!!!')).toThrow();
  });
});
