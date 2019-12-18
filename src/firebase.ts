import * as firebase from "firebase/app"
import { Signaling, User, Handler, CallSignaling, UserId, H, H2 } from "./signaling"
import { WithId } from "./utils"

const userId = Math.floor(Math.random() * 1000000000).toString()
const user = { id: userId, name: "name" }

class FirebaseSignaling implements Signaling {

    messaging: FirebaseMessaging | null = null
    thisEnd: UserId | null = null

    constructor(private readonly firebaseConfig: any) { }

    online(user: User, presenceHandler: Handler<Array<User>>, incomingCallHandler: Handler<WithId<CallSignaling>>) {
        firebase.initializeApp(this.firebaseConfig)

        const database = firebase.database()

        const connectionsRef = database.ref(`common/connections`);
        const connectedRef = database.ref('.info/connected');

        connectedRef.on('value', function (snap) {
            if (snap.val() === true) {
                const con = connectionsRef.push();
                con.onDisconnect().remove();
                con.set({ id: user.id, name: user.name })
            }
        });

        connectionsRef.on("value", snap => {
            console.log("connected users:", snap.val())
            presenceHandler(Object.values(snap.val()))
        });

        this.thisEnd = user.id
        this.messaging = firebaseMessagingForCalls(this.thisEnd)
        this.messaging.subscribeFromAny("call", m => {
            if (this.thisEnd) {
                const cs = new FirebaseCallSignaling(this.thisEnd, m.from)
                incomingCallHandler(new WithId(cs, m.from))
            }
        })
    }

    initiateCall(thisEnd: UserId, otherEnd: UserId) {
        this.messaging?.send(otherEnd, "call", {})
        const cs = new FirebaseCallSignaling(thisEnd, otherEnd)
        return cs
    }

    offline(user: UserId) {
        throw new Error("not implemented")
    }
}

class FirebaseCallSignaling implements CallSignaling {
    messaging: FirebaseMessaging

    constructor(thisEnd: UserId, private readonly otherEnd: UserId) {
        this.messaging = firebaseMessagingForCalls(thisEnd)
    }
    close() {
        this.messaging.close()
    }

    sendOffer(s: RTCSessionDescriptionInit) {
        this.messaging.send(this.otherEnd, "offer", s)
    }
    sendAnswer(s: RTCSessionDescriptionInit) {
        this.messaging.send(this.otherEnd, "answer", s)
    }
    sendIce(s: RTCIceCandidate) {
        this.messaging.send(this.otherEnd, "ice", s)
    }
    onOffer(h: H) {
        this.messaging.subscribeFrom(this.otherEnd, "offer", m => h(m.msg))
    }
    onAnswer(h: H) {
        this.messaging.subscribeFrom(this.otherEnd, "offer", m => h(m.msg))
    }
    onIce(h: H2) {
        this.messaging.subscribeFrom(this.otherEnd, "ice", m => h(m.msg))
    }
}

type Endpoint = string
type MessageType = string
type Payload = string
type Message<A> = {
    from: Endpoint,
    to: Endpoint,
    type: MessageType,
    msg: A
}

type MessageHandler = (m: Message<any>) => void

function mapMessage<A, B>(m: Message<A>, f: (a: A) => B): Message<B> {
    return { ...m, msg: f(m.msg) }
}

class FirebaseMessaging {
    ref: firebase.database.Reference
    offs: Array<(a: any) => void> = []

    constructor(private readonly thisEnd: Endpoint, path: string) {
        this.ref = firebase.database().ref(path)
    }

    send(to: Endpoint, type: MessageType, msg: any) {
        this.sendMessage({ from: this.thisEnd, to, type, msg })
    }

    subscribeFrom(from: Endpoint, type: MessageType, h: MessageHandler) {
        this.subscribe(m => m.to === this.thisEnd && m.from === from && m.type === type, h)
    }

    subscribeFromAny(type: MessageType, h: MessageHandler) {
        this.subscribe(m => m.to === this.thisEnd && m.type === type, h)
    }

    close() {
        this.offs.forEach(f => this.ref.off("child_added", f))
    }

    private sendMessage(m: Message<any>) {
        this.ref.push(mapMessage(m, JSON.stringify))
        this.ref.remove()
    }

    private onMessage(h: (m: Message<any>) => void) {
        this.offs.push(this.ref.on("child_added", snap => {
            const m = snap.val()
            h(mapMessage(m, JSON.parse))
        }))
    }

    private subscribe(p: (m: Message<any>) => boolean, h: MessageHandler) {
        this.onMessage(m => p(m) && h(m))
    }

}

function firebaseMessagingForCalls(e: Endpoint): FirebaseMessaging {
    return new FirebaseMessaging(e, "common/calls")
}
