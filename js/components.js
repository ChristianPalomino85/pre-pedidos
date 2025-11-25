/* ============================================
   AZALEIA - Componentes JavaScript Modernos
   Versión 2.0
   ============================================ */

// ========== LAZY LOADING DE IMÁGENES ==========
class LazyImageLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    };
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        this.options
      );
      this.observeImages();
    } else {
      // Fallback para navegadores antiguos
      this.loadAllImages();
    }
  }

  observeImages() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    images.forEach(img => {
      if (img.dataset.src) {
        this.observer.observe(img);
      }
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    // Mostrar placeholder mientras carga
    img.style.opacity = '0.3';

    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.style.opacity = '1';
      img.style.transition = 'opacity 0.3s ease';
      img.removeAttribute('data-src');
      img.classList.add('lazy-loaded');
    };
    tempImg.onerror = () => {
      img.src = 'img/producto-sin-imagen.jpg';
      img.style.opacity = '1';
    };
    tempImg.src = src;
  }

  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => this.loadImage(img));
  }
}

// ========== SISTEMA DE NOTIFICACIONES TOAST ==========
class ToastNotification {
  constructor() {
    this.container = this.createContainer();
    this.toasts = [];
  }

  createContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 4000) {
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Animar entrada
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Auto cerrar
    if (duration > 0) {
      setTimeout(() => this.close(toast), duration);
    }

    return toast;
  }

  createToast(message, type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      opacity: 0;
      transform: translateX(50px);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      border-left: 4px solid ${colors[type]};
      pointer-events: auto;
      cursor: pointer;
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${colors[type]};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
      flex-shrink: 0;
    `;
    icon.textContent = icons[type];

    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      font-size: 14px;
      color: #333;
      line-height: 1.4;
    `;
    content.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.color = '#333';
    closeBtn.onmouseout = () => closeBtn.style.color = '#999';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.close(toast);
    };

    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeBtn);

    toast.onclick = () => this.close(toast);

    return toast;
  }

  close(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
      const index = this.toasts.indexOf(toast);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    }, 300);
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// ========== MODAL LIGHTBOX PARA IMÁGENES ==========
class ImageLightbox {
  constructor() {
    this.lightbox = null;
    this.currentImage = null;
    this.createLightbox();
    this.bindEvents();
  }

