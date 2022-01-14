import {Component} from 'react';
import {ThemeProvider} from '@rmwc/theme';
import {Grid, GridCell} from '@rmwc/grid';
import {LinearProgress} from '@rmwc/linear-progress';
import eyeson from 'eyeson';
import {RoomContext} from "./context";
import Video from './Video';
import './App.css';
import { withRouter } from "react-router-dom";
import Hls from "hls.js";
import * as janus from 'janus-gateway-js';

class RTSPRoomPage extends Component {
    static contextType = RoomContext;

    state = {
        localStream: null,
        remoteStream: null,
        janusStream: null,
        connecting: false,
        audio: true,
        video: true,
        screen: false,
        settingsDialog: false,
        toastMessage: '',
    };

    componentDidMount() {
        eyeson.onEvent(this.handleEvent);
        this.start();
    }

    handleEvent = event => {
        const { type } = event;
        console.log(event);
        if (type === 'accept') {
            this.setState({
                localStream: event.localStream,
                remoteStream: event.remoteStream,
                connecting: false
            });
            return;
        }
        if (type === 'warning') {
            this.setState({ toastMessage: 'Warning: ' + event.name });
            return;
        }
        if (type === 'error') {
            this.setState({ toastMessage: 'Error: ' + event.name });
            this.endSession();
            return;
        }
        if (type === 'exit') {
            this.setState({ toastMessage: 'Meeting has ended' });
            this.endSession();
            return;
        }
        if (type === 'connection') {
            if (event.connectionStatus === 'ready') {
                // let {rtspLink} = this.props.match.params;
                // rtspLink = decodeURIComponent(rtspLink);
                // console.log('######## publishing RTSP', rtspLink);
                // eyeson.send({
                //     type: 'start_rtmp',
                //     url: rtspLink,
                //     key: '',
                // });
            }
            return;
        }
        console.log('[App]', 'Ignore received event:', event.type);
    };

