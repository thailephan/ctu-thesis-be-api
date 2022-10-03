import { Server } from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    require("./connect")(io);
}

// - connection
//