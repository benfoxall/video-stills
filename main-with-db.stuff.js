import { html, render } from 'https://unpkg.com/lit-html@dev?module'
import Dexie from 'https://unpkg.com/dexie?module'

var db = new Dexie("VideoFrames")

db.version(1).stores({
  videos: '++id, url',
  frames: '++, videoId, index, [videoId+index]'
})

db.open().catch(function (e) {
  console.error("Open failed: " + e.stack);
})

window.db = db;


async function loadVideo(url) {
  
  const request = await fetch(url)

  // this could go into indexeddb too, meh
  const u8 = new Uint8Array(await request.arrayBuffer())

  const reader = new MP4Reader(new Bytestream(u8))

  reader.read()

  const video = reader.tracks[1]

  ;window.ccccc = video;

  const {width, height} = video.trak.tkhd;
  const sampleCount = video.getSampleCount();

  const videoId = await db.videos.add({url, width, height, sampleCount})
  console.log("video: ", videoId)

  const decoder = new Decoder({rgb: true})

  let resolve;
  const wait = new Promise((r) => resolve = r)

  let i = 0;
  let count = sampleCount;
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  decoder.onPictureDecoded = (buffer, width, height) => {
    const index = i++;

    Object.assign(canvas, {width, height});
    
    const imageData = new ImageData(Uint8ClampedArray.from(buffer), width, height)
  
    ctx.putImageData(imageData,0,0)
  
    canvas.toBlob(async blob => {

      await db.frames.add({
        videoId,
        index,
        blob
      })

      if(--count === 0) {
        resolve(videoId)
      }
    })
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

// console.time('decoding')
// loadVideo('./video.broadway.mp4')
//   .then(id => {
//     console.timeEnd('decoding')
//     console.log("DONE!!!@@", id)
//   })


const display = async videoId => {

  const {url, width, height, sampleCount} = await db.videos.get(videoId)

  console.log("DISPLAUY", url)

}


display(36)



const template = ({
  name, total, current, message
}) => html`
<div class="container">
  <div class="video">
  </div>
  <div class="controls">
    <h2 class="name">
      ${name}
    </h2>
    <span class="frame">
      ${current}<span class="extra">/${total}</span>
    </span>
    ${
      message ? message : html`
        <input class="range" type="range" min="0" max="20" step="1" value="0" 
          @input=${e => console.log(e.target.value)}
      />`
    }
  </div>
</div>`


const ui = videoId => {
  render(template({
    name: './video.broadway.mp4',
    total: 20,
    current: 23,
    message: 'decoding'
  }), document.body);
}

ui();