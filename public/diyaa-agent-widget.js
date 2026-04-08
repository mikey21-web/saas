/**
 * diyaa.ai Agent Widget
 * Embed this script on any website to add an AI chat button
 */

(function () {
  const config = window.DiyaaAgent || {}
  const {
    agentId = 'unknown',
    agentType = 'customersupport',
    businessName = 'Support',
    welcomeMessage = "Hi! I'm your AI assistant. How can I help?",
    primaryColor = '#e879f9',
    position = 'bottom-right',
    apiBase = 'https://diyaa.ai',
  } = config

  const container = document.createElement('div')
  container.id = 'diyaa-agent-widget'
  container.style.cssText = `
    position: fixed;
    ${position.includes('right') ? 'right' : 'left'}: 20px;
    bottom: 20px;
    width: 380px;
    max-width: 90vw;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 40px rgba(0,0,0,0.16);
    display: flex;
    flex-direction: column;
    font-family: system-ui, sans-serif;
    z-index: 999999;
  `

  const header = document.createElement('div')
  header.style.cssText = `
    padding: 16px;
    background: ${primaryColor};
    color: white;
    border-radius: 12px 12px 0 0;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  header.innerHTML = `<span>${businessName} AI Agent</span><button id="diyaa-close" style="background: none; border: none; color: white; cursor: pointer;">✕</button>`

  const chatArea = document.createElement('div')
  chatArea.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #f9f9f9;
  `

  const welcomeMsg = document.createElement('div')
  welcomeMsg.style.cssText = `padding: 12px; background: white; border-radius: 8px; border-left: 3px solid ${primaryColor}; font-size: 13px;`
  welcomeMsg.textContent = welcomeMessage
  chatArea.appendChild(welcomeMsg)

  const inputArea = document.createElement('div')
  inputArea.style.cssText = 'padding: 12px; border-top: 1px solid #eee; display: flex; gap: 8px;'

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = 'Type message...'
  input.style.cssText = 'flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; outline: none;'

  const sendBtn = document.createElement('button')
  sendBtn.textContent = 'Send'
  sendBtn.style.cssText = `padding: 8px 16px; background: ${primaryColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;`

  inputArea.appendChild(input)
  inputArea.appendChild(sendBtn)
  container.appendChild(header)
  container.appendChild(chatArea)
  container.appendChild(inputArea)

  const button = document.createElement('button')
  button.id = 'diyaa-agent-button'
  button.style.cssText = `
    position: fixed;
    ${position.includes('right') ? 'right' : 'left'}: 20px;
    bottom: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${primaryColor};
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    z-index: 999998;
    font-size: 24px;
  `
  button.innerHTML = '💬'

  let isOpen = false
  function toggle() {
    isOpen = !isOpen
    container.style.display = isOpen ? 'flex' : 'none'
    button.style.display = isOpen ? 'none' : 'block'
  }

  button.addEventListener('click', toggle)
  document.getElementById('diyaa-close')?.addEventListener('click', toggle)

  sendBtn.addEventListener('click', async () => {
    const msg = input.value.trim()
    if (!msg) return

    const userMsg = document.createElement('div')
    userMsg.style.cssText = `padding: 10px 12px; background: ${primaryColor}; color: white; border-radius: 8px; margin-top: 8px;`
    userMsg.textContent = msg
    chatArea.appendChild(userMsg)

    input.value = ''

    try {
      const res = await fetch(`${apiBase}/api/agents/${agentId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType, message: msg, channel: 'widget' }),
      })
      const data = await res.json()
      const reply = data.response || 'Got it!'
      const agentMsg = document.createElement('div')
      agentMsg.style.cssText = `padding: 10px 12px; background: white; border-left: 3px solid ${primaryColor}; border-radius: 8px; margin-top: 8px;`
      agentMsg.textContent = reply
      chatArea.appendChild(agentMsg)
      chatArea.scrollTop = chatArea.scrollHeight
    } catch (e) {
      console.error('Widget error:', e)
    }
  })

  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click() })

  if (document.body) {
    document.body.appendChild(button)
    document.body.appendChild(container)
    container.style.display = 'none'
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(button)
      document.body.appendChild(container)
      container.style.display = 'none'
    })
  }
})()
