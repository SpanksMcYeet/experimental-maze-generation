let r = document.getElementById('run')
let v = document.getElementById('ex')
let x = document.getElementById('reset')
let s = document.getElementById('status')
let t = document.getElementById('total')
let c = document.getElementById('canvas')
let ctx = c.getContext('2d')
let width = 40
let height = 40
let pixelSize = 10
c.width = pixelSize * width
c.height = pixelSize * height
ctx.scale(pixelSize, pixelSize)

const Maze = class {
  constructor(width, height, randomDigData, borderDigData, minimumWalls, centerDig, removeSingles) {
    this.width = width
    this.height = height
    this.randomDiggers = randomDigData
    this.borderDiggers = borderDigData
    this.minWalls = minimumWalls
    this.centerDig = centerDig
    this.removeSingles = removeSingles
    this.map = Array(this.height).fill().map(a => new Array(this.width).fill(true))
    
    this.prevDir = []
    this.newDir = []
  }
  init() {
    this.dig(this.randomDiggers, this.centerDig ? 'center' : 'none')
    this.dig(this.borderDiggers, 'border')
    if (this.removeSingles) this.purgeFrags()
    this.totalWalls(this.map)
  }
  totalWalls() {
    let totalWalls = 0
    for (let [iy, y] of this.map.entries()) {
      for (let [ix, x] of y.entries()) {
        if (ix > 0 && ix < this.width - 1 && iy > 0 && iy < this.height - 1 && this.map[iy][ix]) {
          let sides = [
            this.map[iy][ix - 1],  // left
            this.map[iy][ix + 1],  // right
            this.map[iy - 1][ix],  // top
            this.map[iy + 1][ix],  // bottom
          ]
          if (sides.filter(a => a))
            totalWalls++
        }
      }
    }
    t.textContent = totalWalls
    return totalWalls
  }
  purgeFrags() {
    ctx.fillStyle = '#ffffff'
    for (let [iy, y] of this.map.entries()) {
      for (let [ix, x] of y.entries()) {
        if (ix > 1 && ix < this.width - 1 && iy > 1 && iy < this.height - 1 && this.map[iy][ix]) {
          let sides = [
            this.map[iy][ix - 1],  // left
            this.map[iy][ix + 1],  // right
            this.map[iy - 1][ix],  // top
            this.map[iy + 1][ix],  // bottom
          ]
          if (sides.every(a => !a)) {
            ctx.fillRect(ix, iy, 1, 1)
            this.map[iy][ix] = false
          }
        }
      }
    }
  }
  dig([maxLength, maxTunnels, maxDiggers], preference) {
    console.log(maxLength, maxTunnels, maxDiggers, preference)
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < maxDiggers; i++) {
      let pos = {}
      // Determine where we prefer to dig
      switch(preference) {
        case 'none': // Dig from any random point in the map
          pos = {
            x: Math.floor(Math.random() * this.width),
            y: Math.floor(Math.random() * this.height),
          }
          break
        case 'center': // Dig exclusively from the center
          if (this.width % 2 === 0 && this.height % 2 === 0) {
            let random = Math.random() <= 0.5 ? Math.floor(Math.random() * 4) : -Math.floor(Math.random() * 4)
            pos = [
              { x: Math.floor(this.width * 0.5) + random, y: Math.floor(this.height * 0.5) + random },
              { x: Math.ceil(this.width * 0.5) + random, y: Math.ceil(this.height * 0.5) + random },
              { x: Math.floor(this.width * 0.5) + random, y: Math.ceil(this.height * 0.5) + random },
              { x: Math.ceil(this.width * 0.5) + random, y: Math.floor(this.height * 0.5) + random },
            ][Math.floor(Math.random() * 4)]
          } else {
            pos = {
              x: this.width * 0.5,
              y: this.height * 0.5,
            }
          }
          break
        case 'border': // Dig exclusively from the border
          pos = [
            { x: 1, y: Math.floor(Math.random() * this.height) }, 
            { x: this.width - 2, y: Math.floor(Math.random() * this.height) },
            { x: Math.floor(Math.random() * this.width), y: 1 },
            { x: Math.floor(Math.random() * this.width), y: this.height - 2 }
          ][Math.floor(Math.random() * 4)]
        default:
          pos = {
            x: Math.floor(Math.random() * this.width),
            y: Math.floor(Math.random() * this.height),
          }
          break
      }
      let directions = [
        [-1, 0], [1, 0], // left and right
        [0, -1], [0, 1], // up and down
      ]
      // Pick a random direction that isn't the same as the previous direction or the opposite direction from before
      this.newDir = this.prevDir.length > 0 ? directions.filter(a => a.every((b, c) => b !== this.prevDir[c]))[Math.floor(Math.random() * 2)] : directions[Math.floor(Math.random() * 4)]
      //this.newDir = directions[Math.floor(Math.random() * 4)]
      // Start digging
      console.log(this.newDir)
      for (let n = 0; n < maxTunnels; n++) {
        // Make sure we can still dig and we're within bounds
        if (maxLength <= 0 && (pos.x <= 0 && pos.x >= this.width - 1) && (pos.y <= 0 && pos.y >= this.height - 1)) continue
        // Pick how long we want our tunnel to be
        let ranLength = Math.floor(Math.random() * maxLength)
        for (let length = 0; length < ranLength; length++) {
          // Dig the tunnel
          if ((pos.x > 0 && pos.x < this.width - 1) && (pos.y > 0 && pos.y < this.height - 1)) {
            this.map[pos.y][pos.x] = false
            ctx.fillRect(pos.x, pos.y, 1, 1)
            pos.x += this.newDir[0]
            pos.y += this.newDir[1]
            // Make sure we don't go under the minimum wall cap
            if (this.totalWalls(this.map) <= this.minWalls) return
          }
        }
        this.prevDir = this.newDir
        this.newDir = directions.filter(a => a.every((b, c) => b !== this.prevDir[c]))[Math.floor(Math.random() * 2)]
      }
    }
  }
}
let applyValues = values => {
  for (let [i, value] of values.entries()) {
    if (typeof value === 'object') {
      if (i % 2 === 0) {
        for (let [n, innerValue] of value.entries())
          document.getElementById(`w${n}`).value = innerValue
      } else {
        for (let [n, innerValue] of value.entries())
          document.getElementById(`b${n}`).value = innerValue
      }
    } else {
      if (i < 2 || i === 4) {
        document.getElementById(`c${i}`).value = value
      } else {
        document.getElementById(`c${i}`).checked = value
      }
    }
  }
}
x.onclick = () => {
  applyValues(['', '', ['', '', ''], ['', '', ''], '', false, false])
}
v.onclick = () => {
  applyValues([40, 40, [4, 15, 25], [4, 15, 80], 0, false, true])
}
r.onclick = () => {
  pixelSize = Math.floor(40 / document.getElementById('c0').value * 10)
  c.width = document.getElementById('c0').value * pixelSize
  c.height = document.getElementById('c1').value * pixelSize
  ctx.scale(pixelSize, pixelSize)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#000000'
  ctx.fillRect(1, 1, c.width / pixelSize - 2, c.height / pixelSize - 2)
  let map = new Maze(
    parseInt(document.getElementById('c0').value),
    parseInt(document.getElementById('c1').value),
    Array(3).fill().map((a, b) => parseInt(document.getElementById(`w${b}`).value)),
    Array(3).fill().map((a, b) => parseInt(document.getElementById(`b${b}`).value)),
    parseInt(document.getElementById('c4').value),
    document.getElementById('c5').checked,
    document.getElementById('c6').checked,
  )
  map.init()
}
