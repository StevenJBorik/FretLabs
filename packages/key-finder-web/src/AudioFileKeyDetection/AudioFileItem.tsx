import { h, Component } from 'preact';
import { keyFinderUtils, audioUtils } from '../Utils';
import { keysNotation } from '../defaults';
import CircleOfFifths from '../CircleOfFifths';
import Fretboard from './Fretboard';

import './AudioFileItem.css';

export interface FileItem {
  id: string;
  canProcess: boolean;
  file: File;
  result: string | null;
  digest: string | null;
  keySignatureNumericValue: number | null;
  scale: { [key: string]: number[] } | null;
}

interface Props {
  fileItem: FileItem;
  updateDigest: (uuid: string, digest: string) => void;
  updateResult: (uuid: string, result: string) => void;
  canvas: HTMLCanvasElement;
}

interface State {
  analysisStart: number;
  analysisDuration: number;
  currentSegment: number;
  maxSegments: number;
  analyzing: boolean;
  result: string;
  keySignatureNumericValue: number | null;
  fileItem: FileItem;
  scale: { [key: string]: number[] } | null; // Add the scale property to the state
}

class AudioFileItem extends Component<Props, State> {
  worker: Worker | null = null;
  terminated: boolean = false;
  keySignatureNumericValue: null;

  state: State = {
    analysisStart: null,
    analysisDuration: null,
    currentSegment: null,
    maxSegments: null,
    analyzing: false,
    result: null,
    keySignatureNumericValue: null,
    fileItem: null,
    scale: null,
  };

  scale = {
    major: [2, 2, 1, 2, 2, 2, 1],
    jonian: [2, 2, 1, 2, 2, 2, 1],
    dorian: [2, 1, 2, 2, 2, 1, 2],
    phrygian: [1, 2, 2, 2, 1, 2, 2],
    lydian: [2, 2, 2, 1, 2, 2, 1],
    mixolydian: [2, 2, 1, 2, 2, 1, 2],
    eolian: [2, 1, 2, 2, 1, 2, 2],
    locrian: [1, 2, 2, 1, 2, 2, 2],
    hexatonic: [2, 2, 2, 2, 2, 2],
    minor: [2, 1, 2, 2, 1, 2, 2],
    jazz_minor: [2, 1, 2, 2, 2, 2, 1],
  };

  theme = {
    neck: '#221709',
    dot: '#808080',
    fret: '#e2c196',
    string: '#fcf8f3',
    fundamental: '#87deb8',
    scale: '#87adde',
  };

  fretboard: Fretboard | null = null; // Create a reference to the Fretboard instance

