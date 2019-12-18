import { WithId } from "./utils"

export type Handler<A> = (a: A) => void
export type H = Handler<RTCSessionDescriptionInit>
export type H2 = Handler<RTCIceCandidate>
export type UserId = string

export interface User {
    id: string
    name: string
}

export interface Signaling {
    online(user: User, presenceHandler: Handler<Array<User>>, incomingCallHandler: Handler<WithId<CallSignaling>>): void
    initiateCall(initiator: UserId, respondent: UserId): CallSignaling
    offline(user: UserId): void
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