  createLightbox() {
    this.lightbox = document.createElement('div');
    this.lightbox.id = 'image-lightbox';
    this.lightbox.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.3s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const img = document.createElement('img');
    img.id = 'lightbox-image';
    img.style.cssText = `
      max-width: 100%;
      max-height: 90vh;
      border-radius: 8px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
      object-fit: contain;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: -50px;
      right: -50px;
      background: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 30px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.transform = 'scale(1.1)';
    closeBtn.onmouseout = () => closeBtn.style.transform = 'scale(1)';
    closeBtn.onclick = () => this.close();

    content.appendChild(img);
    content.appendChild(closeBtn);
    this.lightbox.appendChild(content);
    document.body.appendChild(this.lightbox);
  }

  bindEvents() {
    // Cerrar al hacer clic fuera de la imagen
    this.lightbox.onclick = (e) => {
      if (e.target === this.lightbox) {
        this.close();
      }
    };

    // Cerrar con tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.lightbox.style.display === 'flex') {
        this.close();
      }
    });
  }

  open(imageSrc) {
    const img = this.lightbox.querySelector('#lightbox-image');
    img.src = imageSrc;
    this.lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.lightbox.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ========== LOADING SPINNER ==========
class LoadingSpinner {
  constructor() {
    this.overlay = this.createOverlay();
  }

  createOverlay() {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div style="text-align: center;">
          <div class="spinner-az spinner-lg"></div>
          <p style="color: white; margin-top: 20px; font-size: 16px;" id="loading-text">Cargando...</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  show(message = 'Cargando...') {
    const text = this.overlay.querySelector('#loading-text');
    if (text) text.textContent = message;
    this.overlay.style.display = 'flex';
  }

  hide() {
    this.overlay.style.display = 'none';
  }
}

// ========== FORM VALIDATION ==========
class FormValidator {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (!this.form) return;
    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => {
      if (!this.validateForm()) {
        e.preventDefault();
      }
    });

    // Validación en tiempo real
    const inputs = this.form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) {
          this.validateField(input);
        }
      });
    });
  }

  validateForm() {
    const inputs = this.form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Este campo es requerido';
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Ingresa un email válido';
      }
    }

    // Min length validation
    if (field.hasAttribute('minlength')) {
      const minLength = parseInt(field.getAttribute('minlength'));
      if (value.length < minLength) {
        isValid = false;
        errorMessage = `Mínimo ${minLength} caracteres`;
      }
    }

    // Pattern validation
    if (field.hasAttribute('pattern') && value) {
      const pattern = new RegExp(field.getAttribute('pattern'));
      if (!pattern.test(value)) {
        isValid = false;
        errorMessage = field.getAttribute('title') || 'Formato inválido';
      }
    }

    this.setFieldState(field, isValid, errorMessage);
    return isValid;
  }

  setFieldState(field, isValid, errorMessage) {
    const errorElement = field.parentElement.querySelector('.form-error-az');

    if (isValid) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      if (errorElement) {
        errorElement.remove();
      }
    } else {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');

      if (!errorElement) {
        const error = document.createElement('span');
        error.className = 'form-error-az';
        error.textContent = errorMessage;
        field.parentElement.appendChild(error);
      } else {
        errorElement.textContent = errorMessage;
      }
    }
  }
}

// ========== TOOLTIP SIMPLE ==========
class SimpleTooltip {
  constructor() {
    this.tooltip = this.createTooltip();
    this.bindEvents();
  }

  createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'simple-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      white-space: nowrap;
      max-width: 300px;
    `;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  bindEvents() {
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.show(target, target.getAttribute('data-tooltip'));
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.hide();
      }
    });
  }

  show(element, text) {
    this.tooltip.textContent = text;
    const rect = element.getBoundingClientRect();

    this.tooltip.style.left = rect.left + (rect.width / 2) - (this.tooltip.offsetWidth / 2) + 'px';
    this.tooltip.style.top = rect.top - this.tooltip.offsetHeight - 8 + 'px';
    this.tooltip.style.opacity = '1';
  }

  hide() {
    this.tooltip.style.opacity = '0';
  }
}

// ========== SIDEBAR TOGGLE ==========
function initSidebarToggle() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  if (!sidebar || !toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  });

  // Restaurar estado
  if (localStorage.getItem('sidebarCollapsed') === 'true') {
    sidebar.classList.add('collapsed');
  }
}

// ========== TABLA CON FILTRO ==========
function initTableFilter(tableId, inputId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);

  if (!input || !table) return;

  input.addEventListener('input', (e) => {
    const filter = e.target.value.toLowerCase();
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(filter) ? '' : 'none';
    });
  });
}

// ========== COPIAR AL PORTAPAPELES ==========
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    window.azToast?.success('Copiado al portapapeles');
    return true;
  } catch (err) {
    console.error('Error al copiar:', err);
    window.azToast?.error('Error al copiar');
    return false;
  }
}

// ========== FORMATEO DE NÚMEROS ==========
function formatNumber(num, decimals = 2) {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

function formatCurrency(num, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency
  }).format(num);
}

// ========== DEBOUNCE UTILITY ==========
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ========== INICIALIZACIÓN GLOBAL ==========
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar componentes globales
  window.azLazyLoader = new LazyImageLoader();
  window.azToast = new ToastNotification();
  window.azLightbox = new ImageLightbox();
  window.azLoader = new LoadingSpinner();
  window.azTooltip = new SimpleTooltip();

  // Inicializar sidebar toggle
  initSidebarToggle();

  // Auto-activar lightbox en imágenes con clase
  document.querySelectorAll('.lightbox-trigger').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      window.azLightbox.open(img.src);
    });
  });

  // Log para debug
  console.log('✓ Componentes Azaleia cargados correctamente');
});

// Exportar para uso global
window.AzComponents = {
  LazyImageLoader,
  ToastNotification,
  ImageLightbox,
  LoadingSpinner,
  FormValidator,
  SimpleTooltip,
  copyToClipboard,
  formatNumber,
  formatCurrency,
  debounce,
  initTableFilter
};
