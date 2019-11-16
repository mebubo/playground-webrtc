import { LocalMedia } from './localMedia'
import { WithId } from './utils'

export class WebRTC {
    pc: RTCPeerConnection
    senders: Array<RTCRtpSender> = []

    constructor(private readonly localMedia: LocalMedia) {
        localMedia.subscribeToMediaStreams((current, stopped) => this.handleStreams(current, stopped))
        this.pc = new RTCPeerConnection
    }

    handleStreams(current: Array<WithId<MediaStream>>, stopped: Array<WithId<MediaStream>>) {
        const stoppedTrackIds = stopped.flatMap(s => s.value.getTracks()).map(t => t.id)
        const sendersToStop = this.senders.filter(s => {
            if (!s.track) return false
            return stoppedTrackIds.includes(s.track.id)
        })
        sendersToStop.forEach(s => {
            s.setStreams()
            this.pc.removeTrack(s)
        })
        this.senders = current.flatMap(stream => stream.value.getTracks().map(track => ({track, stream}))).map(({track, stream}) => this.pc.addTrack(track, stream.value))
    }
}