    start = () => {
        const {contextData} = this.context;
        this.setState({ connecting: true });
        let {rtspLink} = this.props.match.params;
        rtspLink = decodeURIComponent(rtspLink);

        // copy-paste from HLS demo below view-source:https://storage.googleapis.com/eyeson-demo/playground/hls-stream.html
        const _fps = 1000 / 30;
        let _video = null;
        let _canvas = null;
        let _context = null;
        let _stream = null;
        let _drawTimer = null;
        let _audioContext = null;
        let _acSource = null;
        let _acStream = null;
        let _gainNode = null;
        let _player = null;
        let _playing = false;
        let _userId = null;
        let _meeting = false;
        let _setSize = true;
        let _ratio = 'original';
        const _ratioValue = {
            '4_3': 4 / 3,
            '16_10': 16 / 10
        };
        const _drawing = {
            width: 0,
            height: 0,
            offsetX: 0,
            offsetY: 0
        };
        const timerWorker = (fn, delay) => {
            const code = `
let _timer = null;
const _message = 'run';
onmessage = ({ data }) => {
    if (data === 'setTimeout') {
        _timer = setTimeout(() => {
            postMessage(_message);
        }, ${delay});
    }
    else if (data === 'clearTimeout') {
        clearTimeout(_timer);
    }
};
`;
            const url = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
            const worker = new Worker(url, { name: 'timer_worker' });
            const timeoutMessage = 'setTimeout';
            const clearMessage = 'clearTimeout';
            URL.revokeObjectURL(url);
            worker.onmessage = () => fn();
            return {
                setTimeout: fn => {
                    worker.postMessage(timeoutMessage);
                },
                clearTimeout: () => {
                    worker.postMessage(clearMessage);
                },
                terminate: () => {
                    worker.terminate();
                }
            };
        };

        const setCanvasSize = () => {
            _setSize = false;
            _drawing.width = _video.videoWidth;
            _drawing.height = _video.videoHeight;
            if (_ratio === 'original') {
                _canvas.width = _drawing.width;
                _canvas.height = _drawing.height;
                _drawing.offsetX = 0;
                _drawing.offsetY = 0;
            } else {
                const prop = _drawing.width / _drawing.height;
                const value = _ratioValue[_ratio];
                if (prop > value) {
                    _canvas.width = _drawing.width;
                    _canvas.height = Math.round(_drawing.width / value);
                    _drawing.offsetX = 0;
                    _drawing.offsetY = Math.round((_canvas.height - _drawing.height) / 2);
                }
                else if (prop < value) {
                    _canvas.width = Math.round(_drawing.height * value);
                    _canvas.height = _drawing.height;
                    _drawing.offsetX = Math.round((_canvas.width - _drawing.width) / 2);
                    _drawing.offsetY = 0;
                }
                else {
                    _canvas.width = _drawing.width;
                    _canvas.height = _drawing.height;
                    _drawing.offsetX = 0;
                    _drawing.offsetY = 0;
                }
                _context.fillStyle = '#404040';
                _context.fillRect(0, 0, _canvas.width, _canvas.height);
            }
        };

        const drawVideo = () => {
            _drawTimer.setTimeout();
            if (_setSize) {
                setCanvasSize();
            }
            if (_ratio === 'original') {
                _context.drawImage(_video, 0, 0);
            } else {
                _context.drawImage(_video, 0, 0, _video.videoWidth, _video.videoHeight, _drawing.offsetX, _drawing.offsetY, _drawing.width, _drawing.height);
            }
        };

        const addAudio = () => {
            if (_audioContext) {
                return;
            }
            _video.muted = false;
            _audioContext = new AudioContext();
            _acSource = _audioContext.createMediaElementSource(_video);
            _acStream = _audioContext.createMediaStreamDestination();
            _gainNode = new GainNode(_audioContext, { gain: $('#slider-volume').value });
            _acSource.connect(_gainNode);
            _gainNode.connect(_acStream);
            _stream.addTrack(_acStream.stream.getAudioTracks()[0]);
        };

        const initVideo = () => {
            _video = document.createElement('video');
            _video.playsInline = true;
            _video.muted = true;
            _drawTimer = timerWorker(drawVideo, _fps);
            _canvas = document.createElement('canvas');
            _context = _canvas.getContext('2d', { alpha: false, desynchronized: true });
            _stream = _canvas.captureStream();

            _video.addEventListener('loadeddata', () => {
                console.log('video loaded - start playing');
                console.log('video size', _video.videoWidth, _video.videoHeight);
                _setSize = true;
                _video.play();
            });
            _video.addEventListener('play', () => {
                console.log('[v] play');
                _playing = true;
                _drawTimer.setTimeout();
                if (_meeting) {
                    eyeson.send({ type: 'change_stream', audio: true, video: true });
                }
            });
            _video.addEventListener('emptied', () => {
                _drawTimer.clearTimeout();
                if (_meeting) {
                    eyeson.send({ type: 'change_stream', audio: false, video: false });
                }
                console.log('[v] emptied');
                _playing = false;
            });
        };

        const startStream = async (url) => {
            if (!url) {
                return;
            }
            if (_player) {
                _player.destroy();
            }
            if (url.startsWith('rtsp://')) {
                await startRtsp();
            } else if (url.endsWith('.mpd')) {
                initVideo();
                initDash(url);
            } else {
                initVideo();
                initHLS(url);
            }
        };

        const callJanusAsyncFunction = (plugin, ctx, func, ...args) => {
            // FIXME how to identify response? Dive into "transaction" and "sender" variables and try to understand
            return new Promise(async (resolve, reject) => {
                const messageHandler = (x) => {
                    plugin.off('message', messageHandler);
                    plugin.off('error', errorHandler);
                    resolve(x);
                };
                const errorHandler = (x) => {
                    plugin.off('message', messageHandler);
                    plugin.off('error', errorHandler);
                    reject(x);
                };
                plugin.on('message', messageHandler);
                plugin.on('error', errorHandler);
                try {
                    await func.bind(ctx)(...args);
                } catch (err) {
                    reject(err);
                }
            });
        }

        const createJanusStream = async (streaming, id, recreateIfExists = true) => {
            try {
                return await callJanusAsyncFunction(streaming, streaming, streaming.create, id, {
                    type: 'rtsp',
                    audio: true,
                    video: true,
                    videopt: 96,
                    videortpmap: 'H264/90000',
                    videofmtp:
                        'packetization-mode=1;profile-level-id=42C01E;sprop-parameter-sets=Z0LAHtkDxWhAAAADAEAAAAwDxYuS,aMuMsg==',
                    audiopt: 97,
                    audiortpmap: 'opus/48000/2',
                    url: rtspLink,
                });
            } catch (err) {
                if (err.message === 'A stream with the provided ID already exists' && recreateIfExists) {
                    console.log('restarting stream...');
                    await streaming.destroy(id);
                    return createJanusStream(streaming, id, false);
                } else {
                    throw err;
                }
            }
        }

        const watch = async (streaming, id) => {
            try {
                return await callJanusAsyncFunction(streaming, streaming, streaming.watch, id);
            } catch (err) {
                console.log('^^^^^^^^^^^ WATCH ERR', err);
                throw err;
            }
        }

        const startRtsp = async () => {
            try {
                const janusClient = new janus.Client('wss://janus.localhost:8989', {
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
                    keepalive: 'true',
                });
                const connection = await janusClient.createConnection('id');
                const session = await connection.createSession();
                const streaming = await session.attachPlugin('janus.plugin.streaming');
                const id = 1;
                // await createJanusStream(streaming, id);
                console.log('Stream created... subscribing to it');
                return new Promise(async (resolve) => {
                    let i = 0;
                    _stream = new MediaStream();
                    streaming.on('pc:track:remote', (event) => {
                        i++;
                        if (event.type == 'track') {
                            _stream.addTrack(event.track);
                        }
                        console.log('pc:track:remote', event, _stream);
                        if (i < 3) {
                            return;
                        }
                        this.setState({
                            janusStream: _stream,
                        });
                        console.log('Janus stream established');
                        resolve();
                    })
                    const { _plainMessage: { jsep }} = await streaming.watch(id);
                    await streaming.start(jsep);
                });
            } catch (err) {
                console.error(err);
            }
        }

        const initDash = url => {
            _player = dashjs.MediaPlayer().create();
            _player.initialize(_video);
            _player.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, ({ data }) => {
                console.log('manifest loaded', data);
            });
            _player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZING, ({ mediaInfo }) => {
                if (mediaInfo.type !== 'video') {
                    return;
                }
                console.log('stream initializing', mediaInfo);
                const { bitrateList } = mediaInfo;
                let startLevel = 0;
                let lastWidth = 0;
                for (let i = 0; i < bitrateList.length; i++) {
                    const width = bitrateList[i].width;
                    if (width <= 1280 && width > lastWidth) {
                        startLevel = i;
                        lastWidth = width;
                    }
                }
                setTimeout(() => _player.setQualityFor('video', startLevel));
            });
            _player.on(dashjs.MediaPlayer.events.ERROR, ({ error }) => {
                console.log('error', error);
                alert(`Error! Unable to load. (${error.message})`);
            });
            _player.attachSource(url);
        };

        const initHLS = url => {
            _player = new Hls();
            _player.attachMedia(_video);
            _player.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                console.log('manifest loaded', data);
                if (data.levels.length > 0) {
                    let startLevel = 0;
                    let lastWidth = 0;
                    for (let i = 0; i < data.levels.length; i++) {
                        const width = data.levels[i].width;
                        if (width <= 1280 && width > lastWidth) {
                            startLevel = i;
                            lastWidth = width;
                        }
                    }
                    _player.startLevel = startLevel;
                }
            });
            _player.on(Hls.Events.ERROR, (event, data) => {
                console.log('error', event, data);
                alert(`Error! Unable to load. (${data.details})`);
            });
            _player.loadSource(url);
        };

        const startMeeting = () => {
            eyeson.onEvent(event => {
                const { type } = event;
                if (type === 'accept') {
                    document.body.classList.add('meeting');
                    _meeting = true;
                    if (_playing === false) {
                        setTimeout(() => eyeson.send({ type: 'change_stream', audio: false, video: false }), 100);
                    }
                }
                else if (type === 'room_ready') {
                    const userId = event.content.user.id;
                    if (_userId !== userId) {
                        _userId = userId;
                    }
                }
                else if (type === 'warning') {
                    vanillaToast.warn(event.name);
                }
                else if (type === 'error') {
                    vanillaToast.error(`Exit meeting due to error "${event.name}"`);
                    exitMeeting();
                }
                else if (type === 'exit') {
                    _meeting = false;
                    vanillaToast.info('Meeting has ended');
                    cleanup();
                }
            });
            eyeson.start(contextData.accessKey, { stream: _stream });
        };

        startStream(rtspLink).then(() => {
            startMeeting();
        });
    };

    endSession = () => {
        eyeson.offEvent(this.handleEvent);
        eyeson.destroy();
        this.setState({
            localStream: null,
            remoteStream: null,
            connecting: false
        });
        eyeson.onEvent(this.handleEvent);
    };

    render() {
        const { connecting, remoteStream, janusStream } = this.state;
        const {contextData} = this.context;

        return (
            <ThemeProvider options={{primary: '#9e206c', secondary: '#6d6d6d'}}>
                <Grid className="App">
                    <GridCell>
                        {janusStream && <Video stream={janusStream} style={{width: '200px'}}/>}
                    </GridCell>
                    <GridCell
                        span="12">Link for Guests:
                        <span className="guest-link"> {contextData.guestLink}</span>
                    </GridCell>
                    <GridCell
                        span="12">Link for RTSP/HLS streamer:
                        <span className="guest-link"> {contextData.rtspLink}</span>
                    </GridCell>
                    <GridCell span="12">
                        {connecting && <LinearProgress />}
                        {remoteStream && <Video stream={remoteStream} style={{width: '200px'}}/>}
                    </GridCell>
                </Grid>
            </ThemeProvider>
        );
    }
}

export default withRouter(RTSPRoomPage);
