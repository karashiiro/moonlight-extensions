import dgram from "dgram";

export function sendToXSOverlay(data: string): void {
  const server = dgram.createSocket("udp4");
  server.send(data, 42069, "127.0.0.1", () => {
    server.close();
  });
}
