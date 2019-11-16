import ReactDOM from 'react-dom'
import React from 'react'
import { App } from './components/App'

export const runApp = () => {
    ReactDOM.render(
        <App />,
        document.getElementById("app")
    );
}