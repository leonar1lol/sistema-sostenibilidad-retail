export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        plataformaFondo: '#F5F5F7',
        plataformaTexto: '#1D1D1F',
        plataformaSecundario: '#86868B',
        plataformaBorde: '#E8E8ED',
        plataformaAzul: '#0071E3',
        plataformaCorporativo: '#1D1D1F',
        plataformaExito: '#34C759',
        plataformaAdvertencia: '#FF9500',
        plataformaPeligro: '#FF3B30',
        superficie: {
          DEFAULT: '#FFFFFF',
          secundaria: '#F9F9FB',
          terciaria: '#F2F2F7'
        }
      },
      fontFamily: {
        sans: [
          '"Inter"',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'system-ui',
          'sans-serif'
        ]
      },
      fontSize: {
        'titulo-pagina': ['30px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.025em' }],
        'titulo-seccion': ['20px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.015em' }],
        'titulo-tarjeta': ['16px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.01em' }],
        'cuerpo': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'cuerpo-pequeno': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'etiqueta': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'subtexto': ['11px', { lineHeight: '1.4', fontWeight: '400' }]
      },
      borderRadius: {
        'sm-token': '8px',
        'md-token': '12px',
        'lg-token': '16px',
        'xl-token': '20px'
      },
      boxShadow: {
        'xs-token': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'sm-token': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'md-token': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'lg-token': '0 16px 48px rgba(0, 0, 0, 0.12)'
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.25, 0.1, 0.25, 1)'
      },
      transitionDuration: {
        '180': '180ms'
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem'
      }
    }
  },
  plugins: []
};
