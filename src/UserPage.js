import React, {useContext, useEffect, useState} from 'react';
import { TextField } from '@rmwc/textfield';
import {Button} from "@rmwc/button";
import Video from './Video';
import axios from './API/axios'
import {useHistory} from "react-router-dom";
import {RoomContext} from "./context";

const UserPage = ({stream}) => {
    const history = useHistory();
    const {setContext} = useContext(RoomContext);

    const [state, setState] = useState({
        userName: '',
        roomName: '',
    })

    const createUser = async (userName) => {
        const data = {
            "user[name]": userName,
        }

        let formBody = [];
        for (let property in data) {
            let encodedKey = encodeURIComponent(property);
            let encodedValue = encodeURIComponent(data[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");

        const response = await axios.post("/rooms", formBody);
        setContext(response.data);
        history.push('rooms/' + state.roomName);
    }

    function handleInputChange(event) {
        const value = event.target.value;
        setState({
            ...state,
            [event.target.name]: value
        });
    }

    return (
        <div className="preloadPage-wrapper">

            <div className='preloadPage-item preloadPage-title'>BRANDED VIDEO CONFERENCING FOR YOU</div>

            <TextField
                className="preloadPage-item"
                label="Room Name"
                style={{width: '20rem'}}
                name="roomName"
                value={state.roomName}
                onChange={handleInputChange}
                required={true}
            />

            <TextField
                className="preloadPage-item"
                label="Your Name"
                style={{width: '20rem'}}
                name="userName"
                value={state.userName}
                onChange={handleInputChange}
                required={true}
            />

            <Button
                className="preloadPage-item"
                label='Join Room'
                outlined='true'
                style={{width: '20rem'}}
                onClick={() => createUser(state.userName)}
            />

            <Video stream={stream && stream}/>
        </div>

    );
}

export default UserPage;
