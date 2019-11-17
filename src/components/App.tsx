import React from 'react'
import { WithId } from '../utils'
import { LocalMediaDevices, LocalMediaStreams } from '../localMedia'

type VideoDevicesProps = {
    devices: Array<MediaDeviceInfo>
    activeStreamDeviceIds: Array<string>
    cb: (device: MediaDeviceInfo, isOn: boolean) => void
}

const VideoDevices: React.FunctionComponent<VideoDevicesProps> = ({ devices, cb, activeStreamDeviceIds }) => {
    return <ul>
        {devices.map(device => {
            return <li key={device.deviceId}>
                <input
                    type="checkbox"
                    checked={activeStreamDeviceIds.includes(device.deviceId)}
                    name=""
                    onChange={e => cb(device, (e.target as any).checked)} /> {device.label}
            </li>
        })}
    </ul>
}

type VideoStreamsProps = {
    streams: Array<WithId<MediaStream>>
}

export const VideoStreams: React.FunctionComponent<VideoStreamsProps> = ({ streams }) => {
    return <ul>
        {streams.map(s => {
            return <li key={s.id}>
                <Video stream={s.value} />
            </li>
        })}
    </ul>
}

interface VideoProps {
    stream: MediaStream
}

export class Video extends React.Component<VideoProps, {}> {
    videoRef: React.RefObject<HTMLVideoElement>
    constructor(props: VideoProps) {
        super(props)
        this.videoRef = React.createRef<HTMLVideoElement>()
    }
    componentDidMount() {
        this.setStream()
    }
    componentDidUpdate() {
        this.setStream()
    }
    setStream() {
        if (this.videoRef.current && this.videoRef.current.srcObject !== this.props.stream) {
            this.videoRef.current.srcObject = this.props.stream;
        }
        if (this.videoRef.current && this.props.stream === null) {
            this.videoRef.current.srcObject = null
        }
    }
    render() {
        return <div>
            <video className="myVideo" ref={this.videoRef} autoPlay muted playsInline controls></video>
        </div>
    }
}

type AppState = {
    mediaDevices: Array<MediaDeviceInfo>
    mediaStreams: Array<WithId<MediaStream>>
}

const initialState: AppState = {
    mediaDevices: [],
    mediaStreams: []
}

type AppProps = {
    localMediaDevices: LocalMediaDevices
    localMediaStreams: LocalMediaStreams
}

export class App extends React.Component<AppProps, AppState> {
    localMediaDevices: LocalMediaDevices
    localMediaStreams: LocalMediaStreams
    subscriptions: Array<() => void> = []
    constructor(props: AppProps) {
        super(props)
        this.state = initialState
        this.localMediaDevices = props.localMediaDevices
        this.localMediaStreams = props.localMediaStreams
    }

    componentDidMount() {
        this.subscriptions.push(this.localMediaDevices.subscribe(mediaDevices => this.setState({ mediaDevices })))
        this.subscriptions.push(this.localMediaStreams.subscribe((mediaStreams, _) => this.setState({ mediaStreams })))
    }

    componentWillUnmount() {
        this.subscriptions.forEach(unsubscribe => unsubscribe())
    }

    render() {
        return <div>
            Hello
            <ul>
                {this.state.mediaDevices.map((d, i) => <li key={i}>{d.toString()}: {JSON.stringify(d)}</li>)}
            </ul>
            <VideoDevices
                devices={this.state.mediaDevices.filter(d => d.kind === 'videoinput' || d.kind === 'audioinput')}
                cb={(device, isOn) => this.localMediaStreams.toggleMediaStream(device, isOn)}
                activeStreamDeviceIds={this.state.mediaStreams.map(s => s.id)}
            />
            <VideoStreams streams={this.state.mediaStreams} />
        </div>
    }
}
