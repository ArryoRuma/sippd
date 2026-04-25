// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://use.typekit.net/xto0bje.css'
        }
      ]
    }
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/content',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'motion-v/nuxt',
    '@nuxtjs/supabase',
    '@nuxt/fonts'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light'
  },

  mdc: {
    highlight: {
      noApiRoute: false
    }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    prerender: {
      routes: [
        '/'
      ]
    }
  },
  debug: true,

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  supabase: {
    redirect: true,
    cookieOptions: {
      // Secure cookies are ignored on plain http localhost; keep secure in production only.
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    },
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/login', '/signup']
    }
  }
})
