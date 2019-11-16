import { WithId } from "./utils"

type Listener<A> = (values: Array<A>) => void
type Listener2<A> = (values: Array<A>, values2: Array<A>) => void

class DisplayMediaDeviceInfo implements MediaDeviceInfo {
 label = "Screen"
 deviceId = "screen"
 kind = "videoinput" as MediaDeviceKind
 groupId = "screen"
 toJSON() {
   return this
 }
}

const DISPLAY_MEDIA_DEVICE = new DisplayMediaDeviceInfo

export class LocalMediaDevices {
  mediaDeviceListeners: Array<Listener<MediaDeviceInfo>> = []

  constructor() {
    navigator.mediaDevices.ondevicechange = () => {
      const devices = this.getMediaDevices()
      devices.then(d => this.mediaDeviceListeners.forEach(listener => listener(d)))
    }
  }

  getMediaDevices() {
    return navigator.mediaDevices.enumerateDevices().then(d => [...d, DISPLAY_MEDIA_DEVICE])
  }

  subscribe(listner: (mediaDevices: Array<MediaDeviceInfo>) => void) {
    this.mediaDeviceListeners.push(listner)
    this.getMediaDevices().then(x => listner(x))
    return () => {
      this.mediaDeviceListeners = this.mediaDeviceListeners.filter(l => l !== listner)
    }
  }

}

export class LocalMediaStreams {
  mediaStreams: Array<WithId<MediaStream>> = []
  mediaStreamListeners: Array<Listener2<WithId<MediaStream>>> = []

  addStream(stream: WithId<MediaStream>) {
    this.mediaStreams = [...this.mediaStreams, stream]
    this.mediaStreamListeners.forEach(listener => listener(this.mediaStreams, []))
  }

  removeStreams(deviceId: string) {
    const streamsToStop = this.mediaStreams.filter(s => s.id === deviceId)
    streamsToStop.flatMap(s => s.value.getTracks()).forEach(t => t.stop())
    const remainingStreams = this.mediaStreams.filter(s => s.id !== deviceId)
    this.mediaStreams = remainingStreams
    this.mediaStreamListeners.forEach(listener => listener(this.mediaStreams, streamsToStop))
  }

  subscribe(listner: Listener2<WithId<MediaStream>>) {
    this.mediaStreamListeners.push(listner)
    listner(this.mediaStreams, [])
    return () => {
      this.mediaStreamListeners = this.mediaStreamListeners.filter(l => l !== listner)
    }
  }

  createStream(device: MediaDeviceInfo): Promise<MediaStream> {
    if (device.deviceId === DISPLAY_MEDIA_DEVICE.deviceId) {
      return (navigator.mediaDevices as any).getDisplayMedia()
    } else if (device.kind === "videoinput") {
      return navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } } })
    } else {
      return navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: device.deviceId } } })
    }
  }

  toggleMediaStream(device: MediaDeviceInfo, isOn: boolean): Promise<void> {
    if (isOn) {
      const stream = this.createStream(device)
      return stream.then(s => this.addStream(new WithId(s, device.deviceId)))
    } else {
      return Promise.resolve(this.removeStreams(device.deviceId))
    }
  }
}