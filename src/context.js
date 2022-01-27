import React, {useState} from 'react';
export const RoomContext = React.createContext({})

const RoomProvider = (props) => {
        const [contextData, setContextData] = useState({
            accessKey: undefined,
            guestLink: undefined,
            rtspLink: undefined,
        });

        function setContext(data) {
            setContextData({
                ...contextData,
                accessKey: data.access_key,
                guestLink: `${window.location.origin}/guest/${data.room.guest_token}`,
                rtspLink: `${window.location.origin}/rtsp/${data.room.guest_token}`,
            });
        }

        return (
            <RoomContext.Provider
                value={{
                    contextData,
                    setContext,
                }}
                {...props}
            />
        );
    };
export default RoomProvider;

