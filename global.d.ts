import { Zone } from "./types";

declare global {
  interface Window {
    zones?: Zone[];
  }
}
