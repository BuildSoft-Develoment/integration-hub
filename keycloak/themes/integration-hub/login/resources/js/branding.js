/*
 * White-label dinamico del login: trae el branding que el admin configuro en preferencias
 * (GET /api/branding, publico) y aplica logo + color primario en runtime. Con fallback silencioso
 * a los valores estaticos de brand.css si el backend no responde.
 *
 * URL del backend: en dev el login corre en :8180 y el backend en :8080; en prod suelen compartir
 * dominio detras de un proxy, asi que se usa una ruta relativa. Ajustar BRANDING_URL por deployment
 * si el backend esta en otro host.
 */
(function () {
  try {
    var BRANDING_URL =
      window.location.port === '8180'
        ? window.location.protocol + '//' + window.location.hostname + ':8080/api/branding'
        : '/api/branding';

    var applyLogo = function (logoDataUri) {
      var header = document.querySelector('#kc-header-wrapper');
      if (header) {
        header.style.backgroundImage = 'url("' + logoDataUri + '")';
      }
    };

    fetch(BRANDING_URL, { cache: 'no-store', mode: 'cors' })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (branding) {
        if (!branding) {
          return;
        }
        if (branding.primaryColor) {
          var root = document.documentElement;
          root.style.setProperty('--ih-brand', branding.primaryColor);
          root.style.setProperty('--ih-brand-strong', branding.primaryColor);
        }
        if (branding.logoDataUri) {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
              applyLogo(branding.logoDataUri);
            });
          } else {
            applyLogo(branding.logoDataUri);
          }
        }
      })
      .catch(function () {
        /* sin branding remoto: se mantienen los defaults estaticos del theme */
      });
  } catch (error) {
    /* no-op */
  }
})();
