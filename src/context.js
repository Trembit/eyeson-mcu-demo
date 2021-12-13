import React, {useState}from 'react';
export const RoomContext = React.createContext({})

const RoomProvider = (props) => {
        const [contextData, setContextData] = useState({
            accessKey: '',
            guestLink: '',
        });

        function setContext(data) {
            setContextData({
                ...contextData,
                accessKey: data.access_key,
                guestLink: data.links.guest_join
            });
        };

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

