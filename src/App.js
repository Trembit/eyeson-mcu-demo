import React from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import UserPage from "./UserPage";
import RoomPage from "./RoomPage";
import RoomProvider from "./context";
import GuestPage from "./GuestPage";
import RtspPage from "./RTSPPage";
import RTSPRoomPage from "./RTSPRoomPage";

const App = () => {
  return (

    <Router>
      <Switch>
        <RoomProvider>
        <Route path='/' exact>
          <UserPage />
        </Route>
          <Route path='/guest/:guestToken'>
            <GuestPage />
          </Route>
          <Route path='/rtsp/:guestToken'>
            <RtspPage />
          </Route>
          <Route path='/rooms/:roomName'>
            <RoomPage />
          </Route>
          <Route path='/rtsp-streamer/:roomName/:rtspLink'>
            <RTSPRoomPage />
          </Route>
        </RoomProvider>
      </Switch>
    </Router>

  );
}

export default App;


