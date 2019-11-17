type Handler<A> = (a: A) => void

export interface Signaling {
    subscribeToPresence(): void
    subscirbeToIncomingCall(): void
    initiateCall(): CallSignaling
    online(): void
    offline(): void
}

export interface CallSignaling {
    close(): void
    sendOffer(s: RTCSessionDescriptionInit): void
    sendAnswer(s: RTCSessionDescriptionInit): void
    sendIce(candidate: RTCIceCandidate): void
    onOffer(h: Handler<RTCSessionDescriptionInit>): void
    onAnswer(h: Handler<RTCSessionDescriptionInit>): void
    onIce(h: Handler<RTCIceCandidate>): void
}