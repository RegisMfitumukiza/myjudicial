import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import rw from '../../messages/rw.json';

const messages: Record<string, Record<string, any>> = { en, fr, rw };

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messages[locale] ?? messages.en
  };
});
