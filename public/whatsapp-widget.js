/**
 * diyaa.ai WhatsApp Widget
 *
 * Usage:
 * <script>
 *   window.DiyaaWhatsAppWidget = {
 *     phoneNumber: '919876543210',
 *     agentName: 'Clothing Support',
 *     welcomeMessage: 'Hi! How can we help?'
 *   };
 * </script>
 * <script src="https://yourdomain.com/whatsapp-widget.js"></script>
 */

(function () {
  if (window.DiyaaWhatsAppWidgetLoaded) return
  window.DiyaaWhatsAppWidgetLoaded = true

  // Configuration
  const config = {
    phoneNumber: window.DiyaaWhatsAppWidget?.phoneNumber || '919876543210',
    agentName: window.DiyaaWhatsAppWidget?.agentName || 'Support',
    welcomeMessage:
      window.DiyaaWhatsAppWidget?.welcomeMessage ||
      'Hi! How can we help you?',
    position: window.DiyaaWhatsAppWidget?.position || 'bottom-right',
    backgroundColor: window.DiyaaWhatsAppWidget?.backgroundColor || '#25D366',
    textColor: window.DiyaaWhatsAppWidget?.textColor || '#ffffff',
  }

  // Validate phone number
  if (!config.phoneNumber) {
    console.error('DiyaaWhatsAppWidget: phoneNumber is required')
    return
  }

  // Inject styles
  const styles = `
    .diyaa-whatsapp-widget-button {
      position: fixed;
      ${config.position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      bottom: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: ${config.backgroundColor};
      color: ${config.textColor};
      border: none;
      cursor: pointer;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9998;
      transition: all 0.3s ease;
      font-weight: 600;
    }

    .diyaa-whatsapp-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .diyaa-whatsapp-widget-button:active {
      transform: scale(0.95);
    }

    .diyaa-whatsapp-widget-chat {
      position: fixed;
      ${config.position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      bottom: 104px;
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
      z-index: 9999;
      overflow: hidden;
      animation: slideUp 0.3s ease forwards;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .diyaa-whatsapp-widget-header {
      background-color: ${config.backgroundColor};
      color: ${config.textColor};
      padding: 16px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .diyaa-whatsapp-widget-header-info h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .diyaa-whatsapp-widget-header-info p {
      margin: 4px 0 0 0;
      font-size: 12px;
      opacity: 0.9;
    }

    .diyaa-whatsapp-widget-close {
      background: none;
      border: none;
      color: ${config.textColor};
      cursor: pointer;
      font-size: 20px;
      padding: 0;
      line-height: 1;
    }

    .diyaa-whatsapp-widget-close:hover {
      opacity: 0.8;
    }

    .diyaa-whatsapp-widget-body {
      padding: 16px;
    }

    .diyaa-whatsapp-widget-message {
      font-size: 14px;
      color: #333;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .diyaa-whatsapp-widget-cta {
      width: 100%;
      padding: 10px 16px;
      background-color: ${config.backgroundColor};
      color: ${config.textColor};
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .diyaa-whatsapp-widget-cta:hover {
      opacity: 0.9;
    }

    .diyaa-whatsapp-widget-footer {
      padding: 12px 16px;
      text-align: center;
      border-top: 1px solid #eee;
    }

    .diyaa-whatsapp-widget-footer a {
      font-size: 11px;
      color: #666;
      text-decoration: none;
      font-weight: 500;
    }

    .diyaa-whatsapp-widget-footer a:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .diyaa-whatsapp-widget-chat {
        width: calc(100vw - 32px);
        max-width: 320px;
      }
    }
  `

  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)

  // Create widget HTML
  function createWidget() {
    // Button
    const button = document.createElement('button')
    button.className = 'diyaa-whatsapp-widget-button'
    button.setAttribute('aria-label', `Chat with ${config.agentName}`)
    button.innerHTML = '💬'
    button.id = 'diyaa-whatsapp-button'

    // Chat bubble
    const chat = document.createElement('div')
    chat.className = 'diyaa-whatsapp-widget-chat'
    chat.id = 'diyaa-whatsapp-chat'
    chat.style.display = 'none'
    chat.innerHTML = `
      <div class="diyaa-whatsapp-widget-header">
        <div class="diyaa-whatsapp-widget-header-info">
          <h3>${config.agentName}</h3>
          <p>Usually responds instantly</p>
        </div>
        <button class="diyaa-whatsapp-widget-close" id="diyaa-whatsapp-close">✕</button>
      </div>
      <div class="diyaa-whatsapp-widget-body">
        <p class="diyaa-whatsapp-widget-message">${config.welcomeMessage}</p>
        <button class="diyaa-whatsapp-widget-cta" id="diyaa-whatsapp-open">
          💬 Open WhatsApp
        </button>
      </div>
      <div class="diyaa-whatsapp-widget-footer">
        <a href="https://diyaa.ai" target="_blank" rel="noopener noreferrer">
          Powered by diyaa.ai
        </a>
      </div>
    `

    // Add to page
    document.body.appendChild(button)
    document.body.appendChild(chat)

    // Event listeners
    button.addEventListener('click', () => {
      const chatBox = document.getElementById('diyaa-whatsapp-chat')
      chatBox.style.display =
        chatBox.style.display === 'none' ? 'block' : 'none'
    })

    document.getElementById('diyaa-whatsapp-close')?.addEventListener('click', () => {
      document.getElementById('diyaa-whatsapp-chat').style.display = 'none'
    })

    document
      .getElementById('diyaa-whatsapp-open')
      ?.addEventListener('click', () => {
        const message = 'Hi, I\'m interested in learning more about your products!'
        const encodedMessage = encodeURIComponent(message)
        const whatsappUrl = `https://wa.me/${config.phoneNumber}?text=${encodedMessage}`
        window.open(whatsappUrl, '_blank')
      })
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget)
  } else {
    createWidget()
  }
})()
