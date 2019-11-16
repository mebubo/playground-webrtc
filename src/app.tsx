import ReactDOM from 'react-dom'
import React from 'react'
import { App } from './components/App'
import { LocalMedia } from './localMedia'

export const runApp = () => {
    const localMedia = new LocalMedia;
    (window as any).localMedia = localMedia
    ReactDOM.render(
        <App localMedia={localMedia} />,
        document.getElementById("app")
    );
}