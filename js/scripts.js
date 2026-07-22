/* Credify Capital - scripts.js */

function validDigits(obj, maxlen) {
  if (!obj || obj.value === undefined || obj.value === null) return;
  var val = obj.value;
  
  // Identify if it is a text-only or name-based field
  var isText = false;
  if (obj.classList && (obj.classList.contains('LettersOnlyDot') || obj.id === 'First_Name' || obj.id === 'Last_Name' || obj.id === 'Email_ID' || obj.id === 'Message')) {
    isText = true;
  }

  if (isText) {
    if (val.length > maxlen) {
      obj.value = val.slice(0, maxlen);
    }
  } else {
    // Numeric context
    if (obj.id === 'intrest_rate' || obj.name === 'intrest_rate') {
      // Allow only digits and one decimal dot
      val = val.replace(/[^0-9.]/g, '');
      var parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }
      var dotIndex = val.indexOf('.');
      if (dotIndex !== -1) {
        var integerPart = val.slice(0, dotIndex).replace(/[^0-9]/g, '');
        var decimalPart = val.slice(dotIndex + 1).replace(/[^0-9]/g, '');
        if (integerPart.length > maxlen) {
          integerPart = integerPart.slice(0, maxlen);
        }
        if (decimalPart.length > 2) {
          decimalPart = decimalPart.slice(0, 2);
        }
        obj.value = integerPart + '.' + decimalPart;
      } else {
        var cleaned = val.replace(/[^0-9]/g, '');
        if (cleaned.length > maxlen) {
          cleaned = cleaned.slice(0, maxlen);
        }
        obj.value = cleaned;
      }
    } else if (obj.id === 'loan_amount' || obj.name === 'loan_amount') {
      // Allow only digits and commas
      var cleaned = val.replace(/[^0-9,]/g, '');
      var digitCount = 0;
      var finalVal = "";
      for (var i = 0; i < cleaned.length; i++) {
        if (cleaned[i] >= '0' && cleaned[i] <= '9') {
          if (digitCount < maxlen) {
            finalVal += cleaned[i];
            digitCount++;
          }
        } else if (cleaned[i] === ',') {
          finalVal += cleaned[i];
        }
      }
      obj.value = finalVal;
    } else {
      // General digits only (e.g. tenure)
      var cleaned = val.replace(/[^0-9]/g, '');
      if (cleaned.length > maxlen) {
        cleaned = cleaned.slice(0, maxlen);
      }
      obj.value = cleaned;
    }
  }
}

window.validDigits = validDigits;

(function () {
  function initMobileMenu() {
    var menuBtn = document.getElementById('mobile-menu-btn');
    var menuPanel = document.getElementById('mobile-menu-panel');
    var menuIcon = document.getElementById('mobile-menu-icon');
    if (menuBtn && menuPanel) {
      // Avoid adding multiple listeners if the script is loaded multiple times or already configured
      if (menuBtn.dataset.menuInitialized) return;
      menuBtn.dataset.menuInitialized = "true";

      menuBtn.addEventListener('click', function () {
        var isOpen = !menuPanel.classList.contains('hidden');
        menuPanel.classList.toggle('hidden');
        menuBtn.setAttribute('aria-expanded', String(!isOpen));
        if (menuIcon) {
          menuIcon.textContent = isOpen ? 'menu' : 'close';
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }
})();
