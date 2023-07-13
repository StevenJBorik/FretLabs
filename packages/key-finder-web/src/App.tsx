import { h, Fragment, Component } from 'preact';
import { Router, Link } from 'preact-router';
import Navigation from './Navigation';
import AudioFileKeyDetection from './AudioFileKeyDetection';
import Settings from './Settings';
import About from './About';
import { CanvasContext } from './FretBoardContext';

import './App.css';

class App extends Component {
  canvasRef = null;

  componentDidMount() {}

  render() {
    return (
      <>
        <div class="top-bar">
          <div class="app-logo">
            <Link href="/">keyfinder</Link>
          </div>
          <Navigation />
        </div>
        <div class="app-wrapper">
          <CanvasContext.Provider value={this.canvasRef}>
            <Router>
              <AudioFileKeyDetection path="/file" />
              <Settings path="/settings" />
              <About path="/about" />
            </Router>
          </CanvasContext.Provider>
        </div>
        <canvas
          ref={(ref) => (this.canvasRef = ref)}
          id="theCanvas"
          width="1000"
          height="90"
          style="border:0px solid #000000;"
        >
          Your browser does not support the canvas tag.
        </canvas>
      </>
    );
  }
}

export default App;
