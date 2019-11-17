import { LocalMediaStreams } from './localMedia'
import { WithId } from './utils'
import { CallSignaling } from './signaling'

export class WebRTC {
    pc: RTCPeerConnection
    senders: Array<RTCRtpSender> = []

    constructor(localMedia: LocalMediaStreams, callSignaling: CallSignaling) {
        localMedia.subscribe((current, stopped) => this.handleLocalStreams(current, stopped))
        this.pc = this.createPeerConnection(callSignaling)
        callSignaling.onIce(c => this.pc.addIceCandidate(c))
        callSignaling.onOffer(o => {
            this.pc.setRemoteDescription(o)
                .then(() => this.pc.createAnswer())
                .then(a => callSignaling.sendAnswer(a))
        })
        callSignaling.onAnswer(a => {
            this.pc.setRemoteDescription(a)
        })
    }

    createPeerConnection(callSignaling: CallSignaling): RTCPeerConnection {
        const pc = new RTCPeerConnection
        pc.onicecandidate = e => {
            if (e.candidate) {
                callSignaling.sendIce(e.candidate)
            }
        }
        pc.onnegotiationneeded = e => {
            return pc.createOffer()
                .then(o => pc.setLocalDescription(o))
                .then(() => {
                    if (pc.localDescription)
                        callSignaling.sendOffer(pc.localDescription)
                })
        }
        pc.onconnectionstatechange = e => {
            switch (pc.connectionState) {
                case "closed":
                case "failed":
                case "disconnected":
                    callSignaling.close()
                    break
            }
        }
        return pc
    }

    handleLocalStreams(current: Array<WithId<MediaStream>>, stopped: Array<WithId<MediaStream>>) {
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