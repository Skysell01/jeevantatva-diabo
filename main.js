// ⚠️ GOOGLE APPS SCRIPT CONFIGURATION (Set via .env or fallback below)
const GOOGLE_SHEET_WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbyOm28QPFz_7CEqy1_5Ix2OdpzNrq_7Tgn-K3zOttZ64PGFYsnxg5d6oo1NUPBgPB_2/exec'; 
const CRM_TOKEN = import.meta.env.VITE_CRM_TOKEN || 'M6JNcKxcNszQwNYZW';
const CRM_CHANNEL_ID = import.meta.env.VITE_CRM_CHANNEL_ID || 'AMT-DBT-SKYSKM';
const CRM_PRODUCT_ID = import.meta.env.VITE_CRM_PRODUCT_ID || '52'; 

document.addEventListener('DOMContentLoaded', () => {

  // 1. WhatsApp Float Button & Order Modal Popup
  const openModalBtn = document.getElementById('whatsappFloat');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const orderModal = document.getElementById('orderModal');

  if (openModalBtn && closeModalBtn && orderModal) {
    openModalBtn.addEventListener('click', () => {
      orderModal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => {
      orderModal.classList.remove('active');
    });

    // Close on clicking overlay outside the modal card
    orderModal.addEventListener('click', (e) => {
      if (e.target === orderModal) {
        orderModal.classList.remove('active');
      }
    });
  }

  // 2. Custom Status / Notification Modal (Duplicate / Success / Error)
  const statusModal = document.getElementById('statusModal');
  const closeStatusModalBtn = document.getElementById('closeStatusModalBtn');
  const statusModalActionBtn = document.getElementById('statusModalActionBtn');
  const statusModalIcon = document.getElementById('statusModalIcon');
  const statusModalTitle = document.getElementById('statusModalTitle');
  const statusModalMessage = document.getElementById('statusModalMessage');

  function showStatusModal(type, title, message) {
    if (!statusModal) {
      alert(message);
      return;
    }

    if (type === 'duplicate') {
      if (statusModalIcon) statusModalIcon.innerText = '⏳';
      if (statusModalTitle) statusModalTitle.innerText = title || 'पहले से सबमिट है!';
    } else if (type === 'success') {
      if (statusModalIcon) statusModalIcon.innerText = '✅';
      if (statusModalTitle) statusModalTitle.innerText = title || 'सफलतापूर्वक प्राप्त हुआ!';
    } else {
      if (statusModalIcon) statusModalIcon.innerText = '⚠️';
      if (statusModalTitle) statusModalTitle.innerText = title || 'सूचना';
    }

    if (statusModalMessage) statusModalMessage.innerText = message;
    statusModal.classList.add('active');
  }

  function hideStatusModal() {
    if (statusModal) {
      statusModal.classList.remove('active');
    }
  }

  if (closeStatusModalBtn) closeStatusModalBtn.addEventListener('click', hideStatusModal);
  if (statusModalActionBtn) statusModalActionBtn.addEventListener('click', hideStatusModal);
  if (statusModal) {
    statusModal.addEventListener('click', (e) => {
      if (e.target === statusModal) hideStatusModal();
    });
  }

  // 3. Order Form Submissions & Google Sheet Sync with 24-hr Duplicate Check
  const orderForms = document.querySelectorAll('.order-form-element');
  orderForms.forEach((form, index) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nameInput = form.querySelector('input[type="text"]');
      const phoneInput = form.querySelector('input[type="tel"]');
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!nameInput || !phoneInput) return;

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();

      if (!name || !phone) {
        showStatusModal('error', 'अधूरी जानकारी', 'कृपया अपना नाम और फ़ोन नंबर दर्ज करें!');
        return;
      }

      // Extract 10-digit phone number
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        showStatusModal('error', 'अमान्य नंबर', 'कृपया एक सही 10-अंकों का फ़ोन नंबर दर्ज करें!');
        return;
      }


      const formSource = form.closest('.modal-card') ? 'Modal Form' : (index === 0 ? 'Top Form' : 'Bottom Form');

      const originalBtnText = submitBtn ? submitBtn.innerText : 'ORDER NOW';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'प्रक्रिया जारी है...';
      }

      try {
        // Send to Google Sheet Webhook
        let sheetRes = null;
        if (GOOGLE_SHEET_WEBHOOK_URL && GOOGLE_SHEET_WEBHOOK_URL.trim() !== '') {
          const sheetParams = new URLSearchParams({
            name: name,
            phone: phone,
            cleanPhone: cleanPhone,
            formSource: formSource,
            _t: Date.now()
          });
          const targetSheetUrl = `${GOOGLE_SHEET_WEBHOOK_URL}${GOOGLE_SHEET_WEBHOOK_URL.includes('?') ? '&' : '?'}${sheetParams.toString()}`;
          try {
            const res = await fetch(targetSheetUrl, { cache: 'no-cache' });
            sheetRes = await res.json();
          } catch (err) {
            console.warn('Google Sheet fetch error:', err);
          }
        }

        // Duplicate Check strictly from Google Sheet response
        const isSheetDuplicate = sheetRes && (sheetRes.status === 'duplicate' || sheetRes.result === 'duplicate');

        if (isSheetDuplicate) {
          storedLeads[cleanPhone] = Date.now();
          localStorage.setItem('diabeet_submitted_leads', JSON.stringify(storedLeads));

          showStatusModal(
            'duplicate',
            'पहले से सबमिट है!',
            'आपने पहले ही सबमिट कर दिया है, कृपया 24 घंटे प्रतीक्षा करें। हमारे प्रतिनिधि आपसे जल्द ही संपर्क करेंगे।'
          );
        } else {
          // Save lead submission in localStorage
          storedLeads[cleanPhone] = Date.now();
          localStorage.setItem('diabeet_submitted_leads', JSON.stringify(storedLeads));

          // Trigger Meta Pixel Lead Event
          if (typeof window.fbq === 'function') {
            window.fbq('track', 'Lead', {
              content_name: 'Diabeet Order',
              value: 2490.00,
              currency: 'INR'
            });
          }

          showStatusModal(
            'success',
            'ऑर्डर दर्ज हुआ!',
            'धन्यवाद! आपका ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है। हम जल्द ही आपसे संपर्क करेंगे।'
          );

          nameInput.value = '';
          phoneInput.value = '';
          if (orderModal) {
            orderModal.classList.remove('active');
          }
        }
      } catch (error) {
        console.error('Submission error:', error);
        showStatusModal(
          'success',
          'ऑर्डर दर्ज हुआ!',
          'धन्यवाद! आपका विवरण सफलतापूर्वक प्राप्त हो गया है। हम जल्द ही आपसे संपर्क करेंगे।'
        );
        nameInput.value = '';
        phoneInput.value = '';
        if (orderModal) {
          orderModal.classList.remove('active');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalBtnText;
        }
      }
    });
  });

  // 4. Privacy Policy Toggle
  const togglePrivacyBtn = document.getElementById('togglePrivacyBtn');
  const privacyBox = document.getElementById('privacyBox');

  if (togglePrivacyBtn && privacyBox) {
    togglePrivacyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      privacyBox.classList.toggle('active');
    });
  }

});

