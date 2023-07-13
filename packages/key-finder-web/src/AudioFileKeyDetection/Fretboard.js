import { h, Component } from 'preact';
class Fretboard extends Component {
  constructor(props) {
    super(props);
    this.numberOfFrets = 22;
    this.width = props.canvas.width;
    this.canvas = props.canvas;
    this.theme = props.theme;
    this.ratio = 0.94;
    this.frets = [];
    this.drawFretboard();
    this.drawFret = this.drawFret.bind(this);
  }

  drawFret = (entry) => {
    entry.draw(this.theme);
  };

  drawScale(scale, keySignatureNumericValue, fromString = 6, span = 8) {
    var pos = keySignatureNumericValue;
    var string = fromString - 1;
    var step = 0;

    do {
      if (step === 0) {
        this.frets[pos].mark(string, this.theme.fundamental);
      } else {
        this.frets[pos].mark(string, this.theme.scale); // Pass the theme.scale color
      }
      pos += scale[step];
      step++;
      if (step >= scale.length) {
        step = 0;
      }
      if (pos > keySignatureNumericValue + 3) {
        pos -= string === 2 ? 4 : 5;
        string--;
      }
    } while (string >= 0 && --span > 0);
  }

  drawFretboard() {
    var from = this.width;
    for (let i = 0; i < this.numberOfFrets; i++) {
      var width = from * (1 - this.ratio);
      this.frets[i] = new Fret(
        this.width - from,
        width,
        this.canvas,
        null,
        this.theme // Pass the theme object
      );
      if ([3, 5, 7, 9, 12, 15, 17, 19, 21].indexOf(i + 1) >= 0) {
        this.frets[i].dot = true;
      } else {
        this.frets[i].pallino = false;
      }
      from -= width;
    }

    this.frets.forEach(this.drawFret.bind(this)); // Bind 'this' to the drawFret function
  }

  render() {
    return null;
  }
}

class Fret {
  constructor(start, width, canvas, dot, theme) {
    this.start = start;
    this.width = width;
    this.canvas = canvas;
    this.dot = dot;
    this.theme = theme; // Add the theme property
    this.ctx = canvas.getContext('2d');
  }

  draw() {
    const { ctx, start, width, canvas, dot, theme } = this;
    ctx.fillStyle = theme.neck;
    ctx.fillRect(start, 0, width, canvas.height);
    if (dot === true) {
      ctx.fillStyle = theme.dot;
      ctx.arc(start + width / 2, canvas.height / 2, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = theme.fret;
    ctx.fillRect(start + width - 3, 0, 3, canvas.height);
    ctx.fillStyle = theme.string;
    for (let string = 0; string < 6; string++) {
      ctx.fillRect(start, this.findString(string), width, 2);
    }
  }

  mark(string, color) {
    this.ctx.beginPath();
    color = typeof color === 'undefined' ? this.theme.scale : color;
    this.ctx.fillStyle = color;
    this.ctx.arc(
      this.start + this.width / 2,
      this.findString(string),
      7,
      0,
      2 * Math.PI
    );
    this.ctx.fill();
  }

  findString(number) {
    return 5 + 15 * number;
  }
}

const theme = {
  neck: '#221709',
  dot: '#808080',
  fret: '#e2c196',
  string: '#fcf8f3',
  fundamental: '#87deb8',
  scale: '#87adde',
};

export default Fretboard;
