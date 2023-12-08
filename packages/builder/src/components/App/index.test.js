import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './'

import { Provider } from 'react-redux'
import configureStore from '../../store'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

// A fair amount of boilerplate code is necessary here
// to establish a context in which the app can run.
it('renders without crashing', async () => {
  const store = await configureStore()

  // Temporary fix for reactstrap error,
  // see https://github.com/reactstrap/reactstrap/issues/773
  const div = document.createElement('div')
  document.body.appendChild(div)

  const root = ReactDOM.createRoot(div)
  root.render(
    <Provider store={store}>
      <DndProvider backend={HTML5Backend}>
        <App />
      </DndProvider>
    </Provider>,
    div,
  )
})
