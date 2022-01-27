import {TextField} from "@rmwc/textfield";
import {Button} from "@rmwc/button";
import Video from "./Video";
import React, {useContext, useState} from "react";
import axios from "./API/axios";
import {useHistory} from "react-router-dom";
import {RoomContext} from "./context";

const RtspPage = ({stream}) => {
    const history = useHistory();
    const {setContext} = useContext(RoomContext);

    const [state, setState] = useState({
        rtspLink: 'rtsp://rtsp.stream/pattern',
        // rtspLink: 'https://usw01-smr05-relay.ozolio.com/hls-live/relay01.cnbodpt.fd0.sm1.av2.at0.sh2.rt15719.rc0.basic.stream/playlist.m3u8',
    })

    const createRtsp = async () => {
        const rtspLink = state.rtspLink;
        const pageUrl = window.location.href;
        const guestToken = pageUrl.split('/')[4];

        const data = {
            "name": rtspLink,
        }

        let formBody = [];
        for (let property in data) {
            let encodedKey = encodeURIComponent(property);
            let encodedValue = encodeURIComponent(data[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");


        const response = await axios.post(`/guests/${guestToken}`, formBody);
        setContext(response.data);
        history.push( '/rtsp-streamer/' + response.data.room.name + '/' + encodeURIComponent(rtspLink));
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
                label="RTSP link"
                style={{width: '20rem'}}
                name="rtspLink"
                value={state.rtspLink}
                onChange={handleInputChange}
                required={true}
            />

            <Button
                className="preloadPage-item"
                label='Join Room'
                outlined='true'
                style={{width: '20rem'}}
                onClick={() => createRtsp()}
            />

            <Video stream={stream && stream}/>
        </div>
    );
}

export default RtspPage;
