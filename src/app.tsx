import ReactDOM from 'react-dom'
import React from 'react'
import { App, VideoStreams } from './components/App'
import { LocalMediaStreams, LocalMediaDevices } from './localMedia'
import { WebRTC } from './webrtc'
import { WithId } from './utils'

export const runApp = () => {
    const localMediaDevices = new LocalMediaDevices
    const localMediaStreams = new LocalMediaStreams
    ReactDOM.render(
        <App localMediaDevices={localMediaDevices} localMediaStreams={localMediaStreams} />,
        document.getElementById("app")
    );
    // const webrtc = new WebRTC(localMediaStreams, null as any)

    // const pc1 = webrtc.pc
    // const pc2 = new RTCPeerConnection

    // pc1.onicecandidate = e => e.candidate && pc2.addIceCandidate(e.candidate);
    // pc2.onicecandidate = e => e.candidate && pc1.addIceCandidate(e.candidate);
    // pc1.onnegotiationneeded = async e => {
    //     try {
    //         await pc1.setLocalDescription(await pc1.createOffer());
    //         if (pc1.localDescription)
    //             await pc2.setRemoteDescription(pc1.localDescription);
    //         await pc2.setLocalDescription(await pc2.createAnswer());
    //         if (pc2.localDescription)
    //             await pc1.setRemoteDescription(pc2.localDescription);
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }

    // const streams: Array<WithId<MediaStream>> = []

    // pc2.ontrack = t => {
    //     console.log("track", t)
    //     const s = new MediaStream()
    //     s.addTrack(t.track)
    //     streams.push(new WithId(s, ""))
    //     ReactDOM.render(<VideoStreams streams={streams} />, document.getElementById("streams"))
    //     t.track.onmute = () => console.log("mute")
    // }
}