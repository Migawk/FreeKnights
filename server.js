import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import { Server } from "socket.io";
import game from "./game.js";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(join(process.env.PWD, "cli", "index.html"));
});
const handle = (req, res, next) => {
  res.sendFile(join(process.env.PWD, "cli", req.path));
  next();
};
app.get("/:path", [handle], () => {});
app.get("/*/:path", [handle], () => {});

game(io);
server.listen(3055, () => {
  console.log("server running at http://localhost:3055");
});
