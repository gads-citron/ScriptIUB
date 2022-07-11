import Client from "ftp";
import * as yup from "yup";

const FTP_TIMEOUT = 20_000;

interface FtpConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
}

/**
 * Manages FTP Connexion and commands
 *
 * See https://developer.wit-datacenter.com/Doc/OAuth
 */
export class ClientFtp {
  private c = new Client();
  private connected = false;
  constructor(private readonly config: FtpConfig) {}

  private connect(): void {
    if (this.connected) {
      return;
    }
    const { host, port, username, password } = this.config;
    this.c.connect({
      host: host,
      port: port,
      user: username,
      password: password,
      connTimeout: FTP_TIMEOUT,
    });
    this.connected = true;
  }
  public async list(): Promise<Client.ListingElement[]> {
    return new Promise((resolve, reject) => {
      this.c.list((error, listing) => {
        if (error) {
          return reject(error);
        }
        resolve(listing);
      });
      this.connect();
    });
  }

  public async getFileToProcess(
    filename: string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    logDebug: Function
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.c.get(filename, (error, stream) => {
        if (error) {
          logDebug(error);
          return Promise.reject(error);
        }
        const chunks: Uint8Array[] = [];
        stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
        stream.on("error", (err) => {
          logDebug(err);
          reject(err);
        });
        stream.once("close", () => {
          this.c.end();
        });
        // Wait until the end of the stream to convert to string
        stream.on("end", () => {
          return resolve(Buffer.concat(chunks).toString("utf8"));
        });
      });
      this.connect();
    });
  }
  public async close(): Promise<void> {
    this.c.destroy();
  }
}
