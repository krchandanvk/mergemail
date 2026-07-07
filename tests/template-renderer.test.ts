import { TemplateRenderer } from '../services/template-renderer';

describe('TemplateRenderer fallback formatting pipeline', () => {
  test('resolves variables with values correctly', () => {
    const data = { name: 'Alice', company: 'Acme Corp' };
    const template = 'Hi {{name}}, welcome to {{company}}!';
    expect(TemplateRenderer.resolve(template, data)).toBe('Hi Alice, welcome to Acme Corp!');
  });

  test('substitutes fallback values when data field is missing or empty', () => {
    const data = { company: 'Acme Corp' };
    const template = 'Hi {{name | default:"Candidate"}}, welcome to {{company}}!';
    expect(TemplateRenderer.resolve(template, data)).toBe('Hi Candidate, welcome to Acme Corp!');
  });

  test('substitutes fallback values with single quotes', () => {
    const data = { company: 'Acme Corp' };
    const template = "Hi {{name | fallback='there'}}, welcome to {{company}}!";
    expect(TemplateRenderer.resolve(template, data)).toBe('Hi there, welcome to Acme Corp!');
  });

  test('substitutes fallback values for empty space fields', () => {
    const data = { name: '   ', company: 'Acme Corp' };
    const template = 'Hi {{name | fallback="there"}}, welcome to {{company}}!';
    expect(TemplateRenderer.resolve(template, data)).toBe('Hi there, welcome to Acme Corp!');
  });

  test('leaves unresolved variables without fallbacks as-is', () => {
    const data = { company: 'Acme Corp' };
    const template = 'Hi {{name}}, welcome to {{company}}!';
    expect(TemplateRenderer.resolve(template, data)).toBe('Hi {{name}}, welcome to Acme Corp!');
  });

  test('case-insensitive lookup works with fallbacks', () => {
    const data = { NAME: 'Bob' };
    const template = 'Hi {{name | default:"Candidate"}}!';
    expect(TemplateRenderer.resolve(template, data)).toBe('Hi Bob!');
  });
});
