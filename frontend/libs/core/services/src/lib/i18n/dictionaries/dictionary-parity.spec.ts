import { en } from './en';
import { es } from './es';

describe('i18n dictionary parity', () => {
  const enKeys = Object.keys(en).sort();
  const esKeys = Object.keys(es).sort();

  it('exposes the same key set in every locale', () => {
    const missingInEs = enKeys.filter((key) => !(key in es));
    const missingInEn = esKeys.filter((key) => !(key in en));

    expect({ missingInEs, missingInEn }).toEqual({
      missingInEs: [],
      missingInEn: [],
    });
  });

  it('has no empty translations', () => {
    const empty = [
      ...enKeys.filter((key) => !en[key as keyof typeof en]?.toString().trim()),
      ...esKeys.filter((key) => !es[key as keyof typeof es]?.toString().trim()),
    ];

    expect(empty).toEqual([]);
  });
});
