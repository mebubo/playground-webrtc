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
}