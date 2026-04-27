(() => {
  const iconMap = {
    'icon-shopping-cart': ['bi', 'bi-cart'],
    'icon-heart': ['bi', 'bi-heart'],
    'icon-heart-filled': ['bi', 'bi-heart-fill'],
    'icon-search': ['bi', 'bi-search'],
    'icon-arrow-right': ['bi', 'bi-arrow-right'],
    'icon-arrow-left': ['bi', 'bi-arrow-left'],
    'icon-star': ['bi', 'bi-star-fill'],
    'icon-check': ['bi', 'bi-check'],
    'icon-x': ['bi', 'bi-x-lg'],
    'icon-gift': ['bi', 'bi-gift-fill'],
    'icon-user': ['bi', 'bi-person'],
    'icon-lock': ['bi', 'bi-lock'],
    'icon-mail': ['bi', 'bi-envelope'],
    'icon-trash-2': ['bi', 'bi-trash'],
    'icon-trash': ['bi', 'bi-trash'],
    'icon-zap': ['bi', 'bi-lightning-charge-fill'],
    'icon-alert-circle': ['bi', 'bi-exclamation-circle'],
    'icon-alert-triangle': ['bi', 'bi-exclamation-triangle'],
    'icon-chevron-left': ['bi', 'bi-chevron-left'],
    'icon-chevron-right': ['bi', 'bi-chevron-right'],
    'icon-clock': ['bi', 'bi-clock'],
    'icon-credit-card': ['bi', 'bi-credit-card'],
    'icon-edit': ['bi', 'bi-pencil-square'],
    'icon-eye': ['bi', 'bi-eye'],
    'icon-eye-off': ['bi', 'bi-eye-slash'],
    'icon-facebook': ['bi', 'bi-facebook'],
    'icon-twitter': ['bi', 'bi-twitter-x'],
    'icon-instagram': ['bi', 'bi-instagram'],
    'icon-youtube-play': ['bi', 'bi-youtube'],
    'icon-file-text': ['bi', 'bi-file-earmark-text'],
    'icon-notebook': ['bi', 'bi-journal-text'],
    'icon-docs': ['bi', 'bi-file-earmark-text'],
    'icon-package': ['bi', 'bi-box-seam'],
    'icon-box': ['bi', 'bi-box-seam'],
    'icon-plus': ['bi', 'bi-plus-lg'],
    'icon-minus': ['bi', 'bi-dash-lg'],
    'icon-printer': ['bi', 'bi-printer'],
    'icon-refresh-cw': ['bi', 'bi-arrow-clockwise'],
    'icon-rotate-ccw': ['bi', 'bi-arrow-counterclockwise'],
    'icon-shield': ['bi', 'bi-shield-check'],
    'icon-shopping-bag': ['bi', 'bi-bag'],
    'icon-smartphone': ['bi', 'bi-phone'],
    'icon-truck': ['bi', 'bi-truck'],
    'icon-home': ['bi', 'bi-house'],
    'icon-map-pin': ['bi', 'bi-geo-alt'],
    'icon-message-circle': ['bi', 'bi-chat-dots'],
    'icon-message-square': ['bi', 'bi-chat-square-text'],
    'icon-calendar': ['bi', 'bi-calendar3'],
    'icon-check-circle': ['bi', 'bi-check-circle'],
    'icon-x-circle': ['bi', 'bi-x-circle'],
    'icon-zoom-in': ['bi', 'bi-zoom-in'],
    'icon-cpu': ['bi', 'bi-cpu'],
    'icon-monitor': ['bi', 'bi-display'],
    'icon-mouse': ['bi', 'bi-mouse'],
    'icon-music': ['bi', 'bi-music-note-beamed'],
    'icon-video': ['bi', 'bi-camera-video'],
    'icon-watch': ['bi', 'bi-smartwatch'],
    'icon-activity': ['bi', 'bi-activity'],
    'icon-hard-drive': ['bi', 'bi-device-hdd'],
    'icon-mic': ['bi', 'bi-mic'],
    'icon-crosshair': ['bi', 'bi-crosshair'],
    'icon-headphones': ['bi', 'bi-headphones'],
    'icon-tv': ['bi', 'bi-tv'],
    'icon-log-out': ['bi', 'bi-box-arrow-right'],
    'icon-people': ['bi', 'bi-people'],
    'icon-briefcase': ['bi', 'bi-briefcase'],
    'icon-info': ['bi', 'bi-info-circle'],
    'icon-warning': ['bi', 'bi-exclamation-diamond'],
    'icon-success': ['bi', 'bi-check-circle'],
    'icon-primary': ['bi', 'bi-circle-fill'],
    'icon-ns-arrow-right': ['bi', 'bi-arrow-right']
  };

  const convertElement = (el) => {
    if (!el || !el.classList || !el.classList.length) {
      return;
    }

    const classes = Array.from(el.classList);
    let changed = false;

    classes.forEach((cls) => {
      const mapped = iconMap[cls];
      if (!mapped) {
        return;
      }

      el.classList.remove(cls);
      mapped.forEach((nextCls) => {
        el.classList.add(nextCls);
      });
      changed = true;
    });

    if (changed) {
      el.classList.add('icon-bridged');
    }
  };

  const convertTree = (root) => {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    convertElement(root);
    root.querySelectorAll('*').forEach(convertElement);
  };

  const boot = () => {
    convertTree(document.documentElement);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          convertElement(mutation.target);
          return;
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            convertTree(node);
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class']
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
