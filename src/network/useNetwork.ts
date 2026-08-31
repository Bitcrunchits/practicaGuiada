import { useContext } from "react";
import { NetworkContext } from "./NetworkProvider";


export function useNetwork() {
    return useContext(NetworkContext);
}