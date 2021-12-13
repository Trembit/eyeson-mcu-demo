import React from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import PreLoadPage from "./PreLoadPage";
import RoomPage from "./RoomPage";
import RoomProvider from "./context";

const App = () => {
  return (

    <Router>
      <Switch>
        <RoomProvider>
        <Route path='/' exact>
          <PreLoadPage/>
        </Route>
        <Route path='/:roomName'>
          <RoomPage  />
        </Route>
        </RoomProvider>
      </Switch>
    </Router>

  );
}

export default App;


