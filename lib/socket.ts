import { Server as IOServer } from "socket.io";

type GlobalSocket = typeof globalThis & {
  io?: IOServer;
};

const globalForSocket = globalThis as GlobalSocket;

export const setIO = (io: IOServer) => {
  globalForSocket.io = io;
};

export const getIO = (): IOServer | null => {
  return globalForSocket.io || null;
};