import { Signaling, User, Handler, CallSignaling, UserId, H, H2 } from "./signaling"
import { WithId } from "./utils"

class TestSignaling implements Signaling {
    connectedUsers: Array<User> = []
    presenceSubscriptions: { [userId: string]: Handler<Array<User>> } = {}
    incomingCallSubscriptions: { [userId: string]: Handler<WithId<CallSignaling>> } = {}

    online(user: User, presenceHandler: Handler<Array<User>>, incomingCallHandler: Handler<WithId<CallSignaling>>) {
        this.connectedUsers.push(user)
        this.incomingCallSubscriptions[user.id] = incomingCallHandler
        this.presenceSubscriptions[user.id] = presenceHandler
        this.notifyPresence()
    }

    offline(user: UserId) {
        this.connectedUsers = this.connectedUsers.filter(u => u.id !== user)
        delete this.presenceSubscriptions[user]
        delete this.incomingCallSubscriptions[user]
        this.notifyPresence()
    }

    notifyPresence() {
        Object.values(this.presenceSubscriptions).forEach(h => h(this.connectedUsers))
    }

    initiateCall(user: UserId, respondent: UserId) {
        const myCallSignaling = new TestCallSignaling
        const otherCallSignaling = new TestCallSignaling
        myCallSignaling.peer = otherCallSignaling
        otherCallSignaling.peer = myCallSignaling
        this.incomingCallSubscriptions[respondent](new WithId(otherCallSignaling, user))
        return myCallSignaling
    }
}

class TestCallSignaling implements CallSignaling {
    offerHandler: H = () => { }
    answerHandler: H = () => { }
    iceHandler: H2 = () => { }

    peer: TestCallSignaling | null = null

    close() { }

    sendOffer(s: RTCSessionDescriptionInit) {
        this.peer && this.peer.offerHandler(s)
    }

    sendAnswer(s: RTCSessionDescriptionInit) {
        this.peer && this.peer.answerHandler(s)
    }
    sendIce(s: RTCIceCandidate) {
        this.peer && this.peer.iceHandler(s)
    }

    onOffer(h: H) {
        this.offerHandler = h
    }
    onAnswer(h: H) {
        this.answerHandler = h
    }
    onIce(h: H2) {
        this.iceHandler = h
    }
}

const s = new TestSignaling

const u1 = { id: "1", name: "user1" }
const u2 = { id: "2", name: "user2" }

function presence(id: string): Handler<Array<User>> {
    return (users) => console.log(`user${id} received presence:`, { ...users })
}

function handleCallSignaling(id: string, cs: WithId<CallSignaling>) {
    console.log(`user${id} is in call with ${cs.id}`, cs)
    cs.value.onOffer(o => {
        console.log(`${id} received offer`, o)
        cs.value.sendAnswer("answer" as unknown as RTCSessionDescriptionInit)
    })
    cs.value.onAnswer(o => console.log(`${id} received answer`, o))
}

function call(id: string): Handler<WithId<CallSignaling>> {
    return (cs) => handleCallSignaling(id, cs)
}

s.online(u1, presence("1"), call("1"))
s.online(u2, presence("2"), call("2"))
const cs = s.initiateCall("1", "2")
handleCallSignaling("1", new WithId(cs, "2"))
cs.sendOffer("offer" as unknown as RTCSessionDescriptionInit)