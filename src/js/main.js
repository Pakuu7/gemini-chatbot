const typingForm = document.querySelector('.typing-area__typing-form')
const typingFormInput = document.querySelector('.typing-area__typing-input')
const chatList = document.querySelector('.chat-list')
const suggestions = document.querySelectorAll('.header__suggestion')
const toggleThemeButton = document.querySelector('#toggle-theme-button')
const deleteChatButton = document.querySelector('#delete-chat-button')

let userMessage = null
let isResponseGenerating = false

const GEMINI_API_KEY = 'AIzaSyAksl4_LHm1Ien4fGCp7uiswlIBvES53ZA'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

const loadLocalstorageData = () => {
	const savedChats = localStorage.getItem('savedChats')
	const islightMode = localStorage.getItem('themeColor') === 'light_mode'
	document.body.classList.toggle('light_mode', islightMode)
	toggleThemeButton.innerText = islightMode ? 'dark_mode' : 'light_mode'
	chatList.innerHTML = savedChats || ''
	document.body.classList.toggle('hide-header', savedChats)
	window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

const createMessageElement = (content, ...classes) => {
	const div = document.createElement('div')
	div.classList.add('chat-list__message-content', ...classes)
	div.innerHTML = content
	return div
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
	let currentWordIndex = 0
	const words = text.split(' ')

	const typingInterval = setInterval(() => {
		textElement.innerHTML += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++]
		incomingMessageDiv.querySelector('.chat-list__icon--copy').classList.add('hide')

		if (currentWordIndex === words.length) {
			clearInterval(typingInterval)
			isResponseGenerating = false
			localStorage.setItem('savedChats', chatList.innerHTML)
			incomingMessageDiv.querySelector('.chat-list__icon--copy').classList.remove('hide')
		}
		window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
	}, 75)
}

const generateAPIResponse = async incomingMessageDiv => {
	const textElement = incomingMessageDiv.querySelector('.chat-list__text')

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [
					{
						role: 'user',
						parts: [{ text: userMessage }],
					},
				],
			}),
		})

		const data = await response.json()
		if (!response.ok) throw new Error(data.error.message)
		const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1')
		showTypingEffect(apiResponse, textElement, incomingMessageDiv)
	} catch (error) {
		isResponseGenerating = false
		textElement.innerText = error.message
		textElement.classList.add('error')
	} finally {
		incomingMessageDiv.classList.remove('loading')
	}
}

const showLoadingAnimation = () => {
	const html = `<div class="chat-list__message-content">
					<img src="dist/img/gemini.svg" alt="Gemini Image" class="chat-list__avatar">
					<p class="chat-list__text"></p>
					<div class="chat-list__loading-indicator">
						<div class="chat-list__loading-bar"></div>
						<div class="chat-list__loading-bar"></div>
						<div class="chat-list__loading-bar"></div>
					</div>
				</div>
				<span onclick="copyMessage(this)" class="chat-list__icon chat-list__icon--copy material-symbols-rounded">content_copy</span>`

	const incomingMessageDiv = createMessageElement(html, 'chat-list__incoming', 'loading')
	chatList.appendChild(incomingMessageDiv)
	window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })

	generateAPIResponse(incomingMessageDiv)
}

const copyMessage = copyIcon => {
	const messageText = copyIcon.parentElement.querySelector('.chat-list__text').innerText
	navigator.clipboard.writeText(messageText)
	copyIcon.innerText = 'done'
	setTimeout(() => (copyIcon.innerText = 'content_copy'), 1000)
}

const handleOutgoingChat = () => {
	userMessage = typingFormInput.value.trim() || userMessage
	if (!userMessage || isResponseGenerating) return

	isResponseGenerating = true

	const html = `<div class="chat-list__message-content">
					<img src="dist/img/user.jpg" alt="User Image" class="chat-list__avatar">
					<p class="chat-list__text">${userMessage}</p>
				</div>`

	const outGoingMessageDiv = createMessageElement(html, 'chat-list__outgoing')
	chatList.appendChild(outGoingMessageDiv)
	typingForm.reset()
	window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })

	document.body.classList.add('hide-header')
	setTimeout(showLoadingAnimation, 500)
}

suggestions.forEach(suggestion => {
	suggestion.addEventListener('click', () => {
		userMessage = suggestion.querySelector('.header__text').innerText
		handleOutgoingChat()
	})
})

toggleThemeButton.addEventListener('click', () => {
	const islightMode = document.body.classList.toggle('light_mode')
	localStorage.setItem('themeColor', islightMode ? 'light_mode' : 'dark_mode')
	toggleThemeButton.innerText = islightMode ? 'dark_mode' : 'light_mode'
})

deleteChatButton.addEventListener('click', () => {
	if (confirm('Are you sure you want to delete all messages?')) {
		localStorage.removeItem('savedChats')
		loadLocalstorageData()
	}
})

typingForm.addEventListener('submit', e => {
	e.preventDefault()

	handleOutgoingChat()
})

loadLocalstorageData()
