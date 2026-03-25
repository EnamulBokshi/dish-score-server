import { Server } from "node:http";
import { env } from "./config/env";
import app from "./app";

let server: Server;


const bootstrap = async () => {
    try {
        server = app.listen(env.PORT, ()=> {
            console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
        })
        
    } catch (error) {
        console.error("Error starting the server:", error);
    }
}

// uncaught exceptions handler 

process.on("uncaughtException", (error)=>{
    console.error("Uncaught Exception detected... Shutting down the server", error);

    if(server){
        server.close(()=>{
            console.log("Server closed successfully");
            process.exit(1);
        })
    }
    process.exit(1);
})

// SIGTERM signal handler

process.on("SIGTERM", ()=> {
    console.log("SIGTERM signal received. Shutting down the server gracefully...");
    if(server){
        server.close(()=>{
            console.log("Server closed successfully");
            process.exit(1);
        })
    }
    else {
        process.exit(1);
    }
})

process.on("SIGINT", ()=> {
    console.log("SIGINT signal received. Shutting down the server gracefully...");
    if(server){
        server.close(()=>{
            console.log("Server closed successfully");
            process.exit(1);
        })
    }
    process.exit(1);
});

process.on("SIGQUIT", ()=> {
    console.log("SIGQUIT signal received. Shutting down the server gracefully...");
    if(server){
        server.close(()=>{
            console.log("Server closed successfully");
            process.exit(1);
        })  
    }
});

// unhandled  rejection handler
process.on("unhandledRejection", (error)=> {
    console.log("Unhandled Rejection detected... Shutting down the server", error);
    if(server){
        server.close(()=> {
            console.log("Server closed successfully");
            process.exit(1);
        })
    }
    process.exit(1);
})

bootstrap();