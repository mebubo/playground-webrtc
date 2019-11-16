import React from 'react'

type AppState = {
    mediaDevices: Array<MediaDeviceInfo>
    mediaStreams: Array<WithId<MediaStream>>
}

class WithId<A> {
    constructor(public readonly value: A, public readonly id: string) { }
}

type VideoDeviceInfo = {
    label: string
    deviceId: string
}

type VideoDevicesProps = {
    devices: Array<VideoDeviceInfo>
    cb: (deviceId: string, isOn: boolean) => void
}

const VideoDevices: React.FunctionComponent<VideoDevicesProps> = ({ devices, cb }) => {
    return <ul>
        {devices.map(({ label, deviceId }, i) => {
            return <li key={i}>
                <input type="checkbox" name="" id="" onChange={e => cb(deviceId, (e.target as any).checked)} /> {label}
            </li>
        })}
    </ul>
}

const DisplayMedia: React.FunctionComponent<VideoDevicesProps> = ({ devices, cb }) => {
    return <ul>
        {devices.map(({ label, deviceId }, i) => {
            return <li key={i}>
                <input type="checkbox" name="" id="" onChange={e => cb(deviceId, (e.target as any).checked)} /> {label}
            </li>
        })}
    </ul>
}

type VideoStreamsProps = {
    streams: Array<MediaStream>
}

const VideoStreams: React.FunctionComponent<VideoStreamsProps> = ({ streams }) => {
    return <ul>
        {streams.map((s, i) => {
            return <li key={i}>
                <Video stream={s} />
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

const initialState: AppState = {
    mediaDevices: [],
    mediaStreams: []
}

export class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props)
        this.state = initialState
        this.queryMediaDevices()
        navigator.mediaDevices.ondevicechange = () => this.queryMediaDevices()
    }
    queryMediaDevices() {
        const devices = navigator.mediaDevices.enumerateDevices()
        devices.then(ds => this.setState({ mediaDevices: ds }))
    }
    toggleMediaStream(deviceId: string, isOn: boolean, createStream: (deviceId: string) => Promise<MediaStream>): Promise<void> {
        if (isOn) {
            const stream = createStream(deviceId)
            return stream.then(s => this.setState({ mediaStreams: [...this.state.mediaStreams, new WithId(s, deviceId)] }))
        } else {
            const streamsToStop = this.state.mediaStreams.filter(s => s.id === deviceId)
            streamsToStop.flatMap(s => s.value.getTracks()).forEach(t => t.stop())
            const remainingStreams = this.state.mediaStreams.filter(s => s.id !== deviceId)
            return Promise.resolve(this.setState({ mediaStreams: remainingStreams }))
        }
    }
    toggleWebcam(deviceId: string, isOn: boolean): Promise<void> {
        return this.toggleMediaStream(deviceId, isOn, deviceId => navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } }))
    }
    toggleDisplayMedia(deviceId: string, isOn: boolean) {
        return this.toggleMediaStream(deviceId, isOn, deviceId => (navigator.mediaDevices as any).getDisplayMedia())
    }
    render() {
        return <div>
            Hello
            <ul>
                {this.state.mediaDevices.map((d, i) => <li key={i}>{d.toString()}: {JSON.stringify(d)}</li>)}
            </ul>
            <VideoDevices devices={this.state.mediaDevices.filter(d => d.kind === 'videoinput')} cb={(deviceId, isOn) => this.toggleWebcam(deviceId, isOn)} />
            <VideoDevices devices={[{label: "Screen", deviceId: "Screen"}]} cb={(deviceId, isOn) => this.toggleDisplayMedia(deviceId, isOn)} />
            <VideoStreams streams={this.state.mediaStreams.map(s => s.value)} />
        </div>
    }
}
