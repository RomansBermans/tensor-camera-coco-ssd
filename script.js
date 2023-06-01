const button = document.getElementById('button')
const video = document.getElementById('video')
const overlay = document.getElementById('overlay')
const stats = document.getElementById('stats')
const info = document.getElementById('info')


async function predict(model) {
  const startTime = performance.now()
  const predictions = await model.detect(video)
  const modelPredictTime = performance.now() - startTime
  stats.innerText = `PT: ${Math.round(modelPredictTime)}MS ${Math.round(1000 / modelPredictTime)}FPS`
    
  overlay.replaceChildren()
  predictions
    .filter(prediction => prediction.score > 0.5)
    .forEach(prediction => {
      const highlighter = document.createElement('div')
      highlighter.style = `left:${prediction.bbox[0]}px; top:${prediction.bbox[1]}px; width:${prediction.bbox[2]}px; height:${prediction.bbox[3]}px;`

      const label = document.createElement('span')
      label.innerText = `${Math.round(prediction.score * 100)}% ${prediction.class} `

      highlighter.append(label)
    
      overlay.append(highlighter)
    })
  
  window.requestAnimationFrame(() => predict(model))
}


async function load() {
  const startTime = performance.now()
  const model = await cocoSsd.load()
  const modelLoadTime = performance.now() - startTime
  
  return { model, modelLoadTime }
}


if (navigator.mediaDevices?.getUserMedia) {
  button.innerText = 'Enable Camera'
  button.addEventListener('click', async event => {
    let videoSrc
    try {
      videoSrc = await navigator.mediaDevices.getUserMedia({ video: true })
      event.target.remove()
    } catch (err) {
      button.innerText = 'Camera Not Enabled (Try Again Or Check Settings)'
      return
    }
    
    stats.innerText = 'Loading Model...'
    const { model, modelLoadTime } = await load()
    
    stats.innerText = 'Predicting...'
    video.onloadeddata = () => predict(model, modelLoadTime)
    video.srcObject = videoSrc
    video.hidden = false
    
    info.innerText = `LD: ${Math.round(modelLoadTime)}MS MM: ${(tf.memory().numBytes / 1000000).toFixed(2)}MB (${tf.memory().numTensors})`
  })
  button.disabled = false
} else {
  button.innerText = 'Camera Not Supported'
}
