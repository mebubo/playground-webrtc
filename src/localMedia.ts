import { WithId } from "./utils"

type Listener<A> = (values: Array<A>) => void

const x = { label: "Screen", deviceId: "Screen", kind: "videoinput", groupId: "screen"}
const displayMediaDevice: MediaDeviceInfo = { ...x, toJSON: () => x } as MediaDeviceInfo

export class LocalMedia {
  mediaStreams: Array<WithId<MediaStream>> = []
  mediaDeviceListeners: Array<Listener<MediaDeviceInfo>> = []
  mediaStreamListeners: Array<Listener<WithId<MediaStream>>> = []

  constructor() {
    navigator.mediaDevices.ondevicechange = () => {
      const devices = this.getMediaDevices()
      devices.then(d => this.mediaDeviceListeners.forEach(listener => listener(d)))
    }
  }

  setState({ mediaStreams }: { mediaStreams?: Array<WithId<MediaStream>> }) {
    if (mediaStreams) {
      this.mediaStreams = mediaStreams
      this.mediaStreamListeners.forEach(listener => listener(this.mediaStreams))
    }
  }

  getMediaDevices() {
    return navigator.mediaDevices.enumerateDevices().then(d => [...d, displayMediaDevice])
  }

  subscribeToMediaDevices(listner: (mediaDevices: Array<MediaDeviceInfo>) => void) {
    this.mediaDeviceListeners.push(listner)
    this.getMediaDevices().then(x => listner(x))
    return () => {
      this.mediaDeviceListeners = this.mediaDeviceListeners.filter(l => l !== listner)
    }
  }

  subscribeToMediaStreams(listner: (mediaStreams: Array<WithId<MediaStream>>) => void) {
    this.mediaStreamListeners.push(listner)
    listner(this.mediaStreams)
    return () => {
      this.mediaStreamListeners = this.mediaStreamListeners.filter(l => l !== listner)
    }
  }

  createStream(deviceId: string): Promise<MediaStream> {
    if (deviceId === displayMediaDevice.deviceId) {
      return (navigator.mediaDevices as any).getDisplayMedia()
    } else {
      return navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } })
    }
  }

  toggleMediaStream(deviceId: string, isOn: boolean, ): Promise<void> {
    if (isOn) {
      const stream = this.createStream(deviceId)
      return stream.then(s => this.setState({ mediaStreams: [...this.mediaStreams, new WithId(s, deviceId)] }))
    } else {
      const streamsToStop = this.mediaStreams.filter(s => s.id === deviceId)
      streamsToStop.flatMap(s => s.value.getTracks()).forEach(t => t.stop())
      const remainingStreams = this.mediaStreams.filter(s => s.id !== deviceId)
      return Promise.resolve(this.setState({ mediaStreams: remainingStreams }))
    }
  }
}