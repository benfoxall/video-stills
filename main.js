import { html, render } from 'https://unpkg.com/lit-html@dev?module'


const frames = [];

const load = (_n) => {
  const n = parseInt(_n, 10)

  // think this might be resetting the canvas each time…
  setState({current: n + 1})

  const f = frames[n];
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')

  ctx.putImageData(f, 0, 0)

}

window.fff = frames

const template = ({
  name, total, current, loaded, message, width, height
}) => html`
<div class="container">
  <div class="video">
    <canvas width=${width} height=${height} />
  </div>
  <div class="controls">
    <h2 class="name">
      <a href="${name}">${name}</a>
    </h2>
    <span class="frame">
      ${current}<span class="extra">${total && `/${total}`}</span>
    </span>
    ${message ? message : ''}
    ${
      loaded && html`
        <input class="range" type="range" min="0" max="${total - 1}" step="1" value="0" 
          @input=${e => load(e.target.value)}
      />`
    }
  </div>
</div>`

const state = {}

const setState = (update) => {
  Object.assign(state, update)
  render(template(state), document.body);
}

setState()



async function loadVideo(url) {

  setState({name: url, message: "loading"})
  
  const request = await fetch(url)

  setState({name: url, message: "decoding"})

  // this could go into indexeddb too, meh
  const u8 = new Uint8Array(await request.arrayBuffer())

  const reader = new MP4Reader(new Bytestream(u8))

  reader.read()

  const video = reader.tracks[1]

  const {width, height} = video.trak.tkhd;
  const sampleCount = video.getSampleCount();

  setState({total: sampleCount, current: 0, width, height})

  const decoder = new Decoder({rgb: true})

  let resolve;
  const wait = new Promise((r) => resolve = r)

  let i = 0;
  let count = sampleCount;
  decoder.onPictureDecoded = (buffer, width, height) => {
    const imageData = new ImageData(Uint8ClampedArray.from(buffer), width, height)

    frames[i++] = imageData;

    setState({current: sampleCount - count})

    if(--count === 0) {

      setState({loaded: true, message: false, current: 0})

      resolve()
    }
  }

  const avc = video.trak.mdia.minf.stbl.stsd.avc1.avcC
  const sps = avc.sps[0]
  const pps = avc.pps[0]

  decoder.decode(sps)
  decoder.decode(pps)

  for(let i = 0; i < sampleCount; i++) {
    for(let nal of video.getSampleNALUnits(i)) {
      decoder.decode(nal)

      // not sure if this is necessary
      await new Promise(r => setTimeout(r, 10))
    }
  }

  return wait
}

console.time('decoding')
loadVideo('./numbers.b.mp4')
  .then(() => {
    console.timeEnd('decoding')
  })