  componentDidMount() {
    if (this.props.fileItem.canProcess) {
      const reader = new FileReader();
      reader.onload = this.handleFileLoad;
      reader.readAsArrayBuffer(this.props.fileItem.file);
    }
    this.setState({ scale: this.scale });
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.fileItem.canProcess === false &&
      this.props.fileItem.canProcess === true
    ) {
      const reader = new FileReader();
      reader.onload = this.handleFileLoad;
      reader.readAsArrayBuffer(this.props.fileItem.file);
    }
  }

  componentWillUnmount() {
    this.terminated = true;
    this.worker && this.worker.terminate();
  }

  advanceSegmentCount = () => {
    this.setState(({ currentSegment }) => ({
      currentSegment: currentSegment + 1,
    }));
  };

  postAudioSegmentAtOffset = (
    worker,
    channelData,
    sampleRate,
    numberOfChannels,
    offset
  ) => {
    const segment = keyFinderUtils.zipChannelsAtOffset(
      channelData,
      offset,
      sampleRate,
      numberOfChannels
    );
    worker.postMessage({ funcName: 'feedAudioData', data: [segment] });
  };

  handleAudioFile = (buffer: AudioBuffer) => {
    if (this.terminated) return;
    const sampleRate = buffer.sampleRate;
    const numberOfChannels = buffer.numberOfChannels;
    const channelData = [];
    for (let i = 0; i < numberOfChannels; i += 1) {
      channelData.push(buffer.getChannelData(i));
    }

    this.setState(
      {
        analyzing: true,
        analysisStart: performance.now(),
        analysisDuration: null,
        scale: this.scale,
      },
      () => {
        const { scale, keySignatureNumericValue } = this.state;
        this.fretboard?.drawScale(scale.major, keySignatureNumericValue, 6, 15); // Call drawScale on the Fretboard instance
      }
    );
    this.worker = keyFinderUtils.initializeKeyFinder({
      sampleRate,
      numberOfChannels,
    });
    const segmentCounts = Math.floor(channelData[0].length / sampleRate);
    this.setState({ maxSegments: segmentCounts, currentSegment: 0 });

    this.worker.addEventListener('message', (event) => {
      if (event.data.finalResponse) {
        const result = keyFinderUtils.extractResultFromByteArray(
          event.data.data
        );
        console.log(result);
        const keySignatureNumericValue =
          this.getKeySignatureNumericValue(result);
        console.log(keySignatureNumericValue);
        this.setState(
          (oldState) => ({
            result,
            analysisDuration: performance.now() - oldState.analysisStart,
            analyzing: false,
            keySignatureNumericValue,
          }),
          () => {
            const { scale, keySignatureNumericValue } = this;
            this.fretboard?.drawScale(
              scale.major,
              keySignatureNumericValue,
              6,
              15
            ); // Call drawScale on the Fretboard instance
          }
        );
        this.props.updateResult(this.props.fileItem.id, result);
        this.worker.terminate();
        this.worker = null;
      } else {
        // Not final response
        if (event.data.data === 0) {
          // very first response
          this.postAudioSegmentAtOffset(
            this.worker,
            channelData,
            sampleRate,
            numberOfChannels,
            0
          );
          this.advanceSegmentCount();
        } else {
          // not first response
          const result = keyFinderUtils.extractResultFromByteArray(
            event.data.data
          );
          this.setState({ result });

          if (this.state.currentSegment < segmentCounts) {
            const offset = this.state.currentSegment * sampleRate;
            this.postAudioSegmentAtOffset(
              this.worker,
              channelData,
              sampleRate,
              numberOfChannels,
              offset
            );
            this.advanceSegmentCount();
          } else {
            // no more segments
            this.worker.postMessage({ funcName: 'finalDetection' });
          }
        }
      }
    });
  };

  getKeySignatureNumericValue(result: string) {
    if (!result) {
      return null;
    }

    const formattedResult = result.replace(/\s/g, ''); // Remove spaces from the result string

    const letter = formattedResult.charAt(0).toUpperCase();
    const octave = parseInt(formattedResult.charAt(formattedResult.length - 1));

    const letterValues = {
      EMajor: 0,
      FMajor: 1,
      'F#Major': 2,
      GbMajor: 2,
      GMajor: 3,
      'G#Major': 4,
      AbMajor: 4,
      AMajor: 5,
      'A#Major': 6,
      BbMajor: 6,
      BMajor: 7,
      CMajor: 8,
      'C#Major': 9,
      DbMajor: 9,
      DMajor: 10,
      'D#Major': 11,
      EbMajor: 11,
    };

    return octave * 12 + letterValues[letter];
  }

  handleFileLoad = async (event: ProgressEvent<FileReader>): Promise<void> => {
    const context = audioUtils.createAudioContext();
    const digest = await crypto.subtle.digest(
      'SHA-256',
      event.target.result as ArrayBuffer
    );
    const hashArray = Array.from(new Uint8Array(digest));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    this.props.updateDigest(this.props.fileItem.id, hashHex);
    context.decodeAudioData(
      event.target.result as ArrayBuffer,
      this.handleAudioFile
    );
  };

  render() {
    const {
      fileItem,
      currentSegment,
      maxSegments,
      analyzing,
      result,
      analysisDuration,
      keySignatureNumericValue,
      scale,
    } = this.state;

    return (
      <div class="file-item__container">
        {/* ... */}
        <div class="file-item__rendered-fretboard">
          {keySignatureNumericValue != null && (
            <Fretboard
              ref={(ref) => (this.fretboard = ref)} // Assign the Fretboard instance to the ref
              keySignatureNumericValue={keySignatureNumericValue} // Use the state value directly
              scale={scale.major}
              strings={6}
              frets={15}
              canvas={this.props.canvas} // Pass the canvas prop received from AudioFileKeyDetection
              theme={this.theme} // Pass the theme object
            />
          )}
        </div>
      </div>
    );
  }
}

export default AudioFileItem;
