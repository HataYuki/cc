import './style.css'
import { haptic } from 'ios-haptics'

document.querySelector('#app').innerHTML = `
  <main>
    <button id="v1">Vibrate 1</button>
    <button id="v2">Vibrate 2</button>
    <button id="v3">Vibrate 3</button>
  </main>
  <div>
    <p id="counter">0</p>
    <p id="message">Tap a button to vibrate</p>
  </div>
`

const vBtn1 = document.querySelector('#v1')
const vBtn2 = document.querySelector('#v2')
const vBtn3 = document.querySelector('#v3')

const counter = document.querySelector('#counter')
const message = document.querySelector('#message')

// navigator.vibrate(200)

if(!vBtn1 || !vBtn2 || !vBtn3) {
  message.textContent = 'Buttons not found'
}

if(!counter) {
  message.textContent = 'Counter not found'
}

console.log(navigator.vibrate)
if (!navigator.vibrate && !navigator.mozVibrate && !navigator.webkitVibrate) {
  message.textContent = 'Vibration API not supported'
}


const incrementCounter = () => { 
  const currentCount = parseInt(counter.textContent, 10) || 0
  counter.textContent = currentCount + 1
}
const vibrate1 = () => {
  haptic()
  incrementCounter()
}

const vibrate2 = () => {
  haptic.confirm()
  incrementCounter()
}

const vibrate3 = () => {
  haptic.error()
  incrementCounter()
}

vBtn1.addEventListener("touchend", vibrate1)
vBtn2.addEventListener("touchend", vibrate2)
vBtn3.addEventListener("touchend", vibrate3)