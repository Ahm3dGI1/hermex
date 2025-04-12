const LOCAL_API = "http://127.0.0.1:8000/api";
const PROD_API = "https://hermex-api-307445798493.asia-southeast1.run.app/api";

/**
 * Pings the localhost to check if it's available.
 * Falls back to deployed backend if not reachable.
 */
export async function getBackendAPI(): Promise<string> {
    try {
        const res = await fetch(`${LOCAL_API}/ping`, { method: "GET" });
        if (res.ok) {
            console.log("Localhost API is active");
            return LOCAL_API;
        } else {
            throw new Error("Localhost responded but not OK");
        }
    } catch (err) {
        console.warn("Localhost not available, using production API");
        return PROD_API;
    }
}